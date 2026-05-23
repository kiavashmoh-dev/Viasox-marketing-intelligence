/**
 * Comment Bank — IndexedDB persistence for Meta-pulled ad comments.
 *
 * Two object stores:
 *   - comments   keyPath: id            → CommentRecord
 *   - cursors    keyPath: adId          → AdSyncCursor
 *
 * Plus a tiny `meta` key-value store for global state (e.g. last pull
 * timestamp across all ads).
 *
 * Mirrors the inspirationStore structure so the patterns are familiar.
 */

import type { CommentRecord, AdSyncCursor, CommentBankStats } from './commentBankTypes';

const DB_NAME = 'viasox_comments';
const DB_VERSION = 1;
const STORE_COMMENTS = 'comments';
const STORE_CURSORS = 'cursors';
const STORE_META = 'meta';

const META_KEY_LAST_PULL = 'last_pull_at';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_COMMENTS)) {
        const comments = db.createObjectStore(STORE_COMMENTS, { keyPath: 'id' });
        comments.createIndex('adId', 'adId', { unique: false });
        comments.createIndex('campaignId', 'campaignId', { unique: false });
        comments.createIndex('createdAt', 'createdAt', { unique: false });
        comments.createIndex('pulledAt', 'pulledAt', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_CURSORS)) {
        db.createObjectStore(STORE_CURSORS, { keyPath: 'adId' });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'key' });
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

// ─── Comment CRUD ───────────────────────────────────────────────────────

/**
 * Bulk insert/update comments. Uses `put` semantics so re-pulled comments
 * (same id) overwrite the existing record harmlessly. Returns the number
 * of records that were NEW vs already-present so the puller can report
 * "X new comments this run."
 */
export async function putComments(comments: CommentRecord[]): Promise<{ added: number; updated: number }> {
  if (comments.length === 0) return { added: 0, updated: 0 };
  const db = await openDb();
  const tx = db.transaction(STORE_COMMENTS, 'readwrite');
  const store = tx.objectStore(STORE_COMMENTS);
  let added = 0;
  let updated = 0;
  for (const c of comments) {
    const existing = await promisifyRequest(store.get(c.id));
    if (existing) updated++;
    else added++;
    store.put(c);
  }
  await promisifyTx(tx);
  return { added, updated };
}

export async function getAllComments(): Promise<CommentRecord[]> {
  const db = await openDb();
  const tx = db.transaction(STORE_COMMENTS, 'readonly');
  return promisifyRequest(tx.objectStore(STORE_COMMENTS).getAll());
}

export async function getCommentsByAd(adId: string): Promise<CommentRecord[]> {
  const db = await openDb();
  const tx = db.transaction(STORE_COMMENTS, 'readonly');
  const index = tx.objectStore(STORE_COMMENTS).index('adId');
  return promisifyRequest(index.getAll(adId));
}

export async function getCommentsSince(timestamp: number): Promise<CommentRecord[]> {
  const all = await getAllComments();
  return all.filter((c) => c.createdAt >= timestamp);
}

export async function clearAllComments(): Promise<void> {
  const db = await openDb();
  const tx = db.transaction([STORE_COMMENTS, STORE_CURSORS, STORE_META], 'readwrite');
  tx.objectStore(STORE_COMMENTS).clear();
  tx.objectStore(STORE_CURSORS).clear();
  tx.objectStore(STORE_META).clear();
  await promisifyTx(tx);
}

// ─── Cursor CRUD ─────────────────────────────────────────────────────────

export async function getCursor(adId: string): Promise<AdSyncCursor | undefined> {
  const db = await openDb();
  const tx = db.transaction(STORE_CURSORS, 'readonly');
  return promisifyRequest(tx.objectStore(STORE_CURSORS).get(adId));
}

export async function getAllCursors(): Promise<AdSyncCursor[]> {
  const db = await openDb();
  const tx = db.transaction(STORE_CURSORS, 'readonly');
  return promisifyRequest(tx.objectStore(STORE_CURSORS).getAll());
}

export async function putCursor(cursor: AdSyncCursor): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE_CURSORS, 'readwrite');
  tx.objectStore(STORE_CURSORS).put(cursor);
  await promisifyTx(tx);
}

// ─── Global meta ─────────────────────────────────────────────────────────

export async function setLastPullAt(ts: number): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE_META, 'readwrite');
  tx.objectStore(STORE_META).put({ key: META_KEY_LAST_PULL, value: ts });
  await promisifyTx(tx);
}

export async function getLastPullAt(): Promise<number | null> {
  const db = await openDb();
  const tx = db.transaction(STORE_META, 'readonly');
  const row = await promisifyRequest<{ key: string; value: number } | undefined>(
    tx.objectStore(STORE_META).get(META_KEY_LAST_PULL),
  );
  return row?.value ?? null;
}

// ─── Stats ───────────────────────────────────────────────────────────────

export async function getStats(): Promise<CommentBankStats> {
  const [comments, lastPull] = await Promise.all([getAllComments(), getLastPullAt()]);
  if (comments.length === 0) {
    return { totalComments: 0, uniqueAds: 0, uniqueCampaigns: 0, oldestComment: null, newestComment: null, lastPullAt: lastPull };
  }
  const adSet = new Set<string>();
  const campSet = new Set<string>();
  let oldest = Infinity;
  let newest = -Infinity;
  for (const c of comments) {
    adSet.add(c.adId);
    if (c.campaignId) campSet.add(c.campaignId);
    if (c.createdAt < oldest) oldest = c.createdAt;
    if (c.createdAt > newest) newest = c.createdAt;
  }
  return {
    totalComments: comments.length,
    uniqueAds: adSet.size,
    uniqueCampaigns: campSet.size,
    oldestComment: oldest === Infinity ? null : oldest,
    newestComment: newest === -Infinity ? null : newest,
    lastPullAt: lastPull,
  };
}
