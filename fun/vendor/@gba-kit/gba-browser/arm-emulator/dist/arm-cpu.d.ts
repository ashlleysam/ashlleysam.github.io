/**
 * ARM7TDMI Full CPU Emulator
 *
 * Supports both ARM (32-bit) and Thumb (16-bit) instruction sets,
 * CPU modes with banked registers, and HLE BIOS calls via SWI.
 *
 * This class is the full-featured CPU for the GBA emulator.
 *
 * References:
 * - ARM7TDMI TRM (DDI0029G): https://ww1.microchip.com/downloads/en/DeviceDoc/DDI0029G_7TDMI_R3_trm.pdf
 * - GBATEK: http://problemkaputt.de/gbatek.htm
 */
import type { CpuSnapshot } from './cpu-snapshot.js';
import type { CpsrFlags, DebugHooks, ExecutionResult, MemoryBus } from './types.js';
/** CPU mode codes (bits 4-0 of CPSR) */
export declare const MODE_USR = 16;
export declare const MODE_FIQ = 17;
export declare const MODE_IRQ = 18;
export declare const MODE_SVC = 19;
export declare const MODE_ABT = 23;
export declare const MODE_UND = 27;
export declare const MODE_SYS = 31;
/**
 * Callback for Software Interrupt (SWI) instructions.
 * Platform-specific: on GBA, the SWI number selects a BIOS function.
 * If not provided, SWI instructions are silently ignored.
 */
export type SwiHandler = (cpu: ArmCpu, swiNumber: number) => void;
/**
 * Full ARM7TDMI CPU supporting ARM and Thumb instruction sets,
 * with CPU modes and banked registers.
 */
export declare class ArmCpu {
    #private;
    /** General-purpose registers r0-r15 (current view, mode-dependent) */
    readonly registers: Uint32Array<ArrayBuffer>;
    /**
     * Current Program Status Register (full 32-bit).
     *
     * Bit layout:
     * - 31: N (Negative)
     * - 30: Z (Zero)
     * - 29: C (Carry)
     * - 28: V (Overflow)
     * - 7: I (IRQ disable)
     * - 6: F (FIQ disable)
     * - 5: T (Thumb state: 0=ARM, 1=Thumb)
     * - 4-0: Mode (0x10=USR, 0x11=FIQ, 0x12=IRQ, 0x13=SVC, 0x17=ABT, 0x1B=UND, 0x1F=SYS)
     */
    cpsr: number;
    /** Memory bus */
    readonly memory: MemoryBus;
    constructor(memory: MemoryBus, options?: {
        hooks?: DebugHooks;
        swiHandler?: SwiHandler;
    });
    /**
     * Set the banked SP for a given mode without switching modes.
     * Used to initialize stack pointers (e.g. GBA BIOS sets IRQ/SVC stacks).
     */
    setBankedSP(mode: number, value: number): void;
    /** Get condition flags from CPSR as a CpsrFlags object */
    get flags(): CpsrFlags;
    /** Get Negative flag */
    getN(): boolean;
    /** Get Zero flag */
    getZ(): boolean;
    /** Get Carry flag */
    getC(): boolean;
    /** Get Overflow flag */
    getV(): boolean;
    /** Get Thumb state bit */
    getT(): boolean;
    /** Get current CPU mode */
    getMode(): number;
    /** Set Negative flag */
    setN(val: boolean): void;
    /** Set Zero flag */
    setZ(val: boolean): void;
    /** Set Carry flag */
    setC(val: boolean): void;
    /** Set Overflow flag */
    setV(val: boolean): void;
    /** Set Thumb state bit */
    setT(val: boolean): void;
    /** Set all four condition flags at once from an AluResult */
    setFlags(n: boolean, z: boolean, c: boolean, v: boolean): void;
    /** Set NZ flags from a result value, leave C and V unchanged */
    setNZ(result: number): void;
    /** Get the SPSR for the current mode. Returns 0 for USR/SYS (no SPSR). */
    getSPSR(): number;
    /** Set the SPSR for the current mode. No-op for USR/SYS. */
    setSPSR(value: number): void;
    /**
     * Switch CPU mode. Saves banked registers from the old mode
     * and restores them for the new mode.
     */
    switchMode(newMode: number): void;
    /** Attach or detach debug hooks */
    setDebugHooks(hooks: DebugHooks | undefined): void;
    /** Register a stub for an external function call */
    registerStub(symbolName: string): number;
    /** Serialize to a plain snapshot. */
    serialize(): CpuSnapshot;
    /** Restore from a snapshot. */
    deserialize(snap: CpuSnapshot): void;
    /** Reset CPU state for a new execution */
    resetState(): void;
    /** Check if IRQs are disabled (CPSR I bit set) */
    irqDisabled(): boolean;
    /**
     * Enter IRQ exception.
     *
     * Standard ARM7TDMI exception entry:
     * 1. Save CPSR to SPSR_irq
     * 2. Switch to IRQ mode
     * 3. Set LR_irq to return address (next instruction + 4)
     * 4. Set I bit (disable further IRQs)
     * 5. Clear T bit (enter ARM state)
     * 6. Set PC to IRQ vector (0x00000018)
     *
     * The BIOS stub at 0x18 (installed by Gba.#installBiosStub) handles:
     * - Saving registers to IRQ stack
     * - Calling the user's handler from [0x03007FFC]
     * - Restoring registers and returning from IRQ
     *
     * The BIOS stub at 0x80 handles IE/IF acknowledgment and BIOS IF mirror
     * update before calling the user handler.
     */
    enterIrq(): void;
    /** Enter Undefined Instruction exception */
    enterUnd(instrAddr: number): void;
    /**
     * Execute one instruction (ARM or Thumb based on T bit).
     * Returns false if halted.
     */
    step(): boolean;
    /** Run until halt or instruction limit */
    run(maxInstructions: number): ExecutionResult;
}
//# sourceMappingURL=arm-cpu.d.ts.map