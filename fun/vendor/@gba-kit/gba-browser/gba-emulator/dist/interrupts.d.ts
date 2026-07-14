/**
 * GBA Interrupt Controller
 *
 * Manages IME (master enable), IE (individual enables), and IF (request flags).
 * When an interrupt is requested and enabled, the CPU is signaled to enter IRQ mode.
 */
import type { InterruptSnapshot } from './savestate.js';
export declare class InterruptController {
    /** Master Interrupt Enable (0x04000208) — only bit 0 matters */
    ime: number;
    /** Interrupt Enable (0x04000200) — which interrupts are enabled */
    ie: number;
    /** Interrupt Flags (0x04000202) — which interrupts are pending */
    if_: number;
    /** Whether the CPU is in HALT state (waiting for interrupt) */
    halted: boolean;
    /**
     * IntrWait flags — set by HLE SWI IntrWait/VBlankIntrWait.
     * When non-zero, halt only breaks when one of these specific interrupts fires.
     * This prevents the game loop from running at HBlank rate when VBlankIntrWait
     * is used with HBlank IRQs enabled.
     */
    intrWaitFlags: number;
    /** Request an interrupt by setting bits in IF. */
    requestInterrupt(flag: number): void;
    /** Acknowledge (clear) interrupt flags by writing to IF. Writing 1 clears. */
    acknowledge(value: number): void;
    /** Check if any enabled interrupt is pending and IME is set. */
    irqPending(): boolean;
    /** Read IE register (16-bit). */
    readIe(): number;
    /** Write IE register (16-bit). */
    writeIe(value: number): void;
    /** Read IF register (16-bit). */
    readIf(): number;
    /** Write IF register — writing 1 acknowledges (clears) the flag. */
    writeIf(value: number): void;
    /** Read IME register. */
    readIme(): number;
    /** Write IME register. */
    writeIme(value: number): void;
    /** Serialize to a plain snapshot. */
    serialize(): InterruptSnapshot;
    /** Restore from a snapshot. */
    deserialize(snap: InterruptSnapshot): void;
    /** Reset all state. */
    reset(): void;
}
//# sourceMappingURL=interrupts.d.ts.map