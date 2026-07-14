/**
 * GBA PPU — Sprite (OBJ) Rendering
 *
 * Renders sprites from OAM. Supports:
 * - All OAM sizes (8x8 to 64x64)
 * - 4bpp and 8bpp color modes
 * - Horizontal/vertical flipping
 * - Sprite priorities (0-3)
 * - 1D and 2D tile mapping
 * - Affine transforms (32 rotation/scaling parameter groups)
 * - OBJ window mode
 * - Mosaic
 */
import type { GbaSystemBus } from '../system-bus.js';
export interface SpritePixel {
    color: number;
    priority: number;
    semiTransparent: boolean;
    isObjWindow: boolean;
}
/**
 * Render all sprites for a given scanline.
 * Returns an array of SCREEN_WIDTH sprite pixels (lowest-index OAM = highest priority).
 */
export declare function renderSpriteScanline(line: number, bus: GbaSystemBus, objMapping1D: boolean, mosaicH: number, mosaicV: number, oamSnapshot?: Uint8Array): SpritePixel[];
//# sourceMappingURL=sprites.d.ts.map