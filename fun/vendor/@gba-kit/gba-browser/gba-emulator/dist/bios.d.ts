/**
 * ARM7TDMI HLE BIOS — High-Level Emulation of GBA BIOS calls
 *
 * Instead of running real BIOS ROM, we intercept SWI instructions and
 * implement the behavior in TypeScript. This is faster and doesn't
 * require a BIOS dump.
 *
 * Reference: GBATEK - GBA BIOS Functions
 * http://problemkaputt.de/gbatek-gba-bios-functions.htm
 */
import type { MemoryBus } from '@gba-kit/arm-emulator';
/**
 * Interface for the CPU that BIOS calls need access to.
 * Uses duck typing to avoid circular imports with ArmCpu.
 */
interface BiosCpu {
    readonly registers: Uint32Array;
    readonly memory: MemoryBus;
}
/** Register the IntrWait callback (called by GBA during setup) */
export declare function setIntrWaitCallback(cb: (flags: number) => void): void;
/**
 * Handle a Software Interrupt (SWI) call.
 *
 * On GBA, the SWI number is the comment field of the SWI instruction:
 * - Thumb: bits 7-0 of the instruction
 * - ARM: bits 23-16 of the instruction
 *
 * The caller is responsible for extracting the correct SWI number
 * before calling this function.
 *
 * @param cpu - The CPU instance
 * @param swiNumber - The SWI function number (0x00-0xFF)
 */
export declare function handleSwi(cpu: BiosCpu, swiNumber: number): void;
export {};
//# sourceMappingURL=bios.d.ts.map