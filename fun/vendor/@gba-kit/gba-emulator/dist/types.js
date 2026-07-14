/**
 * GBA Emulator — Hardware-level Types
 *
 * Types specific to GBA hardware subsystems. CPU-level types
 * live in shared/arm-emulator/types.ts.
 */
// ─── Timing Constants ─────────────────────────────────────────────────
/** ARM7TDMI clock frequency: 2^24 Hz ≈ 16.78 MHz */
export const CPU_FREQ = 16_777_216;
/** Cycles per scanline (visible + HBlank) */
export const CYCLES_PER_SCANLINE = 1232;
/** Number of visible scanlines */
export const VISIBLE_SCANLINES = 160;
/** Number of VBlank scanlines */
export const VBLANK_SCANLINES = 68;
/** Total scanlines per frame */
export const TOTAL_SCANLINES = VISIBLE_SCANLINES + VBLANK_SCANLINES; // 228
/** Cycles per frame */
export const CYCLES_PER_FRAME = CYCLES_PER_SCANLINE * TOTAL_SCANLINES; // 280,896
/** Visible portion of a scanline in cycles */
export const HDRAW_CYCLES = 960;
/** HBlank portion in cycles */
export const HBLANK_CYCLES = 272;
/** Target frame rate (Hz) */
export const FRAME_RATE = CPU_FREQ / CYCLES_PER_FRAME; // ~59.7275 Hz
// ─── Screen Dimensions ────────────────────────────────────────────────
export const SCREEN_WIDTH = 240;
export const SCREEN_HEIGHT = 160;
// ─── Event IDs ────────────────────────────────────────────────────────
/** Unique IDs for scheduled hardware events */
export var EventId;
(function (EventId) {
    EventId[EventId["HBlank"] = 0] = "HBlank";
    EventId[EventId["HBlankEnd"] = 1] = "HBlankEnd";
    EventId[EventId["VBlank"] = 2] = "VBlank";
    EventId[EventId["VBlankEnd"] = 3] = "VBlankEnd";
    EventId[EventId["Timer0Overflow"] = 4] = "Timer0Overflow";
    EventId[EventId["Timer1Overflow"] = 5] = "Timer1Overflow";
    EventId[EventId["Timer2Overflow"] = 6] = "Timer2Overflow";
    EventId[EventId["Timer3Overflow"] = 7] = "Timer3Overflow";
    EventId[EventId["Dma0"] = 8] = "Dma0";
    EventId[EventId["Dma1"] = 9] = "Dma1";
    EventId[EventId["Dma2"] = 10] = "Dma2";
    EventId[EventId["Dma3"] = 11] = "Dma3";
    /** Sentinel — total count of event types */
    EventId[EventId["Count"] = 12] = "Count";
})(EventId || (EventId = {}));
// ─── Interrupt Flags ──────────────────────────────────────────────────
export var IrqFlag;
(function (IrqFlag) {
    IrqFlag[IrqFlag["VBlank"] = 1] = "VBlank";
    IrqFlag[IrqFlag["HBlank"] = 2] = "HBlank";
    IrqFlag[IrqFlag["VCount"] = 4] = "VCount";
    IrqFlag[IrqFlag["Timer0"] = 8] = "Timer0";
    IrqFlag[IrqFlag["Timer1"] = 16] = "Timer1";
    IrqFlag[IrqFlag["Timer2"] = 32] = "Timer2";
    IrqFlag[IrqFlag["Timer3"] = 64] = "Timer3";
    IrqFlag[IrqFlag["Serial"] = 128] = "Serial";
    IrqFlag[IrqFlag["Dma0"] = 256] = "Dma0";
    IrqFlag[IrqFlag["Dma1"] = 512] = "Dma1";
    IrqFlag[IrqFlag["Dma2"] = 1024] = "Dma2";
    IrqFlag[IrqFlag["Dma3"] = 2048] = "Dma3";
    IrqFlag[IrqFlag["Keypad"] = 4096] = "Keypad";
    IrqFlag[IrqFlag["GamePak"] = 8192] = "GamePak";
})(IrqFlag || (IrqFlag = {}));
// ─── DMA ──────────────────────────────────────────────────────────────
/** DMA start timing modes */
export var DmaStartTiming;
(function (DmaStartTiming) {
    DmaStartTiming[DmaStartTiming["Immediately"] = 0] = "Immediately";
    DmaStartTiming[DmaStartTiming["VBlank"] = 1] = "VBlank";
    DmaStartTiming[DmaStartTiming["HBlank"] = 2] = "HBlank";
    DmaStartTiming[DmaStartTiming["Special"] = 3] = "Special";
})(DmaStartTiming || (DmaStartTiming = {}));
/** DMA address control */
export var DmaAddrControl;
(function (DmaAddrControl) {
    DmaAddrControl[DmaAddrControl["Increment"] = 0] = "Increment";
    DmaAddrControl[DmaAddrControl["Decrement"] = 1] = "Decrement";
    DmaAddrControl[DmaAddrControl["Fixed"] = 2] = "Fixed";
    DmaAddrControl[DmaAddrControl["IncrementReload"] = 3] = "IncrementReload";
})(DmaAddrControl || (DmaAddrControl = {}));
// ─── Timer ────────────────────────────────────────────────────────────
/** Timer prescaler dividers */
export const TIMER_PRESCALERS = [1, 64, 256, 1024];
// ─── Input ────────────────────────────────────────────────────────────
/** GBA button bit positions in KEYINPUT register (active-low) */
export var GbaButton;
(function (GbaButton) {
    GbaButton[GbaButton["A"] = 0] = "A";
    GbaButton[GbaButton["B"] = 1] = "B";
    GbaButton[GbaButton["Select"] = 2] = "Select";
    GbaButton[GbaButton["Start"] = 3] = "Start";
    GbaButton[GbaButton["Right"] = 4] = "Right";
    GbaButton[GbaButton["Left"] = 5] = "Left";
    GbaButton[GbaButton["Up"] = 6] = "Up";
    GbaButton[GbaButton["Down"] = 7] = "Down";
    GbaButton[GbaButton["R"] = 8] = "R";
    GbaButton[GbaButton["L"] = 9] = "L";
})(GbaButton || (GbaButton = {}));
// ─── MMIO Register Addresses ──────────────────────────────────────────
export const MMIO = {
    // Display
    DISPCNT: 0x04000000,
    DISPSTAT: 0x04000004,
    VCOUNT: 0x04000006,
    BG0CNT: 0x04000008,
    BG1CNT: 0x0400000a,
    BG2CNT: 0x0400000c,
    BG3CNT: 0x0400000e,
    BG0HOFS: 0x04000010,
    BG0VOFS: 0x04000012,
    BG1HOFS: 0x04000014,
    BG1VOFS: 0x04000016,
    BG2HOFS: 0x04000018,
    BG2VOFS: 0x0400001a,
    BG2PA: 0x04000020,
    BG2PB: 0x04000022,
    BG2PC: 0x04000024,
    BG2PD: 0x04000026,
    BG2X: 0x04000028,
    BG2Y: 0x0400002c,
    BG3PA: 0x04000030,
    BG3PB: 0x04000032,
    BG3PC: 0x04000034,
    BG3PD: 0x04000036,
    BG3X: 0x04000038,
    BG3Y: 0x0400003c,
    WIN0H: 0x04000040,
    WIN1H: 0x04000042,
    WIN0V: 0x04000044,
    WIN1V: 0x04000046,
    WININ: 0x04000048,
    WINOUT: 0x0400004a,
    MOSAIC: 0x0400004c,
    BLDCNT: 0x04000050,
    BLDALPHA: 0x04000052,
    BLDY: 0x04000054,
    // Sound
    SOUNDCNT_L: 0x04000080,
    SOUNDCNT_H: 0x04000082,
    SOUNDCNT_X: 0x04000084,
    SOUNDBIAS: 0x04000088,
    FIFO_A: 0x040000a0,
    FIFO_B: 0x040000a4,
    // DMA
    DMA0SAD: 0x040000b0,
    DMA0DAD: 0x040000b4,
    DMA0CNT_L: 0x040000b8,
    DMA0CNT_H: 0x040000ba,
    DMA1SAD: 0x040000bc,
    DMA1DAD: 0x040000c0,
    DMA1CNT_L: 0x040000c4,
    DMA1CNT_H: 0x040000c6,
    DMA2SAD: 0x040000c8,
    DMA2DAD: 0x040000cc,
    DMA2CNT_L: 0x040000d0,
    DMA2CNT_H: 0x040000d2,
    DMA3SAD: 0x040000d4,
    DMA3DAD: 0x040000d8,
    DMA3CNT_L: 0x040000dc,
    DMA3CNT_H: 0x040000de,
    // Timers
    TM0CNT_L: 0x04000100,
    TM0CNT_H: 0x04000102,
    TM1CNT_L: 0x04000104,
    TM1CNT_H: 0x04000106,
    TM2CNT_L: 0x04000108,
    TM2CNT_H: 0x0400010a,
    TM3CNT_L: 0x0400010c,
    TM3CNT_H: 0x0400010e,
    // Input
    KEYINPUT: 0x04000130,
    KEYCNT: 0x04000132,
    // Interrupts
    IE: 0x04000200,
    IF: 0x04000202,
    WAITCNT: 0x04000204,
    IME: 0x04000208,
    // GBA-internal
    POSTFLG: 0x04000300,
    HALTCNT: 0x04000301,
};
//# sourceMappingURL=types.js.map