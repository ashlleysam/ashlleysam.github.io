import { DmaAddrControl, DmaStartTiming, EventId, IrqFlag } from './types.js';
const ZERO_ORIGIN = { pc: 0, instructionAddress: 0, thumb: false };
const DMA_EVENT_IDS = [EventId.Dma0, EventId.Dma1, EventId.Dma2, EventId.Dma3];
const DMA_IRQ_FLAGS = [IrqFlag.Dma0, IrqFlag.Dma1, IrqFlag.Dma2, IrqFlag.Dma3];
export class DmaController {
    #channels = [];
    #scheduler;
    #interrupts;
    #memory;
    constructor(scheduler, interrupts) {
        this.#scheduler = scheduler;
        this.#interrupts = interrupts;
        for (let i = 0; i < 4; i++) {
            this.#channels.push({
                srcAddr: 0,
                dstAddr: 0,
                srcLatch: 0,
                dstLatch: 0,
                wordCount: 0,
                wordCountLatch: 0,
                dstControl: DmaAddrControl.Increment,
                srcControl: DmaAddrControl.Increment,
                repeat: false,
                wordSize: false,
                startTiming: DmaStartTiming.Immediately,
                irqEnable: false,
                enabled: false,
                startOrigin: ZERO_ORIGIN,
            });
        }
    }
    /** Set memory access functions (called during system bus setup to break circular dep) */
    setMemoryAccess(memory) {
        this.#memory = memory;
    }
    /** Write source address (DMAx_SAD) — 27-bit for DMA0, 28-bit for DMA1-3 */
    writeSrcAddr(index, value) {
        const mask = index === 0 ? 0x07ffffff : 0x0fffffff;
        this.#channels[index].srcLatch = value & mask;
    }
    /** Write destination address (DMAx_DAD) — 27-bit for DMA0-2, 28-bit for DMA3 */
    writeDstAddr(index, value) {
        const mask = index === 3 ? 0x0fffffff : 0x07ffffff;
        this.#channels[index].dstLatch = value & mask;
    }
    /** Write word count (DMAx_CNT_L) */
    writeWordCount(index, value) {
        const mask = index === 3 ? 0xffff : 0x3fff;
        this.#channels[index].wordCountLatch = value & mask;
    }
    /** Read control register (DMAx_CNT_H) */
    readControl(index) {
        const ch = this.#channels[index];
        return (((ch.dstControl & 3) << 5) |
            ((ch.srcControl & 3) << 7) |
            (ch.repeat ? 1 << 9 : 0) |
            (ch.wordSize ? 1 << 10 : 0) |
            ((ch.startTiming & 3) << 12) |
            (ch.irqEnable ? 1 << 14 : 0) |
            (ch.enabled ? 1 << 15 : 0));
    }
    /** Write control register (DMAx_CNT_H) */
    writeControl(index, value) {
        const ch = this.#channels[index];
        const wasEnabled = ch.enabled;
        ch.dstControl = ((value >> 5) & 3);
        ch.srcControl = ((value >> 7) & 3);
        ch.repeat = (value & (1 << 9)) !== 0;
        ch.wordSize = (value & (1 << 10)) !== 0;
        ch.startTiming = ((value >> 12) & 3);
        ch.irqEnable = (value & (1 << 14)) !== 0;
        ch.enabled = (value & (1 << 15)) !== 0;
        if (ch.enabled) {
            // Capture the instruction that started this DMA (for watchpoint attribution).
            ch.startOrigin = this.#memory?.getOrigin?.() ?? ZERO_ORIGIN;
            // (Re-)enabling DMA always reloads addresses and word count from latches,
            // whether transitioning from disabled→enabled OR re-writing while enabled.
            // Real GBA hardware reloads on any control write with enable=1.
            ch.srcAddr = ch.srcLatch;
            ch.dstAddr = ch.dstLatch;
            ch.wordCount = ch.wordCountLatch === 0 ? (index === 3 ? 0x10000 : 0x4000) : ch.wordCountLatch;
            if (ch.startTiming === DmaStartTiming.Immediately) {
                // Immediate DMA executes synchronously (blocks the CPU on real GBA)
                this.#executeTransfer(index);
            }
        }
        else if (wasEnabled && !ch.enabled) {
            this.#scheduler.cancel(DMA_EVENT_IDS[index]);
        }
    }
    /** Trigger DMA channels waiting for a specific start timing */
    trigger(timing) {
        for (let i = 0; i < 4; i++) {
            const ch = this.#channels[i];
            if (ch.enabled && ch.startTiming === timing) {
                this.#scheduleTransfer(i);
            }
        }
    }
    /** Trigger sound FIFO DMA (channels 1 and 2 with Special timing) */
    triggerSoundFifo(channel) {
        const ch = this.#channels[channel];
        if (ch.enabled && ch.startTiming === DmaStartTiming.Special) {
            this.#executeFifoTransfer(channel);
        }
    }
    #scheduleTransfer(index) {
        // DMA transfers happen "immediately" in emulation terms (2 cycles startup)
        this.#scheduler.schedule(DMA_EVENT_IDS[index], 2, () => {
            this.#executeTransfer(index);
        });
    }
    #executeTransfer(index) {
        const memory = this.#memory;
        if (!memory) {
            return;
        }
        const ch = this.#channels[index];
        const step = ch.wordSize ? 4 : 2;
        // Attribute this channel's writes to its start instruction (for watchpoints).
        memory.setDmaSource?.(index, ch.startOrigin);
        for (let i = 0; i < ch.wordCount; i++) {
            if (ch.wordSize) {
                const value = memory.read32(ch.srcAddr);
                memory.write32(ch.dstAddr, value);
            }
            else {
                const value = memory.read16(ch.srcAddr);
                memory.write16(ch.dstAddr, value);
            }
            // Update source address
            ch.srcAddr = this.#updateAddr(ch.srcAddr, ch.srcControl, step);
            // Update destination address
            ch.dstAddr = this.#updateAddr(ch.dstAddr, ch.dstControl, step);
        }
        memory.clearDmaSource?.();
        this.#onTransferComplete(index);
    }
    /** Special FIFO transfer: always 4 words of 32-bit, destination fixed */
    #executeFifoTransfer(index) {
        const memory = this.#memory;
        if (!memory) {
            return;
        }
        const ch = this.#channels[index];
        memory.setDmaSource?.(index, ch.startOrigin);
        for (let i = 0; i < 4; i++) {
            const value = memory.read32(ch.srcAddr);
            memory.write32(ch.dstAddr, value);
            ch.srcAddr = this.#updateAddr(ch.srcAddr, ch.srcControl, 4);
            // Destination fixed for FIFO
        }
        memory.clearDmaSource?.();
        // FIFO DMA always repeats — don't disable
        if (ch.irqEnable) {
            this.#interrupts.requestInterrupt(DMA_IRQ_FLAGS[index]);
        }
    }
    #onTransferComplete(index) {
        const ch = this.#channels[index];
        if (ch.irqEnable) {
            this.#interrupts.requestInterrupt(DMA_IRQ_FLAGS[index]);
        }
        if (ch.repeat && ch.startTiming !== DmaStartTiming.Immediately) {
            // Reload word count, optionally reload destination
            ch.wordCount = ch.wordCountLatch === 0 ? (index === 3 ? 0x10000 : 0x4000) : ch.wordCountLatch;
            if (ch.dstControl === DmaAddrControl.IncrementReload) {
                ch.dstAddr = ch.dstLatch;
            }
        }
        else {
            ch.enabled = false;
        }
    }
    #updateAddr(addr, control, step) {
        switch (control) {
            case DmaAddrControl.Increment:
            case DmaAddrControl.IncrementReload:
                return addr + step;
            case DmaAddrControl.Decrement:
                return addr - step;
            case DmaAddrControl.Fixed:
                return addr;
        }
    }
    /** Serialize to a plain snapshot. */
    serialize() {
        return {
            channels: this.#channels.map((ch) => ({
                srcAddr: ch.srcAddr,
                dstAddr: ch.dstAddr,
                srcLatch: ch.srcLatch,
                dstLatch: ch.dstLatch,
                wordCount: ch.wordCount,
                wordCountLatch: ch.wordCountLatch,
                dstControl: ch.dstControl,
                srcControl: ch.srcControl,
                repeat: ch.repeat,
                wordSize: ch.wordSize,
                startTiming: ch.startTiming,
                irqEnable: ch.irqEnable,
                enabled: ch.enabled,
            })),
        };
    }
    /** Restore from a snapshot. */
    deserialize(snap) {
        for (let i = 0; i < 4; i++) {
            const ch = this.#channels[i];
            const s = snap.channels[i];
            ch.srcAddr = s.srcAddr;
            ch.dstAddr = s.dstAddr;
            ch.srcLatch = s.srcLatch;
            ch.dstLatch = s.dstLatch;
            ch.wordCount = s.wordCount;
            ch.wordCountLatch = s.wordCountLatch;
            ch.dstControl = s.dstControl;
            ch.srcControl = s.srcControl;
            ch.repeat = s.repeat;
            ch.wordSize = s.wordSize;
            ch.startTiming = s.startTiming;
            ch.irqEnable = s.irqEnable;
            ch.enabled = s.enabled;
        }
    }
    /** Reset all DMA channels */
    reset() {
        for (let i = 0; i < 4; i++) {
            const ch = this.#channels[i];
            ch.srcAddr = 0;
            ch.dstAddr = 0;
            ch.srcLatch = 0;
            ch.dstLatch = 0;
            ch.wordCount = 0;
            ch.wordCountLatch = 0;
            ch.dstControl = DmaAddrControl.Increment;
            ch.srcControl = DmaAddrControl.Increment;
            ch.repeat = false;
            ch.wordSize = false;
            ch.startTiming = DmaStartTiming.Immediately;
            ch.irqEnable = false;
            ch.enabled = false;
            this.#scheduler.cancel(DMA_EVENT_IDS[i]);
        }
    }
}
//# sourceMappingURL=dma.js.map