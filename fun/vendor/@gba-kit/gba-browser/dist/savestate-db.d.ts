/**
 * Save State IndexedDB Storage
 *
 * Stores GBA save states with thumbnail previews in IndexedDB.
 * Uses structured clone for efficient storage of typed arrays.
 */
import type { GbaSnapshot } from '@gba-kit/gba-emulator/savestate';
export interface SaveStateRecord {
    id: number;
    label: string;
    timestamp: number;
    romHash: string;
    thumbnail: Blob;
    snapshot: GbaSnapshot;
}
export type SaveStateMeta = Omit<SaveStateRecord, 'snapshot'>;
/** Compute a ROM hash from the first 192 bytes of the ROM. */
export declare function computeRomHash(rom: ArrayBuffer): Promise<string>;
/** Save a snapshot to IndexedDB. Returns the auto-generated ID. */
export declare function saveState(romHash: string, snapshot: GbaSnapshot, thumbnail: Blob, label?: string): Promise<number>;
/** Load a full save state record by ID. */
export declare function loadState(id: number): Promise<SaveStateRecord | undefined>;
/** Delete a save state by ID. */
export declare function deleteState(id: number): Promise<void>;
/** Rename a save state. */
export declare function renameState(id: number, label: string): Promise<void>;
/** List save state metadata (no snapshot data) for a specific ROM. */
export declare function listByRom(romHash: string): Promise<SaveStateMeta[]>;
//# sourceMappingURL=savestate-db.d.ts.map