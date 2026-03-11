/**
 * AGC (Actor-Generated Content) Production Brief Reference Data
 *
 * Contains the building block taxonomy, shot types, hook formula,
 * and structural rules that define the AGC brief format.
 * These are embedded into the script prompt when AGC is selected.
 */

/**
 * Building Block taxonomy — strategic labels for every row of an AGC brief.
 * Reading the Building Block column top-to-bottom reveals the persuasion arc.
 */
export function buildBuildingBlocksReference(): string {
  return `## AGC BUILDING BLOCK TAXONOMY

Every row in the AGC brief MUST have a Building Block label. This label explains the STRATEGIC PURPOSE of that row in the persuasion arc. When you read the Building Block column top-to-bottom, it should reveal the full persuasion journey.

### HOOK BUILDING BLOCKS (use for the 9-hook rows)
- **Benefits** — Lead with a specific benefit or outcome
- **Problem** — Lead with a relatable pain point or frustration
- **Solution** — Lead with the promise of a fix or answer
- **Curiosity** — Create an open loop, tease a reveal
- **Reactions** — Show genuine surprise, delight, or emotion
- **Deposition** — Make a bold claim or statement that demands attention
- **Bizarre** — Pattern-interrupt with something unexpected or strange
- **Satisfying** — Show something visually or emotionally satisfying (ASMR-like, unboxing, reveal)

### BODY BUILDING BLOCKS (use for body rows — mix and sequence strategically)

**Product blocks:**
- **Product intro** — First reveal of the product (name, what it is)
- **Feature** — Specific product feature (non-binding tops, graduated compression, wide-mouth opening)
- **Showcase design** — Show patterns, colors, style — the visual appeal
- **Product demo** — Hands-on demonstration (stretching, putting on, measuring)

**Problem blocks:**
- **Problem** — Name or show the pain point
- **Pain showcase** — Visualize the pain vividly (sock marks, swelling, struggle)
- **Twist the knife** — Intensify the problem — make it feel urgent and unbearable
- **Bad alternative** — Show what the current/old solution looks like (pharmacy socks, beige compression, tight elastic)

**Solution blocks:**
- **Solution** — Position Viasox as the answer to the established problem
- **Benefit** — Specific benefit statement with proof (comfort, no marks, easy on)
- **Results** — Show measurable outcomes (clean legs, all-day comfort, survived a 12-hour shift)
- **Before & after** — Visual or narrative comparison of life before vs. after

**Credibility blocks:**
- **Testimonial** — Direct quote or paraphrased customer experience
- **Reviews** — Reference review data, star ratings, customer count
- **Social proof** — Show popularity signals (107K+ customers, sold-out runs, waitlists)
- **Authority figure** — Expert or professional endorsement (nurse, doctor, podiatrist)

**Story blocks:**
- **Story telling** — Narrative moment that builds emotional connection
- **Relatable** — "I've been there too" moment — shared experience
- **Gift for loved ones** — Position as a thoughtful gift (for mom, dad, grandparent)

**Commercial blocks:**
- **Buying experience** — What happens when you order (unboxing, packaging, delivery)
- **Special details** — Unique differentiators (bamboo blend, seamless toe, extra cushion)
- **Guarantees** — Risk reversal (free shipping, easy returns, satisfaction guarantee)
- **CTA** — Call to action with specific next step`;
}

/**
 * Shot Type + Shot Angle reference for AGC briefs.
 */
export function buildShotTypesReference(): string {
  return `## AGC SHOT TYPES & ANGLES

### SHOT TYPES (one per row)
- **BROLL** — Visual-only footage. No spoken words. Used for cutaways, product close-ups, setting establishment, transition shots. The camera shows something while the viewer hears nothing (or background music/ambient sound).
- **SCRIPT** — Voiceover narration over a visual. The talent's voice is heard but they are NOT on camera speaking. Used in POV-format briefs. The camera shows hands, product, environment while VO plays.
- **ON CAMERA** — Talent speaks directly to camera. Face visible, mouth moving, direct address. Used in Face-to-Camera format briefs. The viewer sees and hears the person speaking.
- **Editing** — Post-production addition. Text overlays, graphics, split screens, before/after composites. Not filmed on set — created in editing.
- **GSCREEN** — Green screen composite. Talent filmed against green screen with background replaced in post. Used for specific visual effects or environment simulations.

### SHOT ANGLES (one per row)
- **Static (Selfie)** — Camera fixed, framing talent from the front. Classic selfie-cam or tripod talking-head setup.
- **Walking** — Camera follows talent walking. Dynamic, movement-based. Can be tracking (following) or leading (walking toward camera).
- **Sitting** — Talent is seated. Couch, chair, kitchen table, car seat. Conversational, relaxed energy.
- **Standing** — Talent stands in frame. More authoritative than sitting. Kitchen counter, doorway, standing at a desk.
- **Ground-Level** — Camera at floor/ground level shooting upward. Dramatic, intimate. Great for product reveals, sock close-ups, foot-level perspectives.
- **Dynamic (Third-Person)** — Camera operated by a third person moving around the talent. Cinematic, documentary-feel. Handheld drift, slow orbit, push-in/pull-out.`;
}

/**
 * The 3x3 Hook Formula — how AGC briefs create 9 hook variations.
 */
export function buildHookFormulaReference(): string {
  return `## AGC 9-HOOK MATRIX (3 Visuals x 3 Verbals)

AGC briefs always produce exactly 9 hook variations by combining 3 Visual approaches with 3 Verbal hooks. This gives editors maximum flexibility to mix and match for testing.

### HOW IT WORKS

**Step 1 — Design 3 Visual Approaches:**
Each Visual is a different camera setup, location, or opening visual context. They should be genuinely DIFFERENT — not just slight variations.

Examples of Visual differentiation:
- Visual A: Ground-level close-up of legs/feet (intimate, product-focused)
- Visual B: Talent sitting at kitchen table, morning light (conversational, lifestyle)
- Visual C: Dynamic tracking shot following talent through home (movement, energy)

**Step 2 — Write 3 Verbal Hooks:**
Each Verbal is a different opening line using a different hook strategy. They should target different emotional triggers.

Examples of Verbal differentiation:
- Verbal 1: Confession/admission ("Nobody ever told me these lines meant something.")
- Verbal 2: Challenge/question ("Look at what your socks are doing to your legs. Really look.")
- Verbal 3: Social proof/curiosity ("107,000 people switched to these socks. I found out why.")

**Step 3 — Combine into 9 hooks:**
| Visual A + Verbal 1 | Visual A + Verbal 2 | Visual A + Verbal 3 |
| Visual B + Verbal 1 | Visual B + Verbal 2 | Visual B + Verbal 3 |
| Visual C + Verbal 1 | Visual C + Verbal 2 | Visual C + Verbal 3 |

### HOOK RULES
- Every hook must match the awareness level. Unaware hooks CANNOT mention the product, the problem name, or the product category.
- Every hook must feel natural in its visual context. A ground-level sock shot with a confession about morning routines feels wrong — the visual and verbal must belong together.
- Hooks should use different Building Block types across the 3 Verbals (e.g., Problem + Curiosity + Benefits, not Problem + Problem + Problem).
- Each hook row gets ALL columns filled: Building Block, Shot Type, Shot Angle, Talent Notes, Shot Notes, Shot Visual, Lines, Editing Notes, Caption.`;
}

/**
 * Core AGC structural rules — format consistency, short lines, etc.
 */
export function buildAgcRules(): string {
  return `## AGC STRUCTURAL RULES (Non-Negotiable)

### 1. EVERY ROW MUST HAVE A LINE (No Silent Rows)
Every single row in the body section MUST have spoken words in the Lines column. There are NO silent/visual-only rows. Even during product demonstrations, B-roll cutaways, or visual moments — there must ALWAYS be continuous voiceover or on-camera dialogue playing. In a successful DTC ad, every second of screen time has a spoken line driving the sale forward. If you feel tempted to write a row with empty Lines, add narration that describes what the viewer is seeing or advances the argument.

### 2. SHORT LINES RULE
Each row in the brief = ONE thought, ONE breath. If you would pause mid-sentence when speaking, SPLIT it into two rows.

BAD (too much per row):
| "I've been wearing these socks for three months and let me tell you, they changed everything about my morning routine because I used to struggle just to get dressed." |

GOOD (one breath per row):
| "I've been wearing these socks for three months." |
| "Let me tell you — they changed everything." |
| "I used to struggle just to get dressed." |

### 3. FORMAT CONSISTENCY RULE
Choose ONE body format and NEVER mix within the body section:

**Option A — Full POV (Voiceover Narration):**
- All body rows use Shot Type = SCRIPT
- Talent's voice is heard but they're NOT on camera speaking
- Camera shows hands, product, environment, demonstrations
- Best for: Documentary style, packing room, investigation, lifestyle

**Option B — Full Face-to-Camera:**
- All body rows use Shot Type = ON CAMERA
- Talent speaks directly to camera, face visible
- Feels like a testimonial or personal recommendation
- Best for: Testimonial, confession, expert/authority, direct address

**Exception on shot type:** BROLL rows can appear in EITHER format as brief interruptions for visual variety. But the speaking format must be consistently SCRIPT or ON CAMERA — never alternating. NOTE: Even BROLL rows MUST still have a spoken line (voiceover continues over cutaway visuals). There are NO silent rows in a DTC ad.

### 4. AWARENESS-LEVEL BODY STRUCTURE

**Unaware (TOF):**
- Product does NOT appear in the first 50% of the body
- No product name, no "socks," no "compression," no problem label until midpoint
- Body arc: Life experience → Pattern recognition → Education → Solution hint → Product reveal → Benefit → Soft CTA
- The viewer should not realize this is an ad until the second half

**Problem Aware:**
- Lead with pain. 60-70% of body dedicated to naming and intensifying the problem BEFORE revealing the solution
- Body arc: Pain hook → Vivid pain showcase → Twist the knife → Education → Solution → Product intro → Proof → CTA

**Solution Aware:**
- Brief problem acknowledgment (1-2 rows max), then heavy differentiation
- Body arc: Quick pain nod → Failed alternatives → New mechanism → Product intro → Features → Proof cascade → CTA

**Product Aware:**
- Product name appears in first 3 rows. Go deep on ONE proof story
- Body arc: Product + new info → Deep customer story → Proof → Mechanism deep-dive → Offer → CTA

**Most Aware:**
- Product + offer in first row. Keep it short. Deal IS the script
- Body arc: Product + offer → Quick proof → Urgency → Details → CTA

### 5. EXTRA B-ROLL REQUIREMENT
Every AGC brief must end with 8-12 extra B-roll shots. These are additional visual shots NOT in the main body — they give editors flexibility for cutaways, transitions, and visual variety.

Include a mix of:
- Product close-ups (texture, patterns, stretch, cushioning)
- Environment/setting shots (the location, props, atmosphere)
- Talent moments (candid reactions, hands interacting with product, walking away)
- Detail shots (packaging, labels, size tags, logo)

### 6. MAXIMIZE AGC ADVANTAGES
AGC has full creative control. Use it. Include shots that UGC creators CANNOT do:
- Precise tabletop demonstrations with specific props (measuring tape stretch to 30 inches)
- Controlled studio lighting for product beauty shots
- Multiple camera angles in one sequence
- Specific product comparisons side-by-side
- Ground-level or overhead perspectives that require a crew
- Synchronized visual demonstrations matching exact script beats`;
}

/**
 * Combined building blocks + shot types + rules reference for non-AGC video production briefs.
 * Used by: UGC, Founder Style, Fake Podcast, Spokesperson, Packaging/Employee.
 */
export function buildVideoProductionBriefReference(): string {
  return `## PRODUCTION BRIEF BUILDING BLOCKS

Every row in the production brief MUST have a Building Block label. This label explains the STRATEGIC PURPOSE of that row in the persuasion arc. When you read the Building Block column top-to-bottom, it should reveal the full persuasion journey.

### HOOK BUILDING BLOCKS
- **Benefits** — Lead with a specific benefit or outcome
- **Problem** — Lead with a relatable pain point or frustration
- **Solution** — Lead with the promise of a fix or answer
- **Curiosity** — Create an open loop, tease a reveal
- **Reactions** — Show genuine surprise, delight, or emotion
- **Deposition** — Make a bold claim or statement that demands attention
- **Bizarre** — Pattern-interrupt with something unexpected or strange
- **Satisfying** — Show something visually or emotionally satisfying

### BODY BUILDING BLOCKS (mix and sequence strategically)

**Product blocks:**
- **Product intro** — First reveal of the product (name, what it is)
- **Feature** — Specific product feature (non-binding tops, graduated compression, wide-mouth opening)
- **Showcase design** — Show patterns, colors, style — the visual appeal
- **Product demo** — Hands-on demonstration (stretching, putting on, measuring)

**Problem blocks:**
- **Problem** — Name or show the pain point
- **Pain showcase** — Visualize the pain vividly (sock marks, swelling, struggle)
- **Twist the knife** — Intensify the problem — make it feel urgent and unbearable
- **Bad alternative** — Show what the current/old solution looks like

**Solution blocks:**
- **Solution** — Position Viasox as the answer to the established problem
- **Benefit** — Specific benefit statement with proof (comfort, no marks, easy on)
- **Results** — Show measurable outcomes (clean legs, all-day comfort, survived a 12-hour shift)
- **Before & after** — Visual or narrative comparison of life before vs. after

**Credibility blocks:**
- **Testimonial** — Direct quote or paraphrased customer experience
- **Reviews** — Reference review data, star ratings, customer count
- **Social proof** — Show popularity signals (107K+ customers, sold-out runs, waitlists)
- **Authority figure** — Expert or professional endorsement (nurse, doctor, podiatrist)

**Story blocks:**
- **Story telling** — Narrative moment that builds emotional connection
- **Relatable** — "I've been there too" moment — shared experience
- **Gift for loved ones** — Position as a thoughtful gift (for mom, dad, grandparent)

**Commercial blocks:**
- **Buying experience** — What happens when you order (unboxing, packaging, delivery)
- **Special details** — Unique differentiators (bamboo blend, seamless toe, extra cushion)
- **Guarantees** — Risk reversal (free shipping, easy returns, satisfaction guarantee)
- **CTA** — Call to action with specific next step

## SHOT TYPES (one per row)
- **BROLL** — Visual-only cutaway footage. Camera shows something while voiceover continues over it. There are NO silent rows — voiceover always plays.
- **SCRIPT** — Voiceover narration over a visual. Talent's voice is heard but they are NOT on camera speaking. Camera shows hands, product, environment.
- **ON CAMERA** — Talent speaks directly to camera. Face visible, mouth moving, direct address.
- **Editing** — Post-production addition. Text overlays, graphics, split screens, before/after composites.

## SHOT ANGLES (one per row)
- **Static (Selfie)** — Camera fixed, framing talent from the front. Classic selfie-cam or tripod talking-head setup.
- **Walking** — Camera follows talent walking. Dynamic, movement-based.
- **Sitting** — Talent is seated. Conversational, relaxed energy.
- **Standing** — Talent stands in frame. More authoritative than sitting.
- **Ground-Level** — Camera at floor/ground level shooting upward. Intimate, dramatic.
- **Dynamic (Third-Person)** — Camera operated by a third person moving around the talent. Documentary-feel.

## PRODUCTION BRIEF RULES (Non-Negotiable)

### 1. EVERY ROW MUST HAVE A LINE (No Silent Rows)
Every single row in the brief MUST have spoken words in the Lines column. There are NO silent/visual-only rows. Even during product demonstrations, B-roll cutaways, or visual moments — there must ALWAYS be continuous voiceover or on-camera dialogue playing. In a successful DTC ad, every second of screen time has a spoken line driving the sale forward. If you feel tempted to write a row with empty Lines, add narration that describes what the viewer is seeing or advances the argument.

### 2. SHORT LINES RULE
Each row in the brief = ONE thought, ONE breath. If you would pause mid-sentence when speaking, SPLIT it into two rows.

BAD (too much per row):
| "I've been wearing these socks for three months and let me tell you, they changed everything about my morning routine because I used to struggle just to get dressed." |

GOOD (one breath per row):
| "I've been wearing these socks for three months." |
| "Let me tell you — they changed everything." |
| "I used to struggle just to get dressed." |`;
}
