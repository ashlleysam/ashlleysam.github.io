/**
 * GBA PSG — Channels 1-4
 *
 * Channel 1: Square wave with sweep + envelope + duty cycle
 * Channel 2: Square wave with envelope + duty cycle
 * Channel 3: Programmable wave (4-bit samples from Wave RAM)
 * Channel 4: Noise (LFSR) with envelope
 *
 * All channels run at CPU_FREQ / (period * prescaler). The frame sequencer
 * (512 Hz, derived from a 256 Hz base) clocks length, envelope, and sweep.
 */
import type { PsgChannel1Snapshot, PsgChannel2Snapshot, PsgChannel3Snapshot, PsgChannel4Snapshot } from '../savestate.js';
/** Frame sequencer rate: 512 Hz (CPU_FREQ / 32768 cycles per step) */
declare const FRAME_SEQUENCER_PERIOD: number;
export declare class PsgChannel1 {
    #private;
    sweepPeriod: number;
    sweepNegate: boolean;
    sweepShift: number;
    duty: number;
    lengthCounter: number;
    lengthEnabled: boolean;
    envelopeInitialVolume: number;
    envelopeDirection: number;
    envelopePeriod: number;
    frequency: number;
    enabled: boolean;
    /** Current output sample (0-15) */
    get output(): number;
    /** Write SOUND1CNT_L (sweep register, offset 0x60) */
    writeSweep(value: number): void;
    /** Read SOUND1CNT_L */
    readSweep(): number;
    /** Write SOUND1CNT_H (duty/envelope, offset 0x62) */
    writeDutyEnvelope(value: number): void;
    /** Read SOUND1CNT_H */
    readDutyEnvelope(): number;
    /** Write SOUND1CNT_X (frequency/control, offset 0x64) */
    writeFreqControl(value: number): void;
    /** Read SOUND1CNT_X (only bit 14 is readable) */
    readFreqControl(): number;
    /** Clock the frequency timer (called at CPU rate via tick) */
    clockTimer(cycles: number): void;
    /** Clock sweep (128 Hz — frame sequencer steps 2, 6) */
    clockSweep(): void;
    /** Clock length counter (256 Hz — every frame sequencer step) */
    clockLength(): void;
    /** Clock envelope (64 Hz — frame sequencer steps 7) */
    clockEnvelope(): void;
    serialize(): PsgChannel1Snapshot;
    deserialize(s: PsgChannel1Snapshot): void;
    reset(): void;
}
export declare class PsgChannel2 {
    #private;
    duty: number;
    lengthCounter: number;
    lengthEnabled: boolean;
    envelopeInitialVolume: number;
    envelopeDirection: number;
    envelopePeriod: number;
    frequency: number;
    enabled: boolean;
    get output(): number;
    /** Write SOUND2CNT_L (duty/envelope, offset 0x68) */
    writeDutyEnvelope(value: number): void;
    readDutyEnvelope(): number;
    /** Write SOUND2CNT_H (frequency/control, offset 0x6C) */
    writeFreqControl(value: number): void;
    readFreqControl(): number;
    clockTimer(cycles: number): void;
    clockLength(): void;
    clockEnvelope(): void;
    serialize(): PsgChannel2Snapshot;
    deserialize(s: PsgChannel2Snapshot): void;
    reset(): void;
}
export declare class PsgChannel3 {
    #private;
    /** Wave RAM: 16 bytes = 32 4-bit samples */
    readonly waveRam: Uint8Array<ArrayBuffer>;
    enabled: boolean;
    lengthCounter: number;
    lengthEnabled: boolean;
    volumeCode: number;
    frequency: number;
    /** Two banks: 0 or 1 (GBA supports bank mode but we use single-bank for now) */
    bankMode: boolean;
    bankSelect: number;
    get output(): number;
    /** Write SOUND3CNT_L (enable, offset 0x70) */
    writeControl(value: number): void;
    readControl(): number;
    /** Write SOUND3CNT_H (length/volume, offset 0x72) */
    writeLengthVolume(value: number): void;
    readLengthVolume(): number;
    /** Write SOUND3CNT_X (frequency/control, offset 0x74) */
    writeFreqControl(value: number): void;
    readFreqControl(): number;
    clockTimer(cycles: number): void;
    clockLength(): void;
    /** Write a byte to wave RAM */
    writeWaveRam(offset: number, value: number): void;
    /** Read a byte from wave RAM */
    readWaveRam(offset: number): number;
    serialize(): PsgChannel3Snapshot;
    deserialize(s: PsgChannel3Snapshot): void;
    reset(): void;
}
export declare class PsgChannel4 {
    #private;
    lengthCounter: number;
    lengthEnabled: boolean;
    envelopeInitialVolume: number;
    envelopeDirection: number;
    envelopePeriod: number;
    clockShift: number;
    widthMode: boolean;
    divisorCode: number;
    enabled: boolean;
    get output(): number;
    /** Write SOUND4CNT_L (envelope, offset 0x78) */
    writeEnvelope(value: number): void;
    readEnvelope(): number;
    /** Write SOUND4CNT_H (frequency/control, offset 0x7C) */
    writeFreqControl(value: number): void;
    readFreqControl(): number;
    clockTimer(cycles: number): void;
    clockLength(): void;
    clockEnvelope(): void;
    serialize(): PsgChannel4Snapshot;
    deserialize(s: PsgChannel4Snapshot): void;
    reset(): void;
}
export { FRAME_SEQUENCER_PERIOD };
//# sourceMappingURL=psg.d.ts.map