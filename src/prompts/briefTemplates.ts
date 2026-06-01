/**
 * Brief Templates — only TWO templates, mirroring the historic Viasox
 * delivery structure.
 *
 *   • AGC template (CSV) — every PRODUCTION brief. AGC, Founder Style,
 *     Spokesperson, Filmed Podcast (Fake Podcast Ads), Packaging/Employee,
 *     UGC. Same 9-hook matrix, same 10-column shot table, same Building
 *     Block rules — the AD-TYPE NUANCE block injects the per-format
 *     flavoring (talent type, setting, body format, etc.).
 *
 *   • Ecom template (Doc) — every EDITING brief. Ecom Style, Full AI
 *     variants, AI Podcast. Same 8-section structure — the AD-TYPE NUANCE
 *     block injects per-format flavoring (AI generation prompts for Full
 *     AI, dialogue + avatar specs for AI Podcast, footage library tags
 *     for Ecom Style).
 *
 * Static keeps its own inline format in scriptPrompt.ts (single-image,
 * fundamentally different from the video brief shape).
 */

import type { ScriptParams } from '../engine/types';

// ─── Template Router ────────────────────────────────────────────────────

export type BriefTemplateId = 'ecom' | 'agc' | 'ugc' | 'fullai';

/**
 * Map an ad type to its delivery template.
 *   - Production path → 'agc' (CSV, 10-col table, 9-hook matrix)
 *   - Editing path    → 'ecom' (DOC, 4-col tables, 3 hooks)
 *   - Creator path    → 'ugc' (DOC, 3-col body table, 5 hooks) — for
 *                       regular creators filming themselves on their phone.
 *                       Stripped of production jargon; uses the editing-
 *                       brief DOC styling but with simpler content.
 *   - AI path         → 'fullai' (DOC, 2-col body table + line numbers) — for
 *                       100% AI-generated ads. Strips the Shot Type column
 *                       entirely (no real shot types exist for AI generation)
 *                       and renames "Script Line" → "Voiceover" so the model
 *                       has no ambiguity about what spoken words go where.
 */
export function getBriefTemplateId(adType: ScriptParams['adType']): BriefTemplateId {
  switch (adType) {
    // Production — anything Nora films with hired talent + a crew
    case 'AGC (Actor Generated Content)':
    case 'Founder Style':
    case 'Spokesperson':
    case 'Fake Podcast Ads':
    case 'Packaging/Employee':
      return 'agc';

    // Creator path — handed to a regular non-technical creator
    case 'UGC (User Generated Content)':
      return 'ugc';

    // AI-generated path — no real shot types apply
    case 'Full AI (Documentary, story, education, etc)':
      return 'fullai';

    // Editing — anything assembled from footage with real shot-type tags
    case 'Ecom Style':
    case 'AI Podcast':
      return 'ecom';

    default:
      return 'ecom';
  }
}

// ─── Shared helpers ─────────────────────────────────────────────────────

function promoLine(offer: ScriptParams['offer']): string {
  if (offer === 'B2G3') return 'Buy 2 Get 3 Free (5 for $60)';
  if (offer === 'B1G1') return 'Buy 1 Get 1 Free';
  return 'None';
}

function valueCallout(offer: ScriptParams['offer']): string {
  if (offer === 'B2G3') return '5 Pairs for $60 ($12 per pair, $90 worth of free socks)';
  if (offer === 'B1G1') return '2 Pairs for $30';
  return 'None';
}

function productLabel(product: ScriptParams['product']): string {
  if (product === 'EasyStretch') return 'EasyStretch Socks (Non-Binding Diabetic Socks)';
  if (product === 'Compression') return 'Compression Socks (Knee-High)';
  if (product === 'Ankle Compression') return 'Ankle Compression Socks';
  return product;
}

// ─── AD-TYPE NUANCE blocks ──────────────────────────────────────────────
//
// These tell the LLM how to flavor the strategic content for the specific
// ad type, even though the OUTPUT STRUCTURE is the same AGC or Ecom shape.
// Same brief skeleton, different soul.

function agcAdTypeNuance(adType: ScriptParams['adType']): string {
  switch (adType) {
    case 'AGC (Actor Generated Content)':
      return `**AD TYPE: AGC — Hired actor + full crew.**
- Location: cinematic, controlled environment (home interior, outdoor location, studio with set dressing). Specify the world.
- Talent: hired actor in their 30s-60s embodying the target persona. Describe age range, look, energy, wardrobe, personality.
- Body format: ${'agcBodyFormat' in (({} as ScriptParams)) ? 'see agcBodyFormat param' : 'Face-to-Camera OR POV — pick one and stay consistent'}.
- The viewer should NOT realize this is acted. It should feel authentic but look elevated.`;

    case 'Founder Style':
      return `**AD TYPE: Founder Style — The actual Viasox founder (or a stand-in playing the founder) speaks directly to camera.**
- Location: the founder's authentic environment — Viasox warehouse, his office, packing station. The environment IS the proof.
- Talent: a man in his 40s-60s, business-casual, warm authority. NOT polished commercial — authentic founder energy.
- Body format: predominantly ON CAMERA (face-to-camera). VO inserts allowed for B-roll cutaways but the founder's face anchors the ad.
- Voice: personal, passionate, first-person. "Let me tell you why we built this..." energy. NOT a polished script — sounds like a real conversation.
- Opening: dramatic establishing shot of the warehouse (scale and inventory visible), then settle into medium shot on the founder.`;

    case 'Spokesperson':
      return `**AD TYPE: Spokesperson — Credentialed expert (nurse, doctor, podiatrist, healthcare professional) presents the product.**
- Location: clean studio OR an environment that reinforces authority (clinic backdrop, professional desk with credentials visible). NOT the founder's warehouse.
- Talent: credentialed-looking 35-60+ year old. Smart-casual to professional wardrobe. Credentials should be visible or named (scrubs, white coat, name tag, "Registered Nurse, 12+ years bedside").
- Body format: ON CAMERA primary. The expert's face + voice carry credibility.
- Voice: authoritative, evidence-based, warm. NOT salesy. Educator energy — "the most knowledgeable woman in the room who's also the kindest."
- Every claim must be defensible — flag any unverifiable assertion for review.`;

    case 'Fake Podcast Ads':
      return `**AD TYPE: Filmed Podcast — Two real hosts in a podcast set having a scripted conversation that feels organic.**
- Location: podcast set — two chairs, table, podcast mics visible, warm lighting, plants/bookshelves in background.
- Talent: TWO people. Host A = curious questioner / "skeptic" who asks what the viewer is thinking. Host B = the "believer" / experienced user who answers with specifics. Visually distinct from each other (age, wardrobe, vibe).
- Body format: DIALOGUE. Lines column alternates between Host A and Host B. Use the Talent Notes column to indicate which host speaks each line ("HOST A", "HOST B").
- The PRODUCT DISCOVERY MOMENT must feel earned — not a forced ad break. Build curiosity in Host A, then Host B reveals.
- 3 camera angles assumed: two-shot wide, Host A close-up, Host B close-up.`;

    case 'Packaging/Employee':
      return `**AD TYPE: Packaging / Employee — Behind-the-scenes warehouse content with actors playing employees.**
- Location: warehouse zones — picking aisle (shelves of inventory), packing station (table, tape gun, boxes), loading dock (packages stacked). The workplace IS the visual story.
- Talent: 1-3 actors playing employees. Wardrobe = branded apron / casual workwear / shipping uniform. Cast for relatability, NOT glamour.
- Body format: mix of POV/SCRIPT (VO over employee action) and brief ON CAMERA moments. Each row should describe what the employee is physically doing (picking, inspecting, packing, labeling, handing off).
- Use the Shot Notes column to specify the warehouse zone for each shot.
- Voice: warm, industrious, human. NOT corporate. ASMR-adjacent packing rhythm is welcome.`;

    case 'UGC (User Generated Content)':
      return `**AD TYPE: UGC — Raw, phone-shot, native-feeling content from a "real person."**
- Location: real-world environments — the talent's home (couch, kitchen, bathroom), car, office, walking around. NOT a studio.
- Talent: real-person aesthetic — phone-shot framing, natural light, unstaged. Cast a 35-65 year old who looks like a Viasox customer, not an actor.
- Body format: Selfie Talking Head primary. POV Handheld for product demo. Use the Shot Type column for "Selfie Talking Head," "POV Handheld," "Reaction Shot," "Phone Screen Recording," "Mirror Selfie," "Casual B-Roll."
- Voice: conversational, unscripted-feeling. Natural filler words ("honestly," "actually," "just"). The Lines column can include loose phrasing — the talent will ad-lib in production.
- Production target: should look like organic social content. NO crew, NO professional lighting feel.`;

    default:
      return '';
  }
}

function ecomAdTypeNuance(adType: ScriptParams['adType']): string {
  switch (adType) {
    case 'Ecom Style':
      return `**AD TYPE: Ecom Style — Editing brief built from EXISTING Viasox footage + AI voiceover.**
- Shot Type column uses footage tags: Talking Head, Putting On Socks, Feet Up Lifestyle, Bare Legs – Condition, Walking, Standing Feet, Before/After Reveal, Studio Product Shot, Animation / Motion Graphics, Text/Title Card, Socks With Shoes, Documentary / Interview, Product Flat Lay, Branded Shipping Box, EGC / Warehouse, Lifestyle Flat Lay, Material Close-up, PNG Cutout, Home Environment, Outdoor Setting.
- Footage we do NOT have — NEVER imply: indoor gym/fitness, medical offices/clinical settings, sports activities, travel/airports, restaurants, children, pets.
- Suggested Visual column = one conversational sentence (8-20 words) describing what the viewer sees. NOT a tag, NOT vague ("b-roll of feet").
- Voice: real person talking to a friend. Natural filler words. NO copywriter prose.`;

    case 'Full AI (Documentary, story, education, etc)':
      return `**AD TYPE: Full AI — 100% AI-generated visuals via Veo / Sora / Runway. NO real footage.**
- Shot Type column uses AI-generation shot labels: "AI Scene," "AI B-Roll," "AI Close-Up," "AI Wide Establishing," "AI Montage," "Archival-Style AI," "AI Voiceover Over B-Roll," "AI Talking Head," "Text/Title Card."
- DO NOT use the Ecom footage library tags. Full AI is not built from existing footage.
- Suggested Visual column = a paste-ready generation prompt: subject, action, environment, mood, camera language, lighting. Specific enough that an editor pastes it directly into Veo/Sora/Runway.
- Specification: ${params_fullAiSpecification('Documentary')} narrative mode.
- Visual Style: cohesive characters / fully VO / talking-to-camera / no-humans-shown / historical visuals (depending on params).
- Voice: cinematic, documentary VO, educational exposition, or aspirational manifesto — NOT casual Ecom voice.
- Visual Grounding Rules from the Ecom template DO NOT apply. AI can depict any environment.
- If a character recurs across scenes, describe them the same way every time — identity consistency is the editor's challenge.`;

    case 'AI Podcast':
      return `**AD TYPE: AI Podcast — Two AI-generated avatars in conversation. Editing brief — no shoot.**
- Shot Type column uses AI-podcast labels: "AI Two-Shot," "AI Host A Close-Up," "AI Host B Close-Up," "AI Mic Close-Up," "AI Over-the-Shoulder."
- The Suggested Visual column for EACH speaking row must include the avatar profile + the set description as a paste-ready AI prompt. Same avatar description for Host A every time; same for Host B; same set every time. Identity consistency depends on it.
- Lines column = dialogue. Use Talent Notes to indicate which host speaks ("HOST A" / "HOST B"). The PRODUCT DISCOVERY MOMENT must be marked explicitly in the Building Block column when it occurs.
- In the EDITING INSTRUCTIONS section, dedicate the Asset field to: (a) Host A full avatar prompt, (b) Host B full avatar prompt, (c) shared set description — all paste-ready, all reusable across clips.
- Voice: conversational, organic. NOT a salesy ad break. Build curiosity in Host A, reveal in Host B.`;

    default:
      return '';
  }
}

// Tiny helper — only used in the Full AI nuance block to surface specification.
function params_fullAiSpecification(fallback: string): string {
  return `[${fallback} — see params.fullAiSpecification if set]`;
}

// ─── Strategic header (shared by both templates) ────────────────────────

function ecomStrategicHeader(params: ScriptParams, dateIso: string): string {
  return `### 1. BRIEF INFO
| Field | Value |
|-------|-------|
| Brief ID | [Generate: PRODUCT_FUNNEL_ConceptSlug_v1, e.g., ES_TOF_DentTest_v1] |
| Date | ${dateIso} |
| Product | ${productLabel(params.product)} |
| Collection | [Specific collection/patterns or "Various"] |
| Collection Asset | [Specific patterns/colors needed for demo and reveal beats] |
| Format | 9:16 vertical (Reels/Stories), 1:1 secondary |

### 2. STRATEGY
| Field | Value |
|-------|-------|
| Concept | [The creative concept this brief executes — what is this ad about?] |
| Angle | [The strategic angle / talking point — the emotional or logical frame] |
| Awareness Level | ${params.awarenessLevel} (${params.funnelStage}) |
| Primary Emotion | [Derived from concept — Relief, Hope, Confidence, Independence, Trust, etc.] |
| Avatar | [The specific person — e.g., "Nurse, 52, who's accepted leg pain as part of the job"] |
| Landing Page | [${params.product} Collection] |

### 3. OFFER
| Field | Value |
|-------|-------|
| Promo | ${promoLine(params.offer)} |
| Promo Asset | ${params.offer !== 'None' ? 'Standard end card' : 'None'} |
| Value Callout | ${valueCallout(params.offer)} |
| Urgency Element | [If applicable based on promo period, otherwise "None"] |`;
}

// ─── 1. Ecom Brief (Doc) — covers Ecom Style, Full AI, AI Podcast ───────

export function buildEcomTemplate(
  params: ScriptParams,
  dateIso: string,
  hasInspiration: boolean = false,
): string {
  return `## ECOM AD BRIEF OUTPUT FORMAT (Doc — Editing Path)

This is an EDITING BRIEF. The editor assembles the final ad using either existing footage (Ecom Style), AI-generated visuals (Full AI, AI Podcast), or some combination. The output structure below is the SAME for every editing brief — only the visual vocabulary changes per ad type.

${ecomAdTypeNuance(params.adType)}

---

## OUTPUT STRUCTURE — ECOM AD BRIEF (8 sections)

${ecomStrategicHeader(params, dateIso)}

### 4. EDITING INSTRUCTIONS
| Field | Value |
|-------|-------|
| Pacing | [Derived from concept — e.g., "Demonstration-focused. Opens on visual evidence. 40-50 seconds."] |
| Resolution | 9:16 primary, 1:1 secondary |
| Caption & Graphics | [Text overlay strategy — what key moments get captions, style notes] |
| Transitions | [Cut style — e.g., "Clean cuts. Zoom on evidence shots. Smooth reveal on solution."] |
| Music | [Mood, genre, energy — e.g., "Curious opening, building, warm resolution."] |
| Voiceover | AI Voiceover – [Tone description — e.g., "Warm, observational female voice."] |
| Asset | [Specific footage categories OR AI generation prompts needed for this brief] |
| Notes | [Production notes — what's most important about this brief's visual approach] |

### 5. SCRIPT (HOOKS) — 3 Variations
| # | Shot Type | Suggested Visual | Hook Line |
|---|-----------|-----------------|-----------|
| 1 | [footage tag OR AI shot label] | [conversational description, 8-20 words] | "[hook line — full natural sentence]" |
| 2 | [tag] | [description] | "[different hook approach]" |
| 3 | [tag] | [description] | "[different hook approach]" |

Each hook uses a DIFFERENT approach. Note the principle (e.g., "Hook 1 — Hopkins Selector").

### 6. SCRIPT (BODY)
| # | Shot Type | Suggested Visual | Script Line |
|---|-----------|-----------------|-------------|
| 1 | [tag] | [conversational description, 8-20 words] | "[line — must sound like a real person talking]" |
| 2 | ... | ... | ... |

Row count adapts to concept and duration. Each row = ONE thought, ONE breath.

🚨 **COLUMN RULE — NON-NEGOTIABLE:** Both the HOOKS and BODY tables have **EXACTLY 4 columns** in this exact order: \`# | Shot Type | Suggested Visual | Script Line\`. Do NOT add a "Building Block", "Beat", "Phase", or any fifth column. If your script follows a beat structure (e.g. Identification → Reframe → Mechanism), that structure guides WHICH lines you write — it does NOT become a table column. The **Script Line column (the rightmost) must contain the actual spoken words** the viewer hears, in quotes. Never put a shot tag, a beat name, or a visual description in the Script Line column. Before you finish, re-read your BODY table: every row's last cell must be a spoken line in quotes, not a description.

### 7. KEY DATA POINTS
List every statistic and customer quote referenced in the script, with source frequencies.

### 8. HOW ${params.framework.toUpperCase()} WAS APPLIED
Walk through how the framework maps to specific rows in the body. Reference row numbers.${hasInspiration ? `

### 9. VISUAL SUBSTITUTION LOG

An inspiration ad was pinned. Document any visual substitutions where the reference used a shot we don't have and you chose the closest available alternative.

| # | Inspiration Shot | Our Substitute | Rationale (1 sentence) |
|---|------------------|----------------|------------------------|
| 1 | [Reference visual] | [Shot Type from our library] | [Why this preserves intent] |

If NO substitutions were required, state: **"No substitutions required — all visuals sourced from available footage."**` : ''}`;
}

// ─── 2. AGC Brief (CSV) — covers all production briefs ──────────────────

export function buildAgcTemplate(params: ScriptParams): string {
  return `## AGC PRODUCTION BRIEF OUTPUT FORMAT (CSV — Production Path)

This is a PRODUCTION BRIEF. Nora finds talent, books a set, and films it. The output structure below is the SAME for every production brief — only the strategic content + nuance changes per ad type.

${agcAdTypeNuance(params.adType)}

---

## GENERAL AGC RULES (apply to every production brief)

- **Building Block label on every row** — hooks and body. The label explains the row's strategic purpose in the persuasion arc (Benefits, Problem, Solution, Curiosity, Reactions, Deposition, Bizarre, Satisfying, Pain Showcase, Twist the Knife, Reveal, Proof, Testimonial, Social Proof, Story telling, Relatable, CTA, etc.).
- **Short Lines Rule** — each row = ONE thought, ONE breath. If you'd pause mid-sentence, SPLIT into two rows. No long sentences crammed into one row.
- **Format Consistency** — all speaking rows use the same Shot Type (ON CAMERA for face-to-camera; SCRIPT for VO/POV). BROLL rows for visual-only cutaways between speaking rows.
- **9-Hook Matrix** — exactly 9 hooks per brief (3 Visuals × 3 Verbals).
- **Use REAL customer language** — every line must be built from the actual review data, not generic copywriter prose.

## OUTPUT STRUCTURE — AGC PRODUCTION BRIEF

### 1. STRATEGY SECTION
- **Concept:** [The creative concept — what is this ad about, what story does it tell?]
- **Angle:** [The strategic angle — the emotional/logical frame]
- **Avatar:** [Who is on screen — age range, look, energy, wardrobe, personality]
- **Location:** [Where the shoot takes place — be specific about the environment, per ad type nuance above]
- **Product:** ${productLabel(params.product)}
- **Collection:** [Specific collection/patterns if relevant, or "Various"]
- **Promotion:** [Promo period if any, or "Evergreen"]
- **Offer:** ${promoLine(params.offer)}
- **Pacing:** [${params.agcPacing === 'fast' ? 'Fast (15-30s) — punchy cuts, high energy' : params.agcPacing === 'deliberate' ? 'Deliberate (60-90s) — documentary rhythm, let moments breathe' : 'Standard (30-45s) — balanced pacing'}]
- **Music:** [Music direction — mood, genre, instruments, energy level]
- **Assets:** [Specific props, products, materials needed for the shoot]
- **Additional Notes:** [Production notes, special requirements, creative direction, anything Nora needs]

### 2. HOOKS — 9-Hook Matrix (3 Visuals × 3 Verbals)

First describe each Visual approach and each Verbal hook strategy:

**Visual A:** [Description of first camera setup/location/opening visual]
**Visual B:** [Description of second — genuinely DIFFERENT from A]
**Visual C:** [Description of third — genuinely DIFFERENT from A and B]
**Verbal 1:** [First hook line strategy]
**Verbal 2:** [Second hook line strategy — different emotional trigger]
**Verbal 3:** [Third hook line strategy — different emotional trigger]

Then output all 9 hooks as a markdown table:

| Hook | Building Block | Shot Type | Shot Angle | Talent Notes | Shot Notes | Shot Visual | Lines | Editing Notes | Caption |
|------|----------------|-----------|------------|--------------|------------|-------------|-------|---------------|---------|
| A1 | [label] | [type] | [angle] | [direction] | [technical] | [what viewer sees] | [spoken words] | [post notes] | [on-screen text] |
| A2 | ... | ... | ... | ... | ... | ... | ... | ... | ... |
| A3 | ... | ... | ... | ... | ... | ... | ... | ... | ... |
| B1 | ... | ... | ... | ... | ... | ... | ... | ... | ... |
| B2 | ... | ... | ... | ... | ... | ... | ... | ... | ... |
| B3 | ... | ... | ... | ... | ... | ... | ... | ... | ... |
| C1 | ... | ... | ... | ... | ... | ... | ... | ... | ... |
| C2 | ... | ... | ... | ... | ... | ... | ... | ... | ... |
| C3 | ... | ... | ... | ... | ... | ... | ... | ... | ... |

### 3. BODY SECTION
The main script body. 20-40 rows depending on pacing. Each row = ONE thought, ONE breath.

| # | Building Block | Shot Type | Shot Angle | Talent Notes | Shot Notes | Shot Visual | Lines | Editing Notes | Caption |
|---|----------------|-----------|------------|--------------|------------|-------------|-------|---------------|---------|
| 1 | [label] | [type] | [angle] | [direction] | [technical] | [what viewer sees] | [spoken words] | [post notes] | [on-screen text] |
| 2 | ... | ... | ... | ... | ... | ... | ... | ... | ... |

${params.agcBodyFormat === 'face-to-camera' ? '**Body Format: Face-to-Camera.** ALL speaking rows use Shot Type = ON CAMERA. Talent speaks directly to camera, face visible.' : "**Body Format: POV (Voiceover Narration).** ALL speaking rows use Shot Type = SCRIPT. Talent's voice is heard as VO but they are NOT on camera speaking. Camera shows hands, product, environment."}
BROLL rows (visual-only cutaways) may appear in either format as brief interruptions between speaking rows.

### 4. EXTRA B-ROLL LIST
8-12 additional shots for editing flexibility (NOT in the main body):

| # | Shot Type | Shot Angle | Shot Notes | Shot Visual | Editing Notes |
|---|-----------|------------|------------|-------------|---------------|
| 1 | BROLL | [angle] | [technical] | [what viewer sees] | [how editors might use this] |

### 5. HOW ${params.framework.toUpperCase()} WAS APPLIED
Walk through how the framework maps to the Building Block sequence in the body. Reference specific row numbers and Building Block labels.`;
}

// ─── 3. UGC Creator Brief (Doc — simplified for non-technical creators) ──
//
// UGC creators are usually older, non-technical, and filming themselves on
// a phone. A 10-column production CSV would overwhelm them. This template
// uses the editing-brief DOC styling but strips ALL production jargon and
// any column that's not essential for the creator. The body table is just
// THREE columns: Shot Visuals (what to do), Shot Type (talk-to-camera or
// B-roll), Lines (what to say). Hooks are 5 variations, each a different
// style — not the 9-hook 3×3 matrix.

export function buildUgcTemplate(params: ScriptParams, dateIso: string): string {
  return `## UGC CREATOR BRIEF OUTPUT FORMAT (Doc — Creator Path)

This brief is handed DIRECTLY to a UGC creator — a regular person, often
older (40+) and non-technical, filming themselves with their phone in their
own home or car. They will read this doc on their phone before/during
filming. They will NOT receive coaching, callsheets, or shot lists from a
director. Everything they need must be on this one page.

**STRIP all production jargon.** No "Building Block" labels. No "Shot Angle."
No "Editing Notes." No "Caption." No "Talent Notes." No 9-hook matrix.
Just: what to film, whether they talk in that shot, and what they say.

${agcAdTypeNuance(params.adType)}

---

## OUTPUT STRUCTURE — UGC CREATOR BRIEF (5 sections)

### 1. BRIEF INFO
| Field | Value |
|-------|-------|
| Brief ID | [auto-generated, leave blank if not provided] |
| Date | ${dateIso} |
| Product | ${productLabel(params.product)} |
| Angle | [strategic angle in plain English] |
| Persona | [who this is FOR — the viewer, in plain language] |
| Length | ${params.duration} |
| Talent | [age range + real-person aesthetic, e.g., "Woman 50-65, comfortable on camera, looks like a Viasox customer (not an actor)"] |
| Location | [specific place in their home — e.g., "Kitchen counter, couch, or their car"] |

### 2. STRATEGY
| Field | Value |
|-------|-------|
| Awareness Level | ${params.awarenessLevel} |
| Primary Emotion | [the ONE feeling they should convey throughout — e.g., "Quiet relief," "Genuine surprise," "Frustration releasing into gratitude"] |
| Avatar | [who they're talking TO — a sentence the creator can picture in their head] |

### 3. VOICE & TONE
A short paragraph (2-4 plain sentences) directly addressing the creator.
Examples of the kind of guidance:
- "Talk like you're telling a close friend about something that surprised you."
- "Don't read this script word-for-word — make it your own. Add filler words ('honestly,' 'actually,' 'just') where they feel natural."
- "It's OK to pause, look down, restart a sentence. Imperfection is the point."
- "Avoid sounding like a salesperson. You're sharing, not selling."

Write this in the creator's voice — no marketing jargon, no DR language.

### 4. SCRIPT (HOOKS) — 5 Variations
EXACTLY 5 hooks. Each one is a different hook STYLE so the creator can record
all 5 versions and we can A/B which performs best.

Hook styles to draw from (pick 5 different ones):
- **Pattern Interrupt** — unexpected opener that breaks scroll ("Okay, this is going to sound weird, but…")
- **Bold Claim** — confident statement ("I'll never buy regular socks again.")
- **Question** — direct question to the viewer ("Why did nobody tell me about these?")
- **Personal Confession** — vulnerable admission ("I used to hide my legs because…")
- **Reframe** — flip a common assumption ("I thought compression socks were medical. They're not.")
- **Curiosity Tease** — set up payoff ("There's one thing I do every morning that changed everything…")
- **Common Enemy** — frustration shared with viewer ("If you're tired of sock marks at the end of the day…")
- **Specific Promise** — concrete benefit ("I haven't had a sock mark in three months.")

Output as a markdown table:

| # | Hook Style | Suggested Visual | Hook Line |
|---|------------|-----------------|-----------|
| 1 | [style name from list above] | [what to film — e.g., "Selfie in kitchen, just put the socks on"] | "[the line, written as the creator would actually speak it]" |
| 2 | [DIFFERENT style] | [visual — same default or different if needed] | "[different line, different approach]" |
| 3 | [DIFFERENT style] | ... | ... |
| 4 | [DIFFERENT style] | ... | ... |
| 5 | [DIFFERENT style] | ... | ... |

No two hooks may use the same style. The "Suggested Visual" can repeat across
hooks if the same setup works — only specify a different visual when the hook
genuinely requires it.

### 5. SCRIPT (BODY)
The main script body. 5-12 rows depending on duration. Each row = one shot,
one action. Keep it conversational throughout.

EXACTLY 3 columns — no more. Production jargon belongs in the AGC briefs,
not here.

| Shot Visuals | Shot Type | Lines |
|-------------|-----------|-------|
| [Plain-English description of what they should do/film, 8-20 words] | Talk to camera | "[what they say — written as natural spoken language]" |
| [next shot, e.g., "Tilt phone down to show feet in the socks"] | B-roll | (no audio) |
| [Selfie again, smiling, hand on heart] | Talk to camera | "[next line]" |
| ... |

Rules for the BODY:
- **Shot Visuals** = what the creator should physically do/film. Plain
  English. No tag jargon ("POV Handheld" → "Hold the phone in front of your
  face like a selfie").
- **Shot Type** = exactly two options: "Talk to camera" or "B-roll".
  Nothing else.
- **Lines** = what they say. If it's B-roll with no speaking, write
  "(no audio)" or "(silent — background music)". Otherwise write the line
  as they'd actually speak it, including natural filler words where they
  belong.

Vary the pacing — don't put 5 talk-to-camera rows in a row. Cut to B-roll
for emphasis or to break up monotony.

CTA must be at the end and must feel like a friend recommending, not a
salesperson selling. "Honestly, just try them" beats "Buy now."`;
}

// ─── Public router ──────────────────────────────────────────────────────

// ─── 4. Full AI Brief (Doc — 2 content columns: Visual + Voiceover) ──────
//
// Full AI ads are 100% AI-generated — there are no real shot type tags
// like "Talking Head" or "Walking" because the visuals don't come from
// existing Viasox footage. The Ecom template's 4-column structure
// (# / Shot Type / Suggested Visual / Script Line) historically confused
// the model: it would dump scene descriptions into BOTH the Visual and
// Script Line columns, leaving the brief with no actual voiceover.
//
// This template strips that structure down to its essential pieces:
//   - # (row number, ordinal only)
//   - Suggested Visual (the scene description / AI generation prompt)
//   - Voiceover (the spoken words — quoted text OR explicit silent marker)
//
// Renaming "Script Line" → "Voiceover" removes any ambiguity about
// whether the column could mean "lines of the visual description."
// "Voiceover" exclusively means audio.

export function buildFullAiTemplate(params: ScriptParams, dateIso: string): string {
  return `## FULL AI BRIEF OUTPUT FORMAT (Doc — AI-Generation Path)

This is a 100% AI-GENERATED ad. There are NO real shot type tags
(no "Talking Head", no "Walking", no "Putting On Socks") because no
existing footage is being used — every visual is produced by a
text-to-video AI model (Veo / Sora / Runway). The brief's body table
has been deliberately simplified to TWO content columns:

  - **Suggested Visual** — the scene description that the AI generator
    will turn into a video clip. Describe what the viewer SEES (subject,
    environment, action, lighting, mood, camera framing). 12–40 words.
    Embed framing hints inline (e.g. "Close-up: a woman's hands…").
  - **Voiceover** — the SPOKEN WORDS that will be heard in the audio
    track. Quoted dialogue OR a narration line. For shots with no audio,
    write \`(silent — VO continues from previous row)\`. NEVER repeat the
    visual description here.

${ecomAdTypeNuance(params.adType)}

---

## OUTPUT STRUCTURE — FULL AI BRIEF (7 sections)

${ecomStrategicHeader(params, dateIso)}

### 4. EDITING INSTRUCTIONS
| Field | Value |
|-------|-------|
| Pacing | [Derived from concept — e.g., "Documentary rhythm. 60-75 seconds. Slow opening, building to product reveal."] |
| Resolution | 9:16 primary, 1:1 secondary |
| Caption & Graphics | [Text overlay strategy — caption cards, lower thirds, title cards] |
| Transitions | [How shots stitch — cuts, dissolves, fade-to-clay (if applicable)] |
| Music | [Mood + style — e.g., "Warm minimal piano, building to hopeful strings on the reveal"] |
| Voiceover | AI Voiceover — [Tone — e.g., "Warm, observational female voice. 50+. Unhurried."] |
| Asset | AI generation: [text-to-video model + style notes — e.g., "Photoreal cinematic with claymation cutaways for anatomy"] |
| Notes | [Production notes — what's most important about this brief's AI visual approach] |

### 5. SCRIPT (HOOKS) — 3 Variations
| # | Suggested Visual | Voiceover |
|---|------------------|-----------|
| 1 | [Scene description for AI generation — 12-40 words, embed framing inline] | "[The actual spoken hook line — full natural sentence]" |
| 2 | [Different scene, different visual approach] | "[Different hook line — different emotional entry]" |
| 3 | [Different scene] | "[Different hook line]" |

Each hook uses a DIFFERENT visual approach AND a different verbal angle.

### 6. SCRIPT (BODY)
| # | Suggested Visual | Voiceover |
|---|------------------|-----------|
| 1 | [Scene description — what the viewer sees] | "[Spoken line]" OR (silent — VO continues from previous row) |
| 2 | [Next scene] | "[Next spoken line]" OR (silent — see music direction) |

**Strict column rules — apply to every row:**

- The **Voiceover** column contains ONLY quoted spoken text OR the literal string \`(silent — VO continues)\` / \`(silent — see music)\`. It NEVER contains visual descriptions, character details, lighting notes, or camera moves.
- The **Suggested Visual** column carries all visual content. Lighting, framing, mood, character appearance — all go here.
- **Self-check before outputting the table:** scan every Voiceover cell. If it describes what the viewer SEES (not what they HEAR), it's in the wrong column. Move it to Suggested Visual and replace with actual spoken words OR a silent marker.

Row count adapts to concept and duration. Each row = ONE visual beat, paired with EITHER one spoken line or one silent visual moment.

### 7. KEY DATA POINTS
List every statistic and customer quote referenced in the voiceover, with source frequencies.

### 8. HOW ${params.framework.toUpperCase()} WAS APPLIED
Walk through how the framework maps to specific rows in the body. Reference row numbers.`;
}

// ─── Public router ──────────────────────────────────────────────────────

/**
 * Build the output-format markdown block for a given ad type. Routes to
 * one of the four real templates (Ecom Doc / AGC CSV / UGC Doc / Full AI Doc)
 * and injects the ad-type nuance block so the strategic content is tailored
 * even though the OUTPUT STRUCTURE follows the template. Static is handled
 * separately in scriptPrompt.ts (single-image format, not a video brief).
 */
export function buildBriefTemplateOutputFormat(
  params: ScriptParams,
  dateIso: string,
  hasInspiration: boolean = false,
): string {
  const id = getBriefTemplateId(params.adType);
  if (id === 'agc') return buildAgcTemplate(params);
  if (id === 'ugc') return buildUgcTemplate(params, dateIso);
  if (id === 'fullai') return buildFullAiTemplate(params, dateIso);
  return buildEcomTemplate(params, dateIso, hasInspiration);
}
