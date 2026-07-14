import { DebugInfo, type SourceLocation } from '@gba-kit/debug-info';
import { Gba } from './gba.js';
import type { CpuSnapshot, GbaSnapshot } from './savestate.js';
/** Platform-specific I/O adapter for the scripting engine */
export interface ScriptingHost {
    writeScreenshot(name: string, rgbaData: Uint8Array, width: number, height: number): Promise<void>;
    writeMemorySnapshot(name: string, data: Record<string, unknown>): Promise<void>;
    writeSaveState(name: string, snapshot: GbaSnapshot): Promise<void>;
    readSaveState(path: string): Promise<GbaSnapshot>;
    log(message: string): void;
}
type ButtonName = 'a' | 'b' | 'select' | 'start' | 'right' | 'left' | 'up' | 'down' | 'r' | 'l';
interface WaitFrames {
    frames: number;
}
interface WaitMemory {
    memory: {
        /**
         * A raw address (read as a single byte), or — when debug info is loaded — a
         * `symbol`/`symbol.field` path, resolved through the DWARF and read at the
         * field's full width (bitfields decoded).
         */
        address: number | string;
        equals?: number;
        lessThan?: number;
        greaterThan?: number;
        bitSet?: number;
    };
    timeout?: number;
}
interface WaitPC {
    pc: number;
    timeout?: number;
}
interface WaitPixel {
    pixel: {
        x: number;
        y: number;
        r: number;
        g: number;
        b: number;
    };
    timeout?: number;
}
type WaitCondition = WaitFrames | WaitMemory | WaitPC | WaitPixel;
interface MemorySnapshotRegion {
    name: string;
    region: 'iwram' | 'ewram' | 'vram' | 'oam' | 'palette' | 'io' | 'sram';
}
interface MemorySnapshotRange {
    name: string;
    address: number;
    length: number;
}
type MemorySnapshotOptions = MemorySnapshotRegion | MemorySnapshotRange;
interface AssertMemory {
    memory: {
        /**
         * A raw address (read as a single byte), or — when debug info is loaded — a
         * `symbol`/`symbol.field` path, resolved through the DWARF and read at the
         * field's full width (bitfields decoded).
         */
        address: number | string;
        equals: number;
    };
}
interface AssertRegister {
    register: {
        name: string;
        equals: number;
    };
}
type AssertCondition = AssertMemory | AssertRegister;
/**
 * A recorded write captured by a data watchpoint. For a `dma*` source, `pc` /
 * `instructionAddress` refer to the instruction that started the DMA.
 */
export interface WatchHit {
    /** CPU PC (pipeline-ahead of the instruction). */
    pc: number;
    /** Address of the responsible instruction (pc-2 in Thumb, pc-4 in ARM). */
    instructionAddress: number;
    /** The watched byte that was written. */
    address: number;
    /** Value committed, masked to the access size. */
    value: number;
    /** Access size in bytes (1, 2 or 4). */
    size: number;
    thumb: boolean;
    source: 'cpu' | 'dma0' | 'dma1' | 'dma2' | 'dma3';
    /**
     * The C `file:line` (+ function) of the writing instruction, when debug info
     * is loaded (see `loadDebugInfo`). This is the "a memory write names its own
     * source line" payoff. Undefined when no debug info, or for code with none
     * (e.g. INCLUDE_ASM stubs, library code).
     */
    location?: SourceLocation;
}
export declare class ScriptingEngine {
    #private;
    /** CPU interface — set externally since Gba doesn't expose full CPU */
    cpuRegisters: Uint32Array | undefined;
    cpuCpsr: (() => number) | undefined;
    cpuSerialize: (() => CpuSnapshot) | undefined;
    cpuDeserialize: ((snapshot: CpuSnapshot) => void) | undefined;
    constructor(gba: Gba, host: ScriptingHost);
    /**
     * Load symbol/DWARF info from a (`-g`-built) ELF image. Enables
     * `pcToSource`/`symbolToAddress`/etc. and annotates watchpoint hits with the
     * writing instruction's source line. The `.gba` ROM has no debug info — pass
     * the sidecar ELF's bytes (its loadable bytes match the ROM, so addresses
     * line up).
     */
    loadDebugInfo(elfBytes: Uint8Array): void;
    /** Provide an already-parsed DebugInfo (e.g. shared with a UI). */
    setDebugInfo(debugInfo: DebugInfo | null): void;
    get debugInfo(): DebugInfo | null;
    get hasDebugInfo(): boolean;
    /** Map a PC to `{ file, line, func }`, or null (no debug info / not in C). */
    pcToSource(pc: number): SourceLocation | null;
    /** The function containing `pc`, as `{ name, address }`, or null. */
    pcToFunction(pc: number): {
        name: string;
        address: number;
    } | null;
    /** Nearest preceding symbol to `addr` as `{ name, offset }`, or null. */
    addressToSymbol(addr: number): {
        name: string;
        offset: number;
    } | null;
    /** Address of a named symbol (function or global), or null. */
    symbolToAddress(name: string): number | null;
    get actionsExecuted(): number;
    wait(condition: WaitCondition): Promise<void>;
    press(buttons: ButtonName | ButtonName[], options?: {
        hold?: number;
    }): Promise<void>;
    pressSequence(inputs: [string | null, number][]): Promise<void>;
    release(button: ButtonName): void;
    takeScreenshot(options: {
        name: string;
    }): Promise<void>;
    takeMemorySnapshot(options: MemorySnapshotOptions): Promise<void>;
    getRegisters(): Record<string, number>;
    getMemory(address: number, length: number): Uint8Array;
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
    watchMemory(options: {
        address: number;
        length?: number;
        /**
         * Keep a hit only when this returns true — watch a wide region but record only
         * what matters. A throw is treated as `false` (never aborts the emulation).
         */
        filter?: (hit: WatchHit) => boolean;
        /**
         * Cap recorded hits (first `maxHits` kept); guards memory on wide/long watches.
         * The watchpoint stays active — call `stop()` to remove it.
         */
        maxHits?: number;
    }): {
        hits: WatchHit[];
        stop: () => void;
    };
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
    watchSymbol(name: string, options?: {
        length?: number;
        filter?: (hit: WatchHit) => boolean;
        maxHits?: number;
    }): {
        hits: WatchHit[];
        stop: () => void;
    };
    /** Remove the data watchpoints created via this engine's `watchMemory`. */
    clearWatchpoints(): void;
    read16(address: number): number;
    read32(address: number): number;
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
    readVariable(path: string): number;
    disassemble(address: number, count?: number, mode?: 'thumb' | 'arm'): {
        address: number;
        instruction: string;
        bytes: number;
    }[];
    /** Disassemble a complete function, stopping at return instructions */
    disassembleFunction(address: number, mode?: 'thumb' | 'arm'): {
        address: number;
        instruction: string;
        bytes: number;
    }[];
    /** Read a null-terminated string from memory */
    readString(address: number, maxLen?: number): string;
    getPixel(x: number, y: number): {
        r: number;
        g: number;
        b: number;
    };
    getScreenRegion(x: number, y: number, width: number, height: number): Uint8Array;
    record(options: {
        name: string;
        interval?: number;
        columns?: number;
    }): {
        stopRecording: () => Promise<void>;
    };
    /** Parse OAM into structured sprite entries */
    readOAM(): {
        index: number;
        x: number;
        y: number;
        tileId: number;
        width: number;
        height: number;
        palette: number;
        priority: number;
        hFlip: boolean;
        vFlip: boolean;
        enabled: boolean;
        mode: number;
    }[];
    /** Read background scroll registers (camera position) */
    readBgScroll(layer: number): {
        x: number;
        y: number;
    };
    /** Read background tilemap as a grid of tile entries */
    readBgTilemap(layer: number): {
        width: number;
        height: number;
        tileSize: number;
        tiles: {
            id: number;
            hFlip: boolean;
            vFlip: boolean;
            palette: number;
        }[];
    };
    /** Parse DISPCNT to show active display configuration */
    readDisplayControl(): {
        mode: number;
        bg: [boolean, boolean, boolean, boolean];
        obj: boolean;
        win0: boolean;
        win1: boolean;
        objWin: boolean;
        frameSelect: number;
    };
    /** Fast hash of a screen region for change detection */
    hashRegion(x: number, y: number, width: number, height: number): number;
    /** Register a per-frame callback fired during wait/press/pressSequence */
    onFrame(callback: ((frame: number) => void) | null): void;
    searchMemory(options: {
        value: number;
        size?: 8 | 16 | 32;
        region?: 'iwram' | 'ewram' | 'both';
    }): number[];
    filterMemory(addresses: number[], options: {
        value: number;
        size?: 8 | 16 | 32;
    }): number[];
    saveState(options: {
        name: string;
    }): Promise<void>;
    loadState(path: string): Promise<void>;
    assert(condition: AssertCondition): void;
}
export {};
//# sourceMappingURL=scripting.d.ts.map