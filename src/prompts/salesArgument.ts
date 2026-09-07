/**
 * THE SALES ARGUMENT DOCTRINE — the engine's spine, distilled from the CMO's
 * complete review corpus (nine per-brief feedbacks + the 2026-08-28 review
 * meeting; synchronized loss-free in SYNCHRONIZED-CMO-DOCTRINE.md).
 *
 * Why this module exists: the CMO's master finding was that briefs looked
 * right — frameworks, awareness levels, emotional arcs all present — while
 * "the argument we're trying to make through our scripts just made no
 * sense." This block sits DIRECTLY UNDER THE CENSORS in the precedence
 * stack: above batch instructions' style guidance, above the craft DNA,
 * above styles and exemplars. When any lower layer's guidance conflicts
 * with an argument law here, the argument law wins. Censors still bind
 * absolutely.
 *
 * It is injected into every ECOM context pack (concept + script stages) and
 * therefore governs every generation AND every editor regeneration on new
 * and previously saved briefs alike.
 */

import type { ProductCategory } from '../engine/types';

/** Per-product objection menus + positioning — the CMO's own lists, verbatim
 *  in substance. Menu, not checklist: answer the 3-5 most relevant, in the
 *  narrator's voice, and CLOSE each one (see the objection law). */
function productArgumentBlock(product: ProductCategory | string): string {
  const p = String(product);
  if (/ankle/i.test(p)) {
    return `**THIS PRODUCT'S ARGUMENT MATERIAL (Ankle Compression):**
- POSITIONING (who chooses ankle over knee-high — segmentation, NEVER disparaging knee-high, which we
  also sell): they want targeted ankle-and-arch support; they dislike knee-high compression; they want
  something easier and quicker to put on; they want a lower-profile option that fits inside everyday
  shoes; they want support without covering the calf. State this as HER preference and life, not as a
  verdict on knee-highs. If the concept's problem is framed as pooling "throughout the lower legs,"
  the framing argues FOR knee-highs — frame the problem where THIS product acts: at the ankle and arch.
- THE PRESSURE PARADOX (resolve it whenever the script warns about pressure/tight bands, ALWAYS on
  neuropathy angles): one tight cuff = CONCENTRATED pressure on one strip of skin; uniform gentle
  compression = DISTRIBUTED support around the whole ankle and arch. Name the contrast explicitly —
  it is the product argument AND the answer to "if pressure is bad, why is yours good?"
- OBJECTION MENU: why ankle instead of knee-high · is it easy to put on · does the cuff dig into a
  swollen ankle · does it fit comfortably inside regular shoes · will it feel too tight · can it be
  worn all day · is it better for someone who dislikes tall compression socks · when should it go on ·
  what does the uniform gentle compression (12-15 mmHg) actually do. Explaining the number is
  ENCOURAGED on this product.`;
  }
  if (/compression/i.test(p)) {
    return `**THIS PRODUCT'S ARGUMENT MATERIAL (Compression, graduated 12-15 mmHg):**
- POSITIONING (why Viasox over other compression socks — argue it, don't assume it): a gentle
  WEARABLE level (12-15) versus the hospital-grade stockings people wrestle with twice and abandon in
  a drawer; genuinely easier to put on; patterns that don't look medical; comfortable enough to
  actually wear all day — "the only compression that helps is the compression you wear."
- OBJECTION MENU: will they feel too tight · are they difficult to put on · will they leave marks
  (conditional phrasing only) · do they look medical · can I wear them comfortably all day · when
  should I put them on · why is 12-15 mmHg the right level for THIS customer. On travel angles add:
  too tight during a long flight · hours of wear · how do my legs feel when I land.
- The "explains why 12-15 works for HER" beat is experiential, in her voice — never a lecture.`;
  }
  // EasyStretch
  return `**THIS PRODUCT'S ARGUMENT MATERIAL (EasyStretch, non-binding):**
- POSITIONING (why Viasox over socks SOLD as diabetic socks — the market teardown the CMO modeled):
  the ones at the market are too thin or too thick, still abrasive, with elastic still gripping —
  "nobody who designed them accounted for a diabetic foot." Ours: no elastic band anywhere, stretches
  to 30 inches, rests instead of grips, seamless toe. Claim-versus-reality is a strong two-beat: what
  their package says, then what shows up.
- OBJECTION MENU: will it fall down without a band · is it easy to get over a swollen foot · will it
  leave marks (absolute no-marks is LEGAL on this product only) · does it look medical · can it be
  worn all day · seamless toe (ONLY when the story's problem involves rubbing/feeling — see the
  feature relevance law).
- The product's honesty cap, in her voice, when the valley ran deep: it does not treat anything — it
  is the one thing pressing on her skin that she CAN change.`;
}

export function getSalesArgumentBlock(product: ProductCategory | string): string {
  return `## THE SALES ARGUMENT DOCTRINE (CMO canon — outranks every layer of this prompt except the censors)

THE CENSORS, by name (the only things that outrank this doctrine): the ⛔ CLAIM BOUNDARY, the
brand facts (exact forms only), the Pain Bank's truth rulings and Stakes License, the
guarantee/urgency bans, and the offer/review-count forms. Everything else in this prompt —
including any brand-identity preamble ABOVE this block (e.g. a comfort-first message hierarchy:
a V1 lead-with convention, not a law for these scripts) — yields to this doctrine wherever they
differ.

**LAW 0 — THE ARGUMENT IS THE PRODUCT.** Before anything is written, the script must HAVE an
argument: one connected chain of beliefs that ends in "so this product is the answer for me."
State the ad's thesis as ONE SAYABLE LAW (e.g. "the less your feet can feel, the more the wrong
sock matters") — if the thesis can't be stated in one sentence, the concept isn't ready. Every beat
must advance the argument: what does this beat make the viewer BELIEVE, and how does that belief set
up the next one? A beat that doesn't advance the argument is decoration — cut it. A script whose
sentences are individually fine but whose sequence argues nothing reads as word-jumble aloud and is
a failed script regardless of craft.

**THE CANON BLOCKS** (every framework is some formula of these; present at EVERY awareness level,
"as subtly as possible" at Unaware): earn attention → build curiosity → let them recognize the
problem → explain WHY it happens → introduce a credible, believable solution → address objections →
demonstrate an outcome → move toward the purchase.

**THE HOOK LAWS.** The hook must establish — immediately, in one breath — the SYMPTOM, the stakes,
and the value of continuing to watch. Unaware delays the PRODUCT, never the symptom: "heavy, swollen
legs" is a symptom and is always legal; only the condition label and product category wait. Every
hook lives in the VIEWER'S body or promises the viewer something — a hook that lives in the
narrator's world ("why does a home care worker dread 5:00?") is dead on arrival: nobody watches
content about the narrator's job. The strongest shape on record: viewer-body question + credential +
the thesis-law ("Can you feel all ten of your toes right now? After 30 years as a nurse, I learned
that the less your feet can feel, the more the wrong sock matters."). Curiosity still needs context —
the viewer must never have to work out what the story has to do with them. Never reference a thing
before naming what it is ("I blamed the shoes" — for WHAT?).

**THE AUTHORITY LAWS.** Authority-adjacent figures are encouraged — the failure mode is never the
casting alone, it is the establishment. (1) BUILD THE DEBT: the less pre-loaded the figure's
credibility (nurse = pre-paid; shoe fitter = zero), the more the script must construct, from her
daily evidence, WHY she has standing on this exact problem — before she is allowed to conclude
anything. (2) ESSENTIALITY TEST: delete the career from the story — if the story still works, the
authority is stapled on to manufacture credibility; rebuild until her experience is load-bearing.
(3) KNOWLEDGE BOUNDARY: she explains only what her life would teach her. A tradesperson testifies to
what she SEES and MEASURES; clinical mechanism arrives through a story event (the nurse's remark,
the doctor's sentence) or through an observer-metaphor — never as her lecture. (4) NO
AUTHORITY-BREAKING HYPERBOLE: never give her a superlative her own persona couldn't honestly say
("the most dangerous thing I ever saw was an ordinary sock" — a 30-year nurse has seen far worse;
the line discredits her). (5) SPECIFICITY IS THE CREDENTIAL: "I'm in home care" is a title; houses
per day, what she does in them, how many clients are diabetic — that is authority.

**THE CLAIM LAWS.** Claim strength = the depth of the EARNING argument, never the intensity of the
wording. Walk every causal chain to its endpoint — apply the probe to every claim: "from what? so
what? and then what?" — a chain that stops at an intermediate ("circulation means your legs can't
heal" … heal from WHAT?) is unfinished. Chain anatomy per the CMO's model: conditional framing +
causal links + a first-person witness marker at the endpoint ("…in some of the worst cases I've ever
seen"). Serious endpoints (for diabetes: numbness → an unfelt wound → infection → amputation) may be
SPOKEN — they belong to the CONDITION, conditionally framed and witnessed; the product never causes
or prevents them. Condition-side education must be TRUE: never myth-bust things that are actually
true (salt, age, and standing DO contribute to swelling — a manufactured contrarian premise is
caught instantly by an audience that lives with the condition), and never compress parallel medical
tracks into a false sequence.

**THE PROPORTION LAW.** The product argument gets EQUAL OR MORE runtime than the problem build. The
reference standard: the top ACS winner spends practically the whole ad developing the product, each
mechanism with its own visual and its own outcome. A 90-second valley followed by two product lines
is a failed script. Corollaries: the story/metaphor is a device — once it has done its job, pivot
fast to product and payoff (the device must not consume the ad); Unaware permits delaying the reveal
but NEVER hiding the product for ten scenes — bounded delay, earned by genuinely built curiosity
that connects, beat by beat, to what is about to be revealed.

**THE MECHANISM LAWS.** Mechanism beats EXPLAIN, never merely evoke — complete the chain: what is
happening → why → why this product's mechanism answers it. A quotable line that can't be diagrammed
is evocation wearing explanation's clothes. Prefer mechanism taught through the STORY'S OWN
MATERIAL — her failed workaround, her measurement, her ritual (why elevating helped at night but the
problem returned by the next evening → why support DURING the day beats relief after it) — over
generic anatomy narration.

**THE OBJECTION LAW.** Objections are a mandatory station of the argument, chosen from this
product's menu below (3-5 most relevant — menu, not checklist). Raising an objection creates a
DEMONSTRATION DEBT: close the loop on screen (show the donning, the fit inside her shoes, the day of
wear) — an assertion ("gentle enough to wear all day") does not pay it.

**THE FEATURE RELEVANCE LAW.** A feature earns mention ONLY if it answers a problem THIS story
established. Never recite the feature list: a seamless toe belongs in a story about feeling and
rubbing, not in a pooling story. Interpret product facts into the story's argument — never echo them.

**THE OUTCOME LAWS.** Promise the outcome EARLY (the hook or first third names what her life gets
back), deliver it late. Outcomes are FELT-SCALE and SCENE-SPECIFIC: less heaviness while making
dinner, shoes that don't feel tighter when she lands, the evening walk back — never a bare
adjective ("feel the difference" — WHAT difference?) and never a manufactured absolute (identical
8 AM/6 PM ankles reads as fake AND overclaims). Even with an extreme posture, the demonstration must
make the result feel EARNED before it is stated. The believable outcome and the compliant outcome
are the same outcome.

**THE CTA LAWS.** Every close carries the offer (Buy 2 Get 3 Free — five pairs for sixty dollars,
twelve a pair) and a DIRECT action — at every awareness level, Unaware included. Never undercut the
bundle ("…and then start with one" fights the five-pair offer); keep low-commitment psychology
INSIDE it: "Start with one pair tomorrow morning and see why you'll be glad you have four more."
Proof is interpreted, never recited — no script closes on a bare review-count reading.

**THE ANTI-TEMPLATE LAW.** Each angle must create a DIFFERENT sales argument — a different thesis,
a different chain, different proof — not the same ad wearing a new character and aesthetic. BANNED
recited fingerprints (the CMO spotted every one): the 9 AM-versus-4 PM / morning-versus-evening
comparison as the insight; "real enough to feel the difference by evening"; closing on "107,000
reviews and counting" or any recited count; the identical late-reveal valley shape. Product facts
and proof numbers are raw material to INTERPRET through this narrator's world, never parameters to
echo. A winning template (e.g. the authority-testimonial format) may repeat; its ARGUMENT may not.

${productArgumentBlock(product)}

**THE FINAL BAR** (the CMO's, verbatim in substance): read the finished script and be able to say
"this is going to be an absolute killer in the account" — and be able to defend, in plain language,
the hook, the audience relevance, the logical progression, the product mechanism, the objections,
the proof, and the intended outcome. If any of those can't be explained plainly, the script is not
done.`;
}
