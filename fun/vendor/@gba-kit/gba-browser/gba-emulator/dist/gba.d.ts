/**
 * GBA System Coordinator
 *
 * Wires up all subsystems and runs the main emulation loop.
 * The CPU runs until the next scheduled event, then the event fires
 * and may schedule further events.
 */
import { ArmCpu } from '@gba-kit/arm-emulator/arm-cpu';
import { Apu } from './apu/apu.js';
import { DmaController } from './dma.js';
import { InputController } from './input.js';
import { InterruptController } from './interrupts.js';
import { Ppu } from './ppu/ppu.js';
import type { GbaSnapshot } from './savestate.js';
import { Scheduler } from './scheduler.js';
import { GbaSystemBus } from './system-bus.js';
import { TimerController } from './timers.js';
import { GbaButton } from './types.js';
/** PPU rendering interface */
export interface PpuInterface {
    /** Render a single scanline */
    renderScanline(line: number, bus: GbaSystemBus): void;
    /** Called at VBlank start */
    onVBlank?(): void;
    /** Get the framebuffer */
    getFramebuffer(): Uint32Array;
    /** Reset */
    reset(): void;
}
export declare class Gba {
    #private;
    readonly scheduler: Scheduler;
    readonly interrupts: InterruptController;
    readonly timers: TimerController;
    readonly dma: DmaController;
    readonly input: InputController;
    readonly bus: GbaSystemBus;
    readonly ppu: Ppu;
    readonly apu: Apu;
    readonly armCpu: ArmCpu;
    constructor();
    /** Load a ROM into the system */
    loadRom(data: Uint8Array): void;
    /** Press a button */
    pressButton(button: GbaButton): void;
    /** Release a button */
    releaseButton(button: GbaButton): void;
    /** Run one full frame (~280,896 cycles) */
    runFrame(): void;
    /** Serialize the entire emulator state to a snapshot (excludes CPU — serialized separately). */
    serialize(): GbaSnapshot;
    /** Restore from a snapshot. ROM/BIOS must already be loaded. */
    deserialize(snap: GbaSnapshot): void;
    /** Stop emulation */
    stop(): void;
    /** Reset the entire system */
    reset(): void;
}
//# sourceMappingURL=gba.d.ts.map