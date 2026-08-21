/**
 * Centralized model configuration.
 *
 * One place to change which Claude model each tier of work uses, instead of
 * hunting through a dozen files. Three tiers:
 *
 *   IDEATION_MODEL — the frontier model for the steps that INVENT: the
 *     Creative Strategist (per-brief thesis + inspiration curation + visual
 *     treatment decisions), the Concept Generator, the Differentiation
 *     Critic, and the standalone Hook Generator / Concepts & Angles modules.
 *     These are the lateral-creative-leap steps where a smarter model
 *     directly converts into more original hooks, concepts, and visual
 *     ideas. Currently Fable 5.
 *
 *   CREATIVE_MODEL — the high-reasoning EXECUTION model: the Script Writer
 *     (faithful execution of the chosen concept into strict templates),
 *     Concept Evaluator, Concept Selector, Strategy Session, Memory
 *     Curator, Persona Builder/Chat, and the Inspiration Bank analyzer.
 *     Proven on format-following; kept stable on Opus 4.8.
 *
 *   UTILITY_MODEL — the fast/cheap model for steps that don't need deep
 *     reasoning: Asana screenshot parsing, the angle-directive proposer,
 *     the brain's deep-reasoning pass, batch chat, inspiration naming.
 *
 * Rollback for any tier is one line here. If the API/proxy rejects an ID
 * you'll see an immediate "400 invalid model" — fix the string below.
 */

/**
 * Frontier ideation model — the steps that INVENT (Creative Strategist,
 * Concept Generator, Differentiation Critic, standalone Concepts/Hooks).
 *
 * FABLE-FIRST POLICY (director ruling, Aug 2026): every thinking/writing
 * seat targets Fable 5 as the PRIMARY model. The fallback lives UNIVERSALLY
 * at the API layer (src/api/claude.ts): a genuine model-access failure
 * trips a sticky session gate to FABLE_FALLBACK_MODEL (surfaced in the
 * Factory UI — never silent), and exhausted transient retries get a one-off
 * NON-sticky rescue. Pinning Fable here is therefore safe even if the key's
 * access lapses — nothing fails, and the fallback is always visible.
 * (The old note recording a 404 gate on this key predates Fable 5 GA; the
 * gate now re-verifies itself live on every fresh session.)
 */
export const IDEATION_MODEL = 'claude-fable-5';

/** High-reasoning execution model — the Script Writer and its judges.
 *  Fable-first per the same ruling; same universal fallback. */
export const CREATIVE_MODEL = 'claude-fable-5';

/** Fast/cheap utility model. Sonnet 4.6 (the dated Sonnet 4 ID was retired). */
export const UTILITY_MODEL = 'claude-sonnet-4-6';

/** The single fallback authority for gated/rescued Fable calls (API layer). */
export const FABLE_FALLBACK_MODEL = 'claude-opus-5';

// ─── Factory V2 tiers ───────────────────────────────────────────────────────
//
// V2's thinking seats (brainstorm, framework selection, concept generation,
// brief writing, line regeneration, final review) TARGET Fable 5. The
// universal API-layer gate handles unavailability; V2's own sendThinking
// fallback remains as defense-in-depth.

/** V2 thinking/writing model — the primary for every V2 creative seat. */
export const V2_THINKING_MODEL = 'claude-fable-5';

/** V2 heavy tier — the Fable fallback + vision + ripple. Opus 5. */
export const V2_HEAVY_MODEL = 'claude-opus-5';
