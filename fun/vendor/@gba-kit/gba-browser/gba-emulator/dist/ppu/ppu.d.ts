/**
 * GBA PPU — Core
 *
 * Implements PpuInterface. Dispatches rendering by BG mode (0, 1, 2)
 * and composites BG layers + sprites per scanline.
 *
 * Modes 3, 4, 5 (bitmap modes) are also supported for completeness.
 */
import type { PpuInterface } from '../gba.js';
import type { PpuSnapshot } from '../savestate.js';
import type { GbaSystemBus } from '../system-bus.js';
export declare class Ppu implements PpuInterface {
    #private;
    /** Reference to MMIO registers — set by the GBA coordinator */
    mmioRegisters?: Uint8Array;
    reset(): void;
    /** Serialize to a plain snapshot. */
    serialize(): PpuSnapshot;
    /** Restore from a snapshot. */
    deserialize(snap: PpuSnapshot): void;
    /**
     * Reload a BG reference point from MMIO registers.
     * On real GBA hardware, writing to BG2X/BG2Y/BG3X/BG3Y immediately
     * reloads the PPU's internal accumulator. This is how per-scanline
     * affine effects (pseudo-3D floors) work.
     */
    reloadBgRefPoint(bgIndex: 2 | 3, isX: boolean): void;
    getFramebuffer(): Uint32Array;
    onVBlank(): void;
    renderScanline(line: number, bus: GbaSystemBus): void;
}
//# sourceMappingURL=ppu.d.ts.map