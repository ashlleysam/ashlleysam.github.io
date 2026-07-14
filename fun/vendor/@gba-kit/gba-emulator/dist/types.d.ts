/**
 * GBA Emulator — Hardware-level Types
 *
 * Types specific to GBA hardware subsystems. CPU-level types
 * live in shared/arm-emulator/types.ts.
 */
/** ARM7TDMI clock frequency: 2^24 Hz ≈ 16.78 MHz */
export declare const CPU_FREQ = 16777216;
/** Cycles per scanline (visible + HBlank) */
export declare const CYCLES_PER_SCANLINE = 1232;
/** Number of visible scanlines */
export declare const VISIBLE_SCANLINES = 160;
/** Number of VBlank scanlines */
export declare const VBLANK_SCANLINES = 68;
/** Total scanlines per frame */
export declare const TOTAL_SCANLINES: number;
/** Cycles per frame */
export declare const CYCLES_PER_FRAME: number;
/** Visible portion of a scanline in cycles */
export declare const HDRAW_CYCLES = 960;
/** HBlank portion in cycles */
export declare const HBLANK_CYCLES = 272;
/** Target frame rate (Hz) */
export declare const FRAME_RATE: number;
export declare const SCREEN_WIDTH = 240;
export declare const SCREEN_HEIGHT = 160;
/** Unique IDs for scheduled hardware events */
export declare const enum EventId {
    HBlank = 0,
    HBlankEnd = 1,
    VBlank = 2,
    VBlankEnd = 3,
    Timer0Overflow = 4,
    Timer1Overflow = 5,
    Timer2Overflow = 6,
    Timer3Overflow = 7,
    Dma0 = 8,
    Dma1 = 9,
    Dma2 = 10,
    Dma3 = 11,
    /** Sentinel — total count of event types */
    Count = 12
}
export declare const enum IrqFlag {
    VBlank = 1,
    HBlank = 2,
    VCount = 4,
    Timer0 = 8,
    Timer1 = 16,
    Timer2 = 32,
    Timer3 = 64,
    Serial = 128,
    Dma0 = 256,
    Dma1 = 512,
    Dma2 = 1024,
    Dma3 = 2048,
    Keypad = 4096,
    GamePak = 8192
}
/** DMA start timing modes */
export declare const enum DmaStartTiming {
    Immediately = 0,
    VBlank = 1,
    HBlank = 2,
    Special = 3
}
/** DMA address control */
export declare const enum DmaAddrControl {
    Increment = 0,
    Decrement = 1,
    Fixed = 2,
    IncrementReload = 3
}
/** Timer prescaler dividers */
export declare const TIMER_PRESCALERS: readonly [1, 64, 256, 1024];
/** GBA button bit positions in KEYINPUT register (active-low) */
export declare const enum GbaButton {
    A = 0,
    B = 1,
    Select = 2,
    Start = 3,
    Right = 4,
    Left = 5,
    Up = 6,
    Down = 7,
    R = 8,
    L = 9
}
export declare const MMIO: {
    readonly DISPCNT: 67108864;
    readonly DISPSTAT: 67108868;
    readonly VCOUNT: 67108870;
    readonly BG0CNT: 67108872;
    readonly BG1CNT: 67108874;
    readonly BG2CNT: 67108876;
    readonly BG3CNT: 67108878;
    readonly BG0HOFS: 67108880;
    readonly BG0VOFS: 67108882;
    readonly BG1HOFS: 67108884;
    readonly BG1VOFS: 67108886;
    readonly BG2HOFS: 67108888;
    readonly BG2VOFS: 67108890;
    readonly BG2PA: 67108896;
    readonly BG2PB: 67108898;
    readonly BG2PC: 67108900;
    readonly BG2PD: 67108902;
    readonly BG2X: 67108904;
    readonly BG2Y: 67108908;
    readonly BG3PA: 67108912;
    readonly BG3PB: 67108914;
    readonly BG3PC: 67108916;
    readonly BG3PD: 67108918;
    readonly BG3X: 67108920;
    readonly BG3Y: 67108924;
    readonly WIN0H: 67108928;
    readonly WIN1H: 67108930;
    readonly WIN0V: 67108932;
    readonly WIN1V: 67108934;
    readonly WININ: 67108936;
    readonly WINOUT: 67108938;
    readonly MOSAIC: 67108940;
    readonly BLDCNT: 67108944;
    readonly BLDALPHA: 67108946;
    readonly BLDY: 67108948;
    readonly SOUNDCNT_L: 67108992;
    readonly SOUNDCNT_H: 67108994;
    readonly SOUNDCNT_X: 67108996;
    readonly SOUNDBIAS: 67109000;
    readonly FIFO_A: 67109024;
    readonly FIFO_B: 67109028;
    readonly DMA0SAD: 67109040;
    readonly DMA0DAD: 67109044;
    readonly DMA0CNT_L: 67109048;
    readonly DMA0CNT_H: 67109050;
    readonly DMA1SAD: 67109052;
    readonly DMA1DAD: 67109056;
    readonly DMA1CNT_L: 67109060;
    readonly DMA1CNT_H: 67109062;
    readonly DMA2SAD: 67109064;
    readonly DMA2DAD: 67109068;
    readonly DMA2CNT_L: 67109072;
    readonly DMA2CNT_H: 67109074;
    readonly DMA3SAD: 67109076;
    readonly DMA3DAD: 67109080;
    readonly DMA3CNT_L: 67109084;
    readonly DMA3CNT_H: 67109086;
    readonly TM0CNT_L: 67109120;
    readonly TM0CNT_H: 67109122;
    readonly TM1CNT_L: 67109124;
    readonly TM1CNT_H: 67109126;
    readonly TM2CNT_L: 67109128;
    readonly TM2CNT_H: 67109130;
    readonly TM3CNT_L: 67109132;
    readonly TM3CNT_H: 67109134;
    readonly KEYINPUT: 67109168;
    readonly KEYCNT: 67109170;
    readonly IE: 67109376;
    readonly IF: 67109378;
    readonly WAITCNT: 67109380;
    readonly IME: 67109384;
    readonly POSTFLG: 67109632;
    readonly HALTCNT: 67109633;
};
//# sourceMappingURL=types.d.ts.map