/** The instruction a data-watchpoint hit is attributed to (pipeline-corrected). */
export interface WriteOrigin {
    /** Raw CPU PC (2 instructions ahead of `instructionAddress`). */
    pc: number;
    /** Address of the instruction (pc-2 in Thumb, pc-4 in ARM). */
    instructionAddress: number;
    thumb: boolean;
}
/** Apply the ARM7TDMI pipeline offset (pc-2 in Thumb, pc-4 in ARM) to a PC + CPSR. */
export declare function captureOrigin(pc: number, cpsr: number): WriteOrigin;
//# sourceMappingURL=write-source.d.ts.map