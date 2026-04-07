/**
 * Inspiration Bank — IndexedDB persistence layer.
 *
 * Three object stores:
 *   - items   keyPath: id  → InspirationItem (metadata + analyzer output)
 *   - blobs   keyPath: id  → { id, blob }     (raw uploaded file)
 *   - frames  keyPath: id  → { id, frames }   (string[] of base64 jpeg data URLs)
 *
 * Items metadata is small enough to be queried in-memory; blobs and frames
 * are loaded on demand to keep page weight light.
 */

import type {
  InspirationItem,
  InspirationFilter,
  InspirationStats,
  InspirationKind,
} from '../engine/inspirationTypes';
import { getEffectiveTags } from '../engine/inspirationTypes';

const DB_NAME = 'viasox_inspiration';
const DB_VERSION = 1;
const STORE_ITEMS = 'items';
const STORE_BLOBS = 'blobs';
const STORE_FRAMES = 'frames';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_ITEMS)) {
        const items = db.createObjectStore(STORE_ITEMS, { keyPath: 'id' });
        items.createIndex('uploadedAt', 'uploadedAt', { unique: false });
        items.createIndex('kind', 'kind', { unique: false });
        items.createIndex('starred', 'starred', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_BLOBS)) {
        db.createObjectStore(STORE_BLOBS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_FRAMES)) {
        db.createObjectStore(STORE_FRAMES, { keyPath: 'id' });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'));
  });

  return dbPromise;
}

function promisifyRequest<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB request failed'));
  });
}

function promisifyTx(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB tx failed'));
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB tx aborted'));
  });
}

/** Atomically write item metadata, optional blob, optional frames. */
export async function putItem(
  item: InspirationItem,
  blob?: Blob,
  frames?: string[]
): Promise<void> {
  const db = await openDb();
  const stores: string[] = [STORE_ITEMS];
  if (blob) stores.push(STORE_BLOBS);
  if (frames) stores.push(STORE_FRAMES);

  const tx = db.transaction(stores, 'readwrite');
  tx.objectStore(STORE_ITEMS).put(item);
  if (blob) tx.objectStore(STORE_BLOBS).put({ id: item.id, blob });
  if (frames) tx.objectStore(STORE_FRAMES).put({ id: item.id, frames });
  return promisifyTx(tx);
}

/** Update item metadata only (no blob/frames touched). */
export async function updateItem(item: InspirationItem): Promise<void> {
  const db = await openDb();
  const tx = db.transaction([STORE_ITEMS], 'readwrite');
  tx.objectStore(STORE_ITEMS).put(item);
  return promisifyTx(tx);
}

export async function getItem(id: string): Promise<InspirationItem | undefined> {
  const db = await openDb();
  const tx = db.transaction([STORE_ITEMS], 'readonly');
  const result = await promisifyRequest(
    tx.objectStore(STORE_ITEMS).get(id) as IDBRequest<InspirationItem | undefined>
  );
  return result ? normalizeKind(result) : undefined;
}

/** Normalize legacy data: any item persisted before the schema collapse with
 *  `kind: 'script'` is now treated as a `'brief'`. Briefs and scripts are the
 *  same thing in the bank — briefs include scripts inside them.
 *
 *  Also backfills the performance-tracking fields added in the learning loop
 *  upgrade so older items behave normally inside the selector + auto-star.
 */
function normalizeKind(item: InspirationItem): InspirationItem {
  let normalized = item;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((item.kind as any) === 'script') {
    normalized = { ...normalized, kind: 'brief' };
  }
  // Backfill performance fields if missing
  if (normalized.usageCount === undefined) normalized = { ...normalized, usageCount: 0 };
  if (normalized.derivedScore === undefined) normalized = { ...normalized, derivedScore: null };
  if (normalized.derivedScoreSampleSize === undefined) {
    normalized = { ...normalized, derivedScoreSampleSize: 0 };
  }
  if (normalized.lastUsedAt === undefined) normalized = { ...normalized, lastUsedAt: null };
  if (normalized.lastUsedInBatchIds === undefined) {
    normalized = { ...normalized, lastUsedInBatchIds: [] };
  }
  return normalized;
}

export async function getAllItems(): Promise<InspirationItem[]> {
  const db = await openDb();
  const tx = db.transaction([STORE_ITEMS], 'readonly');
  const items = await promisifyRequest(tx.objectStore(STORE_ITEMS).getAll() as IDBRequest<InspirationItem[]>);
  // Newest first, normalize legacy kinds
  return items.map(normalizeKind).sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1));
}

export async function getBlob(id: string): Promise<Blob | undefined> {
  const db = await openDb();
  const tx = db.transaction([STORE_BLOBS], 'readonly');
  const rec = await promisifyRequest(
    tx.objectStore(STORE_BLOBS).get(id) as IDBRequest<{ id: string; blob: Blob } | undefined>
  );
  return rec?.blob;
}

export async function getFrames(id: string): Promise<string[]> {
  const db = await openDb();
  const tx = db.transaction([STORE_FRAMES], 'readonly');
  const rec = await promisifyRequest(
    tx.objectStore(STORE_FRAMES).get(id) as IDBRequest<{ id: string; frames: string[] } | undefined>
  );
  return rec?.frames ?? [];
}

export async function deleteItem(id: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction([STORE_ITEMS, STORE_BLOBS, STORE_FRAMES], 'readwrite');
  tx.objectStore(STORE_ITEMS).delete(id);
  tx.objectStore(STORE_BLOBS).delete(id);
  tx.objectStore(STORE_FRAMES).delete(id);
  return promisifyTx(tx);
}

export async function clearAll(): Promise<void> {
  const db = await openDb();
  const tx = db.transaction([STORE_ITEMS, STORE_BLOBS, STORE_FRAMES], 'readwrite');
  tx.objectStore(STORE_ITEMS).clear();
  tx.objectStore(STORE_BLOBS).clear();
  tx.objectStore(STORE_FRAMES).clear();
  return promisifyTx(tx);
}

/** Apply a filter in-memory against the full item list. */
export async function queryItems(filter: InspirationFilter): Promise<InspirationItem[]> {
  const all = await getAllItems();
  const search = filter.searchText?.trim().toLowerCase() ?? '';

  return all.filter((item) => {
    if (item.status !== 'ready') return false;
    if (filter.kind && item.kind !== filter.kind) return false;
    if (filter.starredOnly && !item.starred) return false;

    const tags = getEffectiveTags(item);
    if (filter.adType && tags.adType !== filter.adType) return false;
    if (filter.angleType && tags.angleType !== filter.angleType) return false;
    if (filter.productCategory && tags.productCategory !== filter.productCategory) return false;
    if (filter.isFullAi !== undefined && tags.isFullAi !== filter.isFullAi) return false;

    if (search) {
      const haystack = [
        item.title,
        item.filename,
        item.summary,
        item.styleNotes,
        item.userNotes,
        ...item.learnings,
        ...tags.customTags,
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }

    return true;
  });
}

export async function getStats(): Promise<InspirationStats> {
  const all = await getAllItems();
  const ready = all.filter((i) => i.status === 'ready');

  const byKind: Record<InspirationKind, number> = { video: 0, brief: 0 };
  const byAdType: Record<string, number> = {};
  const byAngle: Record<string, number> = {};
  const byProduct: Record<string, number> = {};
  let starredCount = 0;
  let totalSize = 0;
  let oldest: string | null = null;
  let newest: string | null = null;

  for (const item of ready) {
    byKind[item.kind] = (byKind[item.kind] ?? 0) + 1;
    const tags = getEffectiveTags(item);
    if (tags.adType) byAdType[tags.adType] = (byAdType[tags.adType] ?? 0) + 1;
    if (tags.angleType) byAngle[tags.angleType] = (byAngle[tags.angleType] ?? 0) + 1;
    if (tags.productCategory) {
      byProduct[tags.productCategory] = (byProduct[tags.productCategory] ?? 0) + 1;
    }
    if (item.starred) starredCount += 1;
    totalSize += item.fileSize;
    if (!oldest || item.uploadedAt < oldest) oldest = item.uploadedAt;
    if (!newest || item.uploadedAt > newest) newest = item.uploadedAt;
  }

  return {
    total: ready.length,
    byKind,
    byAdType,
    byAngle,
    byProduct,
    starredCount,
    totalSizeMB: Math.round((totalSize / (1024 * 1024)) * 10) / 10,
    oldest,
    newest,
  };
}

/** Export only metadata (no blobs/frames) — for backups. */
export async function exportMetadata(): Promise<string> {
  const items = await getAllItems();
  return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), items }, null, 2);
}

export function generateId(): string {
  return `insp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

// ─── Performance Tracking (closed feedback loop) ────────────────────────────

const MAX_BATCH_HISTORY = 20;

/**
 * Record a single usage of an inspiration item by a brief that has been
 * scored by the batch reviewer. Updates the rolling average derivedScore
 * and bumps usageCount + lastUsedAt + lastUsedInBatchIds. No-op when the
 * item doesn't exist (it may have been deleted between batches).
 */
export async function recordInspirationUsage(
  itemId: string,
  reviewScore: number,
  batchId: string,
): Promise<void> {
  if (!Number.isFinite(reviewScore)) return;
  const item = await getItem(itemId);
  if (!item) return;

  const prevSample = item.derivedScoreSampleSize ?? 0;
  const prevScore = item.derivedScore ?? null;
  const nextSample = prevSample + 1;
  const nextScore =
    prevScore === null
      ? reviewScore
      : (prevScore * prevSample + reviewScore) / nextSample;

  const prevBatches = item.lastUsedInBatchIds ?? [];
  const nextBatches = [batchId, ...prevBatches.filter((b) => b !== batchId)].slice(0, MAX_BATCH_HISTORY);

  const updated: InspirationItem = {
    ...item,
    usageCount: (item.usageCount ?? 0) + 1,
    derivedScore: Math.round(nextScore * 10) / 10,
    derivedScoreSampleSize: nextSample,
    lastUsedAt: new Date().toISOString(),
    lastUsedInBatchIds: nextBatches,
  };

  await updateItem(updated);
}

/**
 * Auto-star pass — promotes items whose derivedScore meets the threshold and
 * have at least the required sample size to "starred" so the selector boosts
 * them. Manual stars by the user are preserved (we never unstar). Items that
 * the auto-pass starred get marked autoStarred=true so the UI can show
 * provenance, and so we can later unstar if their derived score collapses.
 */
export async function autoStarHighPerformingItems(opts?: {
  scoreThreshold?: number;     // default 8.0
  minSampleSize?: number;      // default 3
  unstarThreshold?: number;    // default 6.5 — only auto-unstars items previously auto-starred
}): Promise<{ starred: string[]; unstarred: string[] }> {
  const scoreThreshold = opts?.scoreThreshold ?? 8.0;
  const minSampleSize = opts?.minSampleSize ?? 3;
  const unstarThreshold = opts?.unstarThreshold ?? 6.5;

  const items = await getAllItems();
  const starred: string[] = [];
  const unstarred: string[] = [];

  for (const item of items) {
    const score = item.derivedScore ?? null;
    const sample = item.derivedScoreSampleSize ?? 0;

    // Promotion: cross the bar going up
    if (score !== null && sample >= minSampleSize && score >= scoreThreshold && !item.starred) {
      const updated: InspirationItem = { ...item, starred: true, autoStarred: true };
      await updateItem(updated);
      starred.push(item.id);
      continue;
    }

    // Demotion: cross the bar going down — but ONLY if we previously auto-starred it.
    // Manual stars are sacred.
    if (
      item.starred &&
      item.autoStarred === true &&
      score !== null &&
      sample >= minSampleSize &&
      score < unstarThreshold
    ) {
      const updated: InspirationItem = { ...item, starred: false, autoStarred: false };
      await updateItem(updated);
      unstarred.push(item.id);
    }
  }

  return { starred, unstarred };
}
