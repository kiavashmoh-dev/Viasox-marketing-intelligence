# Viasox Marketing Intelligence ("The Factory")

Browser-only React SPA that turns Viasox's customer data (110K+ reviews, Meta ad comments, sales history) into creative intelligence and finished video-ad briefs. The centerpiece is **The Factory** (`src/autopilot/`, ModuleId still `'autopilot'`): a multi-agent pipeline — Strategy Session → Creative Strategist → Concept Generation → Differentiation Critic → Concept Selection → Script Writer → Batch Reviewer → Memory Curator — with human-in-the-loop approval gates and a self-improving memory/learning layer. Everything runs client-side; the only servers are two small Cloudflare Workers.

**Read next:** `docs/ARCHITECTURE.md` (full subsystem reference) and `docs/HISTORY.md` (development narrative). Design specs live in `docs/superpowers/specs/`. `README.md` is untouched Vite boilerplate — ignore it.

## Commands

Node lives at `~/local/node`, not system-wide — prefix every npm command:

```bash
PATH="/Users/kiavashmohammadi/local/node/bin:$PATH" npm run dev      # Vite dev server
PATH="/Users/kiavashmohammadi/local/node/bin:$PATH" npm run build    # tsc -b && vite build (type errors block build AND deploy)
PATH="/Users/kiavashmohammadi/local/node/bin:$PATH" npm run lint
```

Deploy = push to `main` → GitHub Pages via `.github/workflows/deploy.yml` (repo: `kiavashmoh-dev/Viasox-marketing-intelligence`, Vite base `/Viasox-marketing-intelligence/` — capital V must match the repo name). The two Cloudflare Workers deploy separately and manually: `cd proxy && npx wrangler deploy` (stateless Claude CORS proxy, `viasox-claude-proxy.workers.dev`) and `cd meta-proxy && npx wrangler deploy` (stateful Meta OAuth + token vault + read-only Graph proxy, `viasox-meta-proxy.kiavashmoh.workers.dev`, needs KV + 3 secrets).

## Map

| Directory | Role |
|---|---|
| `src/App.tsx` | The only state machine: `auth → apikey → upload → processing → dashboard → module`. No router, no URLs. |
| `src/components/` | 12 modules in three archetypes: single-shot generators, multi-phase pipelines (Factory, Comment Intelligence), read-only dashboards. `OutputSelector.tsx` is dead code. |
| `src/engine/` | Deterministic, zero-AI regex analysis of review CSVs. `types.ts` is the app-wide type hub (57 importers). |
| `src/prompts/` | ~11k lines: every Claude prompt builder + the embedded brand knowledge (manifesto, awareness doctrine, claim boundary, brief templates). |
| `src/brain/` | Additive context layer: VoC index (reviews + comments) + optional deep-reasoning call → addendum appended to system prompts. Kill switch: `window.__brain.killAll()`. |
| `src/knowledge/brain/` | Marketing Brain: 8 markdown distillations (Schwartz/Hopkins/Bly/Neumeier + masterclasses), inlined via Vite `?raw`, routed per-step by `src/prompts/marketingBrain.ts`. |
| `src/autopilot/` | The Factory pipeline (`pipelineEngine.ts`, ~1,900 lines) + memory/learning loops (localStorage `viasox_creative_memory`). |
| `src/inspiration/` | Inspiration Bank: reference-ad library in IndexedDB, video frame extraction, analyzer agent, two-tier selection (pinned beats matched), closed-loop scoring. |
| `src/comments/` | Meta ad-comment bank (IndexedDB) + puller walking the Graph API through the meta-proxy Worker. |
| `src/data/` | Build-time snapshots: `reviewAnalysis.json` + `salesEnrichment.json` (regenerated offline by `scripts/*.mjs`) + hand-curated `marketIntelligence.ts`. |
| `src/api/` | `claude.ts` (proxy-first, direct-API fallback, 8× 429/529 retries) and `metaProxy.ts`. |
| `src/config/models.ts` | THE only place model IDs live. Three tiers: IDEATION / CREATIVE (both `claude-opus-4-8`) and UTILITY (`claude-sonnet-4-6`). IDEATION has a TODO to flip to `claude-fable-5` when the API key gets access. |

Storage: sessionStorage = API key (`claude_api_key`). localStorage = creative memory, custom options registry, brain flag overrides. IndexedDB = inspiration bank, comment bank, saved comment analyses + VoC index. Review analysis = React state only (boots from embedded JSON — the upload screen is normally skipped).

## Invariants that have already caused bugs — do not relearn these

- **Brand facts are load-bearing and duplicated.** 12-15 mmHg (Ankle = uniform, NOT graduated), EasyStretch stretches 30", B2G3 = 5 pairs/$60, 107,993 reviews. Hardcoded in `systemBase.ts`, angles/script prompts, `briefTemplates.ts`, `conceptSelectorPrompt.ts`, and enforced as an auto-fail gate in `batchReviewerPrompt.ts`. Changing a fact = grep the whole `src/prompts/` directory.
- **Pattern regexes exist in THREE places:** `src/engine/patterns.ts`, `scripts/preprocess-reviews.mjs`, `scripts/preprocess-sales-data.mjs`. The app boots from the embedded JSON, so editing `patterns.ts` alone changes nothing visible — update all three and regenerate the JSONs (needs the out-of-repo `../VSX Intelligence CSV Data Files/` folder).
- **IndexedDB version coupling:** `src/brain/vocIndex.ts` and `src/comments/commentAnalysisStore.ts` open the SAME database (`viasox_comment_analyses`); their `DB_VERSION` constants must be bumped together or the analyses list silently shows empty (VersionError is swallowed). This regression already shipped once (fixed in `a3107b9`).
- **Prompt text ↔ parser coupling.** Strategy session, concept evaluator/selector, differentiation critic, and batch reviewer emit formats parsed by sibling regex/JSON parsers. Editing output-format instructions without the parser silently degrades to fallbacks (default rating 3, framework → 'PAS').
- **Right-anchored table invariant:** in brief tables the spoken line is ALWAYS the rightmost column (`normalizeBodyRow` in `src/utils/downloadUtils.ts` — also load-bearing for on-screen rendering). Brief-template changes must move prompt + preview + download together; routing is 1:1 via `getBriefTemplateId()` (4 templates: agc/ugc/fullai/ecom).
- **Magic strings everywhere:** durations are exactly `'1-15 sec' | '16-59 sec' | '60-90 sec'`; ad types match by exact literal (e.g. `'Full AI (Documentary, story, education, etc)'`); `AD_TYPE_OPTIONS` and `AWARENESS_OPTIONS` in `asanaMapper.ts` must mirror the `AdType`/`AwarenessLevel` unions in `engine/types.ts`. Renaming an enum value breaks selection/export silently.
- **Awareness is a first-class Factory dimension (July 2026):** per-task dropdown in PlannerView; heuristic default in `asanaMapper.mapAwarenessLevel`; funnelStage derives from awareness. The anti-vagueness "10-second self-selection" gate is enforced at FOUR stages (angles Step-0, critic gate A3, selector/evaluator caps, script Step-0) — change the doctrine in all of them together, plus the `CONCRETE OR DEAD` blocks in `awarenessGuide.ts`. Each level also loads its Schwartz state playbook from `src/prompts/schwartzStates.ts` (injected parametrically into angles/script/hooks/strategist prompts; extracted from the fidelity-audited `src/knowledge/brain/01_breakthrough-advertising.md` — update both together if the Schwartz distillation changes).
- **Batch reviewer runs ONE brief per call on purpose** (a single all-briefs call truncated mid-JSON on 8+ briefs → every brief "Not scored"). Don't consolidate it. Same file hardcodes `INTER_CALL_DELAY = 8000` ms rate-limit discipline.
- **Brain addendum is append-only** (`system + brain.addendum`, never interpolated). All per-module flags are currently ON — trust the `BRAIN_DEFAULT_FLAGS` values in `brainConfig.ts`, not stale "off by default" comments (including the stale header docblock at the top of `brainConfig.ts` itself).
- **Adding a module = 3 edits:** `ModuleId` union (`engine/types.ts`), render chain (`App.tsx`), `SECTIONS` registry (`Sidebar.tsx`). Adding a `BrainModule` = 2 edits (`brainTypes.ts` + `brainConfig.ts`).
- **Awareness policy (April 2026):** Unaware is the DEFAULT TOF level; Problem-Aware is "Upper-MOF". Unaware hard bans are duplicated across ~9 prompt files — keep in sync. The 'Gas Prices' angle deliberately suspends the no-price/no-offer rules.
- **Claim boundary is the anti-hallucination system** (`claimBoundary.ts`): diversity is execution-level, never claim-level; the critic's A2 gate auto-rejects unsupported claims. New products/angles may need a `PRODUCT_RIDERS` entry (Ankle Compression has one because its claim space is small).
- **Password gate:** SHA-256 hash in `src/utils/hash.ts`; the plaintext is NOT in the repo and is not "password" — ask the user.

## Conventions

Single `main` branch, no tags, no PRs; every commit pushed directly. Commit messages carry exhaustive multi-paragraph bodies (root cause, file-by-file changes, rollback notes) — **the git log is the project's dev journal; read bodies, not just subjects.** Keep writing commits in that style. Strictly-additive integration is the house pattern (new layers must produce zero diffs in existing prompt output when disabled), runtime kill switches + localStorage flag overrides are preferred over deploys, and failed experiments get fully rolled back, not patched (see `4f76184`).
