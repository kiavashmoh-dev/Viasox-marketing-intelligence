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
 * Target is Fable 5 ('claude-fable-5'), but that model is GATED — this API
 * key does NOT have Fable access yet (the API returns 404 "Claude Fable 5
 * is not available; please use Opus 4.8"). So the ideation tier runs on
 * Opus 4.8 for now. ALL of the ideation prompt work (Visual Craft Guide,
 * treatment judgment, AGC visual divergence, critic checks) is unaffected —
 * only the model behind this tier changes. When Fable access is granted,
 * flip this one line back to 'claude-fable-5'.
 */
export const IDEATION_MODEL = 'claude-opus-4-8'; // TODO: 'claude-fable-5' once Fable access is granted

/** High-reasoning execution model. Opus 4.8. */
export const CREATIVE_MODEL = 'claude-opus-4-8';

/** Fast/cheap utility model. Sonnet 4.6 (the dated Sonnet 4 ID was retired). */
export const UTILITY_MODEL = 'claude-sonnet-4-6';
