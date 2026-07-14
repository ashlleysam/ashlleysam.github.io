/**
 * GBA APU — Audio Processing Unit
 *
 * Mixes PSG channels 1-4 and DirectSound A/B, outputs samples to a
 * ring buffer for consumption by an AudioWorklet or similar sink.
 *
 * MMIO register offsets (from 0x04000000):
 *   0x60  SOUND1CNT_L  Channel 1 sweep
 *   0x62  SOUND1CNT_H  Channel 1 duty/envelope
 *   0x64  SOUND1CNT_X  Channel 1 frequency/control
 *   0x68  SOUND2CNT_L  Channel 2 duty/envelope
 *   0x6C  SOUND2CNT_H  Channel 2 frequency/control
 *   0x70  SOUND3CNT_L  Channel 3 enable
 *   0x72  SOUND3CNT_H  Channel 3 length/volume
 *   0x74  SOUND3CNT_X  Channel 3 frequency/control
 *   0x78  SOUND4CNT_L  Channel 4 envelope
 *   0x7C  SOUND4CNT_H  Channel 4 frequency/control
 *   0x80  SOUNDCNT_L   PSG master volume/routing
 *   0x82  SOUNDCNT_H   DirectSound volume, timer select, FIFO reset
 *   0x84  SOUNDCNT_X   Master enable, channel status
 *   0x88  SOUNDBIAS    Bias + resolution
 *   0x90-0x9F          Wave RAM (16 bytes)
 *   0xA0  FIFO_A       DirectSound FIFO A (write-only, 32-bit)
 *   0xA4  FIFO_B       DirectSound FIFO B (write-only, 32-bit)
 */
import type { DmaController } from '../dma.js';
import type { ApuSnapshot } from '../savestate.js';
import type { TimerController } from '../timers.js';
export declare class Apu {
    #private;
    constructor(sampleRate?: number);
    /** Connect to the timer controller and register FIFO overflow callbacks */
    connectTimers(timers: TimerController): void;
    /** Connect to the DMA controller for sound FIFO refills */
    connectDma(dma: DmaController): void;
    /** Read a 16-bit MMIO register (offset relative to 0x04000000) */
    readRegister(offset: number): number;
    /** Write a 16-bit MMIO register (offset relative to 0x04000000) */
    writeRegister(offset: number, value: number): void;
    /** Handle 32-bit FIFO write from DMA or CPU */
    writeFifo(channel: 0 | 1, value: number): void;
    /** Advance APU state by the given number of CPU cycles */
    tick(cycles: number): void;
    /**
     * Read interleaved stereo samples into the output buffer.
     * Returns the number of sample frames (pairs) written.
     * The output array should have room for `output.length / 2` stereo pairs.
     */
    readSamples(output: Float32Array): number;
    /** Serialize to a plain snapshot (ring buffer is NOT saved — it's ephemeral audio). */
    serialize(): ApuSnapshot;
    /** Restore from a snapshot. Re-installs timer callbacks. */
    deserialize(snap: ApuSnapshot): void;
    reset(): void;
}
//# sourceMappingURL=apu.d.ts.map