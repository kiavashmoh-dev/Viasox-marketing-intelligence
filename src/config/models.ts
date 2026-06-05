/**
 * Centralized model configuration.
 *
 * One place to change which Claude model each tier of work uses, instead of
 * hunting through a dozen files. Two tiers:
 *
 *   CREATIVE_MODEL — the high-reasoning model for every step where reasoning
 *     quality becomes OUTPUT quality: the Factory's Creative Strategist,
 *     Concept Generator, Differentiation Critic, Concept Evaluator, Concept
 *     Selector, Script Writer, Strategy Session, Memory Curator — plus the
 *     standalone creative modules (Concepts & Angles, Hooks, Script Writer,
 *     Personas) and the Inspiration Bank analyzer (better analysis = better
 *     references feeding the Factory).
 *
 *   UTILITY_MODEL — the fast/cheap model for steps that don't need deep
 *     reasoning: Asana screenshot parsing, the angle-directive proposer, and
 *     the brain's deep-reasoning pass. Opus on these would be wasted cost +
 *     latency.
 *
 * To change the creative model everywhere, edit CREATIVE_MODEL below.
 * To roll back, set it to 'claude-opus-4-6'. If the API/proxy rejects an
 * ID you'll see an immediate "400 invalid model" — the fix is one line here.
 */

/** High-reasoning creative model. Bumped to Opus 4.8. */
export const CREATIVE_MODEL = 'claude-opus-4-8';

/** Fast/cheap utility model. Sonnet — unchanged. */
export const UTILITY_MODEL = 'claude-sonnet-4-20250514';
