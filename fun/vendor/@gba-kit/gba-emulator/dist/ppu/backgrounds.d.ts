/**
 * GBA PPU — Background Rendering
 *
 * Renders text (Mode 0/1) and affine (Mode 1/2) background layers.
 * Text BGs use 16-bit tile map entries; affine BGs use 8-bit entries.
 */
import type { GbaSystemBus } from '../system-bus.js';
declare function read16(arr: Uint8Array, offset: number): number;
declare function color15to32(color15: number): number;
export interface BgControl {
    priority: number;
    tileBase: number;
    mosaic: boolean;
    colorMode: number;
    mapBase: number;
    overflow: boolean;
    screenSize: number;
}
export declare function parseBgControl(cnt: number): BgControl;
/**
 * Render one scanline of a text background layer.
 *
 * @param line - scanline number (0-159)
 * @param bgIndex - BG layer index (0-3)
 * @param ctrl - parsed BG control register
 * @param bus - system bus for memory access
 * @param lineBuffer - output buffer (SCREEN_WIDTH entries, 0 = transparent)
 */
export declare function renderTextBgScanline(line: number, bgIndex: number, ctrl: BgControl, bus: GbaSystemBus, lineBuffer: Uint32Array): void;
/**
 * Render one scanline of an affine background layer.
 *
 * @param line - scanline number
 * @param bgIndex - BG index (2 or 3)
 * @param ctrl - parsed BG control
 * @param refX - current reference point X (8.8 fixed point already accumulated)
 * @param refY - current reference point Y (8.8 fixed point already accumulated)
 * @param bus - system bus
 * @param lineBuffer - output buffer
 */
export declare function renderAffineBgScanline(_line: number, bgIndex: number, ctrl: BgControl, refX: number, refY: number, bus: GbaSystemBus, lineBuffer: Uint32Array): void;
export declare function readSigned28_8(mmio: Uint8Array, offset: number): number;
export { color15to32, read16 };
//# sourceMappingURL=backgrounds.d.ts.map