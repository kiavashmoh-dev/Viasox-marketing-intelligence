/**
 * Product Truth — the concrete product-language system.
 *
 * Born from the July 2026 backlog audit (44 scripts): ~80% of every script
 * was the emotional problem while the product got a few seconds of
 * placeholder language repeated word-for-word ("there's a type of sock built
 * for exactly this"), the entire product vocabulary across 44 scripts was
 * ~4 phrases, and the fix was always a timid existence claim rather than a
 * confident proposition. This module is the counterweight:
 *
 * 1. A PRODUCT LANGUAGE BANK per line — the concrete, sellable attributes
 *    scripts must draw from (all consistent with the brand facts in
 *    systemBase.ts — if a fact changes there, change it here too).
 * 2. A banned-placeholder list — the exact phrases that let a script gesture
 *    at the product without describing it.
 * 3. The SWAP TEST — the audit's sharpest instrument, stated as a rule.
 *
 * Injected into the script writer, concept generator, differentiation
 * critic, and batch reviewer. Awareness interplay: WHERE product language
 * may appear is governed by the awareness level (Unaware: Beats 3-5 only);
 * this module governs HOW CONCRETE it must be once it appears. The two
 * never conflict — an Unaware script still ends with a product beat, and
 * that beat must be concrete.
 */

import type { ProductCategory } from '../engine/types';

const BANKS: Record<ProductCategory, string> = {
  'EasyStretch': `**EasyStretch — concrete attributes to sell (draw at least 2 per script):**
- NO elastic band at the top — nothing digs in, nothing leaves a ring
- Stretches to 30 inches wide, then returns to shape — fits the leg instead of fighting it
- Non-binding fit for swollen, sensitive, or fluctuating legs (the wide-calf fit range is a genuine differentiator almost no competitor covers)
- Bamboo-soft feel — what it's like to WEAR them, not just what they do
- Seamless toe — nothing rubs against sensitive or neuropathic feet
- Patterns and colors that look like socks she'd choose anyway — nothing medical about the look`,
  'Compression': `**Compression Socks — concrete attributes to sell (draw at least 2 per script):**
- Graduated 12-15 mmHg — gentle enough to wear all day, real enough to feel the difference by evening
- Compression that doesn't look medical — patterns and colors people compliment
- The end-of-day difference: legs that feel supported through a 12-hour shift, a flight, a full day standing
- Easier to put on than pharmacy compression — support without the wrestling match
- Seamless toe comfort`,
  'Ankle Compression': `**Ankle Compression — concrete attributes to sell (draw at least 2 per script):**
- Uniform, gentle compression that sits at the ankle and arch (NOT graduated — never claim graduated). Describing WHERE it sits is a recorded spec; do NOT turn it into stability / arch-support / injury-recovery BENEFIT claims — those are outside the recorded claim space (see the CLAIM BOUNDARY's product rider).
- Ankle-height: invisible under scrubs, with sneakers, in regular shoes — support nobody sees
- Gentle pressure exactly where the ache lives — the ankle, not the whole leg
- Seamless toe, soft feel — comfortable enough to forget you're wearing them`,
  'Other': `**Product attributes:** use only recorded attributes from the product data provided — never invent specifications.`,
};

/**
 * Placeholder phrases the backlog audit found doing the product's job in
 * script after script. Banned VERBATIM — the idea of a category reveal is
 * fine; these exact empty formulations are not.
 */
export const BANNED_PLACEHOLDERS = [
  'a type of sock built for exactly this',
  'a kind of sock built for exactly this',
  'a completely different kind of sock',
  'a different kind of sock',
  'a sock most people don’t know exists',
  'socks built differently exist',
  'a special sock',
  'a certain kind of sock',
];

/** Recurring canned tics found across many briefs — banned verbatim. The
 *  sentiment is allowed; the copy-pasted phrasing is not. */
export const BANNED_TICS = [
  'and seriously look how cute',
  'got these from @viasox btw',
];

export function getProductTruthBlock(product: string): string {
  const bank = BANKS[product as ProductCategory] ?? BANKS['Other'];
  return `## PRODUCT CONVICTION — CONCRETE OR IT DOESN'T COUNT

${bank}

**WHERE vs HOW:** WHERE product language may appear is governed by the awareness level (for Unaware, everything in this section lives in Beats 3-5 — the opening's elimination rules are untouched). THIS section governs HOW CONCRETE the product language must be once it appears. The two never conflict.

**THE SWAP TEST (hard rule):** if the script's product/solution beats could be
swapped onto a generic competitor's sock without changing a word, the script
FAILS. The product moments must contain attributes only Viasox can claim this
way — named plainly, shown where possible, never gestured at.

**BANNED PLACEHOLDER LANGUAGE (verbatim):** ${BANNED_PLACEHOLDERS.map((p) => `"${p}"`).join(' / ')}.
These phrases describe nothing. When the category or product is revealed, reveal
it with CONVICTION and at least 2 concrete attributes from the bank above — a
confident proposition, not a timid existence claim. "There's a sock with no
elastic band at the top — it stretches to 30 inches and never leaves a mark"
sells; "there's a type of sock built for exactly this" does not.

**BANNED RECURRING TICS (verbatim):** ${BANNED_TICS.map((p) => `"${p}"`).join(' / ')} —
these exact lines are worn out from overuse across past briefs. Express the
sentiment freshly or not at all.

**MECHANISM HONESTY:** when a script explains WHY the problem happens, the
mechanism must be TRUE and checkable — the elastic band digging in, real venous
mechanics (gravity and blood pooling are legitimate WHEN accurately stated), the
missing graduated pressure. What is banned is FABRICATED physiology: invented
statistics ("~4 lbs per square inch"), made-up cause-and-effect, or vague
science-flavored filler that explains nothing. And a mechanism — even a true
one — is education, not proof. Every script also names its proof moment: a
demonstration, a testimonial line, or a specific review-data anchor.`;
}
