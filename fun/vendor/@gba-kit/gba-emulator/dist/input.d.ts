/**
 * GBA Keypad Input Controller
 *
 * KEYINPUT (0x04000130): Active-low — bit 0 = pressed means the bit is 0.
 * KEYCNT (0x04000132): Interrupt control for keypad IRQ.
 */
import type { InterruptController } from './interrupts.js';
import type { InputSnapshot } from './savestate.js';
import { GbaButton } from './types.js';
export declare class InputController {
    #private;
    constructor(interrupts: InterruptController);
    /** Press a button */
    press(button: GbaButton): void;
    /** Release a button */
    release(button: GbaButton): void;
    /** Set all buttons at once (bitmask, bit set = pressed) */
    setButtons(mask: number): void;
    /** Read KEYINPUT register (active-low: 0 = pressed, 1 = released) */
    readKeyInput(): number;
    /** Read KEYCNT register */
    readKeyCnt(): number;
    /** Write KEYCNT register */
    writeKeyCnt(value: number): void;
    /** Serialize to a plain snapshot. */
    serialize(): InputSnapshot;
    /** Restore from a snapshot. */
    deserialize(snap: InputSnapshot): void;
    /** Reset */
    reset(): void;
}
//# sourceMappingURL=input.d.ts.map