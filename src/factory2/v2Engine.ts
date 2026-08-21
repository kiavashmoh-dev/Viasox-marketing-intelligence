/**
 * Factory V2 — engine.
 *
 * Orchestrates the lean V2 pipeline: brainstorm → direction → concepts →
 * framework selection → structured brief writing → storyboard reference
 * matching → interactive regeneration with ripple checks + deterministic QA.
 *
 * Model policy: thinking/writing seats try V2_THINKING_MODEL (Fable 5)
 * first and degrade automatically to V2_HEAVY_MODEL (Opus 4.8) on a
 * model-access error, remembering for the session. Heavy lifting never
 * runs below Opus 4.8.
 *
 * Resilience policy (V1's hard-won lessons): every engine call carries an
 * outer retry for timeouts/overloads on top of sendMessage's internal
 * 429/529 loop; vision calls get their own retry wrapper (the shared
 * sendVisionMessage has none); reference matching is NON-FATAL — a failed
 * match never discards a completed generation.
 */

import { sendMessage, sendVisionMessage, type ContentBlock } from '../api/claude';
import { V2_THINKING_MODEL, V2_HEAVY_MODEL } from '../config/models';
import { buildBrainAddendum } from '../brain/contextAssembler';
import { getAllItems, getFrames, getItem } from '../inspiration/inspirationStore';
import { getEffectiveTags } from '../engine/inspirationTypes';
import type { InspirationItem } from '../engine/inspirationTypes';
import { getInspirationContextBlock } from '../inspiration/inspirationInjection';
import { BANNED_PLACEHOLDERS, BANNED_TICS } from '../prompts/productTruth';
import { DURATION_TARGETS } from '../prompts/creativeConstraints';
import type { ScriptFramework } from '../engine/types';
import type {
  UgcBriefV2,
  V2Brainstorm,
  V2BrainstormQuestion,
  V2Concept,
  V2RegenTarget,
  V2RippleFlag,
  V2Row,
  V2Task,
  V2ReviewFinding,
  V2ReviewReport,
} from './v2Types';
import {
  UGC_FRAMEWORKS,
  ECOM_FRAMEWORKS,
  ECOM_SHOT_TAGS,
  V2_HOOK_COUNT,
  CTA_PERFORMANCE_NOTE,
  describeTarget,
  taskAdType,
} from './v2Types';
import type { V2AdType, EcomShotTag } from './v2Types';
import {
  buildBrainstormPrompt,
  buildBriefWritePrompt,
  buildConceptsPrompt,
  buildDirectionSynthesisPrompt,
  buildFrameMatchInstruction,
  buildFrameworkSelectPrompt,
  buildRegenPrompt,
  buildRippleCheckPrompt,
  type FrameCandidate,
  type FrameMatchOptions,
  buildExemplarFidelityPrompt,
  buildFinalReviewPrompt,
  ECOM_LONGFORM,
} from './v2Prompts';

const UGC_AD_TYPE = 'UGC (User Generated Content)';
const ECOM_AD_TYPE = 'Ecom Style';

// ─── Retry + model fallback wrappers ────────────────────────────────────────

let fableUnavailable = false;

/**
 * True only for genuine model-lookup failures. Explicitly excludes auth
 * (401 "Invalid API key") and request-validation errors, which previously
 * tripped the fallback and re-sent a doomed request at double cost.
 */
function looksLikeModelAccessError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  if (/api key|authentication|invalid_request|timed out|cancelled|rate limit/i.test(msg)) return false;
  return /not_found|model\s+.*not\s+(found|available)|no such model|claude-fable/i.test(msg);
}

function retryableTransient(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /timed out|overloaded|rate limited|529|congested/i.test(msg);
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(t);
      reject(new Error('Request was cancelled.'));
    });
  });
}

/** Outer transient-failure retry (V1's sendMessageWithRetry lesson). */
async function withRetry<T>(fn: () => Promise<T>, signal?: AbortSignal, attempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      // A TIMEOUT is a 15-30 MINUTE failure: blind-retrying it up to 3× turns
      // one slow call into an hour of silent spinner (the "Final Review never
      // finishes" spiral). One timeout retry, then surface the error.
      const isTimeout = /timed out/i.test(err instanceof Error ? err.message : String(err));
      const lastAllowed = isTimeout ? Math.min(attempts - 1, 1) : attempts - 1;
      if (signal?.aborted || !retryableTransient(err) || i >= lastAllowed) throw err;
      console.warn(`[factory2] transient failure (attempt ${i + 1}/${attempts}) — retrying in 15s`, err);
      await delay(15000, signal);
    }
  }
  throw lastErr;
}

/** Send on the V2 thinking tier: Fable 5 first, Opus 4.8 on model-access
 *  failure (sticky for the session), transient retries on both. */
async function sendThinking(
  system: string,
  user: string,
  apiKey: string,
  maxTokens: number,
  signal?: AbortSignal,
): Promise<string> {
  if (!fableUnavailable) {
    try {
      return await withRetry(() => sendMessage(system, user, apiKey, maxTokens, V2_THINKING_MODEL, signal), signal);
    } catch (err) {
      if (signal?.aborted) throw err;
      if (looksLikeModelAccessError(err)) {
        console.warn(
          `[factory2] ${V2_THINKING_MODEL} unavailable on this API key — falling back to ${V2_HEAVY_MODEL} for this session.`,
        );
        fableUnavailable = true;
      } else {
        throw err;
      }
    }
  }
  return withRetry(() => sendMessage(system, user, apiKey, maxTokens, V2_HEAVY_MODEL, signal), signal);
}

/** Vision with retries — the shared sendVisionMessage throws immediately on
 *  429/529, and V2's vision call always runs right after a heavy write. */
async function sendVisionWithRetry(
  system: string,
  content: ContentBlock[],
  apiKey: string,
  maxTokens: number,
  signal?: AbortSignal,
): Promise<string> {
  return withRetry(
    () => sendVisionMessage(system, content, apiKey, maxTokens, V2_HEAVY_MODEL, signal),
    signal,
  );
}

/** Small spacing between heavy calls in batch loops (V1: 8s; V2 keeps a
 *  lighter 5s since the interactive flow already spreads calls out). */
export const V2_INTER_CALL_DELAY = 5000;
export function interCallDelay(signal?: AbortSignal): Promise<void> {
  return delay(V2_INTER_CALL_DELAY, signal).catch(() => undefined);
}

// ─── JSON parsing (defensive) ───────────────────────────────────────────────

function parseJson<T>(raw: string, context: string): T {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) text = fence[1].trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`Factory V2: ${context} returned no JSON object.`);
  }
  try {
    return JSON.parse(text.slice(start, end + 1)) as T;
  } catch (err) {
    throw new Error(
      `Factory V2: ${context} returned invalid JSON (${err instanceof Error ? err.message : 'parse error'}).`,
    );
  }
}

/**
 * parseJson plus mechanical repairs for the model slips we actually see:
 * trailing commas, a missing comma between members, a missing comma at a
 * line break between two strings. Each repair candidate is accepted ONLY
 * if the whole document then parses — no partial or lossy recovery.
 */
/**
 * Heuristic repair for unescaped double quotes INSIDE string values — the
 * one slip the other repairs cannot touch, and the most common writer
 * failure on dialogue-heavy (yapper) briefs. A quote counts as the
 * string's close only when the next non-space character is a structural
 * delimiter; anything else means it was content, so it gets escaped.
 * Like every repair, the result is accepted ONLY if the whole document
 * then parses — a bad guess self-rejects.
 */
function repairUnescapedQuotes(text: string): string {
  let out = '';
  let inStr = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (!inStr) {
      out += ch;
      if (ch === '"') inStr = true;
    } else if (ch === '\\') {
      out += ch + (text[i + 1] ?? '');
      i++;
    } else if (ch === '"') {
      let j = i + 1;
      while (j < text.length && (text[j] === ' ' || text[j] === '\t')) j++;
      const next = text[j];
      if (next === ',' || next === '}' || next === ']' || next === ':' || next === '\n' || next === '\r' || next === undefined) {
        out += ch;
        inStr = false;
      } else {
        out += '\\"';
      }
    } else {
      out += ch;
    }
  }
  return out;
}

function parseJsonLenient<T>(raw: string, context: string): T {
  try {
    return parseJson<T>(raw, context);
  } catch (firstErr) {
    let text = raw.trim();
    const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fence) text = fence[1].trim();
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) throw firstErr;
    const base = text.slice(start, end + 1);
    const noTrailing = base.replace(/,\s*([}\]])/g, '$1');
    const commaBetweenObjects = (t: string) => t.replace(/}(\s*){/g, '},$1{');
    const commaBetweenStrings = (t: string) => t.replace(/"(\s*\n\s*)"/g, '",$1"');
    const quoteFixed = repairUnescapedQuotes(base);
    const candidates = [
      noTrailing,
      commaBetweenObjects(base),
      commaBetweenStrings(base),
      commaBetweenStrings(commaBetweenObjects(noTrailing)),
      quoteFixed,
      commaBetweenStrings(commaBetweenObjects(quoteFixed.replace(/,\s*([}\]])/g, '$1'))),
    ];
    for (const c of candidates) {
      try {
        const parsed = JSON.parse(c) as T;
        console.warn(`[factory2] ${context}: response needed mechanical JSON repair (accepted a repaired parse).`);
        return parsed;
      } catch {
        // try the next candidate
      }
    }
    throw firstErr;
  }
}

/**
 * A thinking call whose response MUST parse as JSON — self-healing.
 * On an unparseable response: mechanical repair first (above), then ONE
 * corrective retry that shows the model its own output and the exact
 * parser error so it fixes the JSON while keeping the creative content.
 */
async function requestJson<T>(
  system: string,
  user: string,
  apiKey: string,
  maxTokens: number,
  context: string,
  signal?: AbortSignal,
): Promise<T> {
  let raw: string;
  try {
    raw = await sendThinking(system, user, apiKey, maxTokens, signal);
  } catch (err) {
    if (signal?.aborted) throw err;
    // The model burned its whole output budget reasoning and never wrote a
    // token. This is deterministic for a given prompt — an identical retry
    // fails identically forever (the Aug 2026 batch proved it over ~10 manual
    // retries). The only useful recovery is MORE ROOM, so retry once, bigger.
    if (err instanceof Error && err.message.startsWith('TOKEN_BUDGET_EXHAUSTED')) {
      const bigger = Math.min(maxTokens * 3, 32000);
      console.warn(`[factory2] ${context}: output budget exhausted at ${maxTokens} tokens — retrying once at ${bigger}.`);
      await interCallDelay(signal);
      raw = await sendThinking(system, user, apiKey, bigger, signal);
    } else {
      throw err;
    }
  }
  try {
    return parseJsonLenient<T>(raw, context);
  } catch (err) {
    if (signal?.aborted) throw err;
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[factory2] ${context}: unparseable JSON — running one corrective retry.`, err);
    await interCallDelay(signal);
    const fixUser = `${user}

## CORRECTION PASS — YOUR PREVIOUS RESPONSE WAS REJECTED

Your previous response failed JSON parsing with this error:
${msg}

Your previous response was:
"""
${raw.slice(0, 24000)}
"""

Re-emit the COMPLETE response as ONE strictly valid JSON object. Keep the same creative content —
fix ONLY the JSON: convert or escape double quotes inside string values (prefer single quotes for
quoted speech), remove raw line breaks inside strings, add any missing commas between array
elements and properties, remove trailing commas, and close every bracket. If your previous response
was cut off, finish it. Output the JSON object and nothing else.`;
    const raw2 = await sendThinking(system, fixUser, apiKey, maxTokens, signal);
    return parseJsonLenient<T>(raw2, context);
  }
}

let idCounter = 0;
function genId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter}_${Math.random().toString(36).slice(2, 6)}`;
}

// ─── Inspiration helpers ────────────────────────────────────────────────────

/** Ad-type-relevant bank items: explicitly tagged for this ad type, or
 *  untagged videos. Full-AI and other-ad-type videos are excluded — the
 *  selector's own hard boundary (Full-AI never mixes with live-action). */
async function bankItemsFor(adType: V2AdType): Promise<InspirationItem[]> {
  const wanted = adType === 'ecom' ? ECOM_AD_TYPE : UGC_AD_TYPE;
  const items = await getAllItems();
  return items.filter((it) => {
    if (it.status !== 'ready') return false;
    const tags = getEffectiveTags(it);
    if (tags.isFullAi) return false;
    if (tags.adType === wanted) return true;
    return it.kind === 'video' && !tags.adType;
  });
}

/** UGC-relevant bank items (the pre-ecom filter, unchanged behavior). */
async function ugcBankItems(): Promise<InspirationItem[]> {
  return bankItemsFor('ugc');
}

/** Short text snapshot of the UGC bank for the brainstorm prompt. */
export async function summarizeUgcBank(): Promise<string> {
  try {
    const items = await ugcBankItems();
    if (items.length === 0) return 'Inspiration bank has no ready UGC items yet.';
    const lines = items.slice(0, 25).map((it) => {
      const tags = getEffectiveTags(it);
      return `- "${it.title || it.filename}" | ${tags.angleType ?? '?'} | ${tags.duration ?? '?'} | ${tags.framework ?? '?'}${it.starred ? ' | ★' : ''}`;
    });
    return `${items.length} ready UGC-relevant items. Sample:\n${lines.join('\n')}`;
  } catch {
    return 'Inspiration bank unavailable.';
  }
}

/**
 * Inspiration context for a task.
 *
 * PINNED path — the director pins a bank ad IN THE SAME UGC STYLE as the
 * task, making it the FINISHED-PROJECT EXEMPLAR: the concept generator and
 * script writer study it for what "done" looks like in this style across
 * every execution dimension — visuals, shot angles, tone, pace, framework,
 * hooks, beats, CTA, and how product/pain are positioned. The full analyzer
 * output (and the ad's actual script when available) is rendered.
 *
 * UNPINNED path — falls back to the selector's matched references.
 */
async function inspirationContextFor(task: V2Task): Promise<string> {
  try {
    if (task.pinnedInspirationId) {
      const item = await getItem(task.pinnedInspirationId);
      if (item && item.status === 'ready') {
        const script = (item.attachedScriptText || item.textContent || '').trim();
        const scriptBlock = script
          ? `\nTHE EXEMPLAR'S ACTUAL SCRIPT/VO (the primary dissection source — dissect it line by line):\n"""\n${script.slice(0, 6000)}\n"""`
          : '';
        return `## PINNED EXEMPLAR — THE STRUCTURAL AUTHORITY for this task

The director pinned this bank ad as THE authority on how this brief is built. Before writing
ANYTHING, dissect it thoroughly: break it into numbered beats and for each beat name its JOB, its
proportional share of runtime, and the BUILDING BLOCK of each line (hook / escalation / pivot /
discovery / demo / proof / reveal / close). Locate the product-entry position (as % into the ad),
how much of the ad talks product after entry, and the shape of the payoff. That dissected beat map
GOVERNS this brief near one-to-one: same framework logic, same beat order, same proportional
timing, same product-entry position, same product-talk share, same payoff shape, same visual
grammar (shot types, angles, energy). It OUTRANKS the style guide's pacing norms and the awareness
level's timing defaults. It never outranks the censors: OUR brand facts, OUR claim boundary, and
the awareness level's vocabulary/offer bans bind in full — mirror the ARCHITECTURE and the craft,
never the claims, brand facts, or literal lines.
REGISTER CAVEAT: exemplar transcripts are often caption-fragmented (auto-transcription splits
speech into stubs). The exemplar governs STRUCTURE and energy — OUR lines are still written in the
voice DNA's spoken register and must pass the read-aloud test. A choppy transcript is a transcript
artifact, never a license for telegraphic delivery.

"${item.title || item.filename}"
- Summary: ${item.summary || '-'}
- Hook breakdown (the first seconds): ${item.hookBreakdown ?? '-'}
- Narrative arc (the beat structure): ${item.narrativeArc ?? '-'}
- Visual blueprint (shots, framing, text treatment): ${item.visualBlueprint ?? '-'}
- Style notes (tone, pace, energy): ${item.styleNotes || '-'}
- Product bridge (when/how the product enters): ${item.productBridge ?? '-'}
- Key language (register and phrasing patterns): ${item.keyLanguage ?? '-'}
- Line flow (how lines build on each other): ${item.lineFlowAnalysis ?? '-'}
- Learnings: ${(item.learnings ?? []).join(' · ') || '-'}${scriptBlock}`;
      }
    }
    const { block } = await getInspirationContextBlock({
      adType: taskAdType(task) === 'ecom' ? ECOM_AD_TYPE : UGC_AD_TYPE,
      duration: task.duration,
      productCategory: task.product,
      isFullAi: false,
      maxResults: 5,
    });
    return block
      ? `${block}\n\n(NOTE: no ${taskAdType(task) === 'ecom' ? 'exemplar was pinned for this task — the references above are the bank\'s closest ecom matches. Follow the ECOM CRAFT DNA in the context pack as the primary delivery authority.)' : 'style exemplar was pinned for this task — the references above are the bank\'s closest matches, not necessarily this UGC style. Follow the STYLE GUIDE in the context pack as the primary delivery authority.)'}`
      : '';
  } catch (err) {
    console.warn('[factory2] inspiration context unavailable', err);
    return '';
  }
}

// ─── Step 1: Brainstorm ─────────────────────────────────────────────────────

export async function runBrainstorm(
  tasks: V2Task[],
  apiKey: string,
  signal?: AbortSignal,
  instructions?: string,
): Promise<Pick<V2Brainstorm, 'analysis' | 'questions'>> {
  const bankSummary = await summarizeUgcBank();
  const { system, user } = buildBrainstormPrompt(tasks, bankSummary, instructions);
  const brain = await buildBrainAddendum({ module: 'strategySession' }, { apiKey });
  const parsed = await requestJson<{ analysis: string; questions: Array<{ id?: string; question: string; options?: string[] }> }>(
    system + brain.addendum, user, apiKey, 6000, 'brainstorm', signal,
  );
  const questions: V2BrainstormQuestion[] = (parsed.questions ?? []).slice(0, 5).map((q, i) => ({
    id: q.id || `q${i + 1}`,
    question: q.question,
    options: Array.isArray(q.options) ? q.options.slice(0, 4) : [],
  }));
  if (!parsed.analysis || questions.length === 0) {
    throw new Error('Factory V2: brainstorm returned an empty analysis or no questions.');
  }
  return { analysis: parsed.analysis, questions };
}

export async function synthesizeDirection(
  tasks: V2Task[],
  brainstorm: V2Brainstorm,
  apiKey: string,
  signal?: AbortSignal,
  instructions?: string,
): Promise<string> {
  const { system, user } = buildDirectionSynthesisPrompt(tasks, brainstorm, instructions);
  const parsed = await requestJson<{ direction: string }>(system, user, apiKey, 3000, 'direction synthesis', signal);
  if (!parsed.direction) throw new Error('Factory V2: direction synthesis returned empty.');
  return parsed.direction;
}

// ─── Step 2: Concepts ───────────────────────────────────────────────────────

export async function generateConcepts(
  task: V2Task,
  direction: string,
  apiKey: string,
  signal?: AbortSignal,
  instructions?: string,
): Promise<V2Concept[]> {
  const inspiration = await inspirationContextFor(task);
  const { system, user } = buildConceptsPrompt(task, direction, inspiration, instructions);
  const parsed = await requestJson<{ concepts: Array<Omit<V2Concept, 'id'>> }>(system, user, apiKey, 8000, 'concept generation', signal);
  const concepts = (parsed.concepts ?? []).slice(0, 3).map((c) => ({ ...c, id: genId('con') }));
  if (concepts.length === 0) throw new Error('Factory V2: no concepts generated.');
  return concepts;
}

// ─── Step 3: Framework selection ────────────────────────────────────────────

export async function selectFramework(
  task: V2Task,
  concept: V2Concept,
  apiKey: string,
  signal?: AbortSignal,
): Promise<{ name: ScriptFramework; rationale: string }> {
  const inspiration = await inspirationContextFor(task);
  const { system, user } = buildFrameworkSelectPrompt(task, concept, inspiration);
  // 1500 was too tight: this call ships all 15 framework guides, the context
  // pack, the pinned-exemplar dissection AND the Schwartz/Bly brain block, so
  // the model can reason past a small budget before writing its one-line answer.
  const parsed = await requestJson<{ framework: string; rationale: string }>(system, user, apiKey, 5000, 'framework selection', signal);
  const roster = taskAdType(task) === 'ecom' ? ECOM_FRAMEWORKS : UGC_FRAMEWORKS;
  const exact = roster.find((f) => f === parsed.framework)
    ?? roster.find((f) => f.toLowerCase().includes((parsed.framework || '').toLowerCase().slice(0, 12)));
  if (!exact) {
    console.warn(`[factory2] Unrecognized framework "${parsed.framework}" — defaulting to The Discovery Narrative (logged, not silent).`);
  }
  return {
    name: exact ?? 'The Discovery Narrative',
    rationale: parsed.rationale || 'Selected for concept fit.',
  };
}

// ─── Step 4: Brief writing ──────────────────────────────────────────────────

interface RawBriefRow {
  clipNumber: number | string;
  audioType?: string;
  role?: string;
  scriptLine?: string;
  shotType?: string;
  shotDescription?: string;
  overlayText?: string;
  editorNotes?: string;
}

interface RawBriefJson {
  header: {
    concept: string;
    angle: string;
    videoTonality: string;
    attire: string;
    instructions: string[];
    ecomEditing?: {
      pacing?: string;
      music?: string;
      transitions?: string;
      specialNotes?: string;
    };
  };
  hooks: string[];
  ctas: string[];
  scriptProse: string;
  storyboard: RawBriefRow[];
}

/** All ecom footage tags, flattened, for case-insensitive canonicalization. */
const ALL_ECOM_TAGS: readonly EcomShotTag[] = [
  ...ECOM_SHOT_TAGS.core,
  ...ECOM_SHOT_TAGS.supplementary,
  ...ECOM_SHOT_TAGS.limited,
];

/** Normalized, logged-not-silent coercion of model row values. Ecom rows keep
 *  their footage-library TAG (canonicalized case-insensitively; unknown tags
 *  are preserved, not coerced — validateBrief flags them deterministically,
 *  because silently rewriting a tag would hide a grounding failure). */
function toRow(r: RawBriefRow, adType: V2AdType = 'ugc'): V2Row | null {
  const clip = Number(r.clipNumber);
  if (!Number.isFinite(clip)) {
    console.warn(`[factory2] dropping storyboard row with non-numeric clipNumber ${JSON.stringify(r.clipNumber)}`);
    return null;
  }
  if (adType === 'ecom') {
    const tagRaw = (r.shotType ?? '').trim();
    const canonical = ALL_ECOM_TAGS.find((t) => t.toLowerCase() === tagRaw.toLowerCase());
    if (!canonical && tagRaw) {
      console.warn(`[factory2] ecom row carries a non-library shot tag "${tagRaw}" — kept for the validator to flag`);
    }
    return {
      id: genId('row'),
      clipNumber: clip,
      audioType: 'VO',
      scriptLine: r.scriptLine ?? '',
      shotType: (canonical ?? (tagRaw as EcomShotTag)) || 'Studio Product Shot',
      shotDescription: r.shotDescription ?? '',
      reference: { kind: 'none', reason: 'pending match' },
      editorNotes: r.editorNotes ?? '',
      overlayText: r.overlayText ?? '',
    };
  }
  const audioRaw = (r.audioType ?? '').trim().toLowerCase();
  const audio: V2Row['audioType'] =
    audioRaw === 'vo' || audioRaw === 'voiceover' ? 'VO' : 'F2C';
  if (!['f2c', 'vo', 'voiceover', 'talk to camera'].includes(audioRaw) && audioRaw !== '') {
    console.warn(`[factory2] coerced unknown audioType "${r.audioType}" → "${audio}"`);
  }
  const shotRaw = (r.shotType ?? '').trim().toLowerCase().replace(/[^a-z ]/g, '');
  const shot: V2Row['shotType'] =
    shotRaw.includes('roll') ? 'B-Roll' : shotRaw.includes('visual') ? 'Visual Hook' : 'Talk to Camera';
  if (!shotRaw.includes('roll') && !shotRaw.includes('visual') && !shotRaw.includes('talk')) {
    console.warn(`[factory2] coerced unknown shotType "${r.shotType}" → "${shot}"`);
  }
  return {
    id: genId('row'),
    clipNumber: clip,
    audioType: audio,
    scriptLine: r.scriptLine ?? '',
    shotType: shot,
    shotDescription: r.shotDescription ?? '',
    reference: { kind: 'none', reason: 'pending match' },
    editorNotes: r.editorNotes ?? '',
  };
}

/** Attach mirrorsLineId to main-edit rows using the writer's role marking. */
function linkMirrors(rows: V2Row[], raws: RawBriefRow[], hookId: string | undefined, ctaId: string | undefined): void {
  rows.forEach((row, i) => {
    const role = (raws[i]?.role ?? '').toLowerCase();
    if (role === 'hook' && hookId) row.mirrorsLineId = hookId;
    if (role === 'cta' && ctaId) row.mirrorsLineId = ctaId;
  });
  // Fallbacks when the model omitted roles: clip 1 mirrors hook 1; the last
  // spoken Talk-to-Camera row mirrors CTA 1.
  if (hookId && !rows.some((r) => r.mirrorsLineId === hookId)) {
    const first = rows.find((r) => r.clipNumber === 1);
    if (first) first.mirrorsLineId = hookId;
  }
  if (ctaId && !rows.some((r) => r.mirrorsLineId === ctaId)) {
    const last = [...rows].reverse().find((r) => r.shotType === 'Talk to Camera' && r.scriptLine.trim().length > 0);
    if (last) last.mirrorsLineId = ctaId;
  }
}

/** Append the Media Engineered alternate-take convention: End Card spacer,
 *  then hooks 2..n and CTA 2 as extra clips mirroring their source lines. */
function appendAlternateTakes(
  rows: V2Row[],
  hooks: Array<{ id: string; text: string }>,
  ctas: Array<{ id: string; text: string }>,
): V2Row[] {
  const out = [...rows];
  let nextClip = rows.reduce((m, r) => (typeof r.clipNumber === 'number' ? Math.max(m, r.clipNumber) : m), 0);
  const hookRow = rows.find((r) => r.mirrorsLineId === hooks[0]?.id) ?? rows.find((r) => r.clipNumber === 1);
  const ctaRow = rows.find((r) => r.mirrorsLineId === ctas[0]?.id);

  out.push({
    id: genId('row'),
    clipNumber: 'end-card',
    audioType: '-',
    scriptLine: '',
    shotType: 'End Card',
    shotDescription: '-',
    reference: { kind: 'none', reason: 'end card — editor asset' },
    editorNotes: 'Standard end card: website, logo, product, CTA.',
  });

  for (const hook of hooks.slice(1)) {
    nextClip += 1;
    out.push({
      id: genId('row'),
      clipNumber: nextClip,
      audioType: hookRow?.audioType ?? 'F2C',
      scriptLine: hook.text,
      shotType: hookRow?.shotType ?? 'Talk to Camera',
      shotDescription: hookRow ? `Same setup as clip 1. ${hookRow.shotDescription}` : 'Same setup as clip 1.',
      reference: { kind: 'same-as', clipNumber: 1 },
      editorNotes: 'Alternate hook — used for ad variations (swap with clip 1).',
      mirrorsLineId: hook.id,
    });
  }
  for (const cta of ctas.slice(1)) {
    nextClip += 1;
    const refClip = typeof ctaRow?.clipNumber === 'number' ? ctaRow.clipNumber : 1;
    out.push({
      id: genId('row'),
      clipNumber: nextClip,
      audioType: ctaRow?.audioType ?? 'F2C',
      scriptLine: cta.text,
      shotType: ctaRow?.shotType ?? 'Talk to Camera',
      shotDescription: `Same setup as clip ${refClip}. ${CTA_PERFORMANCE_NOTE}`,
      reference: { kind: 'same-as', clipNumber: refClip },
      editorNotes: 'Alternate CTA — used for ad variations (swap with the main CTA clip).',
      mirrorsLineId: cta.id,
    });
  }
  return out;
}

/**
 * Re-number all numeric clips sequentially in array order (skipping the
 * End Card spacer) and remap same-as references through the old→new map.
 * References to a clip that no longer exists become honest 'none' states.
 */
function renumberStoryboard(rows: V2Row[]): V2Row[] {
  const map = new Map<number, number>();
  let next = 0;
  const renumbered = rows.map((r) => {
    if (typeof r.clipNumber !== 'number') return r;
    next += 1;
    map.set(r.clipNumber, next);
    return { ...r, clipNumber: next };
  });
  return renumbered.map((r) => {
    if (r.reference.kind !== 'same-as') return r;
    const remapped = map.get(r.reference.clipNumber);
    if (remapped === undefined) {
      return { ...r, reference: { kind: 'none' as const, reason: 'referenced clip was deleted — re-match from the editor' } };
    }
    return { ...r, reference: { kind: 'same-as' as const, clipNumber: remapped } };
  });
}

// ─── Deterministic QA (no model — cannot hallucinate) ───────────────────────

const BRAND_FACT_CHECKS: Array<{ pattern: RegExp; issue: string }> = [
  { pattern: /graduated[^.]{0,40}ankle|ankle[^.]{0,40}graduated/i, issue: 'Ankle Compression is UNIFORM, never "graduated" — brand-fact violation' },
  { pattern: /\b(1[0-1]|1[6-9]|[2-9]\d)\s*[-–]?\s*\d*\s*mmhg/i, issue: 'mmHg spec other than 12-15 detected — canonical is graduated 12-15 mmHg (Compression) / uniform (Ankle)' },
  // BANNED brand-wide (director ruling, Aug 2026): Viasox creative never
  // promises a guarantee, refund, or returns/exchange policy. Deterministic
  // so no prompt-level persuasion can reintroduce it.
  { pattern: /\bguarantee(d|s)?\b/i, issue: 'BANNED CLAIM: guarantee language — Viasox never promises a guarantee. Use low-stakes entry ("start with one pair") or lived proof instead' },
  { pattern: /money[- ]?back|full refund|we'?ll refund|refund(ed)? (you|your)/i, issue: 'BANNED CLAIM: refund/money-back promise — not approved for Viasox creative' },
  { pattern: /risk[- ]?free|no risk\b|you'?ve lost nothing/i, issue: 'BANNED CLAIM: risk-free framing — de-risk the DECISION (smaller first commitment), never promise the outcome' },
  { pattern: /(free|easy) returns?|return them free|love (them|it) or (return|send)|they fit or they'?re free|send (them|it) back\b/i, issue: 'BANNED CLAIM: returns/exchange promise — not approved for Viasox creative' },
  // The conditional-promise construction: "if we're wrong, return them",
  // "if you don't love them, send them back" — same promise, softer clothes.
  { pattern: /(if|unless)[^.!?]{0,40}(wrong|don'?t love|not happy|doesn'?t work)[^.!?]{0,30}(return|refund|money|send (them|it) back)/i, issue: 'BANNED CLAIM: conditional return/refund promise — de-risk the DECISION (smaller first commitment), never promise the outcome' },
];

export function validateBrief(brief: UgcBriefV2): V2RippleFlag[] {
  const flags: V2RippleFlag[] = [];
  const mainRows = brief.storyboard.filter(
    (r) => typeof r.clipNumber === 'number' && r.reference.kind !== 'same-as' && !r.mirrorsLineId?.startsWith('cta_alt'),
  );
  // Word budget: main edit spoken words vs the duration's hard ceiling.
  const endCardIdx = brief.storyboard.findIndex((r) => r.clipNumber === 'end-card');
  const mainEdit = endCardIdx >= 0 ? brief.storyboard.slice(0, endCardIdx) : mainRows;
  const words = mainEdit.reduce((n, r) => n + r.scriptLine.split(/\s+/).filter(Boolean).length, 0);
  const ceiling =
    taskAdType(brief.task) === 'ecom' && brief.task.duration === '60-90 sec'
      ? ECOM_LONGFORM.hardCeiling // ecom long-form: 90-150s runs to 360 words
      : DURATION_TARGETS[brief.task.duration]?.hardCeiling;
  if (ceiling && words > ceiling) {
    flags.push({
      id: genId('flag'),
      target: 'script prose',
      issue: `Main edit is ${words} spoken words — over the ${ceiling}-word hard ceiling for ${brief.task.duration}`,
      suggestion: 'Tighten the longest clips or cut a beat; regenerate the heaviest lines with "shorter" feedback.',
    });
  }
  // Banned placeholders/tics + brand facts, deterministically.
  const allText = [
    brief.scriptProse,
    ...brief.hooks.map((h) => h.text),
    ...brief.ctas.map((c) => c.text),
    ...brief.storyboard.map((r) => `${r.scriptLine} ${r.shotDescription}`),
  ]
    .join('\n')
    .toLowerCase()
    .replace(/’/g, "'");
  for (const p of [...BANNED_PLACEHOLDERS, ...BANNED_TICS]) {
    if (allText.includes(p.toLowerCase().replace(/’/g, "'"))) {
      flags.push({
        id: genId('flag'),
        target: 'script prose',
        issue: `Banned phrase detected: "${p}"`,
        suggestion: 'Replace with a concrete product attribute or fresh phrasing (see Product Conviction rules).',
      });
    }
  }
  for (const check of BRAND_FACT_CHECKS) {
    if (check.pattern.test(allText)) {
      flags.push({ id: genId('flag'), target: 'script prose', issue: check.issue, suggestion: 'Correct against the canonical brand facts before shipping.' });
    }
  }
  // ── Ecom-only deterministic nets ──────────────────────────────────────────
  if (taskAdType(brief.task) === 'ecom') {
    // 1. Footage grounding: the negative list is the visual claim boundary.
    //    A visual implying footage we don't have is a wall for the editor.
    const NEGATIVE_FOOTAGE =
      /\b(gym|fitness (?:class|studio)|medical office|clinic|clinical setting|hospital|airport|travel(?:ing|ling)?|restaurant|dining out|hiking|jogging|cycling|playing sports|children|toddler|grandchild(?:ren)?|family scene|puppy|kitten|\bdog\b|\bcat\b)\b/i;
    for (const r of mainEdit) {
      if (typeof r.clipNumber !== 'number') continue;
      const visual = `${r.shotType} ${r.shotDescription}`;
      const m = NEGATIVE_FOOTAGE.exec(visual);
      if (m) {
        flags.push({
          id: genId('flag'),
          target: `clip ${r.clipNumber} shot`,
          issue: `Visual implies footage from the NEGATIVE list ("${m[0]}") — the library has no gym/medical/sports/travel/dining/outdoor-activity/children/pet footage`,
          suggestion: 'Rewrite the visual against the footage library tags, or note the replacement in editor notes.',
        });
      }
      // 2. Tag grounding: the shot tag must be a library tag.
      if (r.shotType && !ALL_ECOM_TAGS.some((t) => t === r.shotType)) {
        flags.push({
          id: genId('flag'),
          target: `clip ${r.clipNumber} shot`,
          issue: `"${r.shotType}" is not a footage-library tag — the editor has no bucket to pull from`,
          suggestion: 'Pick the closest tag from the library lists (Core / Supplementary / Limited).',
        });
      }
    }
    // 3. Kia's CTA law: the offer rides every ecom CTA (Unaware exempt — the
    //    release-order doctrine governs the close there).
    if (brief.task.awarenessLevel !== 'Unaware') {
      const OFFER = /buy\s*2|get\s*3|b2g3|\$\s?60|\$\s?12|5 pairs|five pairs/i;
      brief.ctas.forEach((c, i) => {
        if (!OFFER.test(c.text)) {
          flags.push({
            id: genId('flag'),
            target: `cta ${i + 1}`,
            issue: `Ecom CTA carries no offer — "${c.text.length > 70 ? `${c.text.slice(0, 70)}…` : c.text}"`,
            suggestion: 'State the offer plainly (exact brand-facts math) and close on the thesis echo.',
          });
        }
      });
    }
  }
  // Conditional-claim drift, deterministically: on ACS and COMP an absolute
  // mark/dig-in promise must carry its condition ("when sized right") —
  // absolutes are EasyStretch-only. Caught twice in the Week-3 hand review;
  // this net makes the catch permanent. Advisory.
  if (brief.task.product !== 'EasyStretch') {
    const ABSOLUTE_DIG = /(?:nothing|never)\s+dig(?:s|ging)?\s+in|no\s+dig[- ]?ins?\b|no\s+marks\b/i;
    const CONDITIONED = /sized?\s+right|right\s+size/i;
    const spokenAndOverlay = [
      ...brief.hooks.map((h, i) => ({ where: `hook ${i + 1}`, text: h.text })),
      ...brief.ctas.map((c, i) => ({ where: `cta ${i + 1}`, text: c.text })),
      ...mainEdit
        .filter((r) => typeof r.clipNumber === 'number')
        .flatMap((r) => [
          { where: `clip ${r.clipNumber} script`, text: r.scriptLine },
          ...(r.overlayText ? [{ where: `clip ${r.clipNumber} overlay`, text: r.overlayText }] : []),
        ]),
    ];
    for (const { where, text } of spokenAndOverlay) {
      const m = ABSOLUTE_DIG.exec(text);
      if (m && !CONDITIONED.test(text.slice(Math.max(0, m.index - 60), m.index + m[0].length + 60))) {
        flags.push({
          id: genId('flag'),
          target: where,
          issue: `Absolute mark/dig-in claim on ${brief.task.product} ("…${m[0]}…") — absolutes are EasyStretch-only`,
          suggestion: 'Use the approved conditional phrasing: "no dig-in when sized right". Insert the condition; keep the benefit.',
        });
      }
    }
  }
  // Telegraphic chop, deterministically — only the unambiguous shapes (a bare
  // ordinal doing a sentence's job; 3+ clipped fragments chained). Register is
  // ultimately a judgment call, so the main enforcement lives in the voice
  // DNA's read-aloud doctrine, the writer's speakabilityCheck gate, and Final
  // Review failure class 9; this net just guarantees the flagrant cases are
  // never silent. Advisory: a deliberate single punch beat never trips it.
  // Style scope: in Faceless POV the overlay text IS the script (see the
  // ugc_pov guide) — written-overlay register is native there, so the spoken
  // net does not apply. Ecom VO is ALWAYS spoken (read verbatim by the AI
  // voice), so the net runs for every ecom brief regardless of style field.
  // Keep in sync with the DNA's SCOPE clause.
  if (taskAdType(brief.task) === 'ugc' && brief.task.ugcStyle === 'ugc_pov') return flags;
  const spokenSurfaces = [
    ...brief.hooks.map((h, i) => ({ where: `hook ${i + 1}`, text: h.text })),
    ...brief.ctas.map((c, i) => ({ where: `cta ${i + 1}`, text: c.text })),
    ...mainEdit.filter((r) => typeof r.clipNumber === 'number').map((r) => ({ where: `clip ${r.clipNumber} script`, text: r.scriptLine })),
  ];
  const BARE_STUB = /^(?:one|two|three|four|five|six|seven|eight|nine|ten|\d+|number\s+\w+)$/i;
  for (const { where, text } of spokenSurfaces) {
    const sentences = text.split(/[.!?…]+/).map((s) => s.trim()).filter(Boolean);
    if (sentences.length < 2) continue;
    const stub = sentences.find((s) => BARE_STUB.test(s));
    // "…worn there, ranked." — a sentence whose verb arrives as a bare
    // comma-spliced participle tail is the written-copy compression shape.
    const participleTail = sentences.find((s) => /,\s+\w+ed$/i.test(s) && s.split(/\s+/).length >= 4);
    let run = 0;
    let maxRun = 0;
    for (const s of sentences) {
      run = s.split(/\s+/).filter(Boolean).length <= 4 ? run + 1 : 0;
      if (run > maxRun) maxRun = run;
    }
    if (stub || participleTail || maxRun >= 3) {
      const shape = stub
        ? `a bare "${stub}." stub is doing a sentence's job`
        : participleTail
          ? `a comma-spliced participle tail ("…${participleTail.slice(-30)}") amputates the verb phrase`
          : `${maxRun} clipped fragments chained back-to-back`;
      flags.push({
        id: genId('flag'),
        target: where,
        issue: `Telegraphic chop — ${shape}: "${text.length > 90 ? `${text.slice(0, 90)}…` : text}" reads as written copy, not speech`,
        suggestion: 'Fails the read-aloud test. Restore the connective tissue (so / and / that\'s / it was) into one flowing spoken sentence — same facts, same beat. Regenerate the line with "make it sound like natural speech" feedback.',
      });
    }
  }
  return flags;
}

export async function writeBrief(
  task: V2Task,
  concept: V2Concept,
  framework: { name: ScriptFramework; rationale: string },
  direction: string,
  apiKey: string,
  signal?: AbortSignal,
  instructions?: string,
): Promise<UgcBriefV2> {
  const inspiration = await inspirationContextFor(task);
  const { system, user } = buildBriefWritePrompt(task, concept, framework, direction, inspiration, instructions);
  const brain = await buildBrainAddendum(
    { module: 'briefGenerator', angle: task.talkingPoint },
    { apiKey },
  );
  const parsed = await requestJson<RawBriefJson>(system + brain.addendum, user, apiKey, 12000, 'brief writing', signal);
  const rawRows = parsed.storyboard ?? [];
  const mainRows = rawRows.map((r) => toRow(r, taskAdType(task))).filter((r): r is V2Row => r !== null);
  if (mainRows.length < 3) {
    throw new Error('Factory V2: brief writer returned too few storyboard rows.');
  }
  const now = new Date().toISOString();
  const hooks = (parsed.hooks ?? []).slice(0, V2_HOOK_COUNT + 1).map((t) => ({ id: genId('hook'), text: t }));
  const ctas = (parsed.ctas ?? []).slice(0, 2).map((t) => ({ id: genId('cta'), text: t }));
  linkMirrors(mainRows, rawRows, hooks[0]?.id, ctas[0]?.id);
  const brief: UgcBriefV2 = {
    id: genId('brief'),
    taskName: task.parsed.name,
    task,
    header: {
      concept: parsed.header?.concept ?? concept.title,
      angle: parsed.header?.angle ?? task.talkingPoint,
      awarenessLevel: task.awarenessLevel,
      videoTonality: parsed.header?.videoTonality ?? '',
      attire: parsed.header?.attire ?? '',
      instructions: parsed.header?.instructions ?? [],
      ...(taskAdType(task) === 'ecom'
        ? {
            ecomEditing: {
              pacing: parsed.header?.ecomEditing?.pacing ?? '',
              music: parsed.header?.ecomEditing?.music ?? '',
              transitions: parsed.header?.ecomEditing?.transitions ?? '',
              specialNotes: parsed.header?.ecomEditing?.specialNotes ?? '',
            },
          }
        : {}),
    },
    framework,
    concept,
    hooks,
    ctas,
    batchInstructions: (instructions ?? '').trim() || undefined,
    scriptProse: parsed.scriptProse ?? '',
    storyboard: appendAlternateTakes(mainRows, hooks, ctas),
    feedbackLedger: [],
    rippleFlags: [],
    version: 1,
    createdAt: now,
    updatedAt: now,
  };
  brief.rippleFlags = validateBrief(brief);

  // Beat-map fidelity gate: with a pinned exemplar, audit the finished
  // structure against the exemplar's architecture. Non-fatal — mismatches
  // surface as ripple flags in the editor.
  if (inspiration.includes('THE STRUCTURAL AUTHORITY')) {
    try {
      await interCallDelay(signal);
      const { system: fidSystem, user: fidUser } = buildExemplarFidelityPrompt(brief, inspiration);
      const audit = await requestJson<{ flags: Array<{ target: string; issue: string; suggestion: string }> }>(
        fidSystem, fidUser, apiKey, 2500, 'exemplar fidelity audit', signal,
      );
      brief.rippleFlags = [
        ...brief.rippleFlags,
        ...(audit.flags ?? []).slice(0, 6).map((f) => ({
          id: genId('flag'),
          target: `exemplar fidelity — ${f.target}`,
          issue: f.issue,
          suggestion: f.suggestion,
        })),
      ];
    } catch (err) {
      if (signal?.aborted) throw err;
      console.warn('[factory2] exemplar fidelity audit failed (non-fatal)', err);
    }
  }
  return brief;
}

// ─── Step 5: Storyboard reference matching (vision, Opus 4.8 floor) ─────────

const MAX_CANDIDATE_ITEMS = 5;
const FRAMES_PER_ITEM = 4;

export async function matchReferences(
  brief: UgcBriefV2,
  apiKey: string,
  signal?: AbortSignal,
  opts: FrameMatchOptions = {},
): Promise<UgcBriefV2> {
  const items = await bankItemsFor(taskAdType(brief.task));
  // Pinned item first, then starred, then recent.
  const ordered = [...items].sort((a, b) => {
    const ap = a.id === brief.task.pinnedInspirationId ? 1 : 0;
    const bp = b.id === brief.task.pinnedInspirationId ? 1 : 0;
    if (ap !== bp) return bp - ap;
    if (!!a.starred !== !!b.starred) return a.starred ? -1 : 1;
    return (b.uploadedAt || '').localeCompare(a.uploadedAt || '');
  });

  const candidates: FrameCandidate[] = [];
  for (const item of ordered.slice(0, MAX_CANDIDATE_ITEMS)) {
    try {
      const frames = await getFrames(item.id);
      const step = Math.max(1, Math.ceil(frames.length / FRAMES_PER_ITEM));
      let taken = 0;
      for (let i = 0; i < frames.length && taken < FRAMES_PER_ITEM; i += step) {
        if (opts.rejected && opts.rejected.itemId === item.id && opts.rejected.frameIndex === i) continue;
        candidates.push({
          itemId: item.id,
          itemTitle: item.title || item.filename || item.id,
          frameIndex: i,
          dataUrl: frames[i],
        });
        taken += 1;
      }
    } catch {
      // item without frames (text brief) — skip
    }
  }

  const markFailed = (reason: string): UgcBriefV2 => ({
    ...brief,
    storyboard: brief.storyboard.map((r) =>
      r.reference.kind === 'none' && r.reference.reason === 'pending match'
        ? { ...r, reference: { kind: 'none', reason } }
        : r,
    ),
  });

  if (candidates.length === 0) {
    return markFailed('no UGC frames in inspiration bank yet');
  }

  const instruction = buildFrameMatchInstruction(brief, candidates, opts);
  const content: ContentBlock[] = [{ type: 'text', text: instruction }];
  for (const c of candidates) {
    const data = c.dataUrl.replace(/^data:image\/\w+;base64,/, '');
    content.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data } });
  }

  const raw = await sendVisionWithRetry(
    'You are a meticulous UGC storyboard art director. Follow the instruction exactly and answer with strict JSON only.',
    content,
    apiKey,
    3000,
    signal,
  );
  const parsed = parseJsonLenient<{ assignments: Array<{ clipNumber: number; choice: number | string }> }>(
    raw,
    'reference matching',
  );

  const byClip = new Map<number, number | string>();
  for (const a of parsed.assignments ?? []) byClip.set(Number(a.clipNumber), a.choice);

  return {
    ...brief,
    version: brief.version + 1,
    updatedAt: new Date().toISOString(),
    storyboard: brief.storyboard.map((r) => {
      if (typeof r.clipNumber !== 'number') return r;
      if (r.reference.kind === 'same-as') return r; // alternate takes keep their convention
      // Only rows awaiting a match are writable — an existing good reference
      // is never silently overwritten by a batch re-match.
      const writable = r.reference.kind === 'none' && r.reference.reason === 'pending match';
      if (!writable) return r;
      if (opts.onlyClipNumber !== undefined && r.clipNumber !== opts.onlyClipNumber) return r;
      const choice = byClip.get(r.clipNumber);
      if (choice === undefined || choice === 'none') {
        return { ...r, reference: { kind: 'none' as const, reason: 'no good framing match in bank' } };
      }
      if (typeof choice === 'string' && choice.startsWith('same-as:')) {
        const n = parseInt(choice.slice('same-as:'.length), 10);
        if (Number.isFinite(n)) return { ...r, reference: { kind: 'same-as' as const, clipNumber: n } };
        return { ...r, reference: { kind: 'none' as const, reason: 'no good framing match in bank' } };
      }
      // Choices are 1-based IMAGE NUMBERS ("Image 1" = 1).
      const idx = (typeof choice === 'number' ? choice : parseInt(String(choice), 10)) - 1;
      const cand = candidates[idx];
      if (!cand) return { ...r, reference: { kind: 'none' as const, reason: 'no good framing match in bank' } };
      return { ...r, reference: { kind: 'frame' as const, itemId: cand.itemId, frameIndex: cand.frameIndex } };
    }),
  };
}

/** Non-fatal wrapper: a failed match NEVER discards a completed generation. */
export async function matchReferencesSafe(
  brief: UgcBriefV2,
  apiKey: string,
  signal?: AbortSignal,
  opts: FrameMatchOptions = {},
): Promise<UgcBriefV2> {
  try {
    return await matchReferences(brief, apiKey, signal, opts);
  } catch (err) {
    console.warn('[factory2] reference matching failed (non-fatal)', err);
    return {
      ...brief,
      storyboard: brief.storyboard.map((r) =>
        r.reference.kind === 'none' && r.reference.reason === 'pending match'
          ? { ...r, reference: { kind: 'none', reason: 'matching failed — retry from the editor' } }
          : r,
      ),
    };
  }
}

// ─── Steps 6-7: Interactive regeneration + ripple check ─────────────────────

export interface RegenResult {
  brief: UgcBriefV2;
  rippleChecked: boolean;
}

export async function runRippleCheck(
  brief: UgcBriefV2,
  changedTarget: string,
  apiKey: string,
  signal?: AbortSignal,
): Promise<UgcBriefV2> {
  try {
    const { system, user } = buildRippleCheckPrompt(brief, changedTarget);
    const raw = await sendMessage(system, user, apiKey, 2500, V2_HEAVY_MODEL, signal);
    const parsed = parseJsonLenient<{ flags: Array<{ target: string; issue: string; suggestion: string }> }>(
      raw,
      'ripple check',
    );
    return {
      ...brief,
      rippleFlags: [
        ...(parsed.flags ?? []).slice(0, 8).map((f) => ({ id: genId('flag'), ...f })),
        ...validateBrief(brief),
      ],
    };
  } catch (err) {
    console.warn('[factory2] ripple check failed (non-fatal)', err);
    return { ...brief, rippleFlags: validateBrief(brief) };
  }
}

/** Verbatim scriptProse patch: replace the old line when it occurs exactly
 *  once; otherwise flag prose for manual regeneration. */
function patchProse(brief: UgcBriefV2, oldText: string, newText: string): UgcBriefV2 {
  if (!oldText.trim()) return brief;
  const occurrences = brief.scriptProse.split(oldText).length - 1;
  if (occurrences === 1) {
    // Function replacer: replacement text may contain "$" (offer math),
    // which a string replacement would misread as a substitution pattern.
    return { ...brief, scriptProse: brief.scriptProse.replace(oldText, () => newText) };
  }
  return {
    ...brief,
    rippleFlags: [
      ...brief.rippleFlags,
      {
        id: genId('flag'),
        target: 'script prose',
        issue: 'A line changed but could not be auto-patched into the prose read-through',
        suggestion: 'Regenerate the script prose so it matches the storyboard.',
      },
    ],
  };
}

export async function applyRegen(
  brief: UgcBriefV2,
  target: V2RegenTarget,
  feedback: string,
  apiKey: string,
  signal?: AbortSignal,
): Promise<RegenResult> {
  const targetLabel = describeTarget(target, brief);
  const withLedger: UgcBriefV2 = feedback.trim()
    ? {
        ...brief,
        feedbackLedger: [
          ...brief.feedbackLedger,
          { id: genId('fb'), timestamp: new Date().toISOString(), target: targetLabel, feedback: feedback.trim() },
        ],
      }
    : brief;

  // Reference re-match is a vision operation, targeted at ONE clip, with the
  // feedback and the rejected frame threaded through.
  if (target.type === 'row-reference') {
    const row = withLedger.storyboard.find((r) => r.id === target.rowId);
    const clipNo = typeof row?.clipNumber === 'number' ? row.clipNumber : undefined;
    const rejected = row?.reference.kind === 'frame' ? { itemId: row.reference.itemId, frameIndex: row.reference.frameIndex } : undefined;
    const cleared: UgcBriefV2 = {
      ...withLedger,
      storyboard: withLedger.storyboard.map((r) =>
        r.id === target.rowId ? { ...r, reference: { kind: 'none', reason: 'pending match' } } : r,
      ),
    };
    const rematched = await matchReferencesSafe(cleared, apiKey, signal, {
      onlyClipNumber: clipNo,
      feedback: feedback.trim() || undefined,
      rejected,
    });
    return { brief: rematched, rippleChecked: false };
  }

  const { system, user } = buildRegenPrompt(withLedger.task, withLedger, target, feedback);
  const isStructural = target.type === 'framework-regenerate' || target.type === 'framework-switch';
  const maxT = isStructural ? 12000 : 2500;

  let updated: UgcBriefV2;
  if (isStructural) {
    const parsed = await requestJson<{
      rationale: string;
      hooks: string[];
      ctas: string[];
      scriptProse: string;
      storyboard: RawBriefRow[];
    }>(system, user, apiKey, maxT, 'framework restructure', signal);
    const rawRows = parsed.storyboard ?? [];
    const mainRows = rawRows.map((r) => toRow(r, taskAdType(withLedger.task))).filter((r): r is V2Row => r !== null);
    if (mainRows.length < 3) throw new Error('Factory V2: framework restructure returned too few rows.');
    const hooks = (parsed.hooks ?? []).slice(0, V2_HOOK_COUNT + 1).map((t) => ({ id: genId('hook'), text: t }));
    const ctas = (parsed.ctas ?? []).slice(0, 2).map((t) => ({ id: genId('cta'), text: t }));
    linkMirrors(mainRows, rawRows, hooks[0]?.id, ctas[0]?.id);
    const newFrameworkName: ScriptFramework =
      target.type === 'framework-switch' ? target.newFramework : withLedger.framework.name;
    updated = {
      ...withLedger,
      framework: { name: newFrameworkName, rationale: parsed.rationale || withLedger.framework.rationale },
      hooks,
      ctas,
      scriptProse: parsed.scriptProse ?? withLedger.scriptProse,
      storyboard: appendAlternateTakes(mainRows, hooks, ctas),
      version: withLedger.version + 1,
      updatedAt: new Date().toISOString(),
    };
    // Storyboard changed wholesale — re-match, non-fatally.
    updated = await matchReferencesSafe(updated, apiKey, signal);
  } else if (target.type === 'row-insert') {
    const parsed = await requestJson<{
      scriptLine: string;
      audioType?: string;
      shotType?: string;
      shotDescription?: string;
      overlayText?: string;
      editorNotes?: string;
    }>(system, user, apiKey, maxT, 'line insertion', signal);
    const newRow = toRow({ clipNumber: 0, ...parsed }, taskAdType(withLedger.task));
    if (!newRow || !newRow.scriptLine.trim()) {
      throw new Error('Factory V2: line insertion returned an empty line.');
    }
    const idx = withLedger.storyboard.findIndex((r) => r.id === target.afterRowId);
    if (idx === -1) throw new Error('Factory V2: insertion anchor row not found.');
    const beforeLine = withLedger.storyboard[idx]?.scriptLine ?? '';
    const spliced = [...withLedger.storyboard];
    spliced.splice(idx + 1, 0, newRow);
    updated = {
      ...withLedger,
      storyboard: renumberStoryboard(spliced),
      version: withLedger.version + 1,
      updatedAt: new Date().toISOString(),
    };
    // Best-effort prose insertion: place the new line right after the
    // before-line when it occurs exactly once; otherwise flag the prose.
    if (beforeLine.trim() && updated.scriptProse.split(beforeLine).length - 1 === 1) {
      // Function replacer: script lines may contain "$" (pricing), which a
      // string replacement would misread as a substitution pattern.
      updated = { ...updated, scriptProse: updated.scriptProse.replace(beforeLine, () => `${beforeLine} ${newRow.scriptLine}`) };
    } else {
      updated = {
        ...updated,
        rippleFlags: [
          ...updated.rippleFlags,
          {
            id: genId('flag'),
            target: 'script prose',
            issue: 'A line was inserted but could not be auto-patched into the prose read-through',
            suggestion: 'Regenerate the script prose so it matches the storyboard.',
          },
        ],
      };
    }
    // Auto-match a reference for the new clip (non-fatal).
    const insertedClip = updated.storyboard.find((r) => r.id === newRow.id)?.clipNumber;
    if (typeof insertedClip === 'number') {
      updated = await matchReferencesSafe(updated, apiKey, signal, { onlyClipNumber: insertedClip });
    }
  } else {
    const parsed = await requestJson<{ newValue: string }>(system, user, apiKey, maxT, `regenerate ${targetLabel}`, signal);
    const v = (parsed.newValue ?? '').trim();
    if (!v) throw new Error('Factory V2: regeneration returned an empty value.');
    updated = { ...withLedger, version: withLedger.version + 1, updatedAt: new Date().toISOString() };
    switch (target.type) {
      case 'hook': {
        const old = brief.hooks.find((h) => h.id === target.lineId)?.text ?? '';
        updated.hooks = updated.hooks.map((h) => (h.id === target.lineId ? { ...h, text: v } : h));
        // Identity-based sync: every storyboard row mirroring this line.
        const mirrors = updated.storyboard.filter((r) => r.mirrorsLineId === target.lineId);
        updated.storyboard = updated.storyboard.map((r) =>
          r.mirrorsLineId === target.lineId ? { ...r, scriptLine: v } : r,
        );
        if (mirrors.length > 1) {
          updated.rippleFlags = [
            ...updated.rippleFlags,
            {
              id: genId('flag'),
              target: 'script prose',
              issue: `This hook spans ${mirrors.length} clips — the full new text was placed in each; trim the split manually`,
              suggestion: 'Edit the affected clip script lines so the hook splits naturally again.',
            },
          ];
        }
        updated = patchProse(updated, old, v);
        break;
      }
      case 'cta': {
        const old = brief.ctas.find((c) => c.id === target.lineId)?.text ?? '';
        updated.ctas = updated.ctas.map((c) => (c.id === target.lineId ? { ...c, text: v } : c));
        updated.storyboard = updated.storyboard.map((r) =>
          r.mirrorsLineId === target.lineId ? { ...r, scriptLine: v } : r,
        );
        updated = patchProse(updated, old, v);
        break;
      }
      case 'row-script': {
        const row = brief.storyboard.find((r) => r.id === target.rowId);
        const old = row?.scriptLine ?? '';
        updated.storyboard = updated.storyboard.map((r) => (r.id === target.rowId ? { ...r, scriptLine: v } : r));
        // Reverse sync: a mirrored row's edit updates its hook/CTA line too.
        if (row?.mirrorsLineId) {
          updated.hooks = updated.hooks.map((h) => (h.id === row.mirrorsLineId ? { ...h, text: v } : h));
          updated.ctas = updated.ctas.map((c) => (c.id === row.mirrorsLineId ? { ...c, text: v } : c));
        }
        updated = patchProse(updated, old, v);
        break;
      }
      case 'row-shot':
        updated.storyboard = updated.storyboard.map((r) => (r.id === target.rowId ? { ...r, shotDescription: v } : r));
        break;
      case 'row-overlay':
        updated.storyboard = updated.storyboard.map((r) => (r.id === target.rowId ? { ...r, overlayText: v } : r));
        break;
      case 'script-prose':
        updated.scriptProse = v;
        break;
      case 'header-field':
        if (target.field === 'instructions') {
          updated.header = {
            ...updated.header,
            instructions: v.split('\n').map((s) => s.replace(/^[-*•\d.\s]+/, '').trim()).filter(Boolean),
          };
        } else if (target.field === 'awarenessLevel') {
          // Awareness is task-level; not editable via text regen.
        } else {
          updated.header = { ...updated.header, [target.field]: v };
        }
        break;
    }
  }

  const checked = await runRippleCheck(updated, targetLabel, apiKey, signal);
  return { brief: checked, rippleChecked: true };
}

/**
 * Delete a storyboard row (human edit — no generation call). Clips are
 * renumbered, orphaned same-as references become honest 'none' states, the
 * prose read-through is patched when possible, and a ripple check runs so
 * any continuity break the deletion causes is flagged immediately.
 */
export async function deleteRow(
  brief: UgcBriefV2,
  rowId: string,
  apiKey: string,
  signal?: AbortSignal,
): Promise<UgcBriefV2> {
  const row = brief.storyboard.find((r) => r.id === rowId);
  if (!row) return brief;
  const endIdx = brief.storyboard.findIndex((r) => r.clipNumber === 'end-card');
  const mainCount = (endIdx >= 0 ? brief.storyboard.slice(0, endIdx) : brief.storyboard).filter(
    (r) => typeof r.clipNumber === 'number',
  ).length;
  const rowIdx = brief.storyboard.findIndex((r) => r.id === rowId);
  const isMainEdit = endIdx === -1 || rowIdx < endIdx;
  if (isMainEdit && mainCount <= 3) {
    throw new Error('Factory V2: the main edit needs at least 3 clips — regenerate lines instead of deleting further.');
  }
  if (row.mirrorsLineId) {
    throw new Error('Factory V2: this clip mirrors a hook/CTA line — regenerate that line instead of deleting its clip.');
  }

  const deletedClip = row.clipNumber;
  let remaining = brief.storyboard.filter((r) => r.id !== rowId);
  // Orphan any same-as references to the deleted clip BEFORE renumbering.
  if (typeof deletedClip === 'number') {
    remaining = remaining.map((r) =>
      r.reference.kind === 'same-as' && r.reference.clipNumber === deletedClip
        ? { ...r, reference: { kind: 'none' as const, reason: 'referenced clip was deleted — re-match from the editor' } }
        : r,
    );
  }

  let updated: UgcBriefV2 = {
    ...brief,
    storyboard: renumberStoryboard(remaining),
    version: brief.version + 1,
    updatedAt: new Date().toISOString(),
  };

  // Best-effort prose removal.
  const line = row.scriptLine.trim();
  if (line && updated.scriptProse.split(line).length - 1 === 1) {
    updated = { ...updated, scriptProse: updated.scriptProse.replace(line, '').replace(/\s{2,}/g, ' ').trim() };
  } else if (line) {
    updated = {
      ...updated,
      rippleFlags: [
        ...updated.rippleFlags,
        {
          id: genId('flag'),
          target: 'script prose',
          issue: 'A line was deleted but could not be auto-removed from the prose read-through',
          suggestion: 'Regenerate the script prose so it matches the storyboard.',
        },
      ],
    };
  }

  return runRippleCheck(updated, `deleted clip ${String(deletedClip)}`, apiKey, signal);
}

// ─── Final review — the post-editing hook-flow protocol ─────────────────────

/** Normalize for verbatim comparison: curly quotes → straight, collapse
 *  whitespace. The model reads a serialized brief, so tiny drift is normal. */
function normalizeForMatch(t: string): string {
  return t
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

type ReviewTargetRef =
  | { kind: 'hook'; lineId: string }
  | { kind: 'cta'; lineId: string }
  | { kind: 'row-script'; rowId: string }
  | { kind: 'row-shot'; rowId: string }
  | { kind: 'row-overlay'; rowId: string }
  | null;

/** Resolve 'hook 2' / 'cta 1' / 'clip 7 script' / 'clip 7 shot' → field ref
 *  + that field's ACTUAL current text. */
function resolveReviewTarget(brief: UgcBriefV2, target: string): { ref: ReviewTargetRef; actual: string } {
  const t = target.trim().toLowerCase();
  let m = t.match(/^hook\s+(\d+)/);
  if (m) {
    const h = brief.hooks[Number(m[1]) - 1];
    return { ref: h ? { kind: 'hook', lineId: h.id } : null, actual: h?.text ?? '' };
  }
  m = t.match(/^cta\s+(\d+)/);
  if (m) {
    const c = brief.ctas[Number(m[1]) - 1];
    return { ref: c ? { kind: 'cta', lineId: c.id } : null, actual: c?.text ?? '' };
  }
  m = t.match(/^(?:clip|scene)\s+(\d+)\s*(script|shot|overlay)?/);
  if (m) {
    const row = brief.storyboard.find((r) => r.clipNumber === Number(m![1]));
    if (!row) return { ref: null, actual: '' };
    if (m[2] === 'shot') return { ref: { kind: 'row-shot', rowId: row.id }, actual: row.shotDescription };
    if (m[2] === 'overlay') return { ref: { kind: 'row-overlay', rowId: row.id }, actual: row.overlayText ?? '' };
    return { ref: { kind: 'row-script', rowId: row.id }, actual: row.scriptLine };
  }
  return { ref: null, actual: '' };
}

/**
 * Run the director's final-review protocol: every hook variant plugged into
 * the script and read as a finished video, every CTA as the ending, plus a
 * body pass — against the fixed failure-class taxonomy. Findings whose
 * quoted text doesn't match the brief become advisory (no auto-apply):
 * a fix must never overwrite text the model misquoted.
 */
export async function runFinalReview(
  brief: UgcBriefV2,
  apiKey: string,
  signal?: AbortSignal,
): Promise<V2ReviewReport> {
  const { system, user } = buildFinalReviewPrompt(brief);
  const parsed = await requestJson<{
    summary: string;
    findings: Array<{
      severity?: string;
      target?: string;
      issue?: string;
      currentText?: string;
      proposedText?: string;
      rationale?: string;
    }>;
    // 16000, not 8000: the review runs on the THINKING tier and reasons
    // through every hook simulation before writing a token — 8000 was
    // reliably exhausted mid-thought, which triggered the giant-budget
    // retry and the timeout spiral. Room first, retry as the backstop.
  }>(system, user, apiKey, 16000, 'final review', signal);

  const findings: V2ReviewFinding[] = (parsed.findings ?? []).slice(0, 10).map((f) => {
    const severity: V2ReviewFinding['severity'] =
      f.severity === 'major' ? 'major' : f.severity === 'minor' ? 'minor' : 'moderate';
    const target = (f.target ?? 'general').trim();
    let currentText = (f.currentText ?? '').trim();
    let proposedText = (f.proposedText ?? '').trim();
    let rationale = (f.rationale ?? '').trim();
    if (proposedText && target.toLowerCase() !== 'general') {
      const { ref, actual } = resolveReviewTarget(brief, target);
      if (!ref || normalizeForMatch(actual) !== normalizeForMatch(currentText)) {
        // Misquoted or unresolvable — demote to advisory rather than risk a bad overwrite.
        rationale = `${rationale} [Not auto-appliable: the quoted text did not exactly match the brief — apply by hand or re-run the review.]`.trim();
        proposedText = '';
      } else {
        currentText = actual; // store the exact field text so apply is precise
      }
    }
    return {
      id: genId('rf'),
      severity,
      target,
      issue: (f.issue ?? '').trim(),
      currentText,
      proposedText,
      rationale,
    };
  }).filter((f) => f.issue);

  const order = { major: 0, moderate: 1, minor: 2 } as const;
  findings.sort((a, b) => order[a.severity] - order[b.severity]);

  return {
    id: genId('rev'),
    createdAt: new Date().toISOString(),
    briefVersion: brief.version,
    summary: (parsed.summary ?? '').trim() || 'Review complete.',
    findings,
  };
}

/**
 * Apply one review finding's fix — deterministic, no model call. Mirrors the
 * regen apply semantics: hook/CTA fixes sync their mirrored storyboard rows
 * by identity, row fixes reverse-sync their hook/CTA line, and the prose
 * read-through is patched. The fix enters the feedback ledger so future
 * generations never reintroduce the flagged issue.
 */
export function applyReviewFix(brief: UgcBriefV2, finding: V2ReviewFinding): UgcBriefV2 {
  const v = finding.proposedText.trim();
  if (!v) return brief;
  const { ref, actual } = resolveReviewTarget(brief, finding.target);
  if (!ref || normalizeForMatch(actual) !== normalizeForMatch(finding.currentText)) {
    console.warn(`[factory2] review fix skipped — "${finding.target}" changed since the review ran.`);
    return brief;
  }

  let updated: UgcBriefV2 = {
    ...brief,
    feedbackLedger: [
      ...brief.feedbackLedger,
      {
        id: genId('fb'),
        timestamp: new Date().toISOString(),
        target: finding.target,
        feedback: `Final-review fix (${finding.severity}) applied on ${finding.target}: ${finding.issue} The line was replaced; never reintroduce this issue.`,
      },
    ],
    version: brief.version + 1,
    updatedAt: new Date().toISOString(),
  };

  if (ref.kind === 'hook') {
    const old = updated.hooks.find((h) => h.id === ref.lineId)?.text ?? '';
    updated.hooks = updated.hooks.map((h) => (h.id === ref.lineId ? { ...h, text: v } : h));
    updated.storyboard = updated.storyboard.map((r) =>
      r.mirrorsLineId === ref.lineId ? { ...r, scriptLine: v } : r,
    );
    updated = patchProse(updated, old, v);
  } else if (ref.kind === 'cta') {
    const old = updated.ctas.find((c) => c.id === ref.lineId)?.text ?? '';
    updated.ctas = updated.ctas.map((c) => (c.id === ref.lineId ? { ...c, text: v } : c));
    updated.storyboard = updated.storyboard.map((r) =>
      r.mirrorsLineId === ref.lineId ? { ...r, scriptLine: v } : r,
    );
    updated = patchProse(updated, old, v);
  } else if (ref.kind === 'row-script') {
    const row = updated.storyboard.find((r) => r.id === ref.rowId);
    const old = row?.scriptLine ?? '';
    updated.storyboard = updated.storyboard.map((r) => (r.id === ref.rowId ? { ...r, scriptLine: v } : r));
    if (row?.mirrorsLineId) {
      updated.hooks = updated.hooks.map((h) => (h.id === row.mirrorsLineId ? { ...h, text: v } : h));
      updated.ctas = updated.ctas.map((c) => (c.id === row.mirrorsLineId ? { ...c, text: v } : c));
    }
    updated = patchProse(updated, old, v);
  } else if (ref.kind === 'row-shot') {
    updated.storyboard = updated.storyboard.map((r) => (r.id === ref.rowId ? { ...r, shotDescription: v } : r));
  } else if (ref.kind === 'row-overlay') {
    updated.storyboard = updated.storyboard.map((r) => (r.id === ref.rowId ? { ...r, overlayText: v } : r));
  }

  // Mark the finding resolved inside the persisted report.
  if (updated.lastReview) {
    updated = {
      ...updated,
      lastReview: {
        ...updated.lastReview,
        findings: updated.lastReview.findings.map((f) =>
          f.id === finding.id ? { ...f, resolution: 'applied' as const } : f,
        ),
      },
    };
  }
  return updated;
}
