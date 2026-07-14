import { IrqFlag } from './types.js';
export class InputController {
    /** Raw button state: bit set = pressed (internal representation) */
    #buttons = 0;
    /** KEYCNT register value */
    #keycnt = 0;
    #interrupts;
    constructor(interrupts) {
        this.#interrupts = interrupts;
    }
    /** Press a button */
    press(button) {
        this.#buttons |= 1 << button;
        this.#checkKeypadIrq();
    }
    /** Release a button */
    release(button) {
        this.#buttons &= ~(1 << button);
    }
    /** Set all buttons at once (bitmask, bit set = pressed) */
    setButtons(mask) {
        this.#buttons = mask & 0x3ff;
        this.#checkKeypadIrq();
    }
    /** Read KEYINPUT register (active-low: 0 = pressed, 1 = released) */
    readKeyInput() {
        return ~this.#buttons & 0x3ff;
    }
    /** Read KEYCNT register */
    readKeyCnt() {
        return this.#keycnt;
    }
    /** Write KEYCNT register */
    writeKeyCnt(value) {
        this.#keycnt = value & 0xc3ff;
        this.#checkKeypadIrq();
    }
    /** Check if keypad IRQ condition is met */
    #checkKeypadIrq() {
        const irqEnable = (this.#keycnt & (1 << 14)) !== 0;
        if (!irqEnable) {
            return;
        }
        const selectedButtons = this.#keycnt & 0x3ff;
        const logicalAnd = (this.#keycnt & (1 << 15)) !== 0;
        const pressed = this.#buttons & selectedButtons;
        if (logicalAnd) {
            // All selected buttons must be pressed
            if (pressed === selectedButtons && selectedButtons !== 0) {
                this.#interrupts.requestInterrupt(IrqFlag.Keypad);
            }
        }
        else {
            // Any selected button pressed
            if (pressed !== 0) {
                this.#interrupts.requestInterrupt(IrqFlag.Keypad);
            }
        }
    }
    /** Serialize to a plain snapshot. */
    serialize() {
        return { buttons: this.#buttons, keycnt: this.#keycnt };
    }
    /** Restore from a snapshot. */
    deserialize(snap) {
        this.#buttons = 0;
        this.#keycnt = snap.keycnt;
    }
    /** Reset */
    reset() {
        this.#buttons = 0;
        this.#keycnt = 0;
    }
}
//# sourceMappingURL=input.js.map