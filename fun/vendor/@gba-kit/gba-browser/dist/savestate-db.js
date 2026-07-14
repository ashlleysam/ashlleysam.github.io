const DB_NAME = 'gba-kit-savestates';
const DB_VERSION = 1;
const STORE_NAME = 'slots';
let dbPromise = null;
function openDb() {
    if (dbPromise) {
        return dbPromise;
    }
    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
            dbPromise = null;
            reject(request.error);
        };
    });
    return dbPromise;
}
/** Compute a ROM hash from the first 192 bytes of the ROM. */
export async function computeRomHash(rom) {
    const header = rom.slice(0, 192);
    const hash = await crypto.subtle.digest('SHA-256', header);
    return Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}
/** Save a snapshot to IndexedDB. Returns the auto-generated ID. */
export async function saveState(romHash, snapshot, thumbnail, label) {
    const db = await openDb();
    const record = {
        label: label ?? `Save #${Date.now()}`,
        timestamp: Date.now(),
        romHash,
        thumbnail,
        snapshot,
    };
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.add(record);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}
/** Load a full save state record by ID. */
export async function loadState(id) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}
/** Delete a save state by ID. */
export async function deleteState(id) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}
/** Rename a save state. */
export async function renameState(id, label) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const getReq = store.get(id);
        getReq.onsuccess = () => {
            const record = getReq.result;
            if (!record) {
                reject(new Error(`Save state ${id} not found`));
                return;
            }
            record.label = label;
            const putReq = store.put(record);
            putReq.onsuccess = () => resolve();
            putReq.onerror = () => reject(putReq.error);
        };
        getReq.onerror = () => reject(getReq.error);
    });
}
/** List save state metadata (no snapshot data) for a specific ROM. */
export async function listByRom(romHash) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => {
            const all = request.result;
            const filtered = all
                .filter((r) => r.romHash === romHash)
                .map(({ id, label, timestamp, romHash, thumbnail }) => ({
                id,
                label,
                timestamp,
                romHash,
                thumbnail,
            }))
                .sort((a, b) => b.timestamp - a.timestamp);
            resolve(filtered);
        };
        request.onerror = () => reject(request.error);
    });
}
//# sourceMappingURL=savestate-db.js.map