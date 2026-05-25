/**
 * Brain — context assembler (single public entry point).
 *
 * Every prompt builder / module consumer calls ONE function:
 *   `buildBrainAddendum(task, apiKey?) → Promise<BrainContext>`
 *
 * If the per-module flag is OFF, returns a strict no-op (empty addendum).
 * If ON, ensures the VoC index is fresh, selects the relevant slices,
 * optionally runs deep reasoning (for complex tasks), and renders an
 * addendum string ready to be appended verbatim to the existing system
 * prompt.
 *
 * The caller is responsible for the simple concatenation:
 *   `const system = baseSystem + brain.addendum;`
 *
 * See docs/superpowers/specs/2026-05-24-brain-architecture-design.md
 */
import type {
  BrainContext,
  BrainTaskDescriptor,
  BrainMetadata,
  VoCIndex,
} from './brainTypes';
import type { FullAnalysis } from '../engine/types';
import { isBrainEnabledFor } from './brainConfig';
import { ensureFreshVoCIndex } from './vocIndex';
import { selectSlicesForTask } from './sliceSelector';
import { renderAddendum, renderDeepReasoningBlock, renderVoCBlock } from './addendumRenderer';
import { runDeepReasoning, shouldRunDeepReasoning } from './deepReasoning';

/** Optional per-call inputs — current review analysis (so the VoC index can
 *  include reviews), and the API key (only used if deep reasoning fires). */
export interface BrainCallOptions {
  reviews?: FullAnalysis | null;
  apiKey?: string;
}

/**
 * Build the brain addendum for a task. The ONLY entry point for callers.
 *
 * The function is always async — even when the brain is disabled and the
 * result is an immediate empty string. This keeps the API uniform so
 * callers don't switch sync/async paths.
 *
 * On failure of any internal step, gracefully degrades:
 *   - VoC index build fails → returns empty addendum + warning
 *   - Deep reasoning fails → returns addendum WITHOUT deep block + warning
 * The caller's main generation is never blocked.
 */
export async function buildBrainAddendum(
  task: BrainTaskDescriptor,
  options: BrainCallOptions = {},
): Promise<BrainContext> {
  const startedAt = Date.now();
  const warnings: string[] = [];

  // ── Step 1: per-module flag check (the no-op fast path) ─────────────────
  if (!isBrainEnabledFor(task.module)) {
    return emptyContext({
      enabled: false,
      vocIndexBuiltAt: null,
      latencyMs: Date.now() - startedAt,
      channelsConsulted: [],
      slicesUsed: [],
      deepReasoningRan: false,
      warnings,
    });
  }

  // ── Step 2: ensure the VoC index is fresh ───────────────────────────────
  let index: VoCIndex;
  try {
    index = await ensureFreshVoCIndex(options.reviews);
  } catch (err) {
    console.warn('[brain] VoC index build failed — returning empty addendum', err);
    warnings.push(`VoC index build failed: ${err instanceof Error ? err.message : String(err)}`);
    return emptyContext({
      enabled: true,
      vocIndexBuiltAt: null,
      latencyMs: Date.now() - startedAt,
      channelsConsulted: [],
      slicesUsed: [],
      deepReasoningRan: false,
      warnings,
    });
  }

  // If the index is empty (no reviews, no comment analyses), there's nothing
  // useful to add — surface this as a warning but still return cleanly.
  const indexIsEmpty =
    index.sources.reviewCount === 0 && index.sources.commentCount === 0;
  if (indexIsEmpty) {
    warnings.push('VoC index is empty — no reviews or comment analyses available to ground this task.');
    return emptyContext({
      enabled: true,
      vocIndexBuiltAt: index.builtAt,
      latencyMs: Date.now() - startedAt,
      channelsConsulted: ['voc'],
      slicesUsed: [],
      deepReasoningRan: false,
      warnings,
    });
  }

  // ── Step 3: slice selection ─────────────────────────────────────────────
  const slices = selectSlicesForTask(task, index);

  // ── Step 4: optional deep-reasoning Claude call ─────────────────────────
  let deepReasoningOutput = '';
  let deepReasoningRan = false;
  let deepReasoningTokens: number | undefined;
  if (shouldRunDeepReasoning(task)) {
    if (!options.apiKey) {
      warnings.push('Deep reasoning would have fired but no apiKey was provided — skipping.');
    } else {
      try {
        deepReasoningOutput = await runDeepReasoning(task, slices, options.apiKey);
        deepReasoningRan = true;
        // Approximate token count: roughly 1 token per 4 characters of output.
        deepReasoningTokens = Math.round(deepReasoningOutput.length / 4);
      } catch (err) {
        console.warn('[brain] deep reasoning failed — returning addendum without it', err);
        warnings.push(`Deep reasoning failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  // ── Step 5: render the addendum ─────────────────────────────────────────
  const vocBlock = renderVoCBlock(index, slices);
  const deepReasoningBlock = renderDeepReasoningBlock(deepReasoningOutput);
  const addendum = renderAddendum({ vocBlock, deepReasoningBlock });

  const metadata: BrainMetadata = {
    enabled: true,
    vocIndexBuiltAt: index.builtAt,
    slicesUsed: slices.sliceNames,
    deepReasoningRan,
    deepReasoningTokens,
    channelsConsulted: ['voc'],
    warnings,
    latencyMs: Date.now() - startedAt,
  };

  logBrainActivity(task, metadata, addendum.length);

  return { addendum, metadata };
}

// ─── Internal helpers ────────────────────────────────────────────────────

function emptyContext(metadata: BrainMetadata): BrainContext {
  return { addendum: '', metadata };
}

/** Lightweight console log of what the brain just did. Always on — your
 *  visibility into the brain's behavior. */
function logBrainActivity(task: BrainTaskDescriptor, meta: BrainMetadata, addendumChars: number): void {
  const approxTokens = Math.round(addendumChars / 4);
  // eslint-disable-next-line no-console
  console.info(
    `[brain] ${task.module}${task.template ? ` (${task.template})` : ''} — ` +
      `addendum ~${approxTokens.toLocaleString()} tokens, slices: ${meta.slicesUsed.join(', ') || '(none)'}, ` +
      `deepReasoning: ${meta.deepReasoningRan ? 'ran' : 'skipped'}, latency: ${meta.latencyMs}ms` +
      (meta.warnings.length > 0 ? `, warnings: ${meta.warnings.length}` : ''),
  );
  if (meta.warnings.length > 0) {
    // eslint-disable-next-line no-console
    for (const w of meta.warnings) console.info(`[brain] ⚠ ${w}`);
  }
}
