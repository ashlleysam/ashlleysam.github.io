/**
 * ARM7TDMI Thumb Emulator - Memory System
 *
 * Implements the GBA memory map with region dispatch, dirty tracking,
 * and MMIO write recording. Uses ArrayBuffer + DataView for each region.
 */
import type { MemoryBus, MemoryWrite } from './types.js';
/**
 * GBA Memory Map implementation.
 *
 * Each region is backed by an ArrayBuffer. Reads and writes are dispatched
 * by the top byte of the address. All writes are logged for comparison.
 * MMIO writes are recorded separately (order-sensitive).
 */
export declare class GbaMemory implements MemoryBus {
    #private;
    readonly ewram: ArrayBuffer;
    readonly iwram: ArrayBuffer;
    readonly mmio: ArrayBuffer;
    readonly palette: ArrayBuffer;
    readonly vram: ArrayBuffer;
    readonly oam: ArrayBuffer;
    readonly rom: ArrayBuffer;
    constructor();
    read8(address: number): number;
    read16(address: number): number;
    read32(address: number): number;
    write8(address: number, value: number): void;
    write16(address: number, value: number): void;
    write32(address: number, value: number): void;
    /** Load a block of bytes into memory at a given address */
    loadBytes(baseAddress: number, data: Uint8Array): void;
    /** Get all memory writes since last reset */
    getWriteLog(): MemoryWrite[];
    /** Get MMIO writes only (order-sensitive) */
    getMmioWriteLog(): MemoryWrite[];
    /** Reset write logs (but keep memory contents) */
    resetWriteLog(): void;
    /** Zero all writable memory regions and reset logs */
    reset(): void;
}
//# sourceMappingURL=memory.d.ts.map