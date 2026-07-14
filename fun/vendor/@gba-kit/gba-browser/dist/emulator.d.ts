import { ArmCpu } from '@gba-kit/arm-emulator/arm-cpu';
import { Gba } from '@gba-kit/gba-emulator';
import type { GbaSnapshot } from '@gba-kit/gba-emulator/savestate';
export type EmulatorState = 'idle' | 'running' | 'paused';
export interface Breakpoint {
    address: number;
    enabled: boolean;
}
export interface EmulatorCallbacks {
    onStateChange: (state: EmulatorState) => void;
    onFrame: () => void;
    onBreakpoint: (address: number) => void;
}
export declare class EmulatorBridge {
    #private;
    constructor();
    get gba(): Gba;
    get cpu(): ArmCpu;
    get state(): EmulatorState;
    /** Attach callbacks for state updates */
    setCallbacks(callbacks: EmulatorCallbacks): void;
    /** Attach a canvas element for rendering. Immediately shows the last frame. */
    attachCanvas(canvas: HTMLCanvasElement): void;
    /** Detach the current canvas (call when a view unmounts) */
    detachCanvas(): void;
    /** Load a ROM from an ArrayBuffer */
    loadRom(data: ArrayBuffer): void;
    /** Start/resume emulation */
    run(): void;
    /** Pause emulation */
    pause(): void;
    /** Stop emulation and reset */
    stop(): void;
    /** Execute a single CPU instruction */
    stepInstruction(): void;
    /** Run a single emulation frame and render to the attached canvas. */
    runOneFrame(): void;
    /** Step over: run until PC advances past the current instruction */
    stepOver(): void;
    /** Run until a specific address is reached */
    runToAddress(address: number): void;
    addBreakpoint(address: number): void;
    removeBreakpoint(address: number): void;
    toggleBreakpoint(address: number): void;
    getBreakpoints(): Breakpoint[];
    /** Disassemble instructions around the given address */
    disassembleAt(address: number, count: number): Array<{
        address: number;
        mnemonic: string;
        isThumb: boolean;
    }>;
    handleKeyDown(e: KeyboardEvent): void;
    handleKeyUp(e: KeyboardEvent): void;
    /** Whether audio output is currently enabled */
    get audioEnabled(): boolean;
    /** Enable audio output. Creates an AudioContext on first call (requires user gesture). */
    enableAudio(): void;
    /** Disable audio output (mute). The AudioContext is kept alive for quick re-enable. */
    disableAudio(): void;
    /** Toggle audio on/off. Returns the new state. */
    toggleAudio(): boolean;
    readMemory(address: number, size: number): Uint8Array;
    /** Create a snapshot of the current emulator state plus a thumbnail. */
    saveState(): Promise<{
        snapshot: GbaSnapshot;
        thumbnail: Blob;
    }>;
    /** Load a snapshot, restoring the full emulator state. */
    loadState(snapshot: GbaSnapshot): void;
}
//# sourceMappingURL=emulator.d.ts.map