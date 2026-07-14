/**
 * GBA DMA Controller
 *
 * 4 DMA channels with priority (0 highest, 3 lowest).
 * Supports immediate, VBlank, HBlank, and special (sound FIFO) start modes.
 * DMA halts the CPU during transfers.
 */
import type { InterruptController } from './interrupts.js';
import type { DmaSnapshot } from './savestate.js';
import type { Scheduler } from './scheduler.js';
import { DmaStartTiming } from './types.js';
import type { WriteOrigin } from './write-source.js';
/** Memory read/write functions injected from the system bus */
export interface DmaMemoryAccess {
    read16(address: number): number;
    read32(address: number): number;
    write16(address: number, value: number): void;
    write32(address: number, value: number): void;
    /** Current CPU location, captured on channel enable to attribute its writes (watchpoints). */
    getOrigin?(): WriteOrigin;
    /** Mark/unmark subsequent writes as coming from a DMA channel (watchpoints). */
    setDmaSource?(channel: number, origin: WriteOrigin): void;
    clearDmaSource?(): void;
}
export declare class DmaController {
    #private;
    constructor(scheduler: Scheduler, interrupts: InterruptController);
    /** Set memory access functions (called during system bus setup to break circular dep) */
    setMemoryAccess(memory: DmaMemoryAccess): void;
    /** Write source address (DMAx_SAD) — 27-bit for DMA0, 28-bit for DMA1-3 */
    writeSrcAddr(index: number, value: number): void;
    /** Write destination address (DMAx_DAD) — 27-bit for DMA0-2, 28-bit for DMA3 */
    writeDstAddr(index: number, value: number): void;
    /** Write word count (DMAx_CNT_L) */
    writeWordCount(index: number, value: number): void;
    /** Read control register (DMAx_CNT_H) */
    readControl(index: number): number;
    /** Write control register (DMAx_CNT_H) */
    writeControl(index: number, value: number): void;
    /** Trigger DMA channels waiting for a specific start timing */
    trigger(timing: DmaStartTiming): void;
    /** Trigger sound FIFO DMA (channels 1 and 2 with Special timing) */
    triggerSoundFifo(channel: 1 | 2): void;
    /** Serialize to a plain snapshot. */
    serialize(): DmaSnapshot;
    /** Restore from a snapshot. */
    deserialize(snap: DmaSnapshot): void;
    /** Reset all DMA channels */
    reset(): void;
}
//# sourceMappingURL=dma.d.ts.map