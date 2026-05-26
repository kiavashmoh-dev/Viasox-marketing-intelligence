/**
 * Comment Analysis Store — IndexedDB persistence for completed Comment
 * Intelligence runs. Each analysis is a self-contained snapshot (categorized
 * comments + summary + insights report) that can be re-opened later or
 * merged with other analyses into a combined view.
 *
 * Why this exists:
 *   Before this, the analysis result lived only in component state — clicking
 *   "Back to Dashboard" threw away minutes of Claude work. Now every completed
 *   run lands here and shows up as a card on the module's landing page.
 *
 * Storage shape:
 *   - One DB: `viasox_comment_analyses`
 *   - One object store: `analyses` keyed by string id
 *   - One index: `byCreatedAt` for newest-first listing
 *
 * Each record is a `SavedAnalysis` (see types below). The `categorizedComments`
 * field is the full per-comment array — same shape the dashboard renders.
 */
import type { CategorizedComment, CommentSummary } from '../components/comments/CommentDashboard';

const DB_NAME = 'viasox_comment_analyses';
// IMPORTANT: must stay in sync with src/brain/vocIndex.ts DB_VERSION.
// Both files open the same database. The brain's vocIndex bumped this to 2
// when it added the voc_index object store. If this file stays at 1 while
// vocIndex opens at 2, IndexedDB throws VersionError on the v1 open, the
// catch block silently logs, and the UI sees an empty analyses list even
// though the data is still there.
const DB_VERSION = 2;
const STORE = 'analyses';

export interface SavedAnalysis {
  /** Unique id (timestamp-based). */
  id: string;
  /** Auto-generated display name like "Batch 1 of 11 (most recent 500)" or
   *  "Combined — 1,500 comments from 3 batches". */
  name: string;
  /** What kind of analysis this is — affects iconography in the list. */
  type: 'batch' | 'csv' | 'combined';
  /** Total comments included. */
  commentCount: number;
  /** Oldest/newest comment timestamps in this analysis (ms epoch). */
  dateRange: { oldest: number | null; newest: number | null };
  /** When this analysis was completed (ms epoch). */
  createdAt: number;
  /** Full per-comment categorization — what the dashboard reads. */
  categorizedComments: CategorizedComment[];
  /** Aggregated stats — what the dashboard's chart rows read. */
  summary: CommentSummary;
  /** Markdown insights report. */
  insightsReport: string;

  // ── Type-specific metadata (optional) ──
  /** For type='batch': which 500-slot of the bank this came from (1-indexed). */
  batchIndex?: number;
  /** For type='batch': total slots the bank had at time of analysis. */
  totalBatches?: number;
  /** For type='combined': which analyses were merged to make this. */
  sourceAnalysisIds?: string[];
  /** How many of the source analyses' batches failed (informational). */
  failedBatches?: number;
}

// ─── DB init ──────────────────────────────────────────────────────────

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('byCreatedAt', 'createdAt');
      }
    };
  });
  return dbPromise;
}

function tx(mode: IDBTransactionMode): Promise<IDBObjectStore> {
  return openDB().then((db) => db.transaction(STORE, mode).objectStore(STORE));
}

// ─── Public API ───────────────────────────────────────────────────────

export async function saveAnalysis(a: SavedAnalysis): Promise<void> {
  const store = await tx('readwrite');
  await new Promise<void>((res, rej) => {
    const req = store.put(a);
    req.onsuccess = () => res();
    req.onerror = () => rej(req.error);
  });
  // Underlying VoC source changed — invalidate the brain's cached index so
  // the next consumer call rebuilds with the new analysis included.
  // Imported lazily to avoid a circular dependency at module load time.
  const { invalidateVoCIndex } = await import('../brain/vocIndex');
  await invalidateVoCIndex();
}

export async function getAllAnalyses(): Promise<SavedAnalysis[]> {
  const store = await tx('readonly');
  return new Promise((res, rej) => {
    const req = store.getAll();
    req.onsuccess = () => {
      const all = (req.result as SavedAnalysis[]) ?? [];
      all.sort((a, b) => b.createdAt - a.createdAt); // newest first
      res(all);
    };
    req.onerror = () => rej(req.error);
  });
}

export async function getAnalysis(id: string): Promise<SavedAnalysis | null> {
  const store = await tx('readonly');
  return new Promise((res, rej) => {
    const req = store.get(id);
    req.onsuccess = () => res((req.result as SavedAnalysis) ?? null);
    req.onerror = () => rej(req.error);
  });
}

export async function deleteAnalysis(id: string): Promise<void> {
  const store = await tx('readwrite');
  await new Promise<void>((res, rej) => {
    const req = store.delete(id);
    req.onsuccess = () => res();
    req.onerror = () => rej(req.error);
  });
  // See saveAnalysis comment — invalidate the brain's VoC cache too.
  const { invalidateVoCIndex } = await import('../brain/vocIndex');
  await invalidateVoCIndex();
}

// ─── Helpers ──────────────────────────────────────────────────────────

/**
 * Generate a stable id for a new analysis. We include the type so collisions
 * across rapid back-to-back creates are vanishingly unlikely.
 */
export function newAnalysisId(type: SavedAnalysis['type']): string {
  return `${type}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Derive the date range covered by a list of categorized comments. Each
 * comment carries its original `date` field (ISO string or '').
 */
export function deriveDateRange(comments: CategorizedComment[]): { oldest: number | null; newest: number | null } {
  let oldest: number | null = null;
  let newest: number | null = null;
  for (const c of comments) {
    if (!c.original.date) continue;
    const t = Date.parse(c.original.date);
    if (Number.isNaN(t)) continue;
    if (oldest === null || t < oldest) oldest = t;
    if (newest === null || t > newest) newest = t;
  }
  return { oldest, newest };
}

/**
 * Merge multiple analyses into one combined CategorizedComment[] array.
 * Deduplicates by (commenter + comment text + date) — Meta sometimes returns
 * the same comment surfaced against multiple ads.
 */
export function mergeAnalysesComments(analyses: SavedAnalysis[]): CategorizedComment[] {
  const seen = new Set<string>();
  const merged: CategorizedComment[] = [];
  for (const a of analyses) {
    for (const c of a.categorizedComments) {
      const key = `${c.original.commenterName || ''}|${c.original.comment}|${c.original.date || ''}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(c);
    }
  }
  return merged;
}
