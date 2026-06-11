/**
 * Visual Craft Guide — the visual decision-making framework for production
 * and creator (UGC) ad types.
 *
 * The problem this solves: the generators have a rich VERBAL vocabulary
 * (angle language banks, book wisdom, review data) but no VISUAL craft
 * vocabulary — so every line defaults to "B-roll of feet, warm lighting."
 * B-roll isn't wrong; it has a place. The skill being installed here is
 * TREATMENT JUDGMENT: knowing which visual treatment each line has earned,
 * and when a line justifies a prop or unique visual that demonstrates the
 * idea instead of merely illustrating it.
 *
 * The line comes first. The visual decision serves the line. This guide is
 * a decision framework, not a push toward spectacle.
 *
 * Scope:
 *   - Production ad types (AGC, Founder, Spokesperson, Fake Podcast,
 *     Packaging/Employee): full guide — there's a videographer, talent,
 *     and props available, so the full treatment palette is in play.
 *   - UGC: creator-feasible variant — one person with a phone in their own
 *     home. Simple self-shot treatments and household props only.
 *   - Ecom Style / AI Podcast / Static: NOT applicable (assembled from the
 *     existing footage library — visual vocabulary is the footage tags).
 *   - Full AI: NOT applicable (AI generation has its own visual directive).
 */

const PRODUCTION_AD_TYPES = [
  'AGC (Actor Generated Content)',
  'Founder Style',
  'Spokesperson',
  'Fake Podcast Ads',
  'Packaging/Employee',
];

const UGC_AD_TYPE = 'UGC (User Generated Content)';

// ─── The shared core: treatment palette + decision rules ────────────────

const TREATMENT_PALETTE = `## THE VISUAL TREATMENT PALETTE — CHOOSE DELIBERATELY PER LINE

Every script line gets ONE of these treatments. None is "better" than the
others — the skill is matching the treatment to what the line is DOING.

1. **TALK TO CAMERA (talking head)** — for lines that are personal testimony,
   confession, direct address, or authority delivery. When the line's power
   comes from a human face saying it sincerely, nothing beats eye contact.
   Use for: "I" statements with emotional weight, the moment of vulnerability,
   the direct recommendation, the authority claim.

2. **SIMPLE B-ROLL (everyday action)** — for lines where the WORDS carry the
   idea and the visual just needs to ground it in real life. Putting on socks,
   walking to the kitchen, sitting on the couch, morning routine. This is the
   CORRECT choice for quiet lines, bridges, and context-setting — do not
   force creativity onto a line that doesn't need it.

3. **DYNAMIC B-ROLL (movement / energy)** — for momentum lines and
   transitions: following the subject through a doorway, a whip to a reveal,
   purposeful walking toward camera, hands moving fast through a task. Use
   when the line shifts energy or pace; the camera's motion mirrors the
   script's motion.

4. **POV B-ROLL (first person)** — for lines about the VIEWER'S lived
   experience. Looking down at your own feet / swollen ankles, reaching for
   socks at the bedside, pulling back the sheets, looking at the clock at
   3am. The viewer should feel "that's literally my view of my own life."
   Use for identification beats — especially hooks targeting a specific
   daily moment.

5. **PROP / DEMONSTRATION (the showpiece — must be EARNED)** — for lines
   that make a CLAIM, name a MECHANISM, or set up a CONTRAST that can be
   physically SHOWN. The prop's job is proof or vivid metaphor, never
   decoration.

   **THE EARN-IT TEST:** a prop is justified only if removing it would
   remove demonstrated proof of the exact thing the line says. If the line
   still works just as well over simple B-roll, the prop is decoration —
   cut it.

   **FREQUENCY RULE:** 1-2 prop/demonstration moments per ad, MAXIMUM.
   Usually the hook and/or the mechanism beat. The rest of the ad breathes
   with treatments 1-4. An ad that's all showpieces is noise.

## HOW TO DECIDE — ASK WHAT THE LINE IS DOING

- Line IDENTIFIES a lived moment → POV B-roll (or simple B-roll)
- Line CONFESSES / testifies / addresses the viewer → Talk to camera
- Line CLAIMS something measurable or names a MECHANISM → Prop/demonstration (if the earn-it test passes)
- Line CONTRASTS old way vs new way → Prop/demonstration or split-action B-roll
- Line BRIDGES or sets context → Simple B-roll (correct, not lazy)
- Line shifts ENERGY / transitions → Dynamic B-roll
- Line CLOSES / CTA → Talk to camera or product-in-hand simple B-roll`;

const VIASOX_PROP_BANK = `## VIASOX PROP & DEMONSTRATION BANK (realistic, same-day obtainable)

Seed ideas — adapt to the concept, never force-fit. Every prop here is
household-ordinary or dollar-store obtainable:

**Binding / non-binding (EasyStretch):**
- Tight rubber band around the wrist vs. a soft scrunchie — "this is what your sock does vs. what it should do"
- Regular sock's elastic stretched taut between hands vs. EasyStretch stretching effortlessly over a 2L bottle / watermelon (the 30-inch stretch made visible)
- The red ring a tight watch band leaves vs. skin under a loose band

**Swelling / edema (Compression, EasyStretch):**
- A balloon slowly inflated next to a clock face — "your ankles, 9am to 5pm"
- Pressing a thumb into memory foam vs. into bread dough — the dent that stays (pitting)
- A water bottle strapped to the ankle — "what carrying the swelling feels like by 3pm"

**Circulation / compression mechanism (Compression, Ankle):**
- A garden hose gently squeezed to show controlled flow vs. pinched flat — "support vs. strangling"
- Toothpaste tube squeezed from the bottom up — graduated compression in one image
- A firm handshake vs. a crushing grip — "12-15 mmHg is the handshake"

**Neuropathy (gentleness):**
- A feather / cotton ball dragged across the forearm — "when even THIS hurts your feet"
- Static-y balloon held near arm hair — the tingling made visible

**Universal / product:**
- Sock-mark grooves drawn on skin with washable marker fading in reverse
- A drawer of identical sad beige socks vs. one vibrant Viasox pair
- The "sock graveyard" — a pile of stretched-out, failed socks dumped on a table

## REALISM CONSTRAINTS — NON-NEGOTIABLE
- One videographer, simple home/warehouse settings. NO studio rigs, cranes,
  VFX, elaborate set builds, or anything resembling a TV commercial.
- Props must be obtainable same-day from a grocery store, pharmacy, or
  dollar store — or already in the warehouse.
- Camera language stays simple: handheld, tripod, basic gimbal. No drone
  shots, no complex choreography, no multi-camera setups.
- Talent count stays within the ad type's normal cast (usually one person).
- Every prop moment must be filmable in under 30 minutes of setup.
- If a visual idea needs a caption to explain WHY it's on screen, it failed —
  the connection to the line must be instant and obvious.`;

const STRATEGIST_INSTRUCTION = `## YOUR VISUAL TREATMENT RESPONSIBILITY

You decide the visual treatment strategy for this brief — the generator and
script writer execute your plan. In your thesis, include a short
**Visual Treatment Plan**: which beats get talk-to-camera, where simple
B-roll is the right call, where POV lands the identification, and — IF the
concept earns it — the ONE prop/demonstration moment: name the specific
prop, what exact claim or mechanism it demonstrates, and why it passes the
earn-it test. If no line earns a prop, say so plainly — "no prop moment;
this concept lives on testimony + POV" is a correct, professional decision.`;

// ─── UGC variant — creator-feasible only ─────────────────────────────────

const UGC_GUIDE = `## VISUAL CRAFT — UGC CREATOR EDITION (one person, their phone, their home)

The creator films themselves with no crew. Every visual direction must be
something a non-technical person can self-shoot in one take.

**The creator's treatment palette:**
1. **Selfie talk-to-camera** — testimony, confession, recommendation lines.
2. **Phone-propped B-roll** — phone leaned against something while they do a
   simple action: putting socks on, walking past, feet up on the couch.
3. **POV shot** — they point the phone down at their own feet/ankles/hands.
   The strongest identification tool UGC has. Use it for hooks about lived
   moments.
4. **Simple self-prop moment (max ONE per ad, must be earned)** — a
   demonstration the creator can do with things they own: stretching the
   sock over something to show the stretch, the rubber-band-vs-scrunchie
   wrist comparison, pressing a thumb into their ankle, dropping their old
   sock pile on the bed. Keep the instruction to ONE sentence a
   non-technical person can follow ("Stretch the sock wide with both hands
   right at the camera").

**UGC realism constraints:** no second camera operator implied, no lighting
setups, no locations outside home/car/yard, no props beyond what an
ordinary household has. If the instruction needs a tripod they don't own
or a second pair of hands, simplify it.

**Decision rule:** same as always — match treatment to what the line is
doing. Most UGC lines want selfie talk-to-camera or POV. One earned
demonstration beats five forced ones.`;

// ─── Public API ──────────────────────────────────────────────────────────

/**
 * Returns the visual craft guide for the given ad type:
 *   - full guide for production ad types (videographer + props available)
 *   - creator-feasible variant for UGC
 *   - empty string for everything else (Ecom = existing footage tags;
 *     Full AI = its own AI-generation directive; Static = single image)
 *
 * `mode` controls whether the strategist instruction block (the "you make
 * the treatment plan" responsibility) is included — pass 'strategist' from
 * the Creative Strategist prompt and 'writer' from the script prompt.
 */
export function getVisualCraftGuide(
  adType: string,
  mode: 'strategist' | 'writer' = 'writer',
): string {
  if (PRODUCTION_AD_TYPES.includes(adType)) {
    const parts = [TREATMENT_PALETTE, VIASOX_PROP_BANK];
    if (mode === 'strategist') parts.push(STRATEGIST_INSTRUCTION);
    return parts.join('\n\n');
  }
  if (adType === UGC_AD_TYPE) {
    const parts = [UGC_GUIDE];
    if (mode === 'strategist') parts.push(STRATEGIST_INSTRUCTION);
    return parts.join('\n\n');
  }
  return '';
}
