/**
 * ARM7TDMI Thumb Emulator - Bit manipulation and ALU utilities
 *
 * Key TypeScript/JS numeric patterns for 32-bit ARM emulation:
 * - `| 0` truncates to signed 32-bit (like C's int32_t)
 * - `>>> 0` reinterprets as unsigned 32-bit
 * - `Math.imul(a, b)` for correct 32-bit multiply (regular * loses precision above 2^53)
 * - `>>` is arithmetic right shift (sign-extending), `>>>` is logical right shift
 */
import type { AluResult } from './types.js';
/** Extract bits [hi:lo] from a value (inclusive) */
export declare function bits(value: number, hi: number, lo: number): number;
/** Extract a single bit */
export declare function bit(value: number, pos: number): number;
/** Sign-extend a value from `bitWidth` bits to 32 bits */
export declare function signExtend(value: number, bitWidth: number): number;
/** Check if bit 31 is set (negative in signed interpretation) */
export declare function isNegative(value: number): boolean;
/**
 * Add two 32-bit values with full flag computation.
 * Returns the result and NZCV flags.
 */
export declare function addWithFlags(a: number, b: number, carryIn?: number): AluResult;
/**
 * Subtract two 32-bit values with full flag computation.
 * Computes a - b (with optional borrow).
 *
 * ARM subtraction uses inverted carry: C=1 means no borrow.
 * SUB is implemented as ADD(a, ~b, 1).
 */
export declare function subWithFlags(a: number, b: number, carryIn?: number): AluResult;
/**
 * Logical shift left. Returns [result, carryOut].
 * If amount is 0, carry is unchanged (returns oldCarry).
 */
export declare function lsl(value: number, amount: number, oldCarry: boolean): [number, boolean];
/**
 * Logical shift right. Returns [result, carryOut].
 * amount=0 encodes LSR #32 in Thumb Format 1.
 */
export declare function lsr(value: number, amount: number, oldCarry: boolean, immZeroMeans32?: boolean): [number, boolean];
/**
 * Arithmetic shift right. Returns [result, carryOut].
 * amount=0 encodes ASR #32 in Thumb Format 1.
 */
export declare function asr(value: number, amount: number, oldCarry: boolean, immZeroMeans32?: boolean): [number, boolean];
/**
 * Rotate right. Returns [result, carryOut].
 */
export declare function ror(value: number, amount: number, oldCarry: boolean): [number, boolean];
//# sourceMappingURL=utils.d.ts.map