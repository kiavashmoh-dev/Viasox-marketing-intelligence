/**
 * Batched comment categorization — chunks the input into N×batchSize windows,
 * runs each through Claude in parallel with a concurrency cap, then merges
 * the per-comment results back into a single globally-indexed array.
 *
 * Why this exists:
 *   - A single categorization prompt for thousands of comments blows the
 *     200K context window ("prompt is too long" 400). The Meta Pull bank
 *     can hold ten thousand+ comments.
 *   - The categorization output is per-comment ({i, cat, sent, theme}) so
 *     it merges trivially after offsetting indices.
 *   - Phase 2 (insights) runs on aggregate stats + 5 samples per category,
 *     so it never needs batching — runs ONCE on the merged result.
 *
 * Concurrency model: a small semaphore. At most `concurrency` batches are
 * in-flight at any moment. When one finishes, the next starts. Each batch
 * inherits the retry/backoff logic in sendMessage (handles 429/529).
 *
 * Failure model: each batch retries ONCE on its own. If both attempts fail,
 * the batch is marked failed and its comments fall through to defaults in
 * the caller's mapping step ({cat:'Engagement', sent:'Neutral', theme:''}).
 * One bad batch doesn't kill the whole run.
 */
import { sendMessage } from '../api/claude';
import { buildCommentCategorizationPrompt, type CategorizedCommentData } from '../prompts/commentPrompt';
import type { RawComment } from '../utils/commentCsv';

export interface BatchProgress {
  /** Number of batches that have completed (success or failure). */
  completedBatches: number;
  /** Total number of batches in this run. */
  totalBatches: number;
  /** Number of batches that errored out (both attempts failed). */
  failedBatches: number;
  /** Comments successfully categorized so far. */
  categorizedComments: number;
  /** Total comments across all batches. */
  totalComments: number;
}

export interface BatchedCategorizationResult {
  /** Globally-indexed categorizations across all successful batches. */
  results: CategorizedCommentData[];
  /** How many batches failed both attempts. */
  failedBatchCount: number;
  /** Total batches we tried. */
  totalBatches: number;
  /** Comments belonging to failed batches (they'll get defaults in the mapping step). */
  unCategorizedComments: number;
}

export interface BatchedCategorizationOptions {
  batchSize?: number;
  concurrency?: number;
  /** Max output tokens per batch — sized for batchSize comments × ~40 tokens/result. */
  maxTokensPerBatch?: number;
  onProgress?: (p: BatchProgress) => void;
  signal?: AbortSignal;
  model?: string;
}

const DEFAULT_BATCH_SIZE = 500;
const DEFAULT_CONCURRENCY = 3;
const DEFAULT_MAX_TOKENS_PER_BATCH = 24_000;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

/**
 * Parse Claude's response into the expected `[{i, cat, sent, theme}]` shape.
 * Handles markdown-fenced JSON ("```json") that Claude sometimes emits despite
 * being told otherwise.
 */
function parseBatchResponse(text: string): CategorizedCommentData[] {
  let jsonStr = text.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  const data = JSON.parse(jsonStr);
  const arr = (data?.results ?? data) as unknown;
  if (!Array.isArray(arr)) {
    throw new Error('Categorization response is not an array');
  }
  return arr as CategorizedCommentData[];
}

/**
 * Run a single batch with one retry. Returns parsed results (with LOCAL indices,
 * i.e. 0..batchSize-1 — the caller maps them to global indices).
 */
async function runOneBatch(
  batchComments: RawComment[],
  apiKey: string,
  maxTokens: number,
  model: string | undefined,
  signal: AbortSignal | undefined,
): Promise<CategorizedCommentData[]> {
  const { system, user } = buildCommentCategorizationPrompt(batchComments);
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const text = await sendMessage(system, user, apiKey, maxTokens, model, signal);
      return parseBatchResponse(text);
    } catch (err) {
      lastErr = err;
      // Don't retry if it was a user-initiated abort
      if (signal?.aborted) throw err;
      // Brief jitter before retry so simultaneous failures don't re-burst
      await new Promise((r) => setTimeout(r, 1000 + Math.random() * 2000));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

/**
 * Main entry. Chunks, runs concurrently, merges, reports progress.
 */
export async function categorizeCommentsBatched(
  comments: RawComment[],
  apiKey: string,
  options: BatchedCategorizationOptions = {},
): Promise<BatchedCategorizationResult> {
  const batchSize = options.batchSize ?? DEFAULT_BATCH_SIZE;
  const concurrency = Math.max(1, options.concurrency ?? DEFAULT_CONCURRENCY);
  const maxTokens = options.maxTokensPerBatch ?? DEFAULT_MAX_TOKENS_PER_BATCH;
  const onProgress = options.onProgress;
  const signal = options.signal;

  const batches = chunk(comments, batchSize);
  const totalBatches = batches.length;
  const totalComments = comments.length;

  let completedBatches = 0;
  let failedBatches = 0;
  let categorizedComments = 0;
  const allResults: CategorizedCommentData[] = [];

  const report = () => {
    onProgress?.({
      completedBatches,
      totalBatches,
      failedBatches,
      categorizedComments,
      totalComments,
    });
  };
  report();

  // Promise pool — at most `concurrency` batches in-flight at once.
  let cursor = 0;
  const workers: Promise<void>[] = [];
  let aborted = false;

  const worker = async () => {
    while (true) {
      if (signal?.aborted) { aborted = true; return; }
      const myIndex = cursor++;
      if (myIndex >= batches.length) return;
      const batch = batches[myIndex];
      const offset = myIndex * batchSize;
      try {
        const localResults = await runOneBatch(batch, apiKey, maxTokens, options.model, signal);
        // Translate local i → global i
        for (const r of localResults) {
          if (typeof r.i !== 'number') continue;
          if (r.i < 0 || r.i >= batch.length) continue;
          allResults.push({ ...r, i: r.i + offset });
        }
        categorizedComments += localResults.length;
      } catch (err) {
        // Aborted? bubble up by setting flag and stopping.
        if (signal?.aborted) { aborted = true; return; }
        failedBatches++;
        console.warn(`[batchedCategorization] batch ${myIndex + 1}/${totalBatches} failed:`, err);
      } finally {
        completedBatches++;
        report();
      }
    }
  };

  for (let i = 0; i < concurrency; i++) workers.push(worker());
  await Promise.all(workers);

  if (aborted) {
    throw new Error('Categorization cancelled');
  }

  return {
    results: allResults,
    failedBatchCount: failedBatches,
    totalBatches,
    unCategorizedComments: failedBatches * batchSize,
  };
}
