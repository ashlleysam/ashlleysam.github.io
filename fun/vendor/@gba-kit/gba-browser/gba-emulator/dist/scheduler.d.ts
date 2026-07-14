/**
 * GBA Event Scheduler
 *
 * The scheduler coordinates all hardware timing. The CPU runs until
 * the next scheduled event, then the event fires and may schedule
 * further events. This avoids checking timing conditions on every
 * CPU cycle.
 *
 * Design follows mGBA's event-driven scheduling pattern.
 */
import type { SchedulerSnapshot } from './savestate.js';
import { EventId } from './types.js';
export declare class Scheduler {
    #private;
    /** Current cycle count (global clock) */
    currentCycle: number;
    constructor();
    /** Schedule an event to fire after `deltaCycles` cycles from now. */
    schedule(id: EventId, deltaCycles: number, callback: () => void): void;
    /** Cancel a scheduled event. */
    cancel(id: EventId): void;
    /** Check if an event is currently scheduled. */
    isScheduled(id: EventId): boolean;
    /** Get the number of cycles until a specific event fires. Returns 0 if not scheduled. */
    cyclesUntilEvent(id: EventId): number;
    /**
     * Get the number of cycles until the next event fires.
     * Returns Infinity if no events are scheduled.
     */
    cyclesUntilNextEvent(): number;
    /**
     * Advance the clock by `cycles` and fire any events that are due.
     * Events may schedule new events — those are not fired in this tick.
     */
    tick(cycles: number): void;
    /** Serialize to a plain snapshot (callbacks are NOT saved). */
    serialize(): SchedulerSnapshot;
    /** Restore from a snapshot. Callbacks must be re-registered by the caller. */
    deserialize(snap: SchedulerSnapshot): void;
    /** Reset all events and the cycle counter. */
    reset(): void;
}
//# sourceMappingURL=scheduler.d.ts.map