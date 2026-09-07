/**
 * THE AI LIFESTYLE VISUAL SPEC — for fully-AI-generated ecom briefs that
 * must look like REAL UGC (real-looking faces and people; the director's
 * "AI Lifestyle" subsection — the sibling of aiAnimationSpec.ts).
 *
 * Production mode 'ai-lifestyle': nothing is pulled from the footage
 * library — every scene is GENERATED, and the brief's visual cells are
 * generation prompts. The look must be indistinguishable from real UGC and
 * cast 100% to the Viasox demographic.
 *
 * Distilled 2026-08-24 from a frame-by-frame dissection (678 frames, every
 * frame of all 10 director-curated fully-AI reference ads, incl. two direct
 * sock competitors) run by 10 parallel watch agents + a synthesis pass.
 * Compliance adaptations are baked in: no fabricated named institutions or
 * credentials, no guarantee cards, no recognizable competitor brands, no
 * expert-endorsement cameos — the reference ads use those; we do not.
 *
 * Replaces the footage-library block in the ecom context pack when the task
 * runs in AI mode (the library's negative list is a library-gap rule and
 * does not apply — the claim boundary still governs what scenes may imply).
 */

export function getAiLifestyleSpecBlock(): string {
  return `## AI LIFESTYLE PRODUCTION — THE VISUAL LAW (scenes are GENERATED and must look like REAL UGC)

This brief is FULLY AI-GENERATED in the LIFESTYLE style: every scene is generated, looks like a
real person filmed it on a phone, and a viewer must not be able to tell. The visual cell of every row
is a GENERATION PROMPT — persona + action + setting + wardrobe + camera + light + imperfection —
not a footage description. Shot tags remain as SCENE-TYPE vocabulary, but nothing is limited to a
library. The claim boundary still governs what a scene may imply (no athletic-performance scenes,
no children, no fabricated credentials or endorsements). This law is distilled frame-by-frame from
the winning reference ads; every rule below is what made them read as REAL.

**1. THE CASTING LAW — the demo mirror is mandatory.** Every on-camera buyer-proxy reads 50-75 —
a real 60, not a Hollywood 60. Generate age texture ON PURPOSE: crow's feet, neck bands, age
spots, crepey ringed hands, visible veins, gray worn as-is, reading glasses, natural teeth.
Flawless skin is the #1 AI tell — imperfection IS the casting spec. Wardrobe is middle-American
ordinary (cardigans, henleys, robes), rotated per scene to imply days of footage, never one
shoot. Hands that demo the product MUST be the demo's hands — aged, ringed, veined; a hand demo
by the oldest credible person is the strongest proof shot in the ad. AUTHORITY CASTING: the
occupation is WORN, not staged — a generic scrub top (first name only on any tag — never a full
name, institution, or year: we do not fabricate credentials), a name-tag lanyard tossed on the
counter, a shoe-fitter's measuring device, a home-care aide's worn tote. Never a staged clinic,
whiteboard, or white-coat spokesperson. INSERT CAST: rotate several distinct demo-matched people
across b-roll so "this is you" hits every band of 50-75; give POV inserts to anonymous or gloved
hands — hand-continuity mismatches between inserts read as native stitched UGC, not fakery.

**2. PERSONA CONSISTENCY — lock one identity spec.** The narrator's full identity — exact age
read, hair color/length/style, skin-texture notes, and 2-3 FIXED IDENTITY ANCHORS (the same
glasses, same small gold hoops, same ring, same signature cardigan or scrub top) — is written
ONCE, in full, in the casting spec. THE TOOL PREPENDS THAT SPEC VERBATIM to every visual cell
when the brief is exported, so the editor's generation prompt always opens with the complete
persona — you never rewrite it per scene. Write each cell AS THE CONTINUATION of that persona
block: refer to her as 'she', never re-describe her, never contradict an anchor, and name any
wardrobe/lighting delta explicitly as a diegetic change ('same woman, now in her robe — evening
of the same day'). Anchors are what viewers track: faces may drift subtly, anchors may not. Keep talking-head clips 2-4s and cut to b-roll
before micro-drift registers; never let two versions of the same face abut. Justify variation
diegetically — wardrobe/lighting changes are different days, which launders drift as life. Give
risky shots to anonymous hands and rotating extras: variation among extras is expected; variation
in the narrator is not. If the script names an artifact (a note, a drawer of old socks), GENERATE
the artifact — a referenced-but-unshown object is a tell.

**3. THE SETTING LAW — multiply locations; clutter is credibility.** 4-8 distinct real spaces
per ad, implying footage from across the narrator's real week: the plain-door confession
backdrop; a dated bathroom (brown-gold granite, brushed nickel, toiletries standing in frame);
a lived-in living area (recliner, dated carpet, mismatched frames); a kitchen counter with a
visible WALL OUTLET and cords — show what an ad would hide; a car interior in harsh sun; ONE
authority-adjacent space (the fitting bench, the counter, the workroom — never a staged clinic)
used only for bookends. Crowded medicine cabinets, pill organizers, a drawer of failed socks
(unbranded/unrecognizable — never real competitor brands), mail on the counter. A tidy set reads
staged. LIGHTING: motivated practical light only — window daylight, tungsten lamps, blown sun —
and NEVER color-match the grade across locations: cool vs warm vs harsh is what phone footage
across days looks like; a homogenized grade is an AI-pipeline tell. A warm→cool day-to-night
shift across the edit silently proves all-day claims.

**4. CAMERA GRAMMAR — 9:16 vertical, four registers, never mixed.** (1) TALKING HEAD = selfie
language: arm's length, chest-up, lens at/slightly below eye level, drifting headroom, handheld
micro-sway — or propped-phone static, but the framing must CHANGE between locations like
separately shot clips. (2) DEMO POV = phone-in-one-hand macro: the free hand performs (pulling
socks on, pressing a swollen ankle), close focus with natural falloff, visible shake, top-down
for counters and feet. (3) EVIDENCE MACRO = extreme close-ups so tight the subject exceeds the
frame — swollen ankles, sock marks, cracked heels, vein texture: the hardest thing to fake, so
place it prominently to anchor believability. (4) PRODUCT B-ROLL = propped still-life / overhead
flat-lay, phone-on-counter look. BANNED: dolly moves, gimbal glides, cinematic pans, lighting-kit
polish, matched grades. Motion = human hands and handheld drift only; the absence of production
polish IS the grammar.

**5. EDIT RHYTHM — total visual literalism.** Cut every 2-4 seconds; no clip past ~6s except an
opening hook hold (4-13s, installs the credential + claim on one composition) and one deliberate
rhythm-brake hold on the closer. GOVERNING RULE: every concrete noun and verb in the VO gets its
matching visual within the same breath — zero orphaned lines. "Swelling by 3pm" → ankle macro;
"dig into your skin" → sock-mark close-up; "threw them out" → drawer into trash. The face returns
every 2-3 shots. The mechanism demo gets the longest uninterrupted run in the ad — 3 consecutive
fullscreen shots. CLOSE THE VISUAL LOOP: the problem image early (marked, swollen ankle) returns
resolved late in MATCHED FRAMING — before/after as a rhyme. All hard cuts; at most 2 stylized
seams per ad, placed exactly at act breaks (they also paper over shots AI can't hold). Accelerate
the final 20s into the offer; land the CTA on b-roll; end card 2-4s.

**6. OVERLAY SPEC — one caption system, added in POST, never generated in-scene.** Bold sans
karaoke-block fragments of the VERBATIM VO, 3-7 words, one card at a time, synced to speech (the
ad must work muted): black-on-white pills, or white with heavy black outline. Fixed anchor in the
lower-middle band, off faces and off the product. The first 3-4s may carry a 1-2 line stacked
headline pill in the TOP third as the thumbnail-stopper. RESTRAINT IS THE SIGNAL: no emoji, no
decoration, no brand fonts, no arrows (max one, hook only). One allowed accent: the pill flips
RED on the negative-claim lines, back for the solution. Captions parked low also double as gaze
magnets pulling eyes off generated skin, hands, and backgrounds.

**7. PRODUCT PRESENTATION — withhold, then demo.** The product stays OFF SCREEN for the problem
act (at Unaware the release order governs both channels; otherwise the argument's problem act
defines the window) — prosecute the problem with
problem props only: unbranded failed socks handled then trashed, sock-mark and swelling macros,
the 3pm shoe-off wince. FIRST APPEARANCE = MECHANISM, NOT PACK SHOT: the differentiating feature
working before the name lands (the stretch demo pulled wide by aged hands, the easy pull-on by
stiff fingers). Then the DEMO LADDER: one polished brand-coded cutaway (flat-lay — the single
"official" asset in the ad); the mechanism demo by the narrator's OWN aged hands; on-body wear in
real life. The narrator must WEAR IT on camera — the trust-on-own-body beat. The product never
floats on white until the end card — always in a hand, on a counter, on a body. Real numbers may
appear as DIEGETIC objects (the measuring tape at 30 inches, a handwritten offer card at levels
where the offer is legal) — never invented awards, never guarantee cards, never fake review
counts: our real count is 107,993.

**8. AI-TELL AVOIDANCE — text and hands are the giveaways.** NEVER generate in-scene signage,
labels, screen chrome, or small print — garbled text is the most-caught tell. All hero text is a
POST layer (captions, real UI screenshots) razor-sharp over generated footage; the product label
is crisp in exactly ONE clean reveal shot, small or angled elsewhere. One spelling of every name
across label, captions, and VO. HANDS: simple static poses or tight crops; no complex object
manipulation; risky interactions go to gloved/anonymous hands. Complex physics (water, fabric
stretch under tension) kept faceless and brief. FACES: 2-4s max per clip, buried inside familiar
UGC formats (car visor check, selfie vent). IMPERFECTION AS CAMOUFLAGE: pores, flyaways, blown
highlights, motion blur — "too imperfect to be fake." Do not homogenize the grade. Expressions
must match the VO's temperature — an over-articulated face on a mundane line is a soft tell.

**9. EVERY VISUAL CELL IS THE SCENE HALF OF A GENERATION PROMPT.** The tool prepends the full
casting spec to each cell at export, so the editor receives [persona spec] + your cell as ONE
prompt. Your cell supplies everything scene-specific: [action] + [setting + life props] +
[wardrobe for this scene, as a delta from the spec where it changes] + [camera register: which
of the four + framing/distance] + [light source] + [imperfection note]. A cell that re-describes
the persona, contradicts an anchor, or reads wrong with the persona block in front of it is a
failed row.`;
}
