/**
 * Factory V2 — UGC Style layer.
 *
 * The middle layer of the locked taxonomy: AD TYPE (UGC) → STYLE/CONCEPT
 * (this file — "the innovation layer, where 70% net-new lives") →
 * MESSAGING ANGLE (per brief). Authored from the Aug–Sep 2026 UGC Creative
 * Roadmap deck (v3.1 VERIFIED) + UGC Style Bank v1 — transcript-verified
 * against the category's longest-running ads.
 *
 * The style is the VISUAL DELIVERY LAYER: per the roadmap's thesis,
 * Andromeda reads visuals + transcript, so forty scripts inside one visual
 * skin fatigue as ONE creative — the style is what breaks the bundle.
 * Selected per task at batch creation; its guide enters the immutable
 * context pack and dictates visual grammar, shot vocabulary, script
 * register, pacing, framework leanings, and hard constraints.
 *
 * STYLE × AWARENESS RULE (global): the style dictates delivery grammar;
 * the awareness level remains the censor for WHAT may be said WHEN. Where
 * a style's typical timing conflicts with the awareness level's release
 * rules, THE AWARENESS RULES WIN.
 */

export type UgcStyleId =
  | 'ugc_yap'
  | 'ugc_authority'
  | 'ugc_gift'
  | 'ugc_gag'
  | 'ugc_weartest'
  | 'ugc_dil'
  | 'ugc_proage'
  | 'ugc_skit'
  | 'ugc_live'
  | 'ugc_ugly'
  | 'ugc_list'
  | 'ugc_promo'
  | 'ugc_pov'
  | 'ugc_demo';

export interface UgcStyle {
  id: UgcStyleId;
  name: string;
  /** Compact dropdown label. */
  shortLabel: string;
  /** 'week' = roadmap W1-6 · 'bench' = queued response-slot styles ·
   *  'bank' = Style Bank extras named in the deck's taxonomy. */
  tier: 'week' | 'bench' | 'bank';
  oneLiner: string;
  /** The full prompt guide block injected into the context pack. */
  guide: string;
}

const STYLES: Record<UgcStyleId, UgcStyle> = {
  ugc_yap: {
    id: 'ugc_yap',
    name: "True Yapper Rant — 'women our age'",
    shortLabel: 'Yapper Rant',
    tier: 'week',
    oneLiner: '60-120s single-take in-group rant; set-down camera, no cuts, no b-roll.',
    guide: `## UGC STYLE: TRUE YAPPER RANT — "WOMEN OUR AGE" (ugc_yap)

**THE FEEL:** overhearing a friend mid-rant. A 60-120 second SINGLE TAKE — set-down camera, NO cuts, NO b-roll, no music. Fast-talking, opinionated, in-group voice ("women our age… I call BS!"). This is the account's maximum visual distance from polished LoFi: raw is the strategy.
**VISUALS & SHOTS:** camera set down once (counter, shelf, dashboard) and left alone; creator chest-up at home; imperfect framing is a feature. The storyboard is essentially ONE continuous setup — do not write shot changes.
**SCRIPT RULES:** deliberately UNDER-SCRIPTED — the brief provides only: hook + problem beats + product truth + close. Write beats as talking points the creator rants across in her own words, never word-for-word lines. First-person, fast rhythm, mid-thought pivots, righteous energy. The rant is ABOUT a specific lived story (the review bank speaks fluent rant: "tried everything", sock-mark shame, family sock-theft) — never generic category complaint.
**PACING/BEATS:** open mid-rant (no warm-up), stack 2-3 escalating problem beats, land the product truth as the rant's resolution, close warm. Product intro 45s+ (style norm — awareness rules still win). Text-on-screen CTA on cutdowns.
**FRAMEWORK LEANINGS:** Confession/rant arcs — The Skeptic Converter, The Discovery Narrative, Feel-Felt-Found. AVOID tight staged structures (strict PAS beats read as scripted and kill the style).
**CREATOR SPEC:** F 45-65 natural fast talkers; location matches the story.
**ANCHORS:** Happy Mammoth 79s rant (script register, 2 copies live ~4 months) + Melissa Carcache × HM 56.5s talk-to-camera home monologue, 137 days live (delivery) — Foreplay: https://app.foreplay.co/discovery?ad=Vf8Fthl12kcqETyUSEUU`,
  },
  ugc_authority: {
    id: 'ugc_authority',
    name: 'Authority Teardown — talk-only',
    shortLabel: 'Authority Teardown',
    tier: 'week',
    oneLiner: 'Tier-lists and "never again" listicles talked to camera at home; education with late product entry.',
    guide: `## UGC STYLE: AUTHORITY TEARDOWN — TALK-ONLY (ugc_authority)

**THE FEEL:** a plain-spoken veteran explaining what she's learned so you don't repeat her mistakes. Long education (60-140s) that EARNS retention by teaching — tier-lists ("3/10… 9/10"), "never again" listicles, category teardowns.
**VISUALS & SHOTS:** talk-to-camera at HOME. NO medical settings, NO equipment, NO demonstrations. Simple product-in-hand moments only when the education reaches the product.
**SCRIPT RULES:** teach a real mechanism or criteria list; tear down the category's failures before presenting the answer. HARD CONSTRAINT: credentials are PASSING-MENTION ONLY ("As a nurse, this is what I saw all the time") — never the centerpiece, never borrowed authority. The veteran-WEARER persona ("20 years of compression socks — never again") delivers the same power with zero occupational claims. Every claim rides the claim boundary; teardown targets are category-generic, never named competitors.
**PACING/BEATS:** hook = the mistake/lie/criteria promise → numbered education beats (each teaches ONE thing) → the answer arrives as the education's conclusion. LATE product entry (~30-49s style norm — the verified retention engine; awareness rules still win, e.g. Product Aware keeps brand-early).
**FRAMEWORK LEANINGS:** The Myth Buster, The Reason-Why (Hopkins), Empathy-Education-Evidence, The Contrast Framework. Numbered-list structures thrive here.
**CREATOR SPEC:** F 50-70 plain-spoken explainers.
**ANCHORS:** Hollow's "never again" listicle (59s/144d) + tier-list (70s/144d) — structure (Foreplay: https://app.foreplay.co/discovery?ad=hzXvJL6nf0545OxzXaq8); Primal Queen doctor teardown 141s/188d — delivery. The female 45-70 long teardown is an open lane in the category.`,
  },
  ugc_gift: {
    id: 'ugc_gift',
    name: 'Caregiver Gift Duo-Dialogue',
    shortLabel: 'Caregiver Gift Duo',
    tier: 'week',
    oneLiner: 'Creator + their OWN parent: unboxing → reaction → mini-interview → gift CTA.',
    guide: `## UGC STYLE: CAREGIVER GIFT DUO-DIALOGUE (ugc_gift)

**THE FEEL:** a real family moment caught on a phone — adult child gives parent the socks, the parent's genuine reaction is the payoff. Warmth with dignity: validate, NEVER pity (Pillar 2).
**VISUALS & SHOTS:** two people, real home; phone handheld or propped; unboxing at the kitchen table / mailbox walk; close-up on hands during the try-on; faces during the reaction. The parent on camera is the authenticity asset no actor matches.
**SCRIPT RULES:** REAL DIALOGUE, not narration — write conversational exchanges ("Look what Emma got me… so much room I can wiggle my toes!") plus an embedded MINI-INTERVIEW (2-3 gentle questions: "When did the pain start?" "About five years ago"). The adult child narrates setup; the parent's words carry the proof. Caregiver review verbatim is fuel: "I noticed before she did", "My dad can finally put on his own socks" (9.3% of ES reviews are caregiver purchases).
**PACING/BEATS:** setup (why I bought these for mom/dad, ~10s) → unboxing/handover → try-on + genuine reaction → mini-interview → gift-framed CTA ("if someone you love…"). Two-person dialogue holds 80+ seconds when the reaction is real.
**FRAMEWORK LEANINGS:** Star-Story-Solution (the parent is the star), Before-After-Bridge, Feel-Felt-Found. Independence is Core Fear #1 — the duo delivers it with dignity.
**CREATOR SPEC:** creator 30-55 with a willing parent/spouse 60+ at home. The 35-year-old marketplace creator is CORRECTLY CAST as the adult child — this style solves creator-age scarcity structurally.
**ANCHORS:** OrthoFeet daughter-gifts-mom duo (53s, 76 days, transcript-verified dialogue + embedded interview) — Foreplay: https://app.foreplay.co/discovery?ad=BnJa6Av2eHvjidw3vzMk — theirs is polished with actors; ours goes rawer with a real parent.`,
  },
  ugc_gag: {
    id: 'ugc_gag',
    name: 'Comedy Running-Gag Confession',
    shortLabel: 'Running-Gag Comedy',
    tier: 'week',
    oneLiner: '"Welp, I did it again" — physical-proof humor with a 3-strike gag structure; solo self-filmed.',
    guide: `## UGC STYLE: COMEDY RUNNING-GAG CONFESSION (ugc_gag)

**THE FEEL:** a woman cheerfully confessing a habit she's given up fighting. Self-deprecating warmth — laughing WITH herself, NEVER at the customer (Quiet Confidence tone gate).
**VISUALS & SHOTS:** solo self-filmed; every gag beat carries PHYSICAL PROOF on camera — the sock drawer overflowing, the order stack, the pattern tally on the fridge. Evidence disguised as comedy. Simple cuts between proof shots are allowed (unlike the yapper).
**SCRIPT RULES:** the 3-STRIKE GAG STRUCTURE is the skeleton: strike 1 ("the first pair was a fluke") → strike 2 ("then these") → strike 3 + confession ("again… I did it again"). Escalation, then the laugh, then the honest reason why. The funniest material is REAL: 19.5% of customers are repeat-buying collectors; "I bought so many of these socks I'm beginning to worry about my sanity" is an actual review quote.
**PACING/BEATS:** comedy lives in the FIRST BEAT — the hook must land the joke's premise inside 3 seconds. Keep total 30-60s; gags sag past that.
**FRAMEWORK LEANINGS:** confession arcs, The Identity Alignment (collector identity), Hook-Story-Offer with the story AS the gag. Avoid education-heavy structures.
**CREATOR SPEC:** F 40-60 with comedic timing.
**ANCHORS:** Primal Queen's ripped-pants confession — 461 DAYS live at 59s, physical evidence + escalation + laugh (Foreplay: https://app.foreplay.co/discovery?ad=5bZqFzzTxisTWZ9OmMYn). Humor in creator register = extreme longevity in this demo.`,
  },
  ugc_weartest: {
    id: 'ugc_weartest',
    name: 'Wear-Test Diary + Day-0 Opener',
    shortLabel: 'Wear-Test Diary',
    tier: 'week',
    oneLiner: 'Day-counted self-test; Day-0 variant asserts nothing ("just ordered, follow along").',
    guide: `## UGC STYLE: WEAR-TEST DIARY + DAY-0 OPENER (ugc_weartest)

**THE FEEL:** a skeptic documenting her own experiment. Nothing asserted, everything OBSERVED — the day-count is the spine and the built-in retention device.
**VISUALS & SHOTS:** self-filmed diary entries across days — same location/angle repeated for comparability (the ME before/after discipline: same clothes, same framing); date/day text overlays; close-ups of the evidence (marks at 6pm, the calf photographed nightly, wash #47).
**SCRIPT RULES:** Day-0 opener variant is CLAIM-FREE by design: "Everyone keeps posting these. Fine — I ordered. Follow along." Later-day variants report observations in past tense with specifics ("Day 1: I think I wasted $60. Day 30: I owe an apology"). HARD CONSTRAINT: self-test framing ONLY — NEVER money-back/guarantee language. Durability doubt dies by evidence ("wash 47"), not by claims.
**PACING/BEATS:** day-markers ARE the beats: Day 0 setup → Day 1 skepticism → mid-test turn → verdict day. Sequel-ready: each brief should set up Day-7/Day-30 follow-ups (built-in series volume).
**FRAMEWORK LEANINGS:** The Skeptic Converter (native — already proven on our account), Before-After-Bridge, The Demonstration Proof.
**CREATOR SPEC:** F 45-65 (self-story credibility is the currency).
**ANCHORS:** OrthoFeet's 60-Day Wear Test evergreen skeleton; HM's Day-0 format (36s/95d, claim-free); the Kia-graded ✓ Destany wear-test UGC — real multi-location self-filmed day with the test pitched in her own words.`,
  },
  ugc_dil: {
    id: 'ugc_dil',
    name: 'Chaptered Day-in-Life',
    shortLabel: 'Day-in-Life',
    tier: 'week',
    oneLiner: '"Come with me through Tuesday" — time-chaptered routine vlog with mandatory talk-to-camera moments.',
    guide: `## UGC STYLE: CHAPTERED DAY-IN-LIFE (ugc_dil)

**THE FEEL:** "come with me through Tuesday" — a real day, time-chaptered, with the product's role visible instead of claimed. Occupational identity does the targeting (nurse shift, classroom setup, garden day).
**VISUALS & SHOTS:** creator films HERSELF across real locations through the day; time-stamps as chapter cards ("4:45am… lunch… five o'clock"); a verdict moment at day's end. HARD CONSTRAINT (Kia's graded verdict, locked): TALK-TO-CAMERA MOMENTS ARE MANDATORY between VO chapters — never pure VO throughout.
**SCRIPT RULES:** chapters narrate the day plainly; the product appears as the day's quiet constant, not its topic; the verdict beat speaks the conclusion to camera ("do I feel like sitting on the couch, or do I feel like a person?"). No claims — the day IS the evidence.
**PACING/BEATS:** 3-5 time chapters + verdict. Time-chapters give editors natural cutdown points: one shoot = 60s mainline + 30s + 15s cutdowns — write chapters so each survives alone.
**FRAMEWORK LEANINGS:** The Day-in-Life (native), The Identity Alignment, Discovery Narrative for the verdict turn.
**CREATOR SPEC:** occupational-lite; the 60-75 retiree slot is the flagship (biggest demographic gap); male casting fills the male-content gap.
**ANCHORS:** Wellow's "Come with me through Tuesday" (42s, transcript-verified time-chapters) — Foreplay: https://app.foreplay.co/discovery?ad=zGOSx9AiGyEyOLalWwqM; Kia-graded #8 Destany day-in-life (44.9s) — verdict: good style, ADD talk-to-camera moments.`,
  },
  ugc_proage: {
    id: 'ugc_proage',
    name: 'Pro-Age Identity Demo — "women our age"',
    shortLabel: 'Pro-Age Demo',
    tier: 'bench',
    oneLiner: 'Named woman 55-75 demos the product in in-group voice — celebration over shame.',
    guide: `## UGC STYLE: PRO-AGE IDENTITY DEMO (ugc_proage)

**THE FEEL:** Boom's playbook — an age-authentic NAMED woman ("Hi, I'm Linda, 63") demonstrates the product in in-group voice: "us," NEVER "you people with problems." Celebration over shame (Pillars 2 & 5 in delivery form).
**VISUALS & SHOTS:** GRWM-style at home; the woman's face and hands prominent; the demo is unhurried and personal ("here's how it looks on"); gray hair on camera is the point, not a problem.
**SCRIPT RULES:** first-person named intro; pro-age reframes ("signs of a life well lived") applied to sock marks; tutorials disguise the sell ("5 sock rules for over-50 feet"); flip framings welcome ("socks designed for younger legs — that was the problem"). Never shame-based hooks.
**PACING/BEATS:** intro + identity → the demo/tutorial as the body → in-group recommendation close.
**FRAMEWORK LEANINGS:** The Identity Alignment (native), The Demonstration Proof, Feel-Felt-Found.
**CREATOR SPEC:** F 55-75 REQUIRED, named on camera — the scarce-creator style; schedule once creators are secured.
**ANCHORS:** Boom by Cindy Joseph 60s GRWM — gray-haired woman 55+ at home, product in hand, full deictic transcript; account-wide "women our age" identity copy — Foreplay: https://app.foreplay.co/discovery?ad=zfnTucHcaTwMGDuhTXh7`,
  },
  ugc_skit: {
    id: 'ugc_skit',
    name: 'Retro Skit / Character Duo',
    shortLabel: 'Retro Skit',
    tier: 'bench',
    oneLiner: 'Character comedy and two-person interactions — gentle-funny only.',
    guide: `## UGC STYLE: RETRO SKIT / CHARACTER DUO (ugc_skit)

**THE FEEL:** a scripted sketch — pattern interrupt via fiction. Highest visual contrast against everything else on the account. TONE GATE: gentle-funny, never mocking (Quiet Confidence).
**VISUALS & SHOTS:** costume/set gag or duo interaction in a real home; commitment to the bit ("1962 called: sock technology answered" retro housewife; mother-daughter negotiating the sock drawer; two nurses comparing shift rituals). Props simple and household-real.
**SCRIPT RULES:** written dialogue IS allowed here (the one style where word-for-word is native) — but keep lines short and playable by non-actors; the joke carries the structure; the product resolves the bit.
**PACING/BEATS:** premise inside 3s → escalate the bit → product as punchline resolution → light CTA.
**FRAMEWORK LEANINGS:** The Contrast Framework (era/character contrast), Hook-Story-Offer.
**CREATOR SPEC:** creators with acting chops; duo = 2 creators or creator + family member.
**ANCHORS:** Kizik's pink-kitchen landline skit (multi-version) — Foreplay: https://app.foreplay.co/discovery?ad=VYWz3CNQ6oOyUxKcqmjy`,
  },
  ugc_live: {
    id: 'ugc_live',
    name: 'Fake Live / Chat-Overlay',
    shortLabel: 'Fake Live',
    tier: 'bench',
    oneLiner: 'Staged live-stream with chat beats — filmed as UGC, badges added in post.',
    guide: `## UGC STYLE: FAKE LIVE / CHAT-OVERLAY (ugc_live)

**THE FEEL:** a casual "live" — the LIVE badge + scrolling chat is the strongest "not an ad" disguise. Creator answers the chat's questions about her socks in real time.
**VISUALS & SHOTS:** handheld selfie or propped phone, home or store aisle ("LIVE from the sock aisle"); creator reads/reacts to chat questions; chat overlay + badges added IN POST (write the chat beats into Video Editor Notes).
**SCRIPT RULES:** script the CHAT BEATS (questions appearing on screen) and the creator's conversational answers — objections pre-handled as chat questions ("do they roll down?" "ok but do they work with wide calves??"). Delivery must feel unrehearsed; answers in her own words around scripted beats.
**PACING/BEATS:** live greeting → 3-5 chat Q&A beats (each one objection or benefit) → casual close with where-to-get-them.
**FRAMEWORK LEANINGS:** The Objection Crusher (native — chat questions ARE the objections), Empathy-Education-Evidence.
**CREATOR SPEC:** F 40-55, improv-comfortable.
**ANCHORS:** our own SOX-1139 "LIVE from the sock aisle" (fully scripted with chat beats designed) — film as UGC.`,
  },
  ugc_ugly: {
    id: 'ugc_ugly',
    name: 'Ugly Raw Monologue',
    shortLabel: 'Ugly Raw Monologue',
    tier: 'bench',
    oneLiner: 'Set-down camera, no cuts, no music — the yapper\'s shorter raw sibling. Kia-graded #2 style.',
    guide: `## UGC STYLE: UGLY RAW MONOLOGUE (ugc_ugly)

**THE FEEL:** the yapper's shorter, quieter sibling — a set-down camera monologue with zero production. Kia-graded #2 style on our own account: the raw set-down monologue is PROVEN.
**VISUALS & SHOTS:** camera set down once, no cuts, no music, no b-roll, no captions beyond a minimal CTA; imperfect light and framing are features. 20-60s.
**SCRIPT RULES:** one story, told plainly to camera as if to a friend who asked. Under-scripted: hook + 1-2 beats + product truth + close as talking points. Quieter register than the yapper — confession over rant.
**PACING/BEATS:** open mid-thought → the story → the honest recommendation. No performance, no build.
**FRAMEWORK LEANINGS:** Confession arcs, Feel-Felt-Found, The Discovery Narrative.
**CREATOR SPEC:** any F 40-70 who can talk naturally; casting for realness over polish.
**ANCHORS:** our own graded winner (#2 verdict); the style is internal-proven — the exemplar you pin from the bank is the primary reference.`,
  },
  ugc_list: {
    id: 'ugc_list',
    name: 'Routine-Listicle',
    shortLabel: 'Routine-Listicle',
    tier: 'bench',
    oneLiner: '"3 little things that help me feel like myself" — product embedded as habit #3, never the topic.',
    guide: `## UGC STYLE: ROUTINE-LISTICLE (ugc_list)

**THE FEEL:** a small personal list shared generously — "3 little things that help me feel like myself." The product is EMBEDDED AS ONE HABIT, never the topic of the video.
**VISUALS & SHOTS:** each list item gets its own quick scene (the morning tea, the walk, the socks going on); talk-to-camera intro and outro; natural home footage between.
**SCRIPT RULES:** the list frame carries the sell: items 1-2 are genuinely product-free habits (real, relatable, specific); the product is item #3 (or #2 of 3) presented with the same casual weight ("and these — non-negotiable"). Understatement IS the persuasion. Never let the product take over the list.
**PACING/BEATS:** intro promise → item 1 → item 2 → item 3 (product, same energy) → soft close. 30-60s.
**FRAMEWORK LEANINGS:** The Reason-Why in miniature, The Identity Alignment; listicle structure is the framework's skin.
**CREATOR SPEC:** F 45-65; warm, unhurried delivery.
**ANCHORS:** HM's routine-listicle (77d) — product as habit #3 mechanic.`,
  },
  ugc_promo: {
    id: 'ugc_promo',
    name: 'Creator-Voiced TWS Promo',
    shortLabel: 'TWS Promo (BOF)',
    tier: 'bench',
    oneLiner: 'The sale ad AS a casual creator clip — BOF/retargeting only; honest offers, no fake scarcity.',
    guide: `## UGC STYLE: CREATOR-VOICED TWS PROMO (ugc_promo)

**THE FEEL:** the sale announcement delivered as a casual creator clip — a friend telling you the thing she loves is on deal, PQ's 443-day sale-ad mechanic. PLACEMENT: BOF/retargeting ONLY (drops target existing/warm buyers — "joy after relief" honored).
**VISUALS & SHOTS:** casual clip energy: creator with the product/patterns in hand, unbox-and-react to the drop, "the pattern the group chat fought over"; collection shots welcome.
**SCRIPT RULES:** name + deal early and plainly (this style is Most-Aware-native — brand and offer belong up front); genuine enthusiasm, ZERO fake urgency or price-slash theatrics; real scarcity only when true (restocks, limited patterns). Collector identity is the emotional engine (19.5% repeat-buying collectors).
**PACING/BEATS:** the deal in the first sentence → why she loves them (fast, personal) → the honest terms → direct CTA. 15-40s.
**FRAMEWORK LEANINGS:** Hook-Story-Offer compressed; the offer IS the story.
**CREATOR SPEC:** any F 40-65 with collector energy.
**ANCHORS:** Primal Queen's creator-voiced sale ad, 443 days live; The Ridge's drop-capsule engine — Foreplay: https://app.foreplay.co/discovery?ad=EJhjsvAYSJ3faz9keiPc`,
  },
  ugc_pov: {
    id: 'ugc_pov',
    name: 'Faceless POV + Bold Overlay',
    shortLabel: 'Faceless POV',
    tier: 'bank',
    oneLiner: 'Phone-filmed first-person feet/hands/legs — contrarian text overlay does the talking.',
    guide: `## UGC STYLE: FACELESS POV + BOLD OVERLAY (ugc_pov)

**THE FEEL:** first-person phone footage of feet/hands/legs — no face, no performance. The bold contrarian TEXT OVERLAY does the hooking; the footage proves the scene. Muted-safe by design; Wellow's top-impression style.
**VISUALS & SHOTS:** POV shots only: the end-of-day sock-peel with mark reveal, the morning put-on, the 6pm shoe-off in the car, feet crossed on the couch. Each storyboard row = one POV scene; overlay text specified per shot in Video Editor Notes.
**SCRIPT RULES:** the OVERLAY TEXT is the script — short contrarian/scene-identification lines ("You SHOULD wear compression in summer", "this wellness hack feels illegal", "the 6pm shoe-off tells you everything"). VO optional; if used, minimal and matching the overlay register. Scene-identification openers are Unaware-native.
**PACING/BEATS:** hook overlay on the first frame → 2-4 POV scenes each advancing the idea → product/CTA overlay at the end.
**FRAMEWORK LEANINGS:** The Contrast Framework, scene-first Gradualization-style release; structure lives in overlay sequencing.
**CREATOR SPEC:** ANY creator (no face) — cheapest, fastest, age-proof; multiple angles per creator per day.
**ANCHORS:** Wellow's top-impression POV cohort (couch/walking/crossed-feet POV + contrarian overlays).`,
  },
  ugc_demo: {
    id: 'ugc_demo',
    name: 'Demo / Proof Stunt',
    shortLabel: 'Demo Stunt',
    tier: 'bank',
    oneLiner: 'One repeatable physical test as the whole ad — seeing beats claiming.',
    guide: `## UGC STYLE: DEMO / PROOF STUNT (ugc_demo)

**THE FEEL:** one repeatable physical test IS the ad — KURU's glow-heel demo has run 11+ months on this model. Seeing beats claiming; demos convert skepticism visually.
**VISUALS & SHOTS:** the test performed clearly on camera, close-up, real hands: the 30-Inch Stretch Test (tape measure on camera), the Mark Test (one calf each sock, 6pm reveal), One-Hand-Ten-Seconds application timer, the stays-up errand torture test. Repeatability is the point — the same demo can anchor many ads.
**SCRIPT RULES:** narrate the test as it happens, plain and specific ("that's thirty inches — and it goes back"); state the stakes before the test ("if these dig in like the others, you'll see it right here at 6pm"); let the result land visually before any conclusion. Numbers only when TRUE — measured on camera, never invented.
**PACING/BEATS:** stakes → test setup → the test (the longest beat — let it breathe) → result reveal → one-line conclusion + CTA. 15-60s.
**FRAMEWORK LEANINGS:** The Demonstration Proof (native), Before-After-Bridge for the Mark Test.
**CREATOR SPEC:** any age for object demos; 55-70 REQUIRED for the one-hand application demo (the demographic proof IS the ad).
**ANCHORS:** KURU glow-heel demo (11+ months) — fb ads library id 1493720522129513; Kizik's 231-day creator clip built around ONE demo.`,
  },
};

export const UGC_STYLE_IDS = Object.keys(STYLES) as UgcStyleId[];

export function getUgcStyle(id: UgcStyleId): UgcStyle {
  return STYLES[id];
}

/** The prompt block for the context pack. */
export function getUgcStyleBlock(id: UgcStyleId): string {
  const s = STYLES[id];
  return `${s.guide}

**STYLE × AWARENESS (binding):** this style dictates the DELIVERY GRAMMAR — visuals, shots, register,
pacing. The awareness level remains the censor for WHAT may be said WHEN. Where the style's typical
timing conflicts with the awareness level's release rules, THE AWARENESS RULES WIN (e.g. a Product
Aware brief keeps brand-in-first-3-seconds even inside an education style; an Unaware brief keeps
the elimination rules even inside a promo-capable style).`;
}
