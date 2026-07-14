/**
 * GBA Timer Controller
 *
 * 4 independent 16-bit timers. Each can use a prescaler divider
 * or cascade (increment when the previous timer overflows).
 * Timers 0/1 drive DirectSound sample rates.
 */
import type { InterruptController } from './interrupts.js';
import type { TimerSnapshot } from './savestate.js';
import type { Scheduler } from './scheduler.js';
export declare class TimerController {
    #private;
    constructor(scheduler: Scheduler, interrupts: InterruptController);
    /** Set an overflow callback for a timer (used by DirectSound). */
    setOverflowCallback(index: number, callback: () => void): void;
    /** Read timer counter (TM0CNT_L etc.). Syncs counter to current cycle. */
    readCounter(index: number): number;
    /** Write timer reload value (TM0CNT_L etc.). Does NOT update running counter. */
    writeReload(index: number, value: number): void;
    /** Read timer control (TM0CNT_H etc.). */
    readControl(index: number): number;
    /** Write timer control (TM0CNT_H etc.). */
    writeControl(index: number, value: number): void;
    /** Serialize to a plain snapshot. */
    serialize(): TimerSnapshot;
    /** Restore from a snapshot. Overflow callbacks must be reinstalled by APU. */
    deserialize(snap: TimerSnapshot): void;
    /** Reschedule overflow events for enabled non-cascade timers. */
    reconstructEvents(): void;
    /** Reset all timers. */
    reset(): void;
}
//# sourceMappingURL=timers.d.ts.map