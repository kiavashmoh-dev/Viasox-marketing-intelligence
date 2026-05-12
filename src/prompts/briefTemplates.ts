/**
 * Brief Templates — output-format specs for each ad type's final brief.
 *
 * Every template returns a markdown block that gets concatenated into the
 * script-writer system prompt. The script writer then produces a brief in
 * EXACTLY that shape, which the matching download function in
 * `downloadUtils.ts` parses back into either a styled .doc or a structured
 * .csv.
 *
 * Two delivery surfaces, mirroring the user's workflow:
 *   - Doc templates (Ecom, Full AI Visual, AI Podcast) → editing path
 *     (existing footage assembly, AI generation, or AI avatar/dialogue).
 *   - CSV templates (AGC, Single-Talent, Filmed Podcast, Packaging/Employee)
 *     → production path (Nora finds talent, books a set, films it).
 *
 * Every template carries the same strategic header (concept, angle, strategy,
 * avatar, awareness, funnel, offer). Only the body changes per template.
 *
 * Static keeps its existing inline structure in `scriptPrompt.ts` (single
 * image, not a video brief) — not exported from here.
 */

import type { ScriptParams } from '../engine/types';

// ─── Template Router ────────────────────────────────────────────────────

export type BriefTemplateId =
  | 'ecom'
  | 'fullai'
  | 'aipodcast'
  | 'agc'
  | 'singletalent'
  | 'filmedpodcast'
  | 'packaging';

/**
 * Map an ad type to its corresponding brief template id. The mapping is
 * the single source of truth — both the script-writer prompt and the
 * downloader use it.
 *
 * UGC currently routes to Single-Talent (one-person monologue, light
 * production) per the user's "ignore UGC for now" but we still want it
 * to render SOMETHING reasonable; falls through to a sensible default.
 */
export function getBriefTemplateId(adType: ScriptParams['adType']): BriefTemplateId {
  switch (adType) {
    case 'Ecom Style': return 'ecom';
    case 'Full AI (Documentary, story, education, etc)': return 'fullai';
    case 'AI Podcast': return 'aipodcast';
    case 'AGC (Actor Generated Content)': return 'agc';
    case 'Founder Style':
    case 'Spokesperson':
    case 'UGC (User Generated Content)': return 'singletalent';
    case 'Fake Podcast Ads': return 'filmedpodcast';
    case 'Packaging/Employee': return 'packaging';
    default: return 'ecom';
  }
}

// ─── Shared bits ────────────────────────────────────────────────────────

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

/**
 * The strategic header used by every Doc template. The CSV templates use
 * a flatter inline version because Nora reads top-to-bottom.
 */
function docStrategyHeader(params: ScriptParams, dateIso: string): string {
  return `### 1. BRIEF INFO
| Field | Value |
|-------|-------|
| Brief ID | [Generate: PRODUCT_FUNNEL_ConceptSlug_v1, e.g., ES_TOF_DentTest_v1] |
| Date | ${dateIso} |
| Product | ${productLabel(params.product)} |
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
| Value Callout | ${valueCallout(params.offer)} |
| Urgency Element | [If applicable based on promo period, otherwise "None"] |`;
}

// ─── 1. Ecom Brief (Doc) — Editing path ─────────────────────────────────
// Existing format, trimmed. Drops the "How [Framework] Was Applied" footer
// (editors don't read it). Keeps everything else editors actually use.

export function buildEcomTemplate(params: ScriptParams, dateIso: string, hasInspiration: boolean = false): string {
  return `## ECOM AD BRIEF OUTPUT FORMAT (Doc — Editing Path)

This is an EDITING BRIEF assembled from existing Viasox footage with AI voiceover. Every visual must be grounded in footage that actually exists.

### VISUAL GROUNDING RULES (CRITICAL)

**Available Shot Types (use as Shot Type tags):**
- Core: Talking Head, Putting On Socks, Feet Up Lifestyle, Bare Legs – Condition, Walking, Standing Feet, Before/After Reveal, Studio Product Shot, Animation / Motion Graphics, Text/Title Card
- Supplementary: Socks With Shoes, Documentary / Interview, Product Flat Lay (Branded), Branded Shipping Box, EGC / Warehouse, Lifestyle Flat Lay, Material Close-up, PNG Cutout, Home Environment, Outdoor Setting
- Limited: Yoga / Wellness B-Roll (Ankle Compression only), Car Interior, Mall / Public Indoor, Cafe / Seated Public

**Footage we do NOT have — NEVER write visuals implying these:** Indoor gym/fitness, medical offices/clinical settings, sports activities (running, cycling, hiking), travel/airports, restaurants/dining, children/family scenes, pet scenes.

**Visual Description Rules:** The Suggested Visual column must be a SHORT, CONVERSATIONAL description of what the viewer sees — one natural sentence, 8-20 words.

---

## OUTPUT STRUCTURE — ECOM AD BRIEF

${docStrategyHeader(params, dateIso)}

### 4. EDITING INSTRUCTIONS
| Field | Value |
|-------|-------|
| Pacing | [Derived from concept — e.g., "Demonstration-focused. Opens on visual evidence. 40-50 seconds."] |
| Resolution | 9:16 primary, 1:1 secondary |
| Caption & Graphics | [Text overlay strategy — what key moments get captions, style notes] |
| Transitions | [Cut style — e.g., "Clean cuts. Zoom on evidence shots. Smooth reveal on solution."] |
| Music | [Mood, genre, energy — e.g., "Curious opening, building, warm resolution."] |
| Voiceover | AI Voiceover – [Tone description — e.g., "Warm, observational female voice."] |
| Asset | [Specific footage categories from the shot type library needed for this brief] |
| Notes | [Production notes — what's most important about this brief's visual approach] |

### 5. SCRIPT (HOOKS) — 3 Variations
| # | Shot Type | Suggested Visual | Hook Line |
|---|-----------|-----------------|-----------|
| 1 | [footage tag] | [conversational description, 8-20 words] | "[hook line — full natural sentence]" |
| 2 | [footage tag] | [conversational description] | "[different hook approach]" |
| 3 | [footage tag] | [conversational description] | "[different hook approach]" |

Each hook uses a DIFFERENT approach. Note the principle (e.g., "Hook 1 — Hopkins Selector").

### 6. SCRIPT (BODY)
| # | Shot Type | Suggested Visual | Script Line |
|---|-----------|-----------------|-------------|
| 1 | [footage tag] | [conversational description, 8-20 words] | "[line — must sound like a real person talking]" |
| 2 | ... | ... | ... |

Row count adapts to the concept and duration. Each row = one thought, one breath.

### 7. KEY DATA POINTS
List every statistic and customer quote referenced in the script, with source frequencies.${hasInspiration ? `

### 8. VISUAL SUBSTITUTION LOG

Because an inspiration ad was pinned, document any moments where the inspiration used a shot we don't have in our footage library and you chose the closest available alternative.

| # | Inspiration Shot | Our Substitute | Rationale (1 sentence) |
|---|------------------|----------------|------------------------|
| 1 | [Reference visual, e.g., "Close-up of feet on a trail at sunrise"] | [Shot Type from our library, e.g., "Standing Feet (Outdoor Setting)"] | [Why this preserves the inspiration's emotional beat / pacing / intent] |
| 2 | ... | ... | ... |

If NO substitutions were required, state exactly: **"No substitutions required — all visuals sourced from available footage."** If a visual was DROPPED entirely (no acceptable substitute), log it with "DROPPED" in the Substitute column and a note on which adjacent beat absorbed the meaning.` : ''}`;
}

// ─── 2. Full AI Visual Brief (Doc) — Editing path ───────────────────────
// AI-generated visuals via Veo/Sora/Runway. The Editor pastes per-scene
// prompts into the model. Character profile keeps the protagonist
// consistent across shots.

export function buildFullAiTemplate(params: ScriptParams, dateIso: string): string {
  return `## FULL AI VISUAL BRIEF OUTPUT FORMAT (Doc — Editing Path, AI-Generated)

This is an AI-VISUAL BRIEF. 100% of footage is AI-generated by text-to-video models (Veo / Sora / Runway). No real footage, no Viasox stock clips. The editor pastes each row's AI generation prompt directly into the model.

### AI GENERATION RULES (CRITICAL)
- The "AI Generation Prompt" column is the **literal prompt the editor pastes into Veo/Sora/Runway**. Write it as a generation prompt, not a description: include subject, action, setting, mood, camera, lighting, and style cues.
- The Character Profile section is reused VERBATIM in every prompt that features the protagonist. This is how the same character renders consistently across shots.
- Lean into what AI does well: impossible scale, time travel, surreal transitions, visual metaphor, dreamlike imagery. AVOID generation-fragile content: branded product close-ups, multi-person lip-sync dialogue, real-world locations with logos.
- For Full AI Documentary/Story specifically, voiceover is the spine. Visuals deepen the VO; they don't replace it.

---

## OUTPUT STRUCTURE — FULL AI VISUAL BRIEF

${docStrategyHeader(params, dateIso)}

### 4. CHARACTER PROFILE (paste-ready, reused per prompt)
| Field | Value |
|-------|-------|
| Appearance | [Specific physical description — age, ethnicity, hair, build, posture, distinguishing features] |
| Wardrobe | [Specific outfit — color, texture, era, vibe — kept consistent across shots] |
| Voice Tone (for VO) | [The AI voice tone — warm/clinical/conspiratorial/observational] |
| Energy / Vibe | [What the character feels like — calm authority / weary nurse / hopeful skeptic] |

### 5. EDITING INSTRUCTIONS
| Field | Value |
|-------|-------|
| Pacing | [Documentary pace / Punchy / Cinematic — and total target duration] |
| Resolution | 9:16 primary, 1:1 secondary |
| Music | [Mood, genre, energy — match the emotional arc] |
| Voiceover | [Description of the AI voice — gender, age, register, regional feel] |
| Transitions | [Cut style — typically clean cuts for Documentary; surreal morphs for Aspirational] |
| Notes | [Production notes — generation gotchas, what to re-generate if it doesn't land] |

### 6. VOICEOVER SCRIPT (the spine — full VO, line by line)
The full voiceover read top to bottom. This is what the AI voice will speak; the scene table below shows what plays visually under each line.

> [Line 1 — opening hook, 6-10 words]
>
> [Line 2 — beat 2, build]
>
> [Line 3 — beat 3, etc.]
>
> [Final line — CTA or resolution]

### 7. SCENE TABLE (Visuals)
| Scene # | AI Generation Prompt | VO Line This Scene Covers | Duration |
|---------|---------------------|---------------------------|----------|
| 1 | [Full paste-ready prompt for Veo/Sora/Runway — e.g., "Cinematic close-up of [character profile], [action], [setting], [lighting], shot on 35mm, soft warm light"] | "[which VO line plays here]" | [3-5s] |
| 2 | [Full paste-ready prompt — surreal/metaphor scene] | "[which VO line]" | [4s] |
| 3 | ... | ... | ... |

Aim for 6-12 scenes depending on duration. Each scene's prompt should be specific enough to paste with zero rewriting.

### 8. END CARD
| Field | Value |
|-------|-------|
| Visual | [End card description — logo treatment, product cameo, color palette] |
| Text on Screen | [Brand name + soft CTA — e.g., "Viasox" + "Learn more"] |

### 9. KEY DATA POINTS
List every statistic and customer quote referenced in the VO, with source frequencies.`;
}

// ─── 3. AI Podcast Brief (Doc) — Editing path ───────────────────────────
// AI-generated 2-host podcast with avatar prompts. Mirrors Filmed Podcast
// structure for dialogue, swaps real-talent profiles for AI avatar prompts.

export function buildAiPodcastTemplate(params: ScriptParams, dateIso: string): string {
  return `## AI PODCAST BRIEF OUTPUT FORMAT (Doc — Editing Path, AI Avatars)

This is an AI PODCAST BRIEF. Two AI-generated avatars in a podcast-style conversation. The editor uses the Avatar Profiles + Set Description to generate consistent hosts and the same set across every clip, then assembles the dialogue.

### AI PODCAST GENERATION RULES
- The two Avatar Profile blocks below are reused VERBATIM in every generation prompt for that host. Keep them detailed enough that the AI renders the same face every time.
- The Set Description is the shared environment — also pasted into every clip prompt.
- The dialogue must feel like an organic conversation, not an ad. The product DISCOVERY moment is the inflection — before it, just two people talking; after it, natural curiosity-driven exchange about Viasox.

---

## OUTPUT STRUCTURE — AI PODCAST BRIEF

${docStrategyHeader(params, dateIso)}

### 4. AVATAR PROFILE — HOST A (paste-ready)
| Field | Value |
|-------|-------|
| Appearance | [Specific physical description — age, ethnicity, hair, build, distinguishing features] |
| Wardrobe | [Outfit — color, texture, era — kept consistent across all clips] |
| Voice | [Voice description — gender, age, regional accent, warmth/register] |
| Personality / Role | [The "type" — e.g., "curious health enthusiast who asks the questions"] |

### 5. AVATAR PROFILE — HOST B (paste-ready)
| Field | Value |
|-------|-------|
| Appearance | [Description — must look distinct from Host A] |
| Wardrobe | [Outfit — visually different from Host A] |
| Voice | [Different timbre/register from Host A so the dialogue is audibly distinct] |
| Personality / Role | [The "type" — e.g., "skeptic-turned-believer who has tried Viasox"] |

### 6. SET DESCRIPTION (paste-ready, reused per clip)
| Field | Value |
|-------|-------|
| Environment | [Specific podcast set — cozy studio, mid-century, wood paneling, plants, soft warm lighting, two mics, two-shot framing] |
| Lighting | [Soft warm / clinical / golden hour / etc.] |
| Camera Framing | [Default framing — two-shot wide / over-the-shoulder / single-host close-ups when speaking] |

### 7. EDITING INSTRUCTIONS
| Field | Value |
|-------|-------|
| Pacing | [Conversational rhythm — natural pauses, light overlaps, breathing room] |
| Resolution | 9:16 primary, 1:1 secondary |
| Music | [Light bed music / ambient — should NOT compete with dialogue] |
| Captions | [Caption strategy — usually full-sentence captions for accessibility] |
| Transitions | [Clip switches between angles — typically clean cuts on speaker changes] |
| Notes | [What to re-generate if hosts drift in appearance; how to handle the product discovery moment] |

### 8. DIALOGUE SCRIPT (screenplay format)
The conversation, line by line. Each block = one speaker's turn. Mark the product DISCOVERY MOMENT clearly.

> **HOST A:** [opening question or observation, conversational]
>
> **HOST B:** [response, builds on the topic]
>
> **HOST A:** [follow-up — builds the curiosity / pain]
>
> **HOST B:** [reaction]
>
> **[PRODUCT DISCOVERY MOMENT]**
>
> **HOST A:** [the line that pivots — natural product mention, not an ad break]
>
> **HOST B:** [genuine reaction / curiosity / "wait, what?"]
>
> **HOST A:** [explains naturally]
>
> **HOST B:** [endorsement / connection to own experience]
>
> **HOST A:** [closing line — soft CTA or curiosity prompt]

### 9. KEY DATA POINTS
List every statistic and customer quote referenced in the dialogue, with source frequencies.`;
}

// ─── 4. AGC Brief (CSV) — Production path ───────────────────────────────
// Heavy production, hired actor, full crew. Trimmed: 9→6 hook matrix,
// merged shot angle into shot type column, kept Editing Notes per the
// user's note, consolidated wardrobe/lighting/props into Production Notes.

export function buildAgcTemplate(params: ScriptParams): string {
  return `## AGC PRODUCTION BRIEF OUTPUT FORMAT (CSV — Production Path)

This is an AGC (Actor-Generated Content) production brief. Heavy production with a hired actor and full crew. Output as the CSV format Nora and the producer use on set.

### 1. STRATEGY SECTION
- **Concept:** [The creative concept — what is this ad about, what story does it tell?]
- **Angle:** [The strategic angle — the emotional/logical frame]
- **Avatar:** [Who is on screen — age range, look, energy, wardrobe, personality]
- **Location:** [Where the shoot takes place — be specific about the environment]
- **Product:** ${productLabel(params.product)}
- **Collection:** [Specific collection/patterns if relevant, or "Various"]
- **Promotion:** [Promo period if any, or "Evergreen"]
- **Offer:** ${promoLine(params.offer)}
- **Pacing:** [${params.agcPacing === 'fast' ? 'Fast (15-30s) — punchy cuts, high energy' : params.agcPacing === 'deliberate' ? 'Deliberate (60-90s) — documentary rhythm, let moments breathe' : 'Standard (30-45s) — balanced pacing'}]
- **Music:** [Music direction — mood, genre, instruments, energy level]

### 2. PRODUCTION NOTES (single consolidated block)
- **Wardrobe:** [Specific wardrobe direction — colors, fits, style register]
- **Lighting:** [Lighting plan — natural / soft key / dramatic / etc.]
- **Props:** [Specific props needed beyond the product]
- **Additional Notes:** [Special requirements, creative direction, anything Nora needs that doesn't fit elsewhere]

### 3. HOOKS — 6-Hook Matrix (3 Visuals × 2 Verbals)
Create EXACTLY 6 hooks by combining 3 Visual approaches with 2 Verbal hooks.

**Visual A:** [Description of first camera setup/location/opening visual]
**Visual B:** [Description of second — genuinely DIFFERENT from A]
**Visual C:** [Description of third — genuinely DIFFERENT from A and B]
**Verbal 1:** [First hook line strategy]
**Verbal 2:** [Second hook line strategy — different emotional trigger]

Then output all 6 hooks as a markdown table:

| Hook | Building Block | Shot Type (incl. angle) | Talent | Visual | Lines | Editing Notes | Caption |
|------|----------------|-------------------------|--------|--------|-------|---------------|---------|
| A1 | [label] | [ON CAMERA / BROLL — angle inline if non-default] | [talent direction] | [what viewer sees] | [spoken words] | [post notes — cuts, transitions] | [on-screen text] |
| A2 | ... | ... | ... | ... | ... | ... | ... |
| B1 | ... | ... | ... | ... | ... | ... | ... |
| B2 | ... | ... | ... | ... | ... | ... | ... |
| C1 | ... | ... | ... | ... | ... | ... | ... |
| C2 | ... | ... | ... | ... | ... | ... | ... |

### 4. BODY SECTION
The main script body. Each row = ONE thought, ONE breath. 20-40 rows depending on pacing.

| # | Building Block | Shot Type (incl. angle) | Talent | Visual | Lines | Editing Notes | Caption |
|---|----------------|-------------------------|--------|--------|-------|---------------|---------|
| 1 | [label] | [type/angle] | [direction] | [what viewer sees] | [spoken words] | [post notes] | [on-screen text] |
| 2 | ... | ... | ... | ... | ... | ... | ... |

${params.agcBodyFormat === 'face-to-camera' ? 'Body Format: **Face-to-Camera.** ALL speaking rows use Shot Type = ON CAMERA. Talent speaks directly to camera, face visible.' : "Body Format: **POV (Voiceover Narration).** ALL speaking rows use Shot Type = SCRIPT. Talent's voice is heard as VO but they are NOT on camera speaking. Camera shows hands, product, environment."}

### 5. EXTRA B-ROLL LIST
6-10 additional shots for editing flexibility (NOT in the main body):

| # | Shot Type | Visual | Editing Notes |
|---|-----------|--------|---------------|
| 1 | BROLL | [what viewer sees] | [how editors might use this] |`;
}

// ─── 5. Single-Talent Brief (CSV) — Production path ─────────────────────
// Founder Style / Spokesperson / UGC. One person, talking to camera.
// Lighter than AGC (no 9-hook matrix overkill). TALENT TYPE toggles tone.

export function buildSingleTalentTemplate(params: ScriptParams): string {
  const talentType = params.adType === 'Founder Style' ? 'FOUNDER'
    : params.adType === 'Spokesperson' ? 'SPOKESPERSON (credentialed expert)'
    : 'UGC CREATOR';
  const toneGuidance = params.adType === 'Founder Style'
    ? 'Personal, passionate, first-person. "Let me tell you why I built this..." energy. The founder\'s authentic voice — not polished ad copy.'
    : params.adType === 'Spokesperson'
    ? 'Authoritative, credentialed, evidence-based. Establish expertise in the first 5 seconds (credentials, role, why qualified). Verbatim lines matter for accuracy of any claim.'
    : 'Raw, native, phone-shot. Talks like a real person — natural filler words, no polished copywriter prose. Loose phrasing OK; producer/talent can ad-lib.';

  return `## SINGLE-TALENT PRODUCTION BRIEF OUTPUT FORMAT (CSV — Production Path)

This is a SINGLE-TALENT brief — one person speaking to camera. Lighter production than AGC.

### 1. STRATEGY SECTION
- **Concept:** [The creative concept — what is this ad about?]
- **Angle:** [The strategic angle / talking point]
- **Talent Type:** ${talentType}
- **Tonal Direction:** ${toneGuidance}
- **Product:** ${productLabel(params.product)}
- **Offer:** ${promoLine(params.offer)}
- **Pacing:** [Total target duration; typically 30-90s for talent monologue]
- **Music:** [Light bed if any — typically secondary; talent's voice is the focus]

### 2. TALENT PROFILE
- **Talent:** [The specific person on screen. For Founder: actual founder. For Spokesperson: credentials (e.g., "Registered Nurse, 12+ years bedside") + look/age/vibe. For UGC: persona (age, gender, lifestyle — Nora casts to match)]
- **Wardrobe:** [What they wear — Founder/UGC = their own clothes (note the vibe target); Spokesperson = a clinical or authority cue (white coat, scrubs, name tag, etc.)]
- **Demeanor:** [How they carry themselves — relaxed founder / authoritative spokesperson / casual UGC]

### 3. SETTING & PRODUCTION NOTES
- **Setting:** [Where it's filmed — founder's office, warehouse, kitchen, clinic backdrop, etc.]
- **Polish Target:** [${params.adType === 'UGC (User Generated Content)' ? 'Raw, phone-shot, natural light — should look organic in a TikTok/Reels feed' : params.adType === 'Founder Style' ? 'Light production — clean look but not commercial-glossy; founder authenticity preserved' : 'Clean and authoritative — single key light, neutral background, professional but not over-produced'}]
- **Camera:** [How many angles, what shots are needed]
- **Notes:** [Anything Nora needs that doesn't fit elsewhere]

### 4. HOOKS — 3 Variations
Three different opening lines for talent to choose from. NOT a 9-hook matrix — single-talent doesn't need that many.

| # | Building Block | Visual | Line | Caption |
|---|----------------|--------|------|---------|
| 1 | [hook strategy — Confession / Bold Claim / Question] | [what viewer sees in opening 3s] | ${params.adType === 'Spokesperson' ? '"[Verbatim line — exact wording matters for credibility]"' : '"[Opening line — verbatim for Founder; loose for UGC]"'} | [on-screen text] |
| 2 | [different strategy] | ... | ... | ... |
| 3 | [different strategy] | ... | ... | ... |

### 5. BODY SECTION
The main script body. Each row = ONE thought, ONE breath.

| # | Building Block | Visual | Line | Caption | Editing Notes |
|---|----------------|--------|------|---------|---------------|
| 1 | [label — Identification / Pain / Reframe / Mechanism / Reveal / Proof / CTA] | [what viewer sees this row — same setting as Setting above unless noted] | ${params.adType === 'UGC (User Generated Content)' ? '"[Loose phrasing — talent can ad-lib]"' : '"[Verbatim line]"'} | [on-screen text] | [post notes — cuts, transitions, b-roll cutaways] |
| 2 | ... | ... | ... | ... | ... |

### 6. KEY DATA POINTS
List every statistic and customer quote referenced, with source frequencies.${params.adType === 'Spokesperson' ? ' For Spokesperson briefs: all claims must be defensible — flag any unverified claim for legal review.' : ''}`;
}

// ─── 6. Filmed Podcast Brief (CSV) — Production path ────────────────────
// 2 real hosts in a real podcast set. Dialogue-formatted with Speaker
// column for instant scanability.

export function buildFilmedPodcastTemplate(params: ScriptParams): string {
  return `## FILMED PODCAST PRODUCTION BRIEF OUTPUT FORMAT (CSV — Production Path)

This is a FILMED PODCAST brief — two real hosts in conversation, filmed on a podcast set. Output as CSV with a Speaker column so the producer can instantly see who says what.

### 1. STRATEGY SECTION
- **Concept:** [The creative concept — what conversation is this?]
- **Angle:** [The strategic angle / talking point]
- **Product:** ${productLabel(params.product)}
- **Offer:** ${promoLine(params.offer)}
- **Pacing:** [Conversational rhythm — natural pauses, light overlaps]
- **Music:** [Light bed only — should not compete with dialogue]
- **The Moment:** [The single most important moment in the conversation — usually the product DISCOVERY beat]

### 2. HOST A PROFILE
- **Talent:** [Casting — age, gender, look, vibe]
- **Role in conversation:** [The "type" — e.g., "curious questioner / health enthusiast"]
- **Wardrobe:** [Outfit direction]

### 3. HOST B PROFILE
- **Talent:** [Casting — visually and tonally distinct from Host A]
- **Role in conversation:** [The "type" — e.g., "skeptic-turned-believer who's tried Viasox"]
- **Wardrobe:** [Outfit direction — distinct from Host A]

### 4. PRODUCTION NOTES
- **Set:** [Podcast set description — mics visible, wood/warm aesthetic, two-shot framing]
- **Lighting:** [Warm soft key, fill, ambient]
- **Cameras:** [Number of angles — typically 3: two-shot wide + single close-up per host]
- **Audio:** [Lav mics + boom backup; treat the dialogue as the deliverable]
- **Notes:** [Anything Nora needs that doesn't fit elsewhere]

### 5. DIALOGUE SCRIPT
The full conversation. Each row = one speaker turn. Producer and editor read top-to-bottom.

| # | Building Block | Speaker | Line | Visual Cue | Caption | Editing Notes |
|---|----------------|---------|------|------------|---------|---------------|
| 1 | [Opening / Pain Setup / Reframe / DISCOVERY / Endorsement / Closing] | HOST A | "[verbatim line]" | [camera focus — Host A close-up / two-shot / Host B reaction] | [on-screen text if any] | [post notes] |
| 2 | ... | HOST B | "[verbatim line]" | ... | ... | ... |
| 3 | ... | HOST A | ... | ... | ... | ... |

Mark the PRODUCT DISCOVERY MOMENT explicitly in the Building Block column when it occurs.

### 6. KEY DATA POINTS
List every statistic and customer quote referenced, with source frequencies.`;
}

// ─── 7. Packaging/Employee Brief (CSV) — Production path ────────────────
// Warehouse/team behind-the-scenes. Talent is actors playing employees.
// Zone + Action columns capture workplace-as-character.

export function buildPackagingTemplate(params: ScriptParams): string {
  return `## PACKAGING / EMPLOYEE PRODUCTION BRIEF OUTPUT FORMAT (CSV — Production Path)

This is a PACKAGING / EMPLOYEE brief — warehouse and behind-the-scenes content. The talent is ACTORS PLAYING EMPLOYEES (not real Viasox staff). The setting IS the ad — the workplace is the character.

### 1. STRATEGY SECTION
- **Concept:** [The creative concept — what behind-the-scenes story is this?]
- **Angle:** [The strategic angle / talking point]
- **Product:** ${productLabel(params.product)}
- **Offer:** ${promoLine(params.offer)}
- **Pacing:** [Total target duration; typically 20-45s for BTS spots]
- **Music:** [Mood — typically warm/industrious/human]

### 2. TALENT PROFILE (actors playing employees)
- **Number of talent:** [How many people in the spot]
- **Casting:** [For each, describe age range, look, energy — feel real, not actor-y. Cast for relatability, not glamour.]
- **Wardrobe:** [Branded apron / casual workwear / shipping uniform — specific direction so they look like employees]

### 3. SETTING & ZONES
- **Primary Zone:** [e.g., "Picking aisle — shelves of inventory, soft warehouse light"]
- **Secondary Zone:** [e.g., "Packing station — table, tape gun, boxes, shipping label printer"]
- **Tertiary Zone:** [e.g., "Loading dock — packages stacked, daylight through bay door"]
- **Aesthetic Target:** [Clean and humble / warm and industrious / NOT slick or corporate]

### 4. PRODUCTION NOTES
- **Lighting:** [Mix of practical (overhead warehouse) + soft key for talent close-ups]
- **Cameras:** [How many angles, handheld vs. tripod, any tracking shots]
- **Sound:** [Ambient warehouse / lav mics if any dialogue]
- **Notes:** [Anything Nora needs that doesn't fit elsewhere]

### 5. BODY SECTION
Each row = one shot. Zone column tells producer WHERE; Action column tells producer WHAT'S HAPPENING; Line column is VO or dialogue (whichever the ad uses).

| # | Building Block | Zone | Action | Line (VO or dialogue) | Caption | Editing Notes |
|---|----------------|------|--------|-----------------------|---------|---------------|
| 1 | [Setup / Care moment / Detail / Reveal / Human moment / CTA] | [zone label] | [what employee is physically doing — picking / inspecting / packing / labeling / handing off] | "[VO line OR employee dialogue]" | [on-screen text] | [post notes — cuts, transitions] |
| 2 | ... | ... | ... | ... | ... | ... |

### 6. KEY DATA POINTS
List every statistic and customer quote referenced, with source frequencies (e.g., "X% of reviews mention shipping speed").`;
}

// ─── Public router ──────────────────────────────────────────────────────

/**
 * Build the output-format markdown block for a given ad type. This is
 * the entire "what should the brief look like" instruction the script
 * writer follows. Static is handled separately in scriptPrompt.ts (it's
 * a single-image format, not a video brief).
 */
export function buildBriefTemplateOutputFormat(
  params: ScriptParams,
  dateIso: string,
  hasInspiration: boolean = false,
): string {
  const id = getBriefTemplateId(params.adType);
  switch (id) {
    case 'ecom': return buildEcomTemplate(params, dateIso, hasInspiration);
    case 'fullai': return buildFullAiTemplate(params, dateIso);
    case 'aipodcast': return buildAiPodcastTemplate(params, dateIso);
    case 'agc': return buildAgcTemplate(params);
    case 'singletalent': return buildSingleTalentTemplate(params);
    case 'filmedpodcast': return buildFilmedPodcastTemplate(params);
    case 'packaging': return buildPackagingTemplate(params);
    default: return buildEcomTemplate(params, dateIso, hasInspiration);
  }
}
