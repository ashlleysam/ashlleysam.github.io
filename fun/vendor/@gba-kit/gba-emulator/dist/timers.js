import { EventId, IrqFlag, TIMER_PRESCALERS } from './types.js';
const TIMER_EVENT_IDS = [
    EventId.Timer0Overflow,
    EventId.Timer1Overflow,
    EventId.Timer2Overflow,
    EventId.Timer3Overflow,
];
const TIMER_IRQ_FLAGS = [IrqFlag.Timer0, IrqFlag.Timer1, IrqFlag.Timer2, IrqFlag.Timer3];
export class TimerController {
    #channels = [];
    #scheduler;
    #interrupts;
    constructor(scheduler, interrupts) {
        this.#scheduler = scheduler;
        this.#interrupts = interrupts;
        for (let i = 0; i < 4; i++) {
            this.#channels.push({
                counter: 0,
                reload: 0,
                prescaler: 0,
                cascade: false,
                irqEnable: false,
                enabled: false,
                lastUpdateCycle: 0,
            });
        }
    }
    /** Set an overflow callback for a timer (used by DirectSound). */
    setOverflowCallback(index, callback) {
        this.#channels[index].onOverflow = callback;
    }
    /** Read timer counter (TM0CNT_L etc.). Syncs counter to current cycle. */
    readCounter(index) {
        const ch = this.#channels[index];
        if (ch.enabled && !ch.cascade) {
            this.#syncCounter(index);
        }
        return ch.counter & 0xffff;
    }
    /** Write timer reload value (TM0CNT_L etc.). Does NOT update running counter. */
    writeReload(index, value) {
        this.#channels[index].reload = value & 0xffff;
    }
    /** Read timer control (TM0CNT_H etc.). */
    readControl(index) {
        const ch = this.#channels[index];
        return (ch.prescaler & 3) | (ch.cascade ? 1 << 2 : 0) | (ch.irqEnable ? 1 << 6 : 0) | (ch.enabled ? 1 << 7 : 0);
    }
    /** Write timer control (TM0CNT_H etc.). */
    writeControl(index, value) {
        const ch = this.#channels[index];
        const wasEnabled = ch.enabled;
        ch.prescaler = value & 3;
        ch.cascade = index > 0 && (value & (1 << 2)) !== 0;
        ch.irqEnable = (value & (1 << 6)) !== 0;
        ch.enabled = (value & (1 << 7)) !== 0;
        if (!wasEnabled && ch.enabled) {
            // Timer just enabled: reload counter
            ch.counter = ch.reload;
            ch.lastUpdateCycle = this.#scheduler.currentCycle;
            if (!ch.cascade) {
                this.#scheduleOverflow(index);
            }
        }
        else if (wasEnabled && !ch.enabled) {
            // Timer disabled: cancel scheduled overflow
            this.#scheduler.cancel(TIMER_EVENT_IDS[index]);
        }
    }
    /** Sync a non-cascade timer's counter based on elapsed cycles. */
    #syncCounter(index) {
        const ch = this.#channels[index];
        const elapsed = this.#scheduler.currentCycle - ch.lastUpdateCycle;
        const prescaler = TIMER_PRESCALERS[ch.prescaler];
        const ticks = Math.floor(elapsed / prescaler);
        if (ticks > 0) {
            ch.counter = (ch.counter + ticks) & 0xffff;
            ch.lastUpdateCycle += ticks * prescaler;
        }
    }
    /** Schedule the next overflow event for a timer. */
    #scheduleOverflow(index) {
        const ch = this.#channels[index];
        const ticksUntilOverflow = 0x10000 - ch.counter;
        const prescaler = TIMER_PRESCALERS[ch.prescaler];
        const cycles = ticksUntilOverflow * prescaler;
        this.#scheduler.schedule(TIMER_EVENT_IDS[index], cycles, () => {
            this.#onOverflow(index);
        });
    }
    /** Handle a timer overflow. */
    #onOverflow(index) {
        const ch = this.#channels[index];
        // Reload counter
        ch.counter = ch.reload;
        ch.lastUpdateCycle = this.#scheduler.currentCycle;
        // Fire IRQ if enabled
        if (ch.irqEnable) {
            this.#interrupts.requestInterrupt(TIMER_IRQ_FLAGS[index]);
        }
        // Notify listeners (DirectSound FIFO)
        ch.onOverflow?.();
        // Cascade: increment next timer
        if (index < 3) {
            const next = this.#channels[index + 1];
            if (next.enabled && next.cascade) {
                next.counter = (next.counter + 1) & 0xffff;
                if (next.counter === 0) {
                    // Cascade overflow
                    this.#onOverflow(index + 1);
                }
            }
        }
        // Reschedule if still running (must happen even after cascade)
        if (ch.enabled && !ch.cascade) {
            this.#scheduleOverflow(index);
        }
    }
    /** Serialize to a plain snapshot. */
    serialize() {
        return {
            channels: this.#channels.map((ch) => ({
                counter: ch.counter,
                reload: ch.reload,
                prescaler: ch.prescaler,
                cascade: ch.cascade,
                irqEnable: ch.irqEnable,
                enabled: ch.enabled,
                lastUpdateCycle: ch.lastUpdateCycle,
            })),
        };
    }
    /** Restore from a snapshot. Overflow callbacks must be reinstalled by APU. */
    deserialize(snap) {
        for (let i = 0; i < 4; i++) {
            const ch = this.#channels[i];
            const s = snap.channels[i];
            ch.counter = s.counter;
            ch.reload = s.reload;
            ch.prescaler = s.prescaler;
            ch.cascade = s.cascade;
            ch.irqEnable = s.irqEnable;
            ch.enabled = s.enabled;
            ch.lastUpdateCycle = s.lastUpdateCycle;
            // onOverflow preserved from current state (reinstalled by APU)
        }
    }
    /** Reschedule overflow events for enabled non-cascade timers. */
    reconstructEvents() {
        for (let i = 0; i < 4; i++) {
            const ch = this.#channels[i];
            if (ch.enabled && !ch.cascade) {
                this.#scheduleOverflow(i);
            }
        }
    }
    /** Reset all timers. */
    reset() {
        for (let i = 0; i < 4; i++) {
            const ch = this.#channels[i];
            ch.counter = 0;
            ch.reload = 0;
            ch.prescaler = 0;
            ch.cascade = false;
            ch.irqEnable = false;
            ch.enabled = false;
            ch.lastUpdateCycle = 0;
            ch.onOverflow = undefined;
            this.#scheduler.cancel(TIMER_EVENT_IDS[i]);
        }
    }
}
//# sourceMappingURL=timers.js.map