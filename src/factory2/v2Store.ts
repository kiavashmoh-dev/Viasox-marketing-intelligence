/**
 * Factory V2 — persistence.
 *
 * Briefs live in INDEXEDDB (db `viasox_factory2_db`, store `briefs`) as of
 * Aug 2026. They lived in localStorage before — until a production data
 * loss: a finished 5-brief batch's saves all failed on the shared-origin
 * localStorage quota (kiavashmoh-dev.github.io is ONE origin across every
 * GitHub Pages project on the account, V1's creative-memory store
 * included), the old save() swallowed the QuotaExceededError with a
 * console.warn, the in-memory batch view kept showing "complete", and
 * navigating away destroyed the only copies.
 *
 * Two rules now, written in blood:
 *   1. PERSISTENCE FAILURES THROW. Callers surface them — the UI may never
 *      show a brief as complete when it is not actually on disk.
 *   2. IndexedDB, not localStorage (no practical quota; the same engine
 *      the inspiration bank already uses). Legacy localStorage briefs are
 *      imported once and the legacy blob is left untouched as a backup;
 *      until a migration succeeds, reads MERGE legacy + IndexedDB so the
 *      library can never appear suddenly empty.
 */

import type { UgcBriefV2 } from './v2Types';

const LEGACY_KEY = 'viasox_factory2';
const MIGRATED_FLAG = 'viasox_factory2_migrated_idb';
const DB_NAME = 'viasox_factory2_db';
const DB_VERSION = 1;
const STORE = 'briefs';
const MAX_BRIEFS = 300;

// ─── IndexedDB plumbing ─────────────────────────────────────────────────────

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  const p = new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'));
  });
  dbPromise = p;
  p.catch(() => {
    if (dbPromise === p) dbPromise = null; // allow retry on the next call
  });
  return p;
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'));
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'));
  });
}

function reqResult<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB request failed'));
  });
}

async function getAllRaw(db: IDBDatabase): Promise<UgcBriefV2[]> {
  const tx = db.transaction(STORE, 'readonly');
  const all = await reqResult(tx.objectStore(STORE).getAll() as IDBRequest<UgcBriefV2[]>);
  return Array.isArray(all) ? all : [];
}

// ─── Legacy localStorage migration (one-time, non-destructive) ──────────────

function readLegacyBriefs(): UgcBriefV2[] {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { briefs?: UgcBriefV2[] };
    return Array.isArray(parsed.briefs)
      ? parsed.briefs.filter((b): b is UgcBriefV2 => !!b && typeof b.id === 'string')
      : [];
  } catch {
    return [];
  }
}

function legacyMigrated(): boolean {
  try {
    return localStorage.getItem(MIGRATED_FLAG) === '1';
  } catch {
    return false;
  }
}

let migrationPromise: Promise<void> | null = null;

function ensureMigrated(db: IDBDatabase): Promise<void> {
  if (!migrationPromise) {
    migrationPromise = (async () => {
      if (legacyMigrated()) return;
      const legacy = readLegacyBriefs();
      if (legacy.length > 0) {
        const existingIds = new Set((await getAllRaw(db)).map((b) => b.id));
        const toImport = legacy.filter((b) => !existingIds.has(b.id));
        if (toImport.length > 0) {
          const tx = db.transaction(STORE, 'readwrite');
          const os = tx.objectStore(STORE);
          for (const b of toImport) os.put(b);
          await txDone(tx);
          console.info(
            `[factory2] migrated ${toImport.length} brief(s) from localStorage to IndexedDB (legacy copy kept as backup).`,
          );
        }
      }
      try {
        localStorage.setItem(MIGRATED_FLAG, '1');
      } catch {
        // Flag write failing is fine — reads keep merging legacy.
      }
    })().catch((err) => {
      migrationPromise = null; // retry on the next store call
      console.error('[factory2] legacy brief migration failed — reads keep merging the localStorage copy', err);
    });
  }
  return migrationPromise;
}

// ─── Public API (all async, all LOUD on failure) ────────────────────────────

/**
 * Persist a brief. THROWS on any storage failure — callers must surface
 * the error; a brief that did not reach disk must never look saved.
 */
export async function saveBrief(brief: UgcBriefV2): Promise<void> {
  try {
    const db = await openDb();
    await ensureMigrated(db);
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(brief);
    await txDone(tx);
    void pruneOverCap(db).catch(() => undefined);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Brief "${brief.taskName}" could NOT be saved to storage (${msg}). It exists only in this page's memory — export it or fix storage before leaving the page.`,
    );
  }
}

async function pruneOverCap(db: IDBDatabase): Promise<void> {
  const all = await getAllRaw(db);
  if (all.length <= MAX_BRIEFS) return;
  const sorted = [...all].sort((a, b) => (a.updatedAt || '').localeCompare(b.updatedAt || ''));
  const excess = sorted.slice(0, sorted.length - MAX_BRIEFS);
  const tx = db.transaction(STORE, 'readwrite');
  const os = tx.objectStore(STORE);
  for (const b of excess) os.delete(b.id);
  await txDone(tx);
}

export async function getBrief(id: string): Promise<UgcBriefV2 | undefined> {
  const db = await openDb();
  await ensureMigrated(db);
  const tx = db.transaction(STORE, 'readonly');
  const hit = await reqResult(tx.objectStore(STORE).get(id) as IDBRequest<UgcBriefV2 | undefined>);
  if (hit) return hit;
  return legacyMigrated() ? undefined : readLegacyBriefs().find((b) => b.id === id);
}

export async function getAllBriefs(): Promise<UgcBriefV2[]> {
  const db = await openDb();
  await ensureMigrated(db);
  const idb = await getAllRaw(db);
  // Until a migration has succeeded, merge the legacy copy (IndexedDB wins
  // by id) so the library can never appear suddenly empty.
  const merged = new Map<string, UgcBriefV2>();
  if (!legacyMigrated()) {
    for (const b of readLegacyBriefs()) merged.set(b.id, b);
  }
  for (const b of idb) merged.set(b.id, b);
  return [...merged.values()].sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
}

export async function deleteBrief(id: string): Promise<void> {
  const db = await openDb();
  await ensureMigrated(db);
  const tx = db.transaction(STORE, 'readwrite');
  tx.objectStore(STORE).delete(id);
  await txDone(tx);
  // Best-effort: also remove from an unmigrated legacy blob so a merged
  // read cannot resurrect it.
  if (!legacyMigrated()) {
    try {
      const raw = localStorage.getItem(LEGACY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { schemaVersion?: number; briefs?: UgcBriefV2[] };
        parsed.briefs = (parsed.briefs ?? []).filter((b) => b?.id !== id);
        localStorage.setItem(LEGACY_KEY, JSON.stringify(parsed));
      }
    } catch {
      // legacy cleanup is best-effort only
    }
  }
}
