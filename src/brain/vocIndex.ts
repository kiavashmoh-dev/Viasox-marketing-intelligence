/**
 * Brain — Voice-of-Audience (VoC) Index.
 *
 * Pre-computes a structured representation of customer voice merged from:
 *   - The current session's review FullAnalysis (already passed around the app)
 *   - All saved comment analyses (from src/comments/commentAnalysisStore.ts)
 *
 * The index is built lazily — only when a brain-enabled module actually
 * asks for it. Cached in IndexedDB so subsequent retrievals are free.
 * Invalidated when underlying data changes (analyses added/removed/reviewed).
 *
 * The build function is PURE TypeScript — no Claude calls during indexing.
 * Aggregation runs in the browser, expected ≤1s even for tens of thousands
 * of items.
 */
import type { FullAnalysis, CategoryAnalysis } from '../engine/types';
import type { SavedAnalysis } from '../comments/commentAnalysisStore';
import type { CategorizedComment } from '../components/comments/CommentDashboard';
import type { VoCIndex, VoCItem } from './brainTypes';
import { getAllAnalyses } from '../comments/commentAnalysisStore';

// ─── IndexedDB persistence ───────────────────────────────────────────────

/** Same database as the saved analyses — we add a new object store. */
const DB_NAME = 'viasox_comment_analyses';
const DB_VERSION = 2; // bumped from 1 (the store was added in v2)
const STORE_ANALYSES = 'analyses'; // existing
const STORE_VOC = 'voc_index'; // new
const VOC_RECORD_KEY = 'current';

/** Stored shape in IndexedDB — wraps VoCIndex with a fixed key. */
interface VoCRecord {
  key: string;
  index: VoCIndex;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      // The existing 'analyses' store may already exist — only create what's missing.
      if (!db.objectStoreNames.contains(STORE_ANALYSES)) {
        const store = db.createObjectStore(STORE_ANALYSES, { keyPath: 'id' });
        store.createIndex('byCreatedAt', 'createdAt');
      }
      if (!db.objectStoreNames.contains(STORE_VOC)) {
        db.createObjectStore(STORE_VOC, { keyPath: 'key' });
      }
    };
  });
  return dbPromise;
}

async function readCachedRecord(): Promise<VoCRecord | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_VOC, 'readonly');
    const req = tx.objectStore(STORE_VOC).get(VOC_RECORD_KEY);
    req.onsuccess = () => resolve((req.result as VoCRecord) ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function writeCachedRecord(index: VoCIndex): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_VOC, 'readwrite');
    const req = tx.objectStore(STORE_VOC).put({ key: VOC_RECORD_KEY, index } satisfies VoCRecord);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function deleteCachedRecord(): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_VOC, 'readwrite');
    const req = tx.objectStore(STORE_VOC).delete(VOC_RECORD_KEY);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ─── Public API ───────────────────────────────────────────────────────────

/** Invalidate the cached VoC index. Called whenever a saved analysis is
 *  added or removed (the store hooks call this), and exposed for the
 *  dev tools / debug paths. */
export async function invalidateVoCIndex(): Promise<void> {
  try {
    await deleteCachedRecord();
  } catch (err) {
    console.warn('[vocIndex] invalidate failed', err);
  }
}

/** Read the cached index without rebuilding. Returns null if no cache or
 *  if IndexedDB is unavailable. Used by debug tools and by callers that
 *  want to surface staleness explicitly. */
export async function getCachedVoCIndex(): Promise<VoCIndex | null> {
  try {
    const rec = await readCachedRecord();
    return rec?.index ?? null;
  } catch (err) {
    console.warn('[vocIndex] read failed', err);
    return null;
  }
}

/** Returns a fresh VoC index. If the cache exists and is fresh, returns it.
 *  Otherwise rebuilds from the current review FullAnalysis (if provided) +
 *  ALL saved comment analyses, caches the result, and returns it. */
export async function ensureFreshVoCIndex(reviews?: FullAnalysis | null): Promise<VoCIndex> {
  const cached = await getCachedVoCIndex();
  if (cached) return cached;
  return rebuildVoCIndex(reviews ?? null);
}

/** Force-rebuild the index from scratch and overwrite the cache. */
export async function rebuildVoCIndex(reviews: FullAnalysis | null): Promise<VoCIndex> {
  const savedAnalyses = await getAllAnalyses();
  const index = buildVoCIndex(reviews, savedAnalyses);
  await writeCachedRecord(index);
  return index;
}

// ─── Pure builder (no IO, no Claude) ──────────────────────────────────────

/** Heuristic budget — how many items to keep in each slice of the index.
 *  These are the "top N" caps. Render-side slice selection can take fewer. */
const TOP_PER_SLICE = 20;
const QUOTES_PER_ITEM = 5;
const MIN_QUOTE_LEN = 8; // skip 1-word reactions / emoji-only

/**
 * Build the index. Pure aggregation, no async/IO. Safe to call repeatedly.
 *
 * Strategy:
 *   - Walk the reviews FullAnalysis: each product's `pain`, `benefits`,
 *     `transformation`, `segments` categories contribute aggregated themes.
 *   - Walk the saved comment analyses: each CategorizedComment contributes
 *     to slices keyed off its category (Objection → objections, Testimonial
 *     → testimonials, Question → questions, Complaint → complaints, etc.).
 *   - Dedupe THEMES across sources by lowercase normalized handle. If the
 *     same theme appears in reviews AND comments, merge into one VoCItem
 *     with `source: 'both'` and `frequency` summed.
 */
export function buildVoCIndex(
  reviews: FullAnalysis | null,
  savedAnalyses: SavedAnalysis[],
): VoCIndex {
  const builtAt = Date.now();

  // Working maps keyed by lowercase theme handle, per slice.
  type ItemAccum = {
    theme: string; // display form (first seen)
    frequency: number;
    quotes: string[];
    sources: Set<'reviews' | 'comments'>;
    sentiment?: 'Positive' | 'Neutral' | 'Negative';
    category?: string;
  };
  const newSlice = () => new Map<string, ItemAccum>();
  const objections = newSlice();
  const testimonials = newSlice();
  const questions = newSlice();
  const painPoints = newSlice();
  const desires = newSlice();
  const complaints = newSlice();
  const emerging = newSlice();
  const personaBeth = newSlice();
  const personaLinda = newSlice();
  const personaOther = newSlice();
  const productCompression = newSlice();
  const productEasystretch = newSlice();
  const productAnkle = newSlice();

  const bump = (
    map: Map<string, ItemAccum>,
    theme: string,
    quote: string | undefined,
    source: 'reviews' | 'comments',
    sentiment?: 'Positive' | 'Neutral' | 'Negative',
    category?: string,
    weight = 1,
  ) => {
    const key = theme.toLowerCase().trim();
    if (!key) return;
    let entry = map.get(key);
    if (!entry) {
      entry = { theme: theme.trim(), frequency: 0, quotes: [], sources: new Set(), sentiment, category };
      map.set(key, entry);
    }
    entry.frequency += weight;
    entry.sources.add(source);
    if (sentiment && !entry.sentiment) entry.sentiment = sentiment;
    if (category && !entry.category) entry.category = category;
    if (quote && quote.length >= MIN_QUOTE_LEN && entry.quotes.length < QUOTES_PER_ITEM * 3) {
      entry.quotes.push(quote.trim());
    }
  };

  // ── Walk reviews ─────────────────────────────────────────────────────────
  let reviewCount = 0;
  if (reviews) {
    reviewCount = reviews.totalReviews;
    for (const product of Object.values(reviews.products) as Array<NonNullable<typeof reviews.products[keyof typeof reviews.products]>>) {
      if (!product) continue;
      const productMap = mapForProductName(product.productName);
      // pain → painPoints + emerging
      ingestCategoryAnalysis(product.pain, (theme, quote) => {
        bump(painPoints, theme, quote, 'reviews', 'Negative', 'Pain');
        bump(emerging, theme, quote, 'reviews', 'Negative', 'Pain');
        if (productMap) bump(productMap, theme, quote, 'reviews', 'Negative', 'Pain');
      });
      // benefits → testimonials + emerging
      ingestCategoryAnalysis(product.benefits, (theme, quote) => {
        bump(testimonials, theme, quote, 'reviews', 'Positive', 'Benefit');
        bump(emerging, theme, quote, 'reviews', 'Positive', 'Benefit');
        if (productMap) bump(productMap, theme, quote, 'reviews', 'Positive', 'Benefit');
      });
      // transformation → testimonials (strong positive)
      ingestCategoryAnalysis(product.transformation, (theme, quote) => {
        bump(testimonials, theme, quote, 'reviews', 'Positive', 'Transformation');
        if (productMap) bump(productMap, theme, quote, 'reviews', 'Positive', 'Transformation');
      });
      // segments → emerging themes (identity / motivation signals)
      ingestCategoryAnalysis(product.segments, (theme, quote) => {
        bump(emerging, theme, quote, 'reviews', undefined, 'Segment');
        // Persona heuristic: map known segment names into persona buckets
        const personaMap = personaMapForSegment(theme);
        if (personaMap) bump(personaMap, theme, quote, 'reviews', undefined, 'Segment');
      });
    }
  }

  // ── Walk saved comment analyses ─────────────────────────────────────────
  let commentCount = 0;
  const analysisIds: string[] = [];
  for (const a of savedAnalyses) {
    analysisIds.push(a.id);
    commentCount += a.commentCount;
    for (const c of a.categorizedComments) {
      ingestComment(c, {
        objections, testimonials, questions, painPoints, desires, complaints, emerging,
        personaBeth, personaLinda, personaOther,
        productCompression, productEasystretch, productAnkle,
      }, bump);
    }
  }

  // ── Finalize each slice: sort by frequency desc, cap to TOP_PER_SLICE,
  //    pick best QUOTES_PER_ITEM quotes (longest distinct) ────────────────
  const finalize = (map: Map<string, ItemAccum>): VoCItem[] => {
    return Array.from(map.values())
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, TOP_PER_SLICE)
      .map<VoCItem>((e) => ({
        theme: e.theme,
        frequency: e.frequency,
        source: e.sources.has('reviews') && e.sources.has('comments')
          ? 'both'
          : e.sources.has('reviews')
            ? 'reviews'
            : 'comments',
        sampleQuotes: dedupeQuotes(e.quotes).slice(0, QUOTES_PER_ITEM),
        sentiment: e.sentiment,
        category: e.category,
      }));
  };

  return {
    builtAt,
    sources: {
      reviewCount,
      commentAnalysisIds: analysisIds,
      commentCount,
    },
    topObjections: finalize(objections),
    topTestimonials: finalize(testimonials),
    recurringQuestions: finalize(questions),
    painPoints: finalize(painPoints),
    desires: finalize(desires),
    complaints: finalize(complaints),
    personaSignals: {
      beth: finalize(personaBeth),
      linda: finalize(personaLinda),
      other: finalize(personaOther),
    },
    emergingThemes: finalize(emerging),
    productSignals: {
      compression: finalize(productCompression),
      easystretch: finalize(productEasystretch),
      ankle: finalize(productAnkle),
    },
  };
}

// ─── Internal helpers ────────────────────────────────────────────────────

function ingestCategoryAnalysis(
  ca: CategoryAnalysis | undefined,
  onPattern: (theme: string, quote: string | undefined) => void,
): void {
  if (!ca) return;
  for (const [pattern, result] of Object.entries(ca)) {
    if (!result || result.count <= 0) continue;
    // Use the first quote as the primary; bump frequency by count.
    const quotes = result.quotes ?? [];
    if (quotes.length === 0) {
      onPattern(pattern, undefined);
    } else {
      for (const q of quotes.slice(0, QUOTES_PER_ITEM)) {
        onPattern(pattern, q);
      }
    }
  }
}

/** Comment-side ingestion. Routes each categorized comment into the
 *  appropriate slice(s) based on its category, sentiment, and (where
 *  inferable) target persona/product. */
function ingestComment(
  c: CategorizedComment,
  buckets: {
    objections: Map<string, unknown>;
    testimonials: Map<string, unknown>;
    questions: Map<string, unknown>;
    painPoints: Map<string, unknown>;
    desires: Map<string, unknown>;
    complaints: Map<string, unknown>;
    emerging: Map<string, unknown>;
    personaBeth: Map<string, unknown>;
    personaLinda: Map<string, unknown>;
    personaOther: Map<string, unknown>;
    productCompression: Map<string, unknown>;
    productEasystretch: Map<string, unknown>;
    productAnkle: Map<string, unknown>;
  },
  bump: (
    map: Map<string, unknown> & Map<string, never>,
    theme: string,
    quote: string | undefined,
    source: 'reviews' | 'comments',
    sentiment?: 'Positive' | 'Neutral' | 'Negative',
    category?: string,
  ) => void,
): void {
  const theme = c.keyTheme?.trim() || c.category;
  const quote = c.original.comment;
  const sent = c.sentiment;
  const cat = c.category;

  // Route by category — each comment can contribute to multiple slices.
  // The `bump` typing is a bit loose here because the buckets all share the
  // same ItemAccum shape but TypeScript can't see through the helper signature.
  const b = bump as unknown as (
    map: Map<string, unknown>,
    theme: string,
    quote: string | undefined,
    source: 'reviews' | 'comments',
    sentiment?: 'Positive' | 'Neutral' | 'Negative',
    category?: string,
  ) => void;

  switch (cat) {
    case 'Objection':
      b(buckets.objections, theme, quote, 'comments', sent, cat);
      b(buckets.emerging, theme, quote, 'comments', sent, cat);
      break;
    case 'Testimonial':
      b(buckets.testimonials, theme, quote, 'comments', sent, cat);
      b(buckets.emerging, theme, quote, 'comments', sent, cat);
      break;
    case 'Question':
      b(buckets.questions, theme, quote, 'comments', sent, cat);
      break;
    case 'Request':
      b(buckets.desires, theme, quote, 'comments', sent, cat);
      b(buckets.emerging, theme, quote, 'comments', sent, cat);
      break;
    case 'Complaint':
      b(buckets.complaints, theme, quote, 'comments', sent, cat);
      b(buckets.painPoints, theme, quote, 'comments', sent, cat);
      b(buckets.emerging, theme, quote, 'comments', sent, cat);
      break;
    case 'Engagement':
      b(buckets.emerging, theme, quote, 'comments', sent, cat);
      break;
    case 'Spam':
      // skip
      break;
  }

  // Persona heuristic — light keyword sniffing for now.
  const personaMap = personaMapForCommentText(quote);
  if (personaMap) {
    const map = personaMap === 'beth' ? buckets.personaBeth
              : personaMap === 'linda' ? buckets.personaLinda
              : buckets.personaOther;
    b(map, theme, quote, 'comments', sent, cat);
  }

  // Product heuristic — keyword sniffing on the comment text.
  const productMap = productMapForCommentText(quote);
  if (productMap) {
    const map = productMap === 'compression' ? buckets.productCompression
              : productMap === 'easystretch' ? buckets.productEasystretch
              : buckets.productAnkle;
    b(map, theme, quote, 'comments', sent, cat);
  }
}

/** Map a review product name → which product slice map to bump. */
function mapForProductName(name: string): null {
  // Reviews don't currently feed product slices in this v1 — we keep product
  // slices comment-derived to avoid double-counting with topTestimonials etc.
  // The slot is here so we can wire reviews → product slices later if useful.
  void name;
  return null;
}

/** Best-effort persona detection from a segment theme name. */
function personaMapForSegment(theme: string): null {
  // v1: leave segment → persona mapping for the comment-side heuristic.
  // Reviews-side segments are too noisy to map without a curated table.
  void theme;
  return null;
}

/** Lightweight keyword check for persona signals in comment text. */
function personaMapForCommentText(text: string): 'beth' | 'linda' | 'other' | null {
  const t = text.toLowerCase();
  // Beth = quiet fighter, hides pain, doesn't want help, dignity
  if (/i don['']t want to|don['']t complain|by myself|on my own|without help|nobody knows|hide|alone/.test(t)) return 'beth';
  // Linda = researcher, skeptical, evangelist
  if (/researched|skeptical|reviews|compared|tried (everything|other|many)|recommend|evangelist|told (my|all my)|highly recommend/.test(t)) return 'linda';
  return null;
}

/** Lightweight keyword check for product mentions in comment text. */
function productMapForCommentText(text: string): 'compression' | 'easystretch' | 'ankle' | null {
  const t = text.toLowerCase();
  if (/easy ?stretch|stretch sock|non.?binding|no elastic|stretches up/.test(t)) return 'easystretch';
  if (/ankle (sock|compression|brace)/.test(t)) return 'ankle';
  if (/compression|mmhg|graduated|circulation|swelling/.test(t)) return 'compression';
  return null;
}

/** Deduplicate quotes by case-insensitive content, prefer longer variants. */
function dedupeQuotes(quotes: string[]): string[] {
  const seen = new Map<string, string>();
  for (const q of quotes) {
    const key = q.toLowerCase().replace(/\s+/g, ' ').trim();
    if (!key) continue;
    const existing = seen.get(key);
    if (!existing || q.length > existing.length) seen.set(key, q);
  }
  // Order by length desc — longer quotes tend to be more informative
  return Array.from(seen.values()).sort((a, b) => b.length - a.length);
}
