/** Apply the ARM7TDMI pipeline offset (pc-2 in Thumb, pc-4 in ARM) to a PC + CPSR. */
export function captureOrigin(pc, cpsr) {
    const rawPc = pc >>> 0;
    const thumb = (cpsr & 0x20) !== 0; // CPSR T bit
    return { pc: rawPc, instructionAddress: (rawPc - (thumb ? 2 : 4)) >>> 0, thumb };
}
//# sourceMappingURL=write-source.js.map