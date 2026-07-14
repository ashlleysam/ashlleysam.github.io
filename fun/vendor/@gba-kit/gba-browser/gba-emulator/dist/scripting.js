/**
 * GBA Scripting Engine
 *
 * Platform-agnostic scripting API for driving the GBA emulator.
 * Takes a ScriptingHost interface for I/O operations (file writes, logging).
 * Both web and Node.js consumers provide their own ScriptingHost implementation.
 */
import { disassembleArm, disassembleThumb } from "../../../arm-emulator/dist/disassembler.js";
import { DebugInfo } from "../../../debug-info/dist/index.js";
import { GbaButton } from './types.js';
import { captureOrigin } from './write-source.js';
// ─── Button Name Mapping ─────────────────────────────────────────────
const BUTTON_MAP = {
    a: GbaButton.A,
    b: GbaButton.B,
    select: GbaButton.Select,
    start: GbaButton.Start,
    right: GbaButton.Right,
    left: GbaButton.Left,
    up: GbaButton.Up,
    down: GbaButton.Down,
    r: GbaButton.R,
    l: GbaButton.L,
};
function resolveButton(name) {
    const button = BUTTON_MAP[name.toLowerCase()];
    if (button === undefined) {
        throw new Error(`Unknown button: "${name}". Valid buttons: ${Object.keys(BUTTON_MAP).join(', ')}`);
    }
    return button;
}
// ─── Scripting Engine ────────────────────────────────────────────────
export class ScriptingEngine {
    #gba;
    #host;
    #actionsExecuted = 0;
    #recording = null;
    #onFrameCallback = null;
    #frameCount = 0;
    /** Disposers for watchpoints created via this engine (so clearWatchpoints() only clears ours). */
    #watchDisposers = new Set();
    /** CPU interface — set externally since Gba doesn't expose full CPU */
    cpuRegisters;
    cpuCpsr;
    cpuSerialize;
    cpuDeserialize;
    /** Optional ELF symbol/DWARF info enabling source-level queries. */
    #debugInfo = null;
    constructor(gba, host) {
        this.#gba = gba;
        this.#host = host;
    }
    // ─── Debug info (ELF symbols + DWARF) ────────────────────────────
    /**
     * Load symbol/DWARF info from a (`-g`-built) ELF image. Enables
     * `pcToSource`/`symbolToAddress`/etc. and annotates watchpoint hits with the
     * writing instruction's source line. The `.gba` ROM has no debug info — pass
     * the sidecar ELF's bytes (its loadable bytes match the ROM, so addresses
     * line up).
     */
    loadDebugInfo(elfBytes) {
        this.#debugInfo = DebugInfo.fromElf(elfBytes);
    }
    /** Provide an already-parsed DebugInfo (e.g. shared with a UI). */
    setDebugInfo(debugInfo) {
        this.#debugInfo = debugInfo;
    }
    get debugInfo() {
        return this.#debugInfo;
    }
    get hasDebugInfo() {
        return this.#debugInfo !== null;
    }
    /** Map a PC to `{ file, line, func }`, or null (no debug info / not in C). */
    pcToSource(pc) {
        return this.#debugInfo?.pcToSource(pc) ?? null;
    }
    /** The function containing `pc`, as `{ name, address }`, or null. */
    pcToFunction(pc) {
        const fn = this.#debugInfo?.pcToFunction(pc);
        return fn ? { name: fn.name, address: fn.address } : null;
    }
    /** Nearest preceding symbol to `addr` as `{ name, offset }`, or null. */
    addressToSymbol(addr) {
        return this.#debugInfo?.addressToSymbol(addr) ?? null;
    }
    /** Address of a named symbol (function or global), or null. */
    symbolToAddress(name) {
        return this.#debugInfo?.symbolToAddress(name) ?? null;
    }
    get actionsExecuted() {
        return this.#actionsExecuted;
    }
    /** Runs one frame, fires hooks, and captures if recording */
    #runFrame() {
        this.#gba.runFrame();
        this.#frameCount++;
        if (this.#recording) {
            this.#recording.frameCounter++;
            if (this.#recording.frameCounter % this.#recording.interval === 0) {
                this.#recording.frames.push(new Uint32Array(this.#gba.ppu.getFramebuffer()));
            }
        }
        if (this.#onFrameCallback) {
            this.#onFrameCallback(this.#frameCount);
        }
    }
    // ─── Timing / Flow Control ───────────────────────────────────────
    async wait(condition) {
        this.#actionsExecuted++;
        if ('frames' in condition) {
            for (let i = 0; i < condition.frames; i++) {
                this.#runFrame();
            }
            return;
        }
        const timeout = condition.timeout ?? 600;
        if ('memory' in condition) {
            const { address, equals, lessThan, greaterThan, bitSet } = condition.memory;
            const probe = this.#memoryProbe(address);
            for (let i = 0; i < timeout; i++) {
                this.#runFrame();
                const value = probe.read();
                if (equals !== undefined && value === equals) {
                    return;
                }
                if (lessThan !== undefined && value < lessThan) {
                    return;
                }
                if (greaterThan !== undefined && value > greaterThan) {
                    return;
                }
                if (bitSet !== undefined && (value & bitSet) !== 0) {
                    return;
                }
            }
            throw new Error(`wait({ memory }) timed out after ${timeout} frames at ${probe.label}`);
        }
        if ('pc' in condition) {
            const targetPC = condition.pc;
            for (let i = 0; i < timeout; i++) {
                this.#runFrame();
                if (this.#gba.armCpu.registers[15] === targetPC) {
                    return;
                }
            }
            throw new Error(`wait({ pc }) timed out after ${timeout} frames waiting for PC=0x${condition.pc.toString(16)}`);
        }
        if ('pixel' in condition) {
            const { x, y, r, g, b } = condition.pixel;
            const framebuffer = this.#gba.ppu.getFramebuffer();
            for (let i = 0; i < timeout; i++) {
                this.#runFrame();
                const abgr = framebuffer[y * 240 + x];
                if ((abgr & 0xff) === r && ((abgr >> 8) & 0xff) === g && ((abgr >> 16) & 0xff) === b) {
                    return;
                }
            }
            throw new Error(`wait({ pixel }) timed out after ${timeout} frames at (${x}, ${y}) waiting for rgb(${r}, ${g}, ${b})`);
        }
    }
    // ─── Input ───────────────────────────────────────────────────────
    async press(buttons, options) {
        this.#actionsExecuted++;
        const buttonList = Array.isArray(buttons) ? buttons : [buttons];
        const holdFrames = options?.hold ?? 1;
        // Press all buttons
        for (const name of buttonList) {
            this.#gba.pressButton(resolveButton(name));
        }
        // Hold for the specified number of frames
        for (let i = 0; i < holdFrames; i++) {
            this.#runFrame();
        }
        // Release all buttons
        for (const name of buttonList) {
            this.#gba.releaseButton(resolveButton(name));
        }
    }
    async pressSequence(inputs) {
        this.#actionsExecuted++;
        for (const [input, frames] of inputs) {
            if (input === null) {
                // No buttons — just wait
                for (let i = 0; i < frames; i++) {
                    this.#runFrame();
                }
                continue;
            }
            const buttons = input.split('+').map((b) => resolveButton(b.trim()));
            for (const btn of buttons) {
                this.#gba.pressButton(btn);
            }
            for (let i = 0; i < frames; i++) {
                this.#runFrame();
            }
            for (const btn of buttons) {
                this.#gba.releaseButton(btn);
            }
        }
    }
    release(button) {
        this.#gba.releaseButton(resolveButton(button));
    }
    // ─── State Extraction ────────────────────────────────────────────
    async takeScreenshot(options) {
        this.#actionsExecuted++;
        const framebuffer = this.#gba.ppu.getFramebuffer();
        const rgba = new Uint8Array(240 * 160 * 4);
        for (let i = 0; i < 240 * 160; i++) {
            const abgr = framebuffer[i];
            const offset = i * 4;
            rgba[offset] = abgr & 0xff; // R
            rgba[offset + 1] = (abgr >> 8) & 0xff; // G
            rgba[offset + 2] = (abgr >> 16) & 0xff; // B
            rgba[offset + 3] = 0xff; // A (always opaque)
        }
        await this.#host.writeScreenshot(options.name, rgba, 240, 160);
    }
    async takeMemorySnapshot(options) {
        this.#actionsExecuted++;
        let data;
        let address;
        if ('region' in options) {
            const bus = this.#gba.bus;
            switch (options.region) {
                case 'iwram':
                    data = new Uint8Array(bus.iwram);
                    address = 0x03000000;
                    break;
                case 'ewram':
                    data = new Uint8Array(bus.ewram);
                    address = 0x02000000;
                    break;
                case 'vram':
                    data = new Uint8Array(bus.vram);
                    address = 0x06000000;
                    break;
                case 'oam':
                    data = new Uint8Array(bus.oam);
                    address = 0x07000000;
                    break;
                case 'palette':
                    data = new Uint8Array(bus.palette);
                    address = 0x05000000;
                    break;
                case 'io':
                    data = new Uint8Array(bus.mmioRegisters);
                    address = 0x04000000;
                    break;
                case 'sram':
                    data = new Uint8Array(bus.sram);
                    address = 0x0e000000;
                    break;
                default:
                    throw new Error(`Unknown memory region: "${options.region}"`);
            }
        }
        else {
            data = new Uint8Array(options.length);
            address = options.address;
            for (let i = 0; i < options.length; i++) {
                data[i] = this.#gba.bus.read8(options.address + i);
            }
        }
        await this.#host.writeMemorySnapshot(options.name, {
            address: `0x${address.toString(16).padStart(8, '0')}`,
            length: data.length,
            data: Array.from(data),
        });
    }
    getRegisters() {
        const result = {};
        if (this.cpuRegisters) {
            for (let i = 0; i <= 15; i++) {
                result[`r${i}`] = this.cpuRegisters[i];
            }
        }
        if (this.cpuCpsr) {
            result['cpsr'] = this.cpuCpsr();
        }
        return result;
    }
    getMemory(address, length) {
        const data = new Uint8Array(length);
        for (let i = 0; i < length; i++) {
            data[i] = this.#gba.bus.read8(address + i);
        }
        return data;
    }
    /**
     * Watch a memory range; each write appends a {@link WatchHit} to the returned
     * handle's `hits` array, recording which code performed it. The core primitive
     * for finding where a value is written.
     *
     * @example
     *   const w = watchMemory({ address: 0x030055C0 });
     *   await press('right', { hold: 60 }); // take a hit
     *   for (const h of w.hits) console.log(h.source, hex(h.instructionAddress), h.value);
     *   w.stop();
     */
    watchMemory(options) {
        const length = options.length ?? 1;
        const filter = options.filter;
        const maxHits = options.maxHits;
        const hits = [];
        const busDispose = this.#gba.bus.addWriteWatchpoint(options.address, length, ({ address, value, size, dmaChannel, dmaOrigin }) => {
            if (maxHits !== undefined && hits.length >= maxHits) {
                return;
            }
            // DMA: the captured trigger instruction; CPU: the live PC + CPSR.
            const origin = dmaOrigin ?? captureOrigin(this.#gba.armCpu.registers[15], this.#gba.armCpu.cpsr);
            const hit = {
                pc: origin.pc,
                instructionAddress: origin.instructionAddress,
                address,
                value: value >>> 0,
                size,
                thumb: origin.thumb,
                source: dmaChannel >= 0 ? `dma${dmaChannel}` : 'cpu',
            };
            // Annotate with the writer's C source line, when debug info is loaded.
            const loc = this.#debugInfo?.pcToSource(hit.instructionAddress);
            if (loc) {
                hit.location = loc;
            }
            if (filter) {
                let keep = false;
                try {
                    keep = filter(hit);
                }
                catch {
                    keep = false; // a throwing filter must not abort emulation
                }
                if (!keep) {
                    return;
                }
            }
            hits.push(hit);
        });
        const stop = () => {
            if (this.#watchDisposers.delete(busDispose)) {
                busDispose();
            }
        };
        this.#watchDisposers.add(busDispose);
        return { hits, stop };
    }
    /**
     * Watch a named global by symbol (requires debug info). Resolves the symbol to
     * its address, then behaves like `watchMemory`. The watch length defaults to the
     * symbol's own size (st_size) so a multi-byte global is watched in full; pass
     * `length` to override. Throws if no debug info is loaded or the symbol is unknown.
     *
     * @example
     *   const w = watchSymbol('gPlayerState'); // covers the whole global
     *   await press('a'); for (const h of w.hits) console.log(h.location, h.value);
     */
    watchSymbol(name, options) {
        if (!this.#debugInfo) {
            throw new Error('watchSymbol requires debug info; call loadDebugInfo(elfBytes) first');
        }
        const address = this.#debugInfo.symbolToAddress(name);
        if (address === null) {
            throw new Error(`watchSymbol: unknown symbol "${name}"`);
        }
        const length = options?.length ?? this.#debugInfo.symbolSize(name) ?? 1;
        return this.watchMemory({ address, length, filter: options?.filter, maxHits: options?.maxHits });
    }
    /** Remove the data watchpoints created via this engine's `watchMemory`. */
    clearWatchpoints() {
        for (const dispose of this.#watchDisposers) {
            dispose();
        }
        this.#watchDisposers.clear();
    }
    read16(address) {
        return this.#gba.bus.read16(address);
    }
    read32(address) {
        return this.#gba.bus.read32(address);
    }
    /**
     * Read a global/static variable's current value by a `symbol` or
     * `symbol.field.subfield` path — the read counterpart to {@link watchSymbol}. The
     * address comes from the symbol table and the byte size (and any bitfield
     * shift/width) from the variable's DWARF type, so the right number of bytes is read
     * and a packed bitfield is decoded to its plain value. Throws if no debug info is
     * loaded or the path can't be resolved.
     *
     * @example
     *   readVariable('g_game_vars.score');       // a nested struct field
     *   readVariable('gPlayerFlags.invincible'); // a bitfield, decoded
     */
    readVariable(path) {
        return this.#readResolved(this.#resolveForRead(path));
    }
    /** Resolve a path to a readable (≤ 4-byte) location, or throw with the reason. */
    #resolveForRead(path) {
        if (!this.#debugInfo) {
            throw new Error(`resolving "${path}" requires debug info; call loadDebugInfo(elfBytes) first`);
        }
        const loc = this.#debugInfo.resolveVariable(path);
        if (loc === null) {
            throw new Error(`cannot resolve "${path}"`);
        }
        if (loc.size > 4) {
            throw new Error(`"${path}" is ${loc.size} bytes; values wider than 32 bits can't be read`);
        }
        return loc;
    }
    /** Read + bitfield-decode the value at a resolved location; result is unsigned. */
    #readResolved(loc) {
        const raw = this.#readSized(loc.address, loc.size);
        return loc.bitOffset === undefined ? raw : ((raw >>> loc.bitOffset) & (2 ** loc.bitWidth - 1)) >>> 0;
    }
    /**
     * Build a value reader + a human label for a `wait`/`assert` memory address: a raw
     * number reads a single byte; a `symbol`/`symbol.field` path resolves through the
     * DWARF (once, up front) and reads the field's full width, decoding bitfields.
     */
    #memoryProbe(address) {
        if (typeof address === 'number') {
            return { read: () => this.#gba.bus.read8(address), label: `0x${address.toString(16)}` };
        }
        const loc = this.#resolveForRead(address);
        return { read: () => this.#readResolved(loc), label: `"${address}" (0x${loc.address.toString(16)})` };
    }
    /**
     * Read an unsigned little-endian integer of `size` (1–4) bytes by assembling
     * individual bytes, so it is correct at any alignment (the bus's read16/read32
     * force alignment) and the result is unsigned.
     */
    #readSized(address, size) {
        const bus = this.#gba.bus;
        let value = 0;
        for (let i = 0; i < size; i++) {
            value |= bus.read8(address + i) << (8 * i);
        }
        return value >>> 0;
    }
    disassemble(address, count, mode) {
        const n = count ?? 10;
        const isThumb = mode === 'thumb' || (mode === undefined && (address & 1 || (this.cpuCpsr && (this.cpuCpsr() & 0x20) !== 0)));
        const bus = this.#gba.bus;
        const results = [];
        let addr = address & ~(isThumb ? 1 : 3);
        for (let i = 0; i < n; i++) {
            if (isThumb) {
                const opcode = bus.read16(addr);
                results.push({ address: addr, instruction: disassembleThumb(opcode, addr), bytes: 2 });
                addr += 2;
            }
            else {
                const opcode = bus.read32(addr);
                results.push({ address: addr, instruction: disassembleArm(opcode, addr), bytes: 4 });
                addr += 4;
            }
        }
        return results;
    }
    /** Disassemble a complete function, stopping at return instructions */
    disassembleFunction(address, mode) {
        const isThumb = mode === 'thumb' || (mode === undefined && (address & 1 || (this.cpuCpsr && (this.cpuCpsr() & 0x20) !== 0)));
        const bus = this.#gba.bus;
        const results = [];
        let addr = address & ~(isThumb ? 1 : 3);
        const maxInstructions = 500;
        for (let i = 0; i < maxInstructions; i++) {
            if (isThumb) {
                const opcode = bus.read16(addr);
                const text = disassembleThumb(opcode, addr);
                results.push({ address: addr, instruction: text, bytes: 2 });
                addr += 2;
                // Detect Thumb return: bx lr (0x4770) or pop {... pc} (0xBDxx)
                if (opcode === 0x4770 || (opcode & 0xff00) === 0xbd00) {
                    break;
                }
            }
            else {
                const opcode = bus.read32(addr);
                const text = disassembleArm(opcode, addr);
                results.push({ address: addr, instruction: text, bytes: 4 });
                addr += 4;
                // Detect ARM return: bx lr (0xE12FFF1E) or mov pc, lr variants
                if (opcode === 0xe12fff1e) {
                    break;
                }
                // ldmfd sp!, {..., pc} — pop with PC
                if ((opcode & 0x0fff0000) === 0x08bd0000 && opcode & 0x8000) {
                    break;
                }
            }
        }
        return results;
    }
    /** Read a null-terminated string from memory */
    readString(address, maxLen) {
        const limit = maxLen ?? 256;
        const chars = [];
        for (let i = 0; i < limit; i++) {
            const byte = this.#gba.bus.read8(address + i);
            if (byte === 0) {
                break;
            }
            chars.push(byte);
        }
        return String.fromCharCode(...chars);
    }
    getPixel(x, y) {
        const framebuffer = this.#gba.ppu.getFramebuffer();
        const abgr = framebuffer[y * 240 + x];
        return {
            r: abgr & 0xff,
            g: (abgr >> 8) & 0xff,
            b: (abgr >> 16) & 0xff,
        };
    }
    getScreenRegion(x, y, width, height) {
        const framebuffer = this.#gba.ppu.getFramebuffer();
        const rgba = new Uint8Array(width * height * 4);
        for (let row = 0; row < height; row++) {
            for (let col = 0; col < width; col++) {
                const abgr = framebuffer[(y + row) * 240 + (x + col)];
                const offset = (row * width + col) * 4;
                rgba[offset] = abgr & 0xff;
                rgba[offset + 1] = (abgr >> 8) & 0xff;
                rgba[offset + 2] = (abgr >> 16) & 0xff;
                rgba[offset + 3] = 0xff;
            }
        }
        return rgba;
    }
    // ─── Recording ─────────────────────────────────────────────────
    record(options) {
        this.#recording = {
            name: options.name,
            interval: options.interval ?? 1,
            columns: options.columns ?? 10,
            frameCounter: 0,
            frames: [],
        };
        return {
            stopRecording: async () => {
                const state = this.#recording;
                if (!state) {
                    return;
                }
                this.#recording = null;
                await this.#writeSpriteSheet(state);
            },
        };
    }
    async #writeSpriteSheet(state) {
        const frameCount = state.frames.length;
        if (frameCount === 0) {
            return;
        }
        const cols = Math.min(state.columns, frameCount);
        const rows = Math.ceil(frameCount / cols);
        const sheetWidth = 240 * cols;
        const sheetHeight = 160 * rows;
        const rgba = new Uint8Array(sheetWidth * sheetHeight * 4);
        for (let f = 0; f < frameCount; f++) {
            const framebuffer = state.frames[f];
            const col = f % cols;
            const row = Math.floor(f / cols);
            const baseX = col * 240;
            const baseY = row * 160;
            for (let y = 0; y < 160; y++) {
                for (let x = 0; x < 240; x++) {
                    const abgr = framebuffer[y * 240 + x];
                    const offset = ((baseY + y) * sheetWidth + (baseX + x)) * 4;
                    rgba[offset] = abgr & 0xff;
                    rgba[offset + 1] = (abgr >> 8) & 0xff;
                    rgba[offset + 2] = (abgr >> 16) & 0xff;
                    rgba[offset + 3] = 0xff;
                }
            }
        }
        await this.#host.writeScreenshot(state.name, rgba, sheetWidth, sheetHeight);
    }
    // ─── GBA Hardware Introspection ─────────────────────────────────
    /** Parse OAM into structured sprite entries */
    readOAM() {
        const oam = this.#gba.bus.oam;
        const view = new DataView(oam.buffer, oam.byteOffset, oam.byteLength);
        // OAM size lookup: shape (2 bits) × size (2 bits) → [width, height] in pixels
        const sizes = [
            /* Square */ [
                [8, 8],
                [16, 16],
                [32, 32],
                [64, 64],
            ],
            /* Horizontal */ [
                [16, 8],
                [32, 8],
                [32, 16],
                [64, 32],
            ],
            /* Vertical */ [
                [8, 16],
                [8, 32],
                [16, 32],
                [32, 64],
            ],
            /* Prohibited */ [
                [8, 8],
                [8, 8],
                [8, 8],
                [8, 8],
            ],
        ];
        const sprites = [];
        for (let i = 0; i < 128; i++) {
            const base = i * 8;
            const attr0 = view.getUint16(base, true);
            const attr1 = view.getUint16(base + 2, true);
            const attr2 = view.getUint16(base + 4, true);
            const objMode = (attr0 >> 8) & 0x3;
            const enabled = objMode !== 2; // mode 2 = disabled/hidden
            const shape = (attr0 >> 14) & 0x3;
            const size = (attr1 >> 14) & 0x3;
            const [w, h] = sizes[shape][size];
            let y = attr0 & 0xff;
            if (y >= 160) {
                y -= 256;
            }
            let x = attr1 & 0x1ff;
            if (x >= 240) {
                x -= 512;
            }
            sprites.push({
                index: i,
                x,
                y,
                tileId: attr2 & 0x3ff,
                width: w,
                height: h,
                palette: (attr2 >> 12) & 0xf,
                priority: (attr2 >> 10) & 0x3,
                hFlip: !!(attr1 & (1 << 12)),
                vFlip: !!(attr1 & (1 << 13)),
                enabled,
                mode: objMode,
            });
        }
        return sprites;
    }
    /** Read background scroll registers (camera position) */
    readBgScroll(layer) {
        const mmio = this.#gba.bus.mmioRegisters;
        const view = new DataView(mmio.buffer, mmio.byteOffset, mmio.byteLength);
        const offset = 0x10 + layer * 4; // BG0HOFS=0x10, BG1HOFS=0x14, etc.
        return {
            x: view.getUint16(offset, true) & 0x1ff,
            y: view.getUint16(offset + 2, true) & 0x1ff,
        };
    }
    /** Read background tilemap as a grid of tile entries */
    readBgTilemap(layer) {
        const mmio = this.#gba.bus.mmioRegisters;
        const view = new DataView(mmio.buffer, mmio.byteOffset, mmio.byteLength);
        const bgcnt = view.getUint16(0x08 + layer * 2, true);
        const screenBase = ((bgcnt >> 8) & 0x1f) * 0x800;
        const sizeFlag = (bgcnt >> 14) & 0x3;
        const is8bpp = !!(bgcnt & (1 << 7));
        // Tilemap dimensions in tiles (32x32 per screen block)
        const widthTiles = sizeFlag & 1 ? 64 : 32;
        const heightTiles = sizeFlag & 2 ? 64 : 32;
        const vram = this.#gba.bus.vram;
        const tiles = [];
        for (let row = 0; row < heightTiles; row++) {
            for (let col = 0; col < widthTiles; col++) {
                // Handle screen block layout for 64-wide and 64-tall maps
                let screenBlock = 0;
                let localCol = col;
                let localRow = row;
                if (col >= 32) {
                    screenBlock += 1;
                    localCol -= 32;
                }
                if (row >= 32) {
                    screenBlock += sizeFlag & 1 ? 2 : 1;
                    localRow -= 32;
                }
                const entryOffset = screenBase + screenBlock * 0x800 + (localRow * 32 + localCol) * 2;
                if (entryOffset + 1 >= vram.length) {
                    tiles.push({ id: 0, hFlip: false, vFlip: false, palette: 0 });
                    continue;
                }
                const entry = vram[entryOffset] | (vram[entryOffset + 1] << 8);
                tiles.push({
                    id: entry & 0x3ff,
                    hFlip: !!(entry & (1 << 10)),
                    vFlip: !!(entry & (1 << 11)),
                    palette: (entry >> 12) & 0xf,
                });
            }
        }
        return { width: widthTiles, height: heightTiles, tileSize: is8bpp ? 8 : 8, tiles };
    }
    /** Parse DISPCNT to show active display configuration */
    readDisplayControl() {
        const mmio = this.#gba.bus.mmioRegisters;
        const dispcnt = mmio[0] | (mmio[1] << 8);
        return {
            mode: dispcnt & 0x7,
            bg: [!!(dispcnt & (1 << 8)), !!(dispcnt & (1 << 9)), !!(dispcnt & (1 << 10)), !!(dispcnt & (1 << 11))],
            obj: !!(dispcnt & (1 << 12)),
            win0: !!(dispcnt & (1 << 13)),
            win1: !!(dispcnt & (1 << 14)),
            objWin: !!(dispcnt & (1 << 15)),
            frameSelect: (dispcnt >> 4) & 1,
        };
    }
    /** Fast hash of a screen region for change detection */
    hashRegion(x, y, width, height) {
        const framebuffer = this.#gba.ppu.getFramebuffer();
        // FNV-1a 32-bit hash
        let hash = 0x811c9dc5;
        for (let row = 0; row < height; row++) {
            for (let col = 0; col < width; col++) {
                const pixel = framebuffer[(y + row) * 240 + (x + col)];
                hash ^= pixel & 0xff;
                hash = Math.imul(hash, 0x01000193);
                hash ^= (pixel >> 8) & 0xff;
                hash = Math.imul(hash, 0x01000193);
                hash ^= (pixel >> 16) & 0xff;
                hash = Math.imul(hash, 0x01000193);
            }
        }
        return hash >>> 0; // ensure unsigned
    }
    /** Register a per-frame callback fired during wait/press/pressSequence */
    onFrame(callback) {
        this.#onFrameCallback = callback;
    }
    // ─── Memory Search ─────────────────────────────────────────────
    searchMemory(options) {
        const size = options.size ?? 8;
        const region = options.region ?? 'both';
        const results = [];
        const regions = [];
        const bus = this.#gba.bus;
        if (region === 'iwram' || region === 'both') {
            regions.push({ base: 0x03000000, data: bus.iwram });
        }
        if (region === 'ewram' || region === 'both') {
            regions.push({ base: 0x02000000, data: bus.ewram });
        }
        for (const { base, data } of regions) {
            const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
            const step = size >> 3;
            const limit = data.length - step + 1;
            for (let i = 0; i < limit; i++) {
                let val;
                if (size === 8) {
                    val = data[i];
                }
                else if (size === 16) {
                    val = view.getUint16(i, true);
                }
                else {
                    val = view.getUint32(i, true);
                }
                if (val === options.value) {
                    results.push(base + i);
                }
            }
        }
        return results;
    }
    filterMemory(addresses, options) {
        const size = options.size ?? 8;
        const results = [];
        for (const addr of addresses) {
            let val;
            if (size === 8) {
                val = this.#gba.bus.read8(addr);
            }
            else if (size === 16) {
                val = this.#gba.bus.read16(addr);
            }
            else {
                val = this.#gba.bus.read32(addr);
            }
            if (val === options.value) {
                results.push(addr);
            }
        }
        return results;
    }
    // ─── State Management ────────────────────────────────────────────
    async saveState(options) {
        this.#actionsExecuted++;
        const snapshot = this.#gba.serialize();
        if (this.cpuSerialize) {
            snapshot.cpu = this.cpuSerialize();
        }
        await this.#host.writeSaveState(options.name, snapshot);
    }
    async loadState(path) {
        this.#actionsExecuted++;
        const snapshot = await this.#host.readSaveState(path);
        this.#gba.deserialize(snapshot);
        if (this.cpuDeserialize && snapshot.cpu) {
            this.cpuDeserialize(snapshot.cpu);
        }
    }
    // ─── Assertions ──────────────────────────────────────────────────
    assert(condition) {
        if ('memory' in condition) {
            const { address, equals } = condition.memory;
            const probe = this.#memoryProbe(address);
            const actual = probe.read();
            if (actual !== equals) {
                throw new Error(`Assertion failed: memory[${probe.label}] expected ${equals} (0x${equals.toString(16)}), got ${actual} (0x${actual.toString(16)})`);
            }
            return;
        }
        if ('register' in condition) {
            const { name, equals } = condition.register;
            const regs = this.getRegisters();
            const actual = regs[name];
            if (actual === undefined) {
                throw new Error(`Assertion failed: unknown register "${name}"`);
            }
            if (actual !== equals) {
                throw new Error(`Assertion failed: ${name} expected ${equals} (0x${equals.toString(16)}), got ${actual} (0x${actual.toString(16)})`);
            }
            return;
        }
    }
}
//# sourceMappingURL=scripting.js.map