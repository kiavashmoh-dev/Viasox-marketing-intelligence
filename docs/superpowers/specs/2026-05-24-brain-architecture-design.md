# Viasox Marketing Intelligence — Brain Architecture (Approach 1b)

**Status:** Design approved, ready for implementation plan
**Author:** Claude + Kia (brainstorming session 2026-05-24)
**Scope:** Internal architectural improvement — no new user-facing modules or UI
**Risk posture:** Strictly additive, per-module flags defaulted OFF, instant rollback

---

## Executive Summary

The Viasox Marketing Intelligence tool is gaining a "brain" — a single internal context-assembly layer that all existing prompt builders can consult. The brain merges three already-existing knowledge sources (brand manifesto, marketing book wisdom, customer-voice data from reviews + Meta ad comments) into a structured index that every generation task can draw on. The integration is strictly additive: existing prompt builders are unchanged, the brain appends a clearly-labeled section at the END of the system prompt only when its per-module flag is enabled, and the entire system reverts to today's exact behavior the moment any flag is flipped off.

This is the path to making EVERY downstream output (briefs, concepts, scripts, hooks, critiques) smarter as new channels of data come in — without breaking the modules that are currently producing the briefs the team ships.

---

## Context & Motivation

### What exists today

The tool already has a partial "brain" — `src/prompts/systemBase.ts` is a centralized system-prompt foundation containing brand facts, voice guidance, the core audience mandate, persona archetypes, and the four core customer fears. Various reference modules (`manifestoReference.ts`, `agcReference.ts`, `awarenessGuide.ts`, `creativeConstraints.ts`) supply additional context. Each prompt builder (briefTemplates, scriptPrompt, conceptSelectorPrompt, hooksPrompt, etc.) hardcodes which reference modules it imports.

Review data flows in via the `FullAnalysis` object passed at call time. Comment data — newly added via the Meta integration and the saved-analyses library built in this session — does not flow into any prompt builder yet. It lives only in the Comment Intelligence dashboard.

### The gap

1. No formal "channel registry" — adding a new data channel (like ad comments) means hunting through every prompt builder to wire it in.
2. No mechanism for "thorough consultation across all channels per task."
3. The comment-analysis insights (objections, testimonials, recurring questions, persona signals) are a dead-end dashboard — they don't feed back into the brief generators, critics, or strategy agents.

### The user's vision

A "digital brain" that gets fed by multiple channels (reviews, comments, manifesto, books) and consulted in a structured way whenever any creative task runs. New channels can be added over time without rewiring every consumer. The brain doesn't just recite the channels — it INTERROGATES them for gaps, especially on complex tasks (batch generation, AI Doc briefs, strategy sessions).

### What this design is — and isn't

**This design IS:** an internal improvement to the prompt-assembly layer, exposing a single new API that prompt builders can opt into via per-module flags. Pre-computes a structured Voice-of-Audience index from existing analyses for free retrieval. Adds an optional Claude reasoning pass for complex tasks.

**This design ISN'T:** a new user-facing module, panel, sidebar item, settings page, or workflow. It isn't a rewrite of the existing prompt builders. It isn't a replacement for the Creative Strategist, Differentiation Critic, or any other agent — those agents stay, they just consume richer context.

---

## Goals

1. **Make every existing module's output smarter** by giving it structured access to merged customer voice (reviews + comments) without changing how the module is invoked.
2. **Eliminate the "dead-end dashboard" problem** for comment analyses — make their insights feed into brief/concept/script/hook generation.
3. **Provide a single integration point** so adding a new data channel later (e.g., ad performance data) requires changing one file, not every prompt builder.
4. **Preserve current output quality absolutely** — current behavior is the floor, brain-enabled behavior must be the ceiling. Per-module flags default OFF.
5. **Make complex tasks measurably better** through an optional deep-reasoning pass that explicitly identifies gaps to close.

## Non-Goals

1. **Not building any new UI.** No brain panel, no toggle in the dashboard, no settings module.
2. **Not refactoring existing prompt builders.** They stay byte-for-byte unchanged. Integration is at module call sites only.
3. **Not building automated quality scoring.** Validation is qualitative, manual, side-by-side comparison.
4. **Not building production-grade observability.** Telemetry is console logging only.
5. **Not implementing deep-reasoning output caching.** Cost is low enough that v1 doesn't need it.
6. **Not building a formal A/B testing framework.** Promotion decisions are made via the compare tool and the user's judgment.

---

## Architecture Overview

### Directory layout

```
src/
├── brain/                          ← NEW
│   ├── contextAssembler.ts         ← NEW — single entry point: buildBrainAddendum(task)
│   ├── vocIndex.ts                 ← NEW — VoC index computation + persistence
│   ├── brainConfig.ts              ← NEW — per-module flags, kill switches
│   ├── brainTypes.ts               ← NEW — shared types (BrainTaskDescriptor, BrainContext, etc.)
│   ├── brainDevTools.ts            ← NEW — window.__brain.* helpers (preview, compare, snapshot, etc.)
│   └── __snapshots__/              ← NEW — golden files for verify-against-snapshot
│
├── prompts/                        ← UNCHANGED
│   ├── systemBase.ts               ← UNCHANGED
│   ├── briefTemplates.ts           ← UNCHANGED
│   ├── conceptSelectorPrompt.ts    ← UNCHANGED
│   ├── scriptPrompt.ts             ← UNCHANGED
│   ├── hooksPrompt.ts              ← UNCHANGED
│   ├── creativeStrategistPrompt.ts ← UNCHANGED
│   ├── differentiationCriticPrompt.ts ← UNCHANGED
│   ├── conceptEvaluatorPrompt.ts   ← UNCHANGED
│   ├── personaPrompt.ts            ← UNCHANGED
│   ├── strategySessionPrompt.ts    ← UNCHANGED
│   ├── manifestoReference.ts       ← UNCHANGED
│   └── (... all other prompt files) ← UNCHANGED
│
└── comments/
    └── commentAnalysisStore.ts     ← UNCHANGED (brain reads from it via existing API)
```

### Integration pattern

Existing prompt builders are not modified. Integration happens at module call sites. Example (illustrative, not normative):

```typescript
// Before:
const system = buildBriefPrompt(analysis, params);
const text = await sendMessage(system, user, apiKey);

// After (brain-enabled module):
const baseSystem = buildBriefPrompt(analysis, params);  // unchanged
const brain = await buildBrainAddendum({                 // new — 3 lines
  module: 'briefGenerator',
  template: 'agc',
  product: params.product,
  persona: params.persona,
  isBatch: params.briefCount > 1,
  batchCount: params.briefCount,
}, apiKey);
const system = baseSystem + brain.addendum;
const text = await sendMessage(system, user, apiKey);
```

When the brain's per-module flag is OFF (the default), `brain.addendum === ''` and `system === baseSystem`. The Claude call is byte-for-byte identical to today's call.

### Flow when brain is enabled

```
User triggers a generation
       ↓
Prompt builder runs (unchanged) → produces base system prompt
       ↓
Module calls buildBrainAddendum(task)
       ↓
   ┌───────────────────────────────────────────┐
   │  contextAssembler.ts                       │
   │  1. Check per-module flag → off? return ''│
   │  2. ensureFreshVoCIndex() (cached, ~free) │
   │  3. Select relevant slices for THIS task  │
   │  4. If complex task → run deep reasoning  │
   │  5. Render slices + deep reasoning as     │
   │     markdown addendum                     │
   │  6. Return { addendum, metadata }         │
   └───────────────────────────────────────────┘
       ↓
Module appends addendum to base system prompt
       ↓
Claude API call (same shape as today, longer system prompt)
```

---

## The Voice-of-Audience (VoC) Index

### Purpose

A structured, pre-computed representation of customer voice merged from reviews and saved comment analyses. The index is built once when underlying data changes, cached in IndexedDB, and retrieved on demand at near-zero cost.

### Shape

```typescript
interface VoCIndex {
  builtAt: number;
  sources: {
    reviewCount: number;
    commentAnalysisIds: string[];
    commentCount: number;
  };
  topObjections: VoCItem[];
  topTestimonials: VoCItem[];
  recurringQuestions: VoCItem[];
  painPoints: VoCItem[];
  desires: VoCItem[];
  complaints: VoCItem[];
  personaSignals: {
    beth: VoCItem[];
    linda: VoCItem[];
    other: VoCItem[];
  };
  emergingThemes: VoCItem[];
  productSignals: {
    compression: VoCItem[];
    easystretch: VoCItem[];
    ankle: VoCItem[];
  };
}

interface VoCItem {
  theme: string;                     // 2-5 word handle
  frequency: number;                 // how often it appears across sources
  source: 'reviews' | 'comments' | 'both';
  sampleQuotes: string[];            // 3-5 verbatim quotes, ranked by clarity
  sentiment?: 'Positive' | 'Neutral' | 'Negative';
  category?: string;                 // original category tag if applicable
}
```

### Dedupe-across-sources

If a theme (e.g., "price concern") appears in 312 reviews AND 89 comments, it appears as ONE `VoCItem` with `frequency: 401`, `source: 'both'`, and quotes drawn from both pools. The brain treats reviews and comments as the same voice.

### Build trigger (lazy, never preemptive)

- Invalidated when: `saveAnalysis` or `deleteAnalysis` is called on `commentAnalysisStore`; when a new review `FullAnalysis` is loaded.
- Rebuilt when: a brain-enabled module calls `ensureFreshVoCIndex()` and finds the cached version stale or missing.
- If no brain-enabled modules ever run, the index is never built. Zero overhead in default state.

### Build implementation

Pure function: `buildVoCIndex(reviews: FullAnalysis | null, savedAnalyses: SavedAnalysis[]) → VoCIndex`. No Claude calls — pure aggregation of already-categorized data. Browser-side, expected ≤1s for tens of thousands of items.

### Storage

New IndexedDB object store `voc_index` inside the existing `viasox_comment_analyses` database. Single record (one current index at a time). Fields: `builtAt`, `sources`, full index payload.

### Public API (consumed by the assembler)

- `ensureFreshVoCIndex(): Promise<VoCIndex>` — returns cached if fresh, rebuilds if stale
- `invalidateVoCIndex(): Promise<void>` — called from `saveAnalysis` / `deleteAnalysis` (existing functions get a one-line addition to call this)
- `getCachedVoCIndex(): Promise<VoCIndex | null>` — read without rebuild (debug)
- `buildVoCIndex(reviews, savedAnalyses): VoCIndex` — pure function, used by `ensureFreshVoCIndex` internally and exposed for tests

---

## Context Assembler API

### Single entry point

```typescript
async function buildBrainAddendum(
  task: BrainTaskDescriptor,
  apiKey?: string,                   // only used if deep reasoning fires
): Promise<BrainContext>
```

Always async — even cheap retrievals return a Promise to keep the API uniform for callers.

### Task descriptor

```typescript
interface BrainTaskDescriptor {
  module: 'briefGenerator' | 'conceptSelector' | 'scriptWriter'
        | 'hookGenerator' | 'creativeStrategist' | 'differentiationCritic'
        | 'conceptEvaluator' | 'personaPrompt' | 'strategySession';
  template?: 'agc' | 'ecom' | 'aidoc' | 'ugc' | 'editing';
  product?: 'compression' | 'easystretch' | 'ankle';
  persona?: 'beth' | 'linda' | 'other';
  angle?: string;
  format?: '15s' | '30s' | '60s' | 'longform';
  isBatch?: boolean;
  batchCount?: number;
  forceDeepReasoning?: boolean;
}
```

### Return shape

```typescript
interface BrainContext {
  /** Text to APPEND verbatim to the existing system prompt. Empty string
   *  when brain is disabled for this module — making integration a strict no-op. */
  addendum: string;
  metadata: {
    enabled: boolean;
    vocIndexBuiltAt: number | null;
    slicesUsed: string[];
    deepReasoningRan: boolean;
    deepReasoningTokens?: number;
    channelsConsulted: string[];
    warnings: string[];
    latencyMs: number;
  };
}
```

### Internal flow

1. **Flag check** — `isBrainEnabledFor(task.module)` → if false, return `{ addendum: '', metadata: { enabled: false, ... } }` immediately. Zero side effects.
2. **Index freshness** — `await ensureFreshVoCIndex()`. Cache hit ≈ instant.
3. **Slice selection** — pure-TS function mapping `task` → which slices of the index are relevant. Persona-specific signals only if `task.persona` set; product-specific only if `task.product` set; etc.
4. **Deep reasoning decision** — `shouldRunDeepReasoning(task)` returns true if any of:
   - `task.isBatch && task.batchCount >= 3`
   - `task.template === 'aidoc'`
   - `task.module === 'strategySession'`
   - `task.module === 'creativeStrategist'`
   - `task.forceDeepReasoning === true`
5. **Build the addendum string** — render selected slices as the VoC block; if deep reasoning fired, append its output as a second labeled block.

### Addendum format (appended verbatim to system prompt)

```
[ ... existing system prompt, untouched ... ]

---

## VOICE OF AUDIENCE — RECENT DATA (last analysis: <date>)
Drawn from {N} reviews + {M} comments across {K} analyses.

### Top Unaddressed Objections
1. **<theme>** — <freq> mentions
   • "<quote>"
   • "<quote>"
... (additional slices, each labeled)

---

## DEEP REASONING — GAP ANALYSIS FOR THIS TASK   [only when deep reasoning ran]
[ Claude-generated, task-specific, 600-1200 words ]
```

Both blocks always at the END of the system prompt. Nothing existing is touched.

---

## Rollout Order

Four stages, ordered by stakes. The active brief-generation pipeline that ships briefs is in **Stage 4 — last**.

### Stage 1 — Critics (lowest stakes, first target)
- `differentiationCritic`
- `conceptEvaluator`

These modules CONSUME concepts and JUDGE them. They don't produce shippable copy. Quality dip is low-stakes (a re-run resolves it).

### Stage 2 — Selectors & small producers
- `hookGenerator`
- `conceptSelector`

Small, eyeball-comparable outputs. Easy to spot regressions.

### Stage 3 — Strategic agents
- `creativeStrategist`
- `personaPrompt`
- `strategySession`

Influences downstream output but doesn't BE the final output.

### Stage 4 — The actual producers (last)
- `scriptWriter`
- `briefGenerator` — promoted per-template in order: `editing` → `ugc` → `ecom` → `aidoc` → `agc` (AGC last, as it's the highest-volume shipped template)

### Per-module enablement mechanism

Internal config file `src/brain/brainConfig.ts`:

```typescript
export const BRAIN_DEFAULT_FLAGS = {
  differentiationCritic: false,
  conceptEvaluator: false,
  hookGenerator: false,
  conceptSelector: false,
  creativeStrategist: false,
  personaPrompt: false,
  strategySession: false,
  scriptWriter: false,
  briefGenerator: false,
};
export const BRAIN_KILL_SWITCH = false;
export const BRAIN_DEEP_REASONING_KILL = false;
```

All default OFF. A fresh build behaves identically to today.

### Two enablement paths

1. **Code-level (permanent):** edit the default, commit, deploy. This is how a stage gets promoted once approved.
2. **Browser-level (ephemeral, for testing):** dev console helpers persisted to localStorage:
   ```javascript
   window.__brain.enable('differentiationCritic')
   window.__brain.disable('differentiationCritic')
   window.__brain.list()
   ```
   `isBrainEnabledFor()` checks localStorage first, then falls back to code default. Allows test-on-prod without redeploy.

### Stage promotion criteria

For each module:
1. Use `window.__brain.preview(task)` to read what the addendum would be — confirm it reads sensibly
2. Pick 3 representative real recent tasks
3. Run `window.__brain.compare(task)` — runs brain-OFF and brain-ON, surfaces both outputs
4. Verdict per task: `better`, `same`, or `worse`
5. Promotion gate: ≥2 of 3 `better` or `same` AND zero `worse` → promote. Any `worse` → don't promote, investigate.

User explicitly approves every promotion. No unilateral flag flips.

### Rollback

- **Per-browser (ephemeral, instant):** `window.__brain.disable('module')` in console
- **Per-deploy (permanent, one-line PR):** flip default in `brainConfig.ts` back to `false`
- **Global kill (emergency):** flip `BRAIN_KILL_SWITCH` to `true` — every brain call returns empty addendum, entire tool reverts to current behavior
- **Deep-reasoning-only kill:** flip `BRAIN_DEEP_REASONING_KILL` to `true` — VoC slices still work, deep reasoning never fires anywhere

---

## Deep-Reasoning Trigger

The optional second Claude call. Fires sparingly based on rules in `shouldRunDeepReasoning(task)`.

### Trigger rules (explicit)

`shouldRunDeepReasoning(task)` returns `true` if ANY of these is satisfied:

- `task.isBatch && task.batchCount >= 3` — batch run of three or more outputs
- `task.template === 'aidoc'` — AI Doc briefs (long-form, structurally complex)
- `task.module === 'strategySession'` — multi-step strategic planning
- `task.module === 'creativeStrategist'` — strategic agent
- `task.forceDeepReasoning === true` — manual override / debug escape hatch

Otherwise returns `false`. Single-output briefs, hook variations, single-concept critiques get the VoC slices ONLY — no deep-reasoning call.

The global kill switch `BRAIN_DEEP_REASONING_KILL` short-circuits this entire function to always return `false` regardless of task properties.

### Cost & latency

- Per fire: ~3-5K input tokens + ~1-2K output tokens at Sonnet = roughly $0.04-0.05
- Per fire is per-batch, not per-output: a batch of 10 briefs = 1 deep-reasoning call, not 10
- Latency: ~10-25s added once per batch (imperceptible relative to total batch time)
- Estimated monthly cost: well under $1 at expected usage

### Prompt structure

System prompt:
```
You are a strategic analyst for the Viasox marketing intelligence brain.

You will be given:
1. A task descriptor — what's about to be generated
2. Selected slices of the current Voice-of-Audience index

Your job: identify what's most strategically important for THIS specific
task. Be ruthlessly specific. Reference actual quote text. Don't speak in
generalities. Don't repeat what's already in the task descriptor.

Output a concise markdown analysis (≤1200 words) with sections:
- KEY GAPS
- MUST-USE EVIDENCE
- PERSONA-VOICE REMINDERS
- RECOMMENDED EMPHASIS

If the data is sparse or doesn't add anything to the task, say so plainly
in one sentence. Do not pad.
```

User message: serialized task descriptor + selected VoC slices (the same slices already going into the addendum — we don't run a second selection).

### Failure handling — graceful degradation

If the deep-reasoning call fails (timeout, 429, 5xx, network):
1. Catch and log to console with task context
2. Return the addendum WITHOUT the deep-reasoning block (basic VoC slices still included)
3. Metadata flags `deepReasoningRan: false` and adds a warning
4. The user's main generation proceeds normally

The deep-reasoning failure NEVER aborts the user's actual task.

### No caching in v1

Per-call cost is too low to justify cache complexity. Adding caching later is a localized 30-line addition.

---

## Safety Mechanisms

### 1. Prompt-builder no-touch rule

Brain integration happens at MODULE CALL SITES, never inside prompt builder files. Existing files in `src/prompts/` have zero diffs across this entire project. If a code review shows a diff inside `src/prompts/*`, the PR doesn't merge. This is the strongest single guarantee that current behavior is preserved.

### 2. Prompt snapshot baseline

Before any brain code lands:
```javascript
window.__brain.snapshotCurrent()
// → generates JSON file of current output of buildBriefPrompt(),
//   buildScriptPrompt(), buildHooksPrompt(), etc., for ~10 canonical
//   task inputs. Downloads as prompt-snapshot-<date>.json
```

The downloaded snapshot is committed to `src/brain/__snapshots__/baseline-<date>.json`.

### 3. Verify-against-snapshot

```javascript
window.__brain.verifyAgainstSnapshot('baseline-2026-05-24.json')
// → re-runs prompt builders with brain OFF for the canonical inputs
//   diffs against snapshot, reports any drift
```

Catches accidental modifications to prompt builders or systemBase. Run before every PR.

### 4. Side-by-side compare tool

```javascript
await window.__brain.compare({
  module: 'differentiationCritic',
  product: 'compression',
  persona: 'beth',
})
// → runs the actual task twice (brain off + brain on)
//   logs both outputs + the addendum that was injected
//   optionally downloads side-by-side HTML
```

The primary tool for promotion evaluation.

### 5. Telemetry — always visible

Every brain call logs to console:
```
[brain] briefGenerator (agc) — addendum 2.4K tokens, slices used:
  topObjections, topTestimonials, personaSignals.beth
  Deep reasoning: skipped (single brief)
  Latency: 12ms (cache hit on VoC index)
```

For Stage 4, brain metadata is additionally attached to the saved brief object for retroactive audit.

### 6. Pre-promotion checklist (per-module)

Before flipping a default flag from `false` to `true`:
- [ ] `verifyAgainstSnapshot()` reports zero drift
- [ ] `preview()` of the addendum reads sensibly
- [ ] `compare()` on ≥3 real tasks shows brain-ON ≥ brain-OFF
- [ ] Cost/latency telemetry within bounds (no surprise 30s waits)
- [ ] User explicitly approves the promotion

### Rollback drill

Before any production deployment of brain code, the rollback path is exercised:
1. Deploy with one module's default flag ON
2. Confirm brain runs (telemetry log, behavior change)
3. Run `window.__brain.disable('module')` in console
4. Confirm next generation behaves identically to brain-OFF (snapshot comparison)
5. Run `window.__brain.enable('module')` to restore
6. Confirm brain-ON behavior returns

Rollback is tested in production conditions before we depend on it.

---

## Validation Strategy

### What "helping" means (per module type)

| Module type | "Helping" indicator |
|---|---|
| Critics | Critiques cite specific customer-voice evidence; sharper, harder to dismiss |
| Hook generators | Hooks use verbatim language from comments/reviews; greater variety |
| Concept selectors | Selections explicitly cite which audience gaps they close |
| Strategic agents | Strategy references specific personas/objections/themes, not generic DTC moves |
| Brief generators | Briefs incorporate specific testimonial quotes, preempt specific objections |

### Validation rhythm

**Round 1 — pre-promotion (per module):** 3 representative tasks via `compare()`. Decision matrix:

| Verdicts (3 tasks) | Decision |
|---|---|
| 3 × better | Promote, high confidence |
| 2 × better, 1 × same | Promote |
| 1 × better, 2 × same | Promote, monitor closely |
| 3 × same | Don't promote — brain not adding value |
| Any worse | Don't promote — investigate |

**Round 2 — real-world (per stage):** week of real use, periodic `compare()` sanity checks. Promote next stage only after current feels solid.

### Red flags — revert immediately

- Outputs longer but not more specific
- Forced/shoehorned VoC quotes
- Same recommendations regardless of input
- Formulaic structure ("here's an objection, here's a testimonial…")
- Voice drift toward analytical/clinical (deep-reasoning bleed)

### Out of scope for v1

- Automated quality scoring
- Formal validation log file
- Statistical significance testing
- User surveys

Your eyeball + the compare tool + the snapshot baseline is the v1 validation system. If usage scales beyond one operator, formal validation infrastructure becomes worth building.

---

## File Manifest

### New files (10)

| File | Purpose |
|---|---|
| `src/brain/contextAssembler.ts` | `buildBrainAddendum()` entry point + orchestration |
| `src/brain/vocIndex.ts` | VoC index types, build function, IndexedDB persistence |
| `src/brain/brainConfig.ts` | Default flags + kill switches |
| `src/brain/brainTypes.ts` | Shared types (`BrainTaskDescriptor`, `BrainContext`, `VoCIndex`, `VoCItem`) |
| `src/brain/brainDevTools.ts` | `window.__brain.*` helpers (preview, compare, snapshot, verify, enable, disable, list) |
| `src/brain/sliceSelector.ts` | Pure-TS slice selection logic mapping task → which VoC slices to include |
| `src/brain/addendumRenderer.ts` | Pure-TS markdown rendering of slices + deep reasoning into the appendable string |
| `src/brain/deepReasoning.ts` | Deep reasoning Claude call orchestration + prompt construction |
| `src/brain/__snapshots__/.gitkeep` | Directory for committed prompt snapshots |
| `src/brain/__snapshots__/baseline-<date>.json` | Initial snapshot of current prompt outputs (committed before any other brain code lands) |

### Modified files (existing, minimal additions only)

| File | Change |
|---|---|
| `src/comments/commentAnalysisStore.ts` | `saveAnalysis()` and `deleteAnalysis()` add a single line calling `invalidateVoCIndex()` |
| `src/main.tsx` (or equivalent entry) | Initialize `window.__brain` dev tools in dev mode |
| Per-module call sites (in `src/components/modules/*` etc.) | Added per stage, per the rollout order. Each integration is ~3-5 lines: `const brain = await buildBrainAddendum(...); system = baseSystem + brain.addendum;` |

### Files explicitly NOT modified

All files in `src/prompts/`. Code review enforces this.

---

## Open Questions

None at design approval time. All design decisions captured above.

If implementation surfaces a question that changes any design decision, it goes back through brainstorming before being resolved.

---

## Appendix A — Example consumer integration

`src/components/modules/CommentIntelligence.tsx` (illustrative; actual integration depends on which modules are promoted):

```typescript
// Before any brain integration (current code):
const insightsPrompt = buildCommentInsightsPrompt(commentSummary, samples);
const insightsResult = await insightsApi.generate(
  insightsPrompt.system,
  insightsPrompt.user,
  14000,
);

// After (if 'commentInsights' were a brain-enabled module — illustrative):
const baseInsights = buildCommentInsightsPrompt(commentSummary, samples);
const brain = await buildBrainAddendum({
  module: 'commentInsights', // hypothetical
  product: undefined,         // not product-specific for this task
}, apiKey);
const finalSystem = baseInsights.system + brain.addendum;
const insightsResult = await insightsApi.generate(
  finalSystem,
  baseInsights.user,
  14000,
);
```

When brain is disabled (default), `brain.addendum === ''` and `finalSystem === baseInsights.system`.

## Appendix B — Example addendum (rendered)

```
---

## VOICE OF AUDIENCE — RECENT DATA (last analysis: May 23, 2026)
Drawn from 107,993 reviews + 4,210 comments across 9 analyses.

### Top Unaddressed Objections
1. **Price concern** — 401 mentions
   • "These are way too expensive for socks"
   • "Found cheaper ones at the pharmacy"
2. **Compression skepticism** — 287 mentions
   • "Tried compression socks before, didn't work"
   • "Will these actually help my swelling?"

### Strongest Testimonials Available For Repurposing
1. **30-inch stretch / non-binding praise** — 215 mentions, strongly positive
   • "Finally socks that don't cut off my circulation"
   • "I cried the first time I put them on"

### Persona Voice — Beth (Quiet Fighter)
   • "I don't want to bother my daughter for help getting dressed"
   • "Just want to put on my own socks like I used to"

---

## DEEP REASONING — GAP ANALYSIS FOR THIS TASK
Given your task parameters (product: compression, persona: beth, batch of 5):

### KEY GAPS
- Beth-voice quotes are heavily skewed toward independence anxiety; only 2 of
  the 5 briefs should lead with that or risk repetitiveness.
- The 30-inch stretch testimonial is unused in the last 12 briefs — strong
  candidate for a fresh hook.

### MUST-USE EVIDENCE
- "I cried the first time I put them on" is the strongest emotional moment in
  the testimonial pool. At least one of the five briefs should be built
  around it.

### PERSONA-VOICE REMINDERS
- Beth doesn't complain, doesn't ask for help. Language should be quiet,
  understated, dignified. Avoid sentences ending in exclamation points.

### RECOMMENDED EMPHASIS
- 3/5 briefs: lead with comfort or no-marks (per the Message Hierarchy)
- 1/5: lead with the 30-inch stretch unused testimonial
- 1/5: address the price-skepticism objection head-on with a value-anchor hook
```

---

## Implementation handoff

Next step: invoke the writing-plans skill to produce a step-by-step implementation plan based on this spec.
