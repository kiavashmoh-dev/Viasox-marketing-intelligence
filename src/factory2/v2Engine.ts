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
} from './v2Types';
import {
  UGC_FRAMEWORKS,
  V2_HOOK_COUNT,
  CTA_PERFORMANCE_NOTE,
  describeTarget,
} from './v2Types';
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
} from './v2Prompts';

const UGC_AD_TYPE = 'UGC (User Generated Content)';

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
      if (signal?.aborted || !retryableTransient(err) || i === attempts - 1) throw err;
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

let idCounter = 0;
function genId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter}_${Math.random().toString(36).slice(2, 6)}`;
}

// ─── Inspiration helpers ────────────────────────────────────────────────────

/** UGC-relevant bank items: explicitly UGC-tagged, or untagged videos.
 *  Full-AI and other-ad-type videos are excluded — the selector's own hard
 *  boundary (Full-AI references never mix with live-action). */
async function ugcBankItems(): Promise<InspirationItem[]> {
  const items = await getAllItems();
  return items.filter((it) => {
    if (it.status !== 'ready') return false;
    const tags = getEffectiveTags(it);
    if (tags.isFullAi) return false;
    if (tags.adType === UGC_AD_TYPE) return true;
    return it.kind === 'video' && !tags.adType;
  });
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

/** Inspiration context for a task: pinned item (authoritative) or matched. */
async function inspirationContextFor(task: V2Task): Promise<string> {
  try {
    if (task.pinnedInspirationId) {
      const item = await getItem(task.pinnedInspirationId);
      if (item && item.status === 'ready') {
        return `PINNED REFERENCE — the director pinned this specific ad for this task; follow its creative shape closely:
"${item.title || item.filename}"
Summary: ${item.summary || '-'}
Hook breakdown: ${item.hookBreakdown ?? '-'}
Narrative arc: ${item.narrativeArc ?? '-'}
Key language: ${item.keyLanguage ?? '-'}
Learnings: ${(item.learnings ?? []).join(' · ')}`;
      }
    }
    const { block } = await getInspirationContextBlock({
      adType: UGC_AD_TYPE,
      duration: task.duration,
      productCategory: task.product,
      isFullAi: false,
      maxResults: 5,
    });
    return block;
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
): Promise<Pick<V2Brainstorm, 'analysis' | 'questions'>> {
  const bankSummary = await summarizeUgcBank();
  const { system, user } = buildBrainstormPrompt(tasks, bankSummary);
  const brain = await buildBrainAddendum({ module: 'strategySession' }, { apiKey });
  const raw = await sendThinking(system + brain.addendum, user, apiKey, 6000, signal);
  const parsed = parseJson<{ analysis: string; questions: Array<{ id?: string; question: string; options?: string[] }> }>(
    raw,
    'brainstorm',
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
): Promise<string> {
  const { system, user } = buildDirectionSynthesisPrompt(tasks, brainstorm);
  const raw = await sendThinking(system, user, apiKey, 3000, signal);
  const parsed = parseJson<{ direction: string }>(raw, 'direction synthesis');
  if (!parsed.direction) throw new Error('Factory V2: direction synthesis returned empty.');
  return parsed.direction;
}

// ─── Step 2: Concepts ───────────────────────────────────────────────────────

export async function generateConcepts(
  task: V2Task,
  direction: string,
  apiKey: string,
  signal?: AbortSignal,
): Promise<V2Concept[]> {
  const inspiration = await inspirationContextFor(task);
  const { system, user } = buildConceptsPrompt(task, direction, inspiration);
  const raw = await sendThinking(system, user, apiKey, 6000, signal);
  const parsed = parseJson<{ concepts: Array<Omit<V2Concept, 'id'>> }>(raw, 'concept generation');
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
  const { system, user } = buildFrameworkSelectPrompt(task, concept);
  const raw = await sendThinking(system, user, apiKey, 1500, signal);
  const parsed = parseJson<{ framework: string; rationale: string }>(raw, 'framework selection');
  const exact = UGC_FRAMEWORKS.find((f) => f === parsed.framework)
    ?? UGC_FRAMEWORKS.find((f) => f.toLowerCase().includes((parsed.framework || '').toLowerCase().slice(0, 12)));
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
  editorNotes?: string;
}

interface RawBriefJson {
  header: {
    concept: string;
    angle: string;
    videoTonality: string;
    attire: string;
    instructions: string[];
  };
  hooks: string[];
  ctas: string[];
  scriptProse: string;
  storyboard: RawBriefRow[];
}

/** Normalized, logged-not-silent coercion of model row values. */
function toRow(r: RawBriefRow): V2Row | null {
  const clip = Number(r.clipNumber);
  if (!Number.isFinite(clip)) {
    console.warn(`[factory2] dropping storyboard row with non-numeric clipNumber ${JSON.stringify(r.clipNumber)}`);
    return null;
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

// ─── Deterministic QA (no model — cannot hallucinate) ───────────────────────

const BRAND_FACT_CHECKS: Array<{ pattern: RegExp; issue: string }> = [
  { pattern: /graduated[^.]{0,40}ankle|ankle[^.]{0,40}graduated/i, issue: 'Ankle Compression is UNIFORM, never "graduated" — brand-fact violation' },
  { pattern: /\b(1[0-1]|1[6-9]|[2-9]\d)\s*[-–]?\s*\d*\s*mmhg/i, issue: 'mmHg spec other than 12-15 detected — canonical is graduated 12-15 mmHg (Compression) / uniform (Ankle)' },
  { pattern: /30[- ]?day money[- ]?back/i, issue: 'Guarantee wording — Viasox standard risk-reversal should be verified (do not import other brands\' guarantees)' },
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
  const ceiling = DURATION_TARGETS[brief.task.duration]?.hardCeiling;
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
  return flags;
}

export async function writeBrief(
  task: V2Task,
  concept: V2Concept,
  framework: { name: ScriptFramework; rationale: string },
  direction: string,
  apiKey: string,
  signal?: AbortSignal,
): Promise<UgcBriefV2> {
  const inspiration = await inspirationContextFor(task);
  const { system, user } = buildBriefWritePrompt(task, concept, framework, direction, inspiration);
  const brain = await buildBrainAddendum(
    { module: 'briefGenerator', angle: task.talkingPoint },
    { apiKey },
  );
  const raw = await sendThinking(system + brain.addendum, user, apiKey, 12000, signal);
  const parsed = parseJson<RawBriefJson>(raw, 'brief writing');
  const rawRows = parsed.storyboard ?? [];
  const mainRows = rawRows.map(toRow).filter((r): r is V2Row => r !== null);
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
    },
    framework,
    concept,
    hooks,
    ctas,
    scriptProse: parsed.scriptProse ?? '',
    storyboard: appendAlternateTakes(mainRows, hooks, ctas),
    feedbackLedger: [],
    rippleFlags: [],
    version: 1,
    createdAt: now,
    updatedAt: now,
  };
  brief.rippleFlags = validateBrief(brief);
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
  const items = await ugcBankItems();
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
  const parsed = parseJson<{ assignments: Array<{ clipNumber: number; choice: number | string }> }>(
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
    const parsed = parseJson<{ flags: Array<{ target: string; issue: string; suggestion: string }> }>(
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
    return { ...brief, scriptProse: brief.scriptProse.replace(oldText, newText) };
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
  const raw = await sendThinking(system, user, apiKey, isStructural ? 12000 : 2500, signal);

  let updated: UgcBriefV2;
  if (isStructural) {
    const parsed = parseJson<{
      rationale: string;
      hooks: string[];
      ctas: string[];
      scriptProse: string;
      storyboard: RawBriefRow[];
    }>(raw, 'framework restructure');
    const rawRows = parsed.storyboard ?? [];
    const mainRows = rawRows.map(toRow).filter((r): r is V2Row => r !== null);
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
  } else {
    const parsed = parseJson<{ newValue: string }>(raw, `regenerate ${targetLabel}`);
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
