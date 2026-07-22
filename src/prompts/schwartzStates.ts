/**
 * Schwartz Awareness State Doctrine — per-level playbooks from Breakthrough
 * Advertising (Eugene Schwartz), extracted from the studied Marketing Brain
 * source (src/knowledge/brain/01_breakthrough-advertising.md, fidelity-audited
 * against the full book text 2026-07-13).
 *
 * WHY THIS FILE EXISTS: the Marketing Brain routes full source documents by
 * PIPELINE STEP, not by awareness level — the script writer always receives
 * the whole Schwartz distillation and must find the relevant state's doctrine
 * on its own. This module closes that gap: selecting an awareness level loads
 * Schwartz's ACTUAL playbook for that state — the headline job, the permitted
 * moves, and the named patterns with their real example ads — not just a
 * time-allocation template.
 *
 * Injected parametrically alongside the awareness guides (concept generation,
 * script writer, hook generator, creative strategist). Only the selected
 * level's block is sent — one block per call.
 *
 * Mapping between the app's AwarenessLevel and Schwartz's five states:
 *   Most Aware      = State 1 (knows the product, wants it, hasn't bought)
 *   Product Aware   = State 2 (knows the product, doesn't yet want it)
 *   Solution Aware  = State 3 (knows what he wants, not that a product does it)
 *   Problem Aware   = State 4 (has a need, doesn't connect it to the product)
 *   Unaware         = State 5 (completely unaware, or won't admit the desire)
 */

const SOPHISTICATION_FOOTER = `*(Awareness sets WHAT the opening may say. Market sophistication — how many similar promises this audience has already heard — sets HOW the claim is framed. That is a separate dial: see the Stages of Sophistication in the full Schwartz source in the Marketing Brain block. For a tired claim space, lead with the MECHANISM, Stage-3 style.)*`;

const STATE_BLOCKS: Record<string, string> = {
  'Most Aware': `## SCHWARTZ STATE DOCTRINE — MOST AWARE (Breakthrough Advertising, State 1)

The prospect knows the product, knows what it does, wants it — and simply hasn't bought yet. Schwartz's prescription is the shortest in the book: **headline = product name + bargain.** "Revere Zomar Lens… Formerly $149.50 — Now Only $119.95." The price IS the news. He calls this the least creative job in advertising — do not add creativity where none is needed; every second of warm-up delays a purchase that was already decided.

**The playbook:**
1. Name + deal in the first sentence: product, exact terms, deadline. "5 pairs for $60" beats "an amazing deal" — always the specific number.
2. The rest of the ad removes friction, not doubt: genuine urgency (real deadline, real scarcity, real season), risk reversal for the last objection ("Love them or return them"), and the product looking beautiful.
3. For retargeting, the minimal form is complete: "Back in stock." / "Still in your cart." can be the entire concept.

**Failure mode at this state:** education. Explaining the product to someone who already wants it reads as noise and postpones the click.

${SOPHISTICATION_FOOTER}`,

  'Product Aware': `## SCHWARTZ STATE DOCTRINE — PRODUCT AWARE (Breakthrough Advertising, State 2)

The prospect knows the product but doesn't yet want it — Schwartz calls this "the bulk of all advertising." **Show the name; spend the rest of the opening on superiority.** Never re-introduce the product from zero — a Product Aware viewer scrolls reruns.

**Schwartz's seven headline tasks for this state — pick ONE per ad and go deep:**
1. **Reinforce the desire** — by association ("Steinway — The Instrument of the Immortals"), by sensory sharpening ("The skin YOU love to touch"), or by illustration.
2. **Sharpen the image of HOW it satisfies** — "At 60 miles an hour, the loudest noise in this Rolls-Royce is the electric clock."
3. **Extend where/when it satisfies** — "Thirst knows no season."
4. **New proof / documentation** — "9 out of 10 screen stars use Lux." Fresh testimonial, fresh data, fresh demonstration.
5. **A new mechanism that satisfies better** — Hoover: washes floors AND vacuums up the scrub water.
6. **A new mechanism that removes an old limitation** — Zenith's inconspicuous hearing aid.
7. **Change the image or mechanism entirely to escape competition** — the escape hatch when the market has heard everything (this is the sophistication problem).

**The playbook:** brand lands in the first 3 seconds; the NEW thing (one task above, executed concretely) lands by 10. One powerful story or proof point beats five bullet points. Physical product facts earn their place here — as documentation of the claim, price justification, and the "fresh basis for believability."

**Failure mode at this state:** running an introduction ad. If the ad would work for someone who never heard of Viasox, it is aimed at the wrong state.

${SOPHISTICATION_FOOTER}`,

  'Solution Aware': `## SCHWARTZ STATE DOCTRINE — SOLUTION AWARE (Breakthrough Advertising, State 3)

The prospect knows what he wants to achieve — he does not yet know YOUR product does it. This is new-product-introduction logic: **pinpoint the uncrystallized desire, then crystallize it so sharply that every prospect recognizes it at a glance.**

**Schwartz's three steps, in order:**
1. **Name the desire and/or its solution in the headline** — plainly when possible.
2. **Prove it can be accomplished.**
3. **Show that the mechanism of accomplishment is contained in your product.**

**His example headlines for this state:** "Who else wants a whiter wash — with no hard work?" / "How to win friends and influence people" / "To men who want to quit work some day" / "Now! Run your car without spark plugs" / "When doctors feel rotten — this is what they do."

Use plain statement first; when the desire is worn from repetition, reinforce with fresh proof, mystery, or wonderment ("17,000 blooms from a single plant?"). From this state down, Schwartz warns, execution outweighs mechanics — the creative job is to "give a name to the still-undefined."

**The playbook:** the MECHANISM is the star — name the category and the differentiator early ("compression socks that don't strangle your calves by noon"), acknowledge the failed alternatives briefly (2–3 seconds, they already know), then spend the ad proving the mechanism (non-binding tops, graduated 12-15 mmHg, wide-mouth design) is real and is in Viasox. Heavy proof: specific percentages, customer quotes, before/after.

**Failure mode at this state:** re-dramatizing the problem. They know the problem. Every second spent agitating is a second not spent differentiating.

${SOPHISTICATION_FOOTER}`,

  'Problem Aware': `## SCHWARTZ STATE DOCTRINE — PROBLEM AWARE (Breakthrough Advertising, State 4)

The prospect has the need but doesn't connect it to any product. This is Schwartz's problem-solving ad: **(1) name the need and/or its solution in the headline; (2) dramatize the need so vividly the prospect feels how badly it must be satisfied; (3) present your product as the inevitable solution.**

**Schwartz's gradient of openings — choose by how raw and admitted the pain is:**
- Bare problem, one word: "Corns?"
- Problem + solution promise: "Stops maddening itch."
- Limitation removed: "Shrinks hemorrhoids without surgery."
- Substitute for an unpleasant/expensive task: "Now! A ring and piston job in a tube!"
- Prevention through loved ones: "Look, Mom — no cavities!" — Schwartz's prevention rule: a person will NOT visualize future disasters for HIMSELF, only for the people he loves. Sell prevention through the daughter, the husband, the grandkids.
- Emotional sharpening: "Do YOU make these mistakes in English?"
- Worn-out directness revived by a twist: "How a bald-headed barber helped save my hair."

**The playbook:** the pain is the hero of the first half — name the symptom with real-person specificity ("the burning that starts in your toes by 3pm," not "foot discomfort"), agitate with sensory language taken VERBATIM from the reviews, then bridge to the product as relief. The bridge must feel earned. You are ALLOWED to be explicit about the problem at this state — vagueness here is an unforced error.

**Failure mode at this state:** either clinical detachment (naming the condition like a pamphlet instead of mirroring the lived experience) or premature product entry before the agitation has made relief feel necessary.

${SOPHISTICATION_FOOTER}`,

  'Unaware': `## SCHWARTZ STATE DOCTRINE — UNAWARE (Breakthrough Advertising, State 5)

The prospect doesn't know, won't admit, or cannot verbalize the desire. Schwartz calls this the hardest and most valuable state — where "dead" markets are reborn. **The Elimination Rules: no price, no product name (be wary even of the logo), no direct statement of function, desire, or problem.**

What remains is the market itself — the **identification opening**: "You are calling your market together… You are telling them what they are. You are defining them for themselves." The opening sells only the next paragraph; the body then walks identification → awareness of the problem/desire → a solution exists → your product.

**Schwartz's named patterns for this state (with the real ads):**
- Hidden dream given words — "THE UNIVERSITY OF THE NIGHT."
- Hidden fear exploited — "WHY MEN CRACK…"
- Unacceptable problem entered through an accepted image — "WITHIN THE CURVE OF A WOMAN'S ARM."
- Unspeakable desire projected visually — the Marlboro tattoo ads (the words would be rejected; the image is not).
- Common resentment widening the market — "WHY HAVEN'T TV OWNERS BEEN TOLD THESE FACTS."
- Ultimate triumph — "THEY LAUGHED WHEN I SAT DOWN AT THE PIANO. BUT WHEN I STARTED TO PLAY!—"
- Result of a rejected problem stated directly — "OFTEN A BRIDESMAID BUT NEVER A BRIDE."
- Reward projected to hide the work — "HERE'S AN EXTRA $50, GRACE—"

**The cardinal rule:** "Your prospect must identify with your headline before he can buy from it… It must pick out the product's logical prospects — and reject as many people as it attracts." Never a mere startler, joke, or pretty picture — Schwartz calls that the easiest headline type to write emptily. This is exactly why the 10-second concreteness rule exists: identification demands specific scenes, and an opening whose details are interchangeable selects nobody. Styles (verse, confession, comic strip) go stale and then laughable — "though styles may change, strategy does not."

**The playbook:** the 5 Unaware release gates in the awareness guide operationalize this state — what may be said when. The chosen script framework supplies the storytelling that carries the viewer through the gates; execute it with concrete, filmable scene details and the sub-persona named.

${SOPHISTICATION_FOOTER}`,
};

/**
 * Return Schwartz's state doctrine for the given awareness level, or an
 * empty string for unrecognized input (callers inject unconditionally).
 */
export function getSchwartzStateBlock(level: string): string {
  return STATE_BLOCKS[level] ?? '';
}
