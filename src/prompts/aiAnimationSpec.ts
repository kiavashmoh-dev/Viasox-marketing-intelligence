/**
 * THE AI ANIMATION VISUAL SPEC — for fully-AI-generated ecom briefs whose
 * visuals are ANIMATION (claymation and other AI-animation styles; the
 * director's "AI Animation" subsection — the sibling of aiLifestyleSpec.ts).
 *
 * Production mode 'ai-animation': nothing is pulled from the footage
 * library and nothing pretends to be real footage — every scene is a
 * GENERATED animation. The SCRIPT does not change: it is still one real
 * person's story with the full Stakes Engine (pain, knife beats, verbatim
 * VO). Animation is the visual instrument that carries it — the reference
 * pattern is the claymation ads in the Inspiration Bank.
 *
 * Replaces the footage-library block in the ecom context pack when the
 * task runs in animation mode. The claim boundary governs in full: visual
 * exaggeration may express FELT experience (a stylized squeeze, a visible
 * throb), never a measurable promise or a mechanism we don't have.
 */

export function getAiAnimationSpecBlock(): string {
  return `## AI ANIMATION PRODUCTION — THE VISUAL LAW (scenes are GENERATED ANIMATION — no real faces)

This brief is FULLY AI-GENERATED in an ANIMATION style: no real faces, no pretend-UGC — an
animation carries the story. THE SCRIPT DOES NOT CHANGE: it is still ONE person's story in her own
voice, with the pain ladder, the knife beats, and the verbatim-VO law all binding. What changes is
the instrument: the visual cell of every row is a GENERATION PROMPT for an animated scene — style +
character + action + set + camera/motion + light + texture — not a footage description. Shot tags
remain as SCENE-TYPE vocabulary.

**1. THE CONTRAST ENGINE (why animation earns its place).** A handmade, charming surface lets the
heaviest TRUE story land without flinching: the viewer drops ad-defenses for animation while the VO
does exactly what our ecom DNA demands — names the condition, twists the knife, teaches the
mechanism. Never soften the script because the visuals are cute; the tension between warm visuals
and hard truth IS the format. An animation with a defanged script is a failed brief.

**2. THE STYLE DECLARATION LAW.** Declare ONE animation style in the plan and the casting/style
spec, and hold it in EVERY scene — style drift is animation's version of casting drift. Choose the
style FOR the story (name the reason in one clause): claymation/stop-motion (tactile, imperfect,
warmest — the house default), felt/fabric miniatures (softest, comfort-coded — natural fit for a
sock story), paper cutout (graphic, quick, best for listy teardowns), stylized 3D (roundest and
most polished — use when the concept needs physical simulation like stretch), painterly 2D (most
emotional interiority). The style's FULL texture description is written ONCE, in the style +
character spec — e.g. 'handmade claymation, visible fingerprints in the clay, slightly imperfect
surfaces, miniature-set depth of field, stop-motion cadence'. THE TOOL PREPENDS THAT SPEC
VERBATIM to every visual cell at export, so each generation prompt opens with the full style —
you never rewrite it per scene; you write cells that never contradict it.

**3. THE CHARACTER DESIGN LAW.** The narrator's avatar reads as the BUYER, translated into the
style: silver/gray hair in yarn or clay, reading glasses, a cardigan, softly rounded proportions
— warm and DIGNIFIED. Never a caricature of age, never a joke at her expense: she is the hero
telling her own story. Write ONE character model spec (proportions, palette, wardrobe, plus 2-3
FIXED ANCHORS — the same glasses, the same brooch, the same cardigan color) into the style +
character spec; the tool prepends it to every visual cell at export, so anchors never flicker
and you never re-describe her per scene — cells refer to her as 'she' and name only what this
scene changes. When the concept uses an AUTHORITY narrator, the avatar wears the occupation
in-style (a tiny clay name tag, a felt scrub top, a miniature measuring stick) — the playbook's
rules still bind. Supporting characters are specced in full in the same spec.

**4. THE METAPHOR ENGINE (animation's superpower).** Animation shows what real footage cannot —
use it on the exact beats where the script needs it most: the tight sock as a band cinching a
soft clay leg (the tourniquet effect made visible); swelling as the foot gently growing through
the day; pooling as liquid settling downward; relief as the leg exhaling when the right pair
goes on; the 30-inch stretch pulled wide in charming disbelief. Map EVERY knife beat and the
mechanism beat to a named visual metaphor in the plan. THE LICENSE: exaggeration expresses FELT
experience and true mechanism — it never invents a measurable claim, a medical outcome, or a
mechanism outside the bank. The VO and overlays stay literal and claim-boundary-true; the
pictures carry the poetry.

**5. SET & WORLD.** Miniature-set logic: the same humble, domestic world our buyer lives in —
the kitchen, the bedside, the recliner, the pharmacy counter — rebuilt in-style with handmade
props and visible craft texture (fingerprints in clay, fabric weave, paper edges). One
consistent world palette and scale across the ad; soft practical miniature lighting with real
falloff and shadows. Clutter still reads as life (tiny pill organizer, tiny mail pile). The
world must feel HANDMADE, never sterile CGI-clean — visible craft is this mode's authenticity,
the way imperfection is lifestyle's.

**6. CAMERA & MOTION.** Stop-motion cadence for claymation/felt (the slightly stepped 8-12fps
feel — specify it); smoother motion only for stylized 3D/2D. Unlike lifestyle, deliberate
camera moves are LEGAL here — the medium is overtly crafted, so a slow push-in on the squeezing
band or an overhead reveal of the miniature bedroom reads as craft, not as ad polish. Cuts still
run 2-4 seconds and the LITERALISM LAW still governs: every concrete noun and verb in the VO
gets its matching animated visual in the same breath — zero orphaned lines. Close the visual
loop: the problem image early returns RESOLVED late in matched framing.

**7. PRODUCT PRESENTATION.** The product is the ONE thing rendered faithful: the colorway,
pattern, and packaging must be instantly recognizable in-style (a clay sock still wears OUR
pattern). The mechanism demo is the metaphor's RESOLUTION — the gentle band that doesn't cinch,
the top that stretches wide — staged as the longest, most loving sequence in the ad. The END
CARD may break style and cut to the REAL product photo with the offer (the proven pattern);
mid-ad style breaks are banned. Offer objects appear as handcrafted diegetic props (a tiny
painted sale sign) only at awareness levels where the offer is legal.

**8. OVERLAYS & TEXT.** The same post-only caption system as all ecom: bold pill captions,
verbatim VO fragments, 3-7 words, lower-middle band, synced to speech — added in POST, never
generated in-scene. Generated in-scene text garbles in animation exactly as it does in
live-action: any in-world text is a handcrafted PROP with at most 1-2 short words (a stitched
'OUCH', a tiny 'SALE' sign), used sparingly and legible in one frame.

**9. EVERY VISUAL CELL IS THE SCENE HALF OF A GENERATION PROMPT.** The tool prepends the full
style + character spec to each cell at export, so the editor receives [style + character spec] +
your cell as ONE prompt. Your cell supplies everything scene-specific: [action] + [set +
handmade props] + [camera + motion cadence] + [light] + [craft-texture note]. A cell that
re-describes the style or the character, contradicts an anchor, or reads wrong with the spec
block in front of it is a failed row.`;
}
