/**
 * GBA DirectSound A/B — FIFO-based 8-bit PCM channels
 *
 * Each channel has a 32-byte FIFO queue. A timer overflow pops the
 * next sample; DMA refills the FIFO when it runs low.
 */
import type { DirectSoundSnapshot } from '../savestate.js';
export declare class DirectSoundChannel {
    #private;
    /** Current output sample (signed 8-bit, range -128..127) */
    currentSample: number;
    /** Whether this channel is enabled (left) */
    enableLeft: boolean;
    /** Whether this channel is enabled (right) */
    enableRight: boolean;
    /** Volume: false = 50%, true = 100% */
    fullVolume: boolean;
    /** Which timer drives this channel (0 or 1) */
    timerSelect: number;
    /** Push 4 bytes from a 32-bit write into the FIFO */
    writeFifo(value: number): void;
    /** Pop the next sample from the FIFO (called on timer overflow) */
    popSample(): void;
    /** Returns true if the FIFO needs a DMA refill (<= 16 bytes remaining) */
    needsRefill(): boolean;
    /** Get current FIFO size */
    get size(): number;
    /** Clear the FIFO */
    resetFifo(): void;
    /** Serialize to a plain snapshot. */
    serialize(): DirectSoundSnapshot;
    /** Restore from a snapshot. */
    deserialize(snap: DirectSoundSnapshot): void;
    /** Full reset */
    reset(): void;
}
//# sourceMappingURL=direct-sound.d.ts.map