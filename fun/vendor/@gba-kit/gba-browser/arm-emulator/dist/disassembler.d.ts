/**
 * Disassemble a 16-bit Thumb instruction.
 *
 * @param instruction - The 16-bit instruction word
 * @param address - The address of the instruction (for PC-relative calculations)
 * @returns A human-readable disassembly string
 */
export declare function disassembleThumb(instruction: number, address: number): string;
/**
 * Disassemble a 32-bit ARM instruction.
 *
 * @param instruction - The 32-bit instruction word
 * @param address - The address of the instruction (for PC-relative calculations)
 * @returns A human-readable disassembly string
 */
export declare function disassembleArm(instruction: number, address: number): string;
//# sourceMappingURL=disassembler.d.ts.map