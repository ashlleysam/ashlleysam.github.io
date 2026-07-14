/**
 * GBA PPU — Layer Compositor
 *
 * Handles:
 * - Priority-based layer sorting (BG + sprites)
 * - Windowing (WIN0, WIN1, OBJ window, outside)
 * - Alpha blending (BLDCNT, BLDALPHA, BLDY)
 * - Brightness increase/decrease
 */
import type { GbaSystemBus } from '../system-bus.js';
import type { SpritePixel } from './sprites.js';
export interface BgLayer {
    id: number;
    priority: number;
    lineBuffer: Uint32Array;
}
/**
 * Compose all layers for one scanline into the framebuffer.
 */
export declare function compositeScanline(line: number, bgLayers: BgLayer[], sprites: SpritePixel[], bus: GbaSystemBus, framebuffer: Uint32Array): void;
//# sourceMappingURL=compositor.d.ts.map