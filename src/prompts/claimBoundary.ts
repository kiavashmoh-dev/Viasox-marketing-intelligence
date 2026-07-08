/**
 * CLAIM BOUNDARY — the truth constraint that prevents invented pains and
 * benefits.
 *
 * ROOT CAUSE THIS FIXES (June 2026 audit): during high-volume weeks the
 * Ankle Compression briefs drifted into pain points and benefits that do
 * not exist in any recorded material. Why: the pipeline's diversity quotas
 * (5 concepts, 5 distinct territories, "each concept must target a
 * DIFFERENT problem", unique proof anchors) exceed ACS's small RECORDED
 * claim space (~7 pains, of which 3 are strong). With the novelty mandate
 * ("go beyond the manifesto") and no truth gate anywhere in the pipeline,
 * the model filled the quota by inventing. The Differentiation Critic
 * checked relevance-to-talking-point, not truth-to-product — so invented
 * claims sailed through.
 *
 * THE FIX: (1) define the approved claim space explicitly, (2) redefine
 * diversity as EXECUTION-level (persona/moment/format), never CLAIM-level,
 * (3) enforce with a hard gate at the critic. Injected into: Creative
 * Strategist, Concept Generator, Differentiation Critic, Script Writer.
 */

import type { ProductCategory } from '../engine/types';

// ─── Product-specific riders: where each product's space is tight ────────

const PRODUCT_RIDERS: Partial<Record<ProductCategory, string>> = {
  'Ankle Compression': `**ANKLE COMPRESSION — READ THIS TWICE. This product's recorded claim space is deliberately SMALL, and past batches have invented claims for it.**

The COMPLETE recorded pain/benefit space for Ankle Compression is:
- Localized ankle/foot swelling — 12.0% of reviews (THE primary pain)
- General comfort / softness — 27.6%
- Fashion/style appeal — 8.3% (this is partly a FASHION product)
- Work-related fatigue from standing — 5.5%
- Heat intolerance (vs knee-highs) — 4.0%
- Discreet wear / fits in any shoe — 3.9%
- Seasonal (summer) need — 3.7%
- Gateway positioning: "compression for people who don't think compression socks are for them" (buyers are NEW to compression, not downsizing from knee-highs)
- Underexploited but RECORDED: pregnancy swelling, seniors, travel, healthcare workers

That is the whole space. DO NOT invent beyond it. Specifically, do NOT build concepts on any of the following unless the task's assigned talking point explicitly IS that topic or the injected review data quotes it:
- Sports/athletic performance or recovery
- Sprain/injury recovery or rehabilitation
- "Ankle stability" / brace-like support claims
- Arch support or plantar claims
- Calf or leg benefits (the product ends at the ankle)
- Balance or fall prevention
- Any medical treatment/cure claims

If a concept quota demands more distinct territories than this space contains, REUSE a recorded pain across concepts and differentiate by persona, moment, scene, or format. That is the correct move — an invented pain is never the correct move.`,
};

const GENERIC_RIDER = `This product has a comparatively rich recorded claim space — but the same law applies: if a pain or benefit is not in the recorded materials or the injected review data, it does not exist for ad purposes.`;

/**
 * The claim boundary block. Inject AFTER the product purchase triggers /
 * strategic messaging sections (which define the approved space) wherever
 * concepts, theses, or scripts are produced or judged.
 */
export function getClaimBoundaryBlock(product: string): string {
  const rider = PRODUCT_RIDERS[product as ProductCategory] ?? GENERIC_RIDER;

  return `## ⛔ CLAIM BOUNDARY — THE APPROVED CLAIM SPACE (HARD CONSTRAINT)

**The approved claim space for this brief consists of, and ONLY of:**
1. The task's assigned talking point (user-chosen — always valid).
2. The recorded PURCHASE TRIGGERS and pain points for this product (the ranked lists with frequencies).
3. The product's STRATEGIC MESSAGING and OBJECTION BANK content.
4. Pains, benefits, and language that appear in the injected review data / customer quotes.

**THE LAW: every concept's central pain and central benefit — and every claim a script makes — must be traceable to that space.** If you cannot point to the recorded trigger, the review quote, or the assigned talking point that a claim rests on, the claim does not exist for advertising purposes. Do not use it. (Hopkins: a specific, true claim is accepted at face value; an invented one poisons everything around it.)

**DIVERSITY IS EXECUTION-LEVEL, NEVER CLAIM-LEVEL.** When a diversity requirement (distinct territories, different problems, unique proof anchors) collides with a small recorded claim space, the diversity requirement LOSES — reuse a recorded pain and differentiate through persona, life-moment, scene, format, emotional entry, framing, or awareness path instead. A repeated TRUE claim with a fresh execution always beats a novel INVENTED claim. This rule overrides any per-angle-type instruction like "each concept must target a different problem."

**GROUNDING CITATION:** when stating a concept's or thesis's core claim, name its source from the approved space (e.g. "localized ankle swelling — 12.0% of ACS reviews", "review quote: 'first sock my swollen ankle fits into'"). If you find yourself writing a plausible-sounding statistic or quote you cannot actually see in the provided data, STOP — that is fabrication.

${rider}`;
}
