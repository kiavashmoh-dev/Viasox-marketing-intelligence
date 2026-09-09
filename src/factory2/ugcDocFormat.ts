/**
 * The UGC creator-document FORMAT + CALIBRATION block (Sep 2026).
 *
 * Kia's decision: every UGC brief ships as a three-tab Google Doc (Creator
 * Brief · Script · Strategy) at EXACTLY the level of information of his
 * example — trimmed, essentials only, no bloated instructions. The writer
 * therefore receives (1) the fields of that document as its output contract
 * and (2) the example itself as the calibration for how much to write per
 * field — with the same fence the ecom taste file carries: the example's
 * WORDING is calibration, never material. Its calf-map story, its marker,
 * its anniversary sale belong to that brief alone.
 *
 * Injected into the UGC writer only (the ecom writer keeps its own format).
 */

import { V2_HOOK_COUNT } from './v2Types';

/** The JSON fragment for the `creatorDoc` object in the UGC writer's shape. */
export function ugcCreatorDocJsonShape(): string {
  return `{
    "briefInfo": {
      "collection": "the product collection name, e.g. 'EasyStretch™' / 'Compression' / 'Ankle Compression'",
      "socks": "exactly what the creator receives — count + product + patterns when the task or director names them (never invent patterns: if unstated, write the count and product and '(patterns to be confirmed)')",
      "format": "one line: aspect + who films + what kind of video, e.g. '9:16 creator-filmed UGC demonstration + testimonial'",
      "creatorRequirement": "ONE line, ~20 words: sex, age band, region, and the lived experience this concept needs the creator to genuinely have",
      "creatorNote": ["3-4 short paragraphs, ~200 words total, spoken to the creator in the second person: (1) what the video should feel like and the ONE repeatable visual it is built around; (2) record all ${V2_HOOK_COUNT} hooks as separate takes that share one body and CTA (+ what hook ${V2_HOOK_COUNT} must open with when a promotion runs); (3) props to have ready and the specific close-ups to capture; (4) speak naturally, keep every personal claim true to her experience, the product-claim line she must not cross, and the delivery spec (raw vertical clips, clean audio, bright natural light, no filters or captions, two seconds of silence before and after each take)"]
    },
    "scriptNote": "ONE short paragraph, ~45 words, at the top of the Script tab: hooks as separate takes sharing one body and CTA; what hook ${V2_HOOK_COUNT} does when a promotion runs; keep the product out of frame until the reveal",
    "beforeYouSubmit": ["5-7 checklist items, ~15 words each, all specific to THIS brief: the takes to film, the prop rules, the close-ups to capture, the filming spec, the truthfulness rule, the claim line not to cross"],
    "strategy": {
      "awarenessLevel": "the task's awareness level in plain words, ~6 words, e.g. 'Problem-aware moving toward solution-aware'",
      "primaryEmotion": "the emotional arc as an → chain, ~8 words",
      "avatar": "ONE sentence, ~40 words: who she is, what she repeatedly experiences, what she currently believes about it",
      "hypothesis": "~45 words: why THIS demonstration/story will make the problem legible and position the product",
      "coreCreativeIdea": "the idea in CAPS as a sayable line, then ~25 words on the visual thread that carries it",
      "offer": { "promo": "the promotion exactly as the director stated it", "valueCallout": "the value in one line", "fourthHook": "what hook ${V2_HOOK_COUNT} must open with and how it doubles as a short sale-led cut, ~35 words", "urgency": "~12 words; end with 'confirm the live offer before export'" },
      "production": {
        "format": "~10 words: format, aspect, target runtime",
        "creator": "~20 words: the creator in one line + the truthfulness rule for her personal statements",
        "props": "~25 words: every prop the script needs, as a list in one line",
        "locations": "~20 words: the home settings the shots need"
      },
      "editing": {
        "pacing": "~22 words: the pacing arc from the first three seconds to the close",
        "graphics": "~25 words: the on-screen label system before/after the reveal + any counter for the offer",
        "audio": "~25 words: delivery + music behaviour across the arc"
      },
      "reference": { "adaptationNote": "~45 words: which STRUCTURE the pinned example lends (its beat order), what replaces its device, and what must NOT carry over (its claims, its product mechanism)" }
    }
  }`;
}

/** The format + calibration block for the UGC writer's system prompt. */
export function getUgcDocFormatBlock(): string {
  return `## THE CREATOR DOCUMENT — THE ONLY FORMAT A UGC BRIEF SHIPS IN (Sep 2026)

Every UGC brief becomes ONE Google Doc with THREE tabs. Your JSON fills those tabs and NOTHING
else exists in the document — so write to this level of information exactly: not less, not more.

TAB 1 · CREATOR BRIEF — one table: Brief ID · Product · Collection · Socks · Format · Creator
Requirement · Creator Note · Duration. (Brief ID, Product, and Duration come from the task.)
TAB 2 · SCRIPT — a one-paragraph creator note; the FULL READ-THROUGH (your scriptProse, exactly
as she says it, hook 1 through the CTA); then the script table with four columns —
LINE / SECTION · SHOT / ACTION · SCRIPT LINE · ON-SCREEN TEXT — one row per hook (HOOK 1..${V2_HOOK_COUNT},
each its own take), one per body clip (BODY 1..n; the clip where the product first appears is
"BODY n — PRODUCT REVEAL"), an OFFER row when a promotion runs, then the CTA; and a BEFORE YOU
SUBMIT checklist.
TAB 3 · STRATEGY — one table: Strategy (Awareness Level · Primary Emotion · Avatar · Hypothesis ·
Core Creative Idea) · Offer (only when a promotion runs) · Production (Format · Creator · Props ·
Locations) · Editing (Pacing · Graphics · Audio) · Reference (Adaptation Note — only when an
example is pinned).

HOW THE FIELDS ARE WRITTEN (calibrated on the director's own example below):
- SHOT / ACTION is second-person direction in ~20 words: what she does with the camera and the
  props, one concrete action per row. No performance coaching essays.
- SCRIPT LINE is the spoken line as she says it, 15-40 words; the hooks name the symptom in her
  own world. ON-SCREEN TEXT is a 3-6 word caption in CAPS for hooks, the offer, and the CTA;
  body rows usually leave it empty.
- Every field has the word budget stated in the JSON shape. The budgets are the level of
  information the director approved — a field twice its budget is bloat, a field at a third is
  thin. Plain sentences; no headers, no bullet prefixes inside a field.
- The creator note and the checklist are SPECIFIC to this brief (its props, its visual, its
  claim line) — never generic filming advice.
- OFFER and the Offer strategy group exist ONLY when the director's instructions or the batch
  direction state a promotion; then hook ${V2_HOOK_COUNT} opens with that offer so it doubles as a
  short sale-led cut. With no promotion: omit "offer", no OFFER row, the CTA closes on the
  evergreen bundle per the awareness rules.
- REFERENCE exists ONLY when an example is pinned (an INSPIRATION CONTEXT is present).

⛔ THE EXAMPLE IS CALIBRATION, NEVER MATERIAL. The document below is the director's own brief,
shown so you match its level of detail and its register per field. Its story (a calf-map drawn
with a marker, the tight cuff, the ruler test), its product, its offer, and every one of its
sentences belong to THAT brief. Reproducing its visual device, its lines, or its checklist on a
different task is the failure the director will reject first.

### THE DIRECTOR'S EXAMPLE (level of information per field)

BRIEF INFO
- Collection: EasyStretch™
- Socks: 2 EasyStretch socks — Legacy and Snoopy pattern.
- Format: 9:16 creator-filmed UGC demonstration + testimonial
- Creator Requirement: Female, 50+, North American; naturally fuller/wider calves and genuine
  experience with tight sock cuffs, sock marks, or end-of-day puffiness
- Creator Note (4 paragraphs): "Hi! This video should feel like a personal discovery filmed at
  home, built around one repeatable visual: mapping what tight socks do to wider calves. Use a
  washable, skin-safe marker—not a permanent Sharpie—to draw the cuff line and label the areas
  where a regular sock digs in, leaves marks, or makes your legs / feet feel puffy. Keep the
  drawings simple and readable on camera." / "Please record all four hooks as separate takes.
  Each hook connects to the same shared body and CTA. Hook 4 must begin with the Viasox
  anniversary sale so it can also be edited into a shorter sale-led video." / "Have a
  narrow/tight unbranded sock, a flexible measuring tape or ruler, and at least two patterned
  EasyStretch™ pairs ready. Capture clear close-ups of the old cuff mark, the comparison sock
  opening, the EasyStretch™ opening at rest and stretched, the non-binding top resting on your
  calf, and one uninterrupted pull-on demonstration. Also film the triple-padded bottom, seamless
  toe area, both patterns, and natural walking/standing lifestyle clips." / "Speak naturally
  rather than reading word-for-word. Any statement about swelling, marks, discomfort, or personal
  improvement must be true to your experience. Do not call EasyStretch™ medical compression or
  say it treats circulation problems. Submit raw, unedited vertical clips with clean audio,
  bright natural light, no filters or captions, and two seconds of silence before and after each
  take."

SCRIPT TAB
- Creator note: "Film all four hooks as separate takes. Each hook connects to the same shared
  body and CTA. Hook 4 begins with the anniversary offer and can also be edited as a shorter
  sale-led cut. Keep Viasox out of frame until the product reveal in the shared body."
- Script table rows (LINE/SECTION · SHOT/ACTION · SCRIPT LINE · ON-SCREEN TEXT):
  HOOK 1 · "Start tight on your bare calf. Draw a red line exactly where a regular sock cuff
  usually sits, then circle the indentation." · "If your socks leave a ring this deep around your
  calf, your calves are not the problem. Your socks are too small." · YOUR CALVES AREN'T THE PROBLEM
  HOOK 4 — SALE FIRST · "Hold two Viasox pairs, then leave room for three animated pairs to pop
  in. Immediately point to the old cuff line on your calf." · "Viasox is giving away three free
  pairs for its anniversary. And if regular socks dig into your calves like this, let me show you
  why these are worth stocking up on." · BUY 2, GET 3 FREE • ANNIVERSARY SALE
  BODY 1 · "Wear the narrow comparison sock. Trace its top edge with the skin-safe marker and
  write TIGHT above the line." · "This was my normal. The cuff would dig in right here, and by the
  time I took the sock off, the line was practically stamped into my leg." · (empty)
  BODY 5 — PRODUCT REVEAL · "Bring Viasox EasyStretch™ into frame for the first time. Place it
  beside the comparison sock." · "Then I found Viasox EasyStretch, and the difference was obvious
  before I even put them on." · (empty)
  BODY 8 · "Film one uninterrupted shot of putting the sock on. No jump cuts. Then stand and
  smooth it once." · "I can open it wide, get my foot in, and pull it over my calf without turning
  getting dressed into a workout." · (empty)
  OFFER · "Hold two pairs, leave room for animated pairs." · "And right now, Viasox is celebrating
  its anniversary. Buy two pairs and they give you three more free. That is five pairs for the
  price of two." · 5 PAIRS FOR THE PRICE OF 2
  CTA · "Hold all available pairs, point down, and finish on a clean close-up of the stretched
  opening around your calf." · "If your calves have been fighting your socks every day, stop
  blaming your legs. Go to Viasox.com and shop the anniversary sale: buy one, get one free, or buy
  two and get three free." · BUY 1, GET 1 FREE • BUY 2, GET 3 FREE
  (the example has 11 body rows; the body length is whatever the duration ceiling allows)
- Before you submit (6 items): "Film all four hooks as separate takes and keep Viasox out of
  frame until the shared-body product reveal." / "Use only a washable, skin-safe marker on the
  calf; do not use permanent marker." / "Capture the narrow-sock comparison, ruler/stretch test,
  uninterrupted pull-on shot, cuff fit, sole padding, toe area, patterns and lifestyle footage." /
  "Film vertically in bright natural light with clear audio; turn off HDR, filters, captions,
  music and in-camera effects." / "Keep all statements about sock marks, puffiness, discomfort and
  personal results truthful to your experience." / "Do not call EasyStretch™ compression or claim
  it treats circulation problems, edema or swelling."

STRATEGY TAB
- Awareness Level: Problem-aware moving toward solution-aware
- Primary Emotion: Frustrated self-recognition → visual proof → relief → urgency
- Avatar: North American woman 50+ with naturally wider calves who repeatedly experiences tight
  sock cuffs, deep sock marks, discomfort and end-of-day ankle puffiness; she assumes her legs are
  the problem and has not found socks that feel made for her body.
- Hypothesis: A physical calf-map demonstration will make an invisible fit problem immediately
  legible. Showing the narrow cuff, marking the pressure zones, and then measuring the
  EasyStretch™ opening turns a familiar private frustration into visible proof and positions the
  product as the sock designed to accommodate her calf.
- Core Creative Idea: MY CALVES WEREN'T THE PROBLEM. THE SOCKS WERE. The marker remains the
  visual thread: red marks identify the problem; a ruler proves the size mismatch; a green line
  and EasyStretch™ demonstrate the more accommodating fit.
- Offer → Promo: Viasox Anniversary Sale: Buy 1, Get 1 Free or Buy 2, Get 3 Free. · Value
  Callout: Pay for two pairs and receive five pairs total. · Fourth Hook: Must open with Buy 2,
  Get 3 Free, then point directly to the old cuff line. It should work both as Hook 4 for the long
  edit and as the opening of a shorter sale-led cut. · Urgency: Anniversary promotion and pattern
  availability; confirm the live offer before export.
- Production → Format: Creator-filmed UGC demonstration/testimonial; vertical 9:16; target
  90–120 seconds. · Creator: Energetic North American woman 50+ with visibly fuller calves.
  Personal symptom/result statements must match her actual lived experience. · Props: Washable
  skin-safe marker, flexible ruler or measuring tape, narrow unbranded comparison sock, two or
  more approved patterned EasyStretch™ pairs, optional five-pair set for offer shot. · Locations:
  Bright home setting with a chair or couch, hard floor, kitchen or hallway, and uncluttered
  wall/background for the calf demonstration.
- Editing → Pacing: Fast pattern interrupt in the first three seconds; deliberate close-ups
  during marker/ruler proof; faster benefit stack after product reveal; energetic sale close. ·
  Graphics: Use simple red pressure-zone labels before reveal and green fit/comfort labels after
  reveal. Add a five-pair counter for the offer. Keep captions bold and highly readable. · Audio:
  Natural direct-to-camera delivery with small pauses for each drawing. Light upbeat music; lower
  it during the fit explanation and lift it at the sale reveal.
- Reference → Adaptation Note: Borrow the reference's show-the-problem → explain-the-mechanism →
  demonstrate-the-product → before/after payoff structure. Replace its glass-and-liquid metaphor
  with a calf map, cuff comparison and ruler-based stretch demonstration. Do not carry over its
  health claims or product mechanism.`;
}
