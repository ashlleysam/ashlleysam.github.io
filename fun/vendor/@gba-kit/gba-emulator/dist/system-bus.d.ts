/**
 * GBA System Bus
 *
 * Implements MemoryBus and dispatches reads/writes to the
 * appropriate subsystem based on address ranges.
 *
 * Memory map:
 *   0x00000000-0x00003FFF  BIOS (16 KB)
 *   0x02000000-0x0203FFFF  EWRAM (256 KB)
 *   0x03000000-0x03007FFF  IWRAM (32 KB)
 *   0x04000000-0x040003FE  I/O Registers (MMIO)
 *   0x05000000-0x050003FF  Palette RAM (1 KB)
 *   0x06000000-0x06017FFF  VRAM (96 KB)
 *   0x07000000-0x070003FF  OAM (1 KB)
 *   0x08000000-0x09FFFFFF  Game Pak ROM (up to 32 MB)
 *   0x0E000000-0x0E00FFFF  Game Pak SRAM (64 KB)
 */
import type { MemoryBus } from '@gba-kit/arm-emulator';
import type { Apu } from './apu/apu.js';
import type { DmaController } from './dma.js';
import type { InputController } from './input.js';
import type { InterruptController } from './interrupts.js';
import type { SystemBusSnapshot } from './savestate.js';
import type { TimerController } from './timers.js';
import type { WriteOrigin } from './write-source.js';
/** A committed write reported to a data watchpoint. */
export interface WatchpointWrite {
    /** The watched byte that was written (within the access, clamped to the watch range). */
    address: number;
    /** Value committed, masked to `size` bytes. */
    value: number;
    /** Access size in bytes (1, 2 or 4). */
    size: number;
    /** Active DMA channel (0-3) if a DMA performed the write, else -1 (a CPU/BIOS store). */
    dmaChannel: number;
    /** The DMA's start instruction when `dmaChannel >= 0`, else null. */
    dmaOrigin: WriteOrigin | null;
}
export declare class GbaSystemBus implements MemoryBus {
    #private;
    /** External Work RAM (256 KB) */
    readonly ewram: Uint8Array<ArrayBuffer>;
    /** Internal Work RAM (32 KB) */
    readonly iwram: Uint8Array<ArrayBuffer>;
    /** Palette RAM (1 KB) */
    readonly palette: Uint8Array<ArrayBuffer>;
    /** Video RAM (96 KB) */
    readonly vram: Uint8Array<ArrayBuffer>;
    /** Object Attribute Memory (1 KB) */
    readonly oam: Uint8Array<ArrayBuffer>;
    /** Game Pak SRAM (64 KB) */
    readonly sram: Uint8Array<ArrayBuffer>;
    /** Display control registers (written via MMIO, read by PPU) */
    readonly mmioRegisters: Uint8Array<ArrayBuffer>;
    /** Callback when BG2/BG3 reference point registers are written (for PPU ref point reload) */
    onBgRefPointWrite?: (bgIndex: 2 | 3, isX: boolean) => void;
    /** Attribute subsequent committed writes to a DMA channel (called by the DMA controller). */
    setDmaSource(channel: number, origin: WriteOrigin): void;
    clearDmaSource(): void;
    /**
     * Register a write watchpoint over [address, address+length); returns a disposer.
     * `length` is clamped to >= 1.
     */
    addWriteWatchpoint(address: number, length: number, onWrite: (info: WatchpointWrite) => void): () => void;
    /** Remove every registered watchpoint. */
    clearWriteWatchpoints(): void;
    /** Whether any data watchpoint is registered (hot-path gate). */
    hasWatchpoints(): boolean;
    /** Wire up subsystem references */
    connect(parts: {
        interrupts: InterruptController;
        timers: TimerController;
        dma: DmaController;
        input: InputController;
        apu: Apu;
    }): void;
    /** Load BIOS ROM data */
    loadBios(data: Uint8Array): void;
    /** Write a 32-bit value to the BIOS region (for installing HLE stubs) */
    writeBios32(address: number, value: number): void;
    /** Load Game Pak ROM data */
    loadRom(data: Uint8Array): void;
    read8(address: number): number;
    read16(address: number): number;
    read32(address: number): number;
    write8(address: number, value: number): void;
    write16(address: number, value: number): void;
    write32(address: number, value: number): void;
    /** Serialize to a plain snapshot (excludes bios and rom). */
    serialize(): SystemBusSnapshot;
    /** Restore from a snapshot. BIOS and ROM must already be loaded. */
    deserialize(snap: SystemBusSnapshot): void;
    /** Reset all memory and registers */
    reset(): void;
}
//# sourceMappingURL=system-bus.d.ts.map