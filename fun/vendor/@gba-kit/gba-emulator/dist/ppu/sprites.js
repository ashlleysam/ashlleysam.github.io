import { SCREEN_WIDTH } from '../types.js';
import { color15to32, read16 } from './backgrounds.js';
// ─── OAM Size Lookup ─────────────────────────────────────────────────
/** [width, height] for each shape+size combination */
const OBJ_SIZES = [
    // shape 0: Square
    [
        [8, 8],
        [16, 16],
        [32, 32],
        [64, 64],
    ],
    // shape 1: Horizontal
    [
        [16, 8],
        [32, 8],
        [32, 16],
        [64, 32],
    ],
    // shape 2: Vertical
    [
        [8, 16],
        [8, 32],
        [16, 32],
        [32, 64],
    ],
];
function parseOamEntry(oam, index) {
    const base = index * 8;
    const attr0 = read16(oam, base);
    const attr1 = read16(oam, base + 2);
    const attr2 = read16(oam, base + 4);
    const affine = !!(attr0 & (1 << 8));
    return {
        y: attr0 & 0xff,
        affine,
        doubleSize: affine && !!(attr0 & (1 << 9)),
        disabled: !affine && !!(attr0 & (1 << 9)),
        mode: (attr0 >> 10) & 0x3,
        mosaic: !!(attr0 & (1 << 12)),
        colorMode: (attr0 >> 13) & 1,
        shape: (attr0 >> 14) & 0x3,
        x: attr1 & 0x1ff,
        affineIndex: (attr1 >> 9) & 0x1f,
        hflip: !affine && !!(attr1 & (1 << 12)),
        vflip: !affine && !!(attr1 & (1 << 13)),
        size: (attr1 >> 14) & 0x3,
        tileIndex: attr2 & 0x3ff,
        priority: (attr2 >> 10) & 0x3,
        palette: (attr2 >> 12) & 0xf,
    };
}
// ─── Sprite Scanline Rendering ───────────────────────────────────────
/**
 * Render all sprites for a given scanline.
 * Returns an array of SCREEN_WIDTH sprite pixels (lowest-index OAM = highest priority).
 */
export function renderSpriteScanline(line, bus, objMapping1D, mosaicH, mosaicV, oamSnapshot) {
    const oam = oamSnapshot ?? bus.oam;
    const result = new Array(SCREEN_WIDTH);
    for (let i = 0; i < SCREEN_WIDTH; i++) {
        result[i] = { color: 0, priority: 4, semiTransparent: false, isObjWindow: false };
    }
    // OAM has 128 entries
    for (let i = 0; i < 128; i++) {
        const sprite = parseOamEntry(oam, i);
        if (!sprite.affine && sprite.disabled) {
            continue;
        }
        if (sprite.shape >= 3) {
            continue; // prohibited
        }
        const sizeEntry = OBJ_SIZES[sprite.shape]?.[sprite.size];
        if (!sizeEntry) {
            continue;
        }
        const [objW, objH] = sizeEntry;
        // Bounding box (double size for affine with double-size flag)
        const boundW = sprite.affine && sprite.doubleSize ? objW * 2 : objW;
        const boundH = sprite.affine && sprite.doubleSize ? objH * 2 : objH;
        // Sprite Y can wrap around (values >= 160 are negative)
        let spriteY = sprite.y;
        if (spriteY >= 160 && spriteY + boundH > 256) {
            spriteY -= 256;
        }
        // Check if this scanline intersects the sprite
        const localY = line - spriteY;
        if (localY < 0 || localY >= boundH) {
            continue;
        }
        // Mosaic Y
        const effectiveLocalY = sprite.mosaic && mosaicV > 1 ? localY - (localY % mosaicV) : localY;
        // Sprite X (9-bit, sign extend)
        let spriteX = sprite.x;
        if (spriteX >= 256) {
            spriteX -= 512;
        }
        // For each pixel in the sprite's bounding width
        for (let bx = 0; bx < boundW; bx++) {
            const screenX = spriteX + bx;
            if (screenX < 0 || screenX >= SCREEN_WIDTH) {
                continue;
            }
            // Skip if already drawn by higher-priority sprite (lower OAM index)
            if (result[screenX].color !== 0) {
                continue;
            }
            let texX;
            let texY;
            if (sprite.affine) {
                // Affine transform
                const halfW = boundW >> 1;
                const halfH = boundH >> 1;
                // Read affine params from OAM snapshot (4 params per group, spread across OAM entries)
                const paramBase = sprite.affineIndex * 32;
                const pa = toSignedS16(read16(oam, paramBase + 6));
                const pb = toSignedS16(read16(oam, paramBase + 14));
                const pc = toSignedS16(read16(oam, paramBase + 22));
                const pd = toSignedS16(read16(oam, paramBase + 30));
                // Transform screen-relative coords to texture coords
                const dx = bx - halfW;
                const dy = effectiveLocalY - halfH;
                texX = ((pa * dx + pb * dy) >> 8) + (objW >> 1);
                texY = ((pc * dx + pd * dy) >> 8) + (objH >> 1);
                if (texX < 0 || texX >= objW || texY < 0 || texY >= objH) {
                    continue;
                }
            }
            else {
                // Normal sprite
                texX = sprite.hflip ? objW - 1 - bx : bx;
                texY = sprite.vflip ? objH - 1 - effectiveLocalY : effectiveLocalY;
            }
            // Mosaic X
            if (sprite.mosaic && mosaicH > 1) {
                texX = texX - (texX % mosaicH);
            }
            // Get tile pixel
            const colorIndex = getSpritePixelColor(sprite, texX, texY, objW, bus, objMapping1D);
            if (colorIndex === 0) {
                continue;
            }
            // Look up palette color (OBJ palette starts at 0x200 in palette RAM)
            let paletteOffset;
            if (sprite.colorMode === 1) {
                // 8bpp
                paletteOffset = 0x200 + colorIndex * 2;
            }
            else {
                // 4bpp
                paletteOffset = 0x200 + (sprite.palette * 16 + colorIndex) * 2;
            }
            const color15 = read16(bus.palette, paletteOffset);
            const color32 = color15to32(color15);
            result[screenX] = {
                color: color32,
                priority: sprite.priority,
                semiTransparent: sprite.mode === 1,
                isObjWindow: sprite.mode === 2,
            };
        }
    }
    return result;
}
// ─── Sprite Tile Access ──────────────────────────────────────────────
function getSpritePixelColor(sprite, texX, texY, objW, bus, mapping1D) {
    const tileCol = texX >> 3;
    const tileRow = texY >> 3;
    const fineX = texX & 7;
    const fineY = texY & 7;
    let tileIndex;
    if (mapping1D) {
        // 1D mapping: tiles are laid out sequentially
        const tilesPerRow = objW >> 3;
        const tileOffset = tileRow * tilesPerRow + tileCol;
        if (sprite.colorMode === 1) {
            // 8bpp: each tile is 2 tile-index units
            tileIndex = sprite.tileIndex + tileOffset * 2;
        }
        else {
            tileIndex = sprite.tileIndex + tileOffset;
        }
    }
    else {
        // 2D mapping: 32 tiles per row (each row = 32 tile indices in VRAM)
        if (sprite.colorMode === 1) {
            tileIndex = sprite.tileIndex + tileRow * 32 + tileCol * 2;
        }
        else {
            tileIndex = sprite.tileIndex + tileRow * 32 + tileCol;
        }
    }
    // OBJ tile data starts at 0x10000 in VRAM
    const tileBase = 0x10000;
    if (sprite.colorMode === 1) {
        // 8bpp — 64 bytes per tile
        const addr = tileBase + tileIndex * 32 + fineY * 8 + fineX;
        return bus.vram[addr] ?? 0;
    }
    else {
        // 4bpp — 32 bytes per tile
        const addr = tileBase + tileIndex * 32 + fineY * 4 + (fineX >> 1);
        const byte = bus.vram[addr] ?? 0;
        return fineX & 1 ? byte >> 4 : byte & 0xf;
    }
}
// ─── Helpers ─────────────────────────────────────────────────────────
function toSignedS16(value) {
    return (value << 16) >> 16;
}
//# sourceMappingURL=sprites.js.map