import type { ScriptParams, FullAnalysis, FunnelStage, MarketingBookReference, ProductCategory } from '../engine/types';
import { buildSystemBase, getProductAnalysis } from './systemBase';
import { buildAdTypeGuideCompact } from './adTypeGuides';
import { getAwarenessScriptGuide } from './awarenessGuide';

function buildFunnelGuide(stage: FunnelStage): string {
  const guides: Record<FunnelStage, string> = {
    'TOF': `## FUNNEL STAGE: TOP OF FUNNEL (TOF) — Cold Audiences

**WHO THEY ARE:** Never heard of Viasox. May not know they have a solvable problem. Scrolling past everything.

**SCRIPT MANDATE — TOF STRUCTURAL RULES:**
1. The script must EARN attention through identification, curiosity, or emotion — never product claims.
2. Zero product language in the first 40% of the script. No brand name, no "socks," no "compression" until the viewer is hooked.
3. Hopkins' "select your audience" principle: the hook must call out a SPECIFIC person so the right viewer self-selects.
4. Proof density LOW — maximum one data point or one customer voice. Save the proof stack for MOF.
5. CTA must be soft: "Learn more," "See why 107K+ people switched," "Discover." NEVER "Buy now" or "Shop."
6. The script must feel like CONTENT, not an ad. If it reads like a sales pitch in the first half, it fails TOF.
7. Schwartz: Lead with IDENTIFICATION or PROBLEM, never the product.

**SCRIPT STRUCTURE:**
- Opening 40%: Audience identification + emotional hook + relatable scenario (viewer's world)
- Middle 30%: Problem recognition or curiosity bridge (the "wait..." moment)
- Final 30%: Product discovery (feels earned) + soft CTA

**DELIVERY STYLE:** Conversational, storytelling, confessional, slice-of-life. Never salesy.
**HOOK PRIORITY:** Emotional/curiosity > identity > "did you know." Product hooks BANNED.`,

    'MOF': `## FUNNEL STAGE: MIDDLE OF FUNNEL (MOF) — Warm, Considering

**WHO THEY ARE:** Know Viasox exists or engaged with a TOF ad. Interested but NOT convinced. Have objections and alternatives.

**SCRIPT MANDATE — MOF STRUCTURAL RULES:**
1. Open with a hook that references the problem or desire they already recognize — no need to build from scratch.
2. PROOF DENSITY must be HIGH — at least 2-3 proof elements per script (customer quotes, data points, demonstrations, before/after).
3. Schwartz's "three dimensions": every MOF script must work on at least TWO of: intensify DESIRE, strengthen IDENTIFICATION, build BELIEF.
4. Hopkins' "specifics" rule: vague claims banned. Every benefit needs a measurable proof point. "Comfortable" banned — "90% reported less pain in one week" required.
5. Must OVERCOME at least one specific objection (price, skepticism, "I've tried compression before").
6. CTA medium-direct: "Try your first pair," "See the reviews," "Compare for yourself." Not passive, not aggressive.
7. Include mechanism explanation — give them the "reason why" it works (Schwartz's mechanization).

**SCRIPT STRUCTURE:**
- Opening 25%: Problem/desire recognition + tension setup (objection or question)
- Middle 50%: Proof stack — mechanism, customer evidence, data points, demonstrations
- Final 25%: Resolution + differentiation + medium CTA

**DELIVERY STYLE:** Authoritative, evidence-based, testimonial-driven, comparison-ready.
**HOOK PRIORITY:** Proof > social proof > "reason why" > before/after.`,

    'BOF': `## FUNNEL STAGE: BOTTOM OF FUNNEL (BOF) — Hot, Ready to Convert

**WHO THEY ARE:** Visited the site, added to cart, engaged with multiple ads, or returning customers. They KNOW Viasox. Need a final push.

**SCRIPT MANDATE — BOF STRUCTURAL RULES:**
1. Brand name/product in the FIRST 3 SECONDS. They know who you are.
2. The first 30% delivers the OFFER, NEWS, or URGENCY — do not make them wait.
3. Every BOF script must have a CLEAR, SPECIFIC, ACTIONABLE CTA — not "shop now" but "Get 20% off — code COMFORT20."
4. Schwartz BOF rule: Lead with product name, price, offer, or what's new. ONLY valid leads.
5. Hopkins' "make action easy" rule: mention free shipping, easy returns, guarantee, risk-free trial.
6. Create URGENCY without deception — limited time, limited stock, seasonal relevance.
7. Keep it SHORT and DIRECT. BOF scripts are the most concise. No education, no problem setup.

**SCRIPT STRUCTURE:**
- Opening 30%: Brand recognition + offer/news/urgency lead
- Middle 40%: Final proof point + objection removal + risk reduction
- Final 30%: Specific CTA + urgency reinforcement

**DELIVERY STYLE:** Direct, confident, urgent, deal-focused. Minimal storytelling.
**HOOK PRIORITY:** Offer > urgency > reminder. Education hooks BANNED.`,
  };
  return guides[stage] ?? '';
}

function buildScriptProductGuide(product: ProductCategory): string {
  const guides: Record<ProductCategory, string> = {
    'EasyStretch': `## PRODUCT LINE: EASYSTRETCH — Non-Binding Diabetic & Comfort Socks

**PRODUCT IDENTITY:** Comfort-first, non-binding, NON-COMPRESSION socks.

**SCRIPT MESSAGING RULES:**
- NEVER call these compression socks — they are the OPPOSITE of compression
- Primary proof language: "no marks," "easy to put on," "finally comfortable," "can do it myself"
- Core messaging pillars (in priority order): No Sock Marks → Easy to Put On → All-Day Comfort → Style/Dignity → Diabetic-Safe
- When showing product in use: emphasize the EASE of putting them on (wide-mouth), the ABSENCE of marks at end of day, the BEAUTIFUL patterns
- Independence messaging is unique to this line — "I can put on my own socks" = dignity preserved
- Style angle is strongest here — show the patterns, the colors, the "these don't look medical" moment

**SCRIPT TALENT/SETTING:**
- Seniors at home putting on socks in the morning (independence angle)
- Diabetics checking their legs at end of day (no marks reveal)
- Gift buyer presenting beautiful socks to a loved one (style + care)
- Anyone showing off fun patterns (style confidence)

**EMOTIONAL TERRITORY:** Relief, independence, dignity, "finally," style confidence, "I can do this myself"`,

    'Compression': `## PRODUCT LINE: COMPRESSION — Graduated Compression Socks (15-20 mmHg)

**PRODUCT IDENTITY:** Performance + medical graduated compression with comfort and style.

**SCRIPT MESSAGING RULES:**
- ALWAYS differentiate from pharmacy/drugstore compression — "not your pharmacy compression socks"
- Primary proof language: "survived my 12-hour shift," "doesn't feel like a tourniquet," "real compression, real comfort"
- Core messaging pillars (in priority order): Real Compression Real Comfort → Survives 12-Hour Shifts → Reduces Swelling & Fatigue → Not Pharmacy Compression → Style Meets Function
- When showing product in use: show the ALL-DAY endurance (morning to night), the LEG AFTER a long shift (no swelling), the COMPARISON with cheap compression
- The "tourniquet effect" comparison (old compression vs. Viasox) is a killer script moment
- Healthcare worker insider language: shifts, scrubs, break room, charting, patient rounds

**SCRIPT TALENT/SETTING:**
- Nurse finishing 12-hour shift, removing shoes in break room (endurance proof)
- Teacher on their feet all day, walking halls (standing worker)
- Traveler on a long flight, arriving without swollen ankles (travel use)
- Side-by-side: pharmacy compression vs. Viasox (comparison reveal)

**EMOTIONAL TERRITORY:** Endurance, professional pride, "works as hard as I do," discovery/surprise`,

    'Ankle Compression': `## PRODUCT LINE: ANKLE COMPRESSION — Targeted Ankle Support

**PRODUCT IDENTITY:** Full graduated compression in discreet ankle-length format.

**SCRIPT MESSAGING RULES:**
- Position as MODERN, ACTIVE, VERSATILE choice — skews younger and more mobile
- Primary proof language: "invisible compression," "works with any shoe," "compression nobody sees"
- Core messaging pillars (in priority order): Compression Without the Crew → Versatile & Discreet → All-Season → Same Technology Shorter Length → Active Lifestyle Fit
- When showing product in use: show VERSATILITY (sneakers, loafers, dress shoes), the SURPRISE that it's compression, the WARM WEATHER advantage
- The "I didn't know they made ankle compression" discovery moment is a strong script beat
- Avoid heavy medical messaging — this line is for active, style-conscious people

**SCRIPT TALENT/SETTING:**
- Active professional putting on ankle socks with dress shoes (discreet)
- Gym-goer or runner (athletic context)
- Summer setting where crew socks would be too hot
- Shoe try-on montage showing versatility

**EMOTIONAL TERRITORY:** Freedom, modern lifestyle, versatility, "compression my way," discreet self-care`,

    'Other': `## PRODUCT LINE: GENERAL VIASOX
Focus on universal value propositions: superior comfort, no sock marks, beautiful designs, purpose-built quality, 107K+ customer base. Tailor messaging based on other selectors.`,
  };
  return guides[product] ?? guides['Other'];
}

function buildBookFocus(book: MarketingBookReference): string {
  const focuses: Record<MarketingBookReference, string> = {
    'Scientific Advertising (Hopkins)': `PRIMARY BOOK FOCUS: SCIENTIFIC ADVERTISING by Claude Hopkins.
Write this script as Hopkins would. Every principle must be front and center:
- SERVE, don't sell. The script must feel like useful information, not a pitch.
- SPECIFICITY is your weapon. No vague claims. Every benefit backed by exact numbers.
- HEADLINE-AS-SELECTOR: Your hook exists to select the RIGHT audience. Address THEM only.
- SHOW the product working. Let it demonstrate its own value visually (the sample principle).
- Write like a salesperson talking to ONE person. Not an ad. A conversation.
- Test everything. Include A/B test suggestions grounded in Hopkins' testing principles.`,

    'Breakthrough Advertising (Schwartz)': `PRIMARY BOOK FOCUS: BREAKTHROUGH ADVERTISING by Eugene Schwartz.
Write this script as Schwartz would. Channel existing mass desire:
- MASS DESIRE: Identify the desire that already lives in millions of hearts. Channel it onto Viasox.
- THREE DIMENSIONS: Every second must work on DESIRE (make them want), IDENTIFICATION (make them see themselves), and BELIEF (make them trust).
- AWARENESS LEVEL: Match every word to the prospect's awareness stage. The hook, the body, the CTA — all calibrated.
- INTENSIFICATION: Build momentum frame by frame. Sensory language. Visualize the result. Name the enemy.
- IDENTIFICATION: Use specific characters they recognize. Mirror their language. Show their world.
- MECHANIZATION: Give a REASON WHY it works. People need a mechanism to believe.`,

    'The Brand Gap (Neumeier)': `PRIMARY BOOK FOCUS: THE BRAND GAP by Marty Neumeier.
Write this script to create a GUT FEELING, not just communicate information:
- BRAND = GUT FEELING: Every frame must build an emotional impression. What FEELING should this leave? Relief. Warmth. "Finally." Dignity.
- TRUST = RELIABILITY + DELIGHT: Show the product works (reliability) AND show something unexpectedly wonderful about it (delight).
- CHARISMATIC BRAND: Make the viewer feel nothing else comes close. Not through comparison but through showing what Viasox uniquely delivers.
- DIFFERENTIATION: We notice only what's DIFFERENT. Differentiate in the first 3 seconds.
- Visuals and emotion carry more weight than copy in this approach. Focus on showing, feeling, experiencing.`,

    "The Copywriter's Handbook (Bly)": `PRIMARY BOOK FOCUS: THE COPYWRITER'S HANDBOOK by Robert Bly.
Write this script as Bly would. Direct response craft at its finest:
- 4 U's IN EVERY HOOK: URGENT (reason to act now), UNIQUE (different from competitors), ULTRA-SPECIFIC (exact numbers), USEFUL (clear benefit).
- BFD FORMULA: Address the audience's BELIEFS (about socks, health, aging), FEELINGS (fear, frustration, hope), and DESIRES (comfort, independence, style).
- MOTIVATING SEQUENCE: (1) Get attention, (2) Show the need, (3) Satisfy the need, (4) Prove superiority, (5) Ask for action.
- BENEFITS ONE LEVEL DEEPER: Feature -> Benefit -> REAL Benefit. Always dig to the emotional core.
- Write to ONE person. Short sentences. Short words. Prospect's own language from reviews.
- Put the strongest benefit in the hook. Include PROOF — specific numbers, real testimonials.`,

    'All Four Books': `Apply principles from ALL FOUR marketing books in a balanced way:
- Hopkins: Specificity, service, selection, samples
- Schwartz: Mass desire channeling, awareness-appropriate approach, three dimensions
- Neumeier: Gut feeling creation, trust-building, differentiation
- Bly: 4 U's, BFD formula, motivating sequence, benefits one level deeper`,
  };
  return focuses[book] ?? focuses['All Four Books'];
}


const FRAMEWORK_DETAILS: Record<string, string> = {
  'PAS (Problem-Agitate-Solution)': `**PAS (Problem-Agitate-Solution)**
Structure:
1. PROBLEM (0:00-0:05) - Name the specific pain point
2. AGITATE (0:05-0:15) - Make the problem feel urgent/unbearable
3. SOLUTION (0:15-0:25) - Introduce Viasox as the answer
4. PROOF (0:25-0:30) - Customer quote or data point

Best for: Cold audiences, problem-aware prospects`,

  'AIDA-R (Attention-Interest-Desire-Action-Retention)': `**AIDA-R (Attention-Interest-Desire-Action-Retention)**
Structure:
1. ATTENTION (0:00-0:05) - Pattern interrupt hook
2. INTEREST (0:05-0:12) - Unexpected fact or insight
3. DESIRE (0:12-0:22) - Paint the after state
4. ACTION (0:22-0:27) - Clear CTA
5. RETENTION (0:27-0:30) - Repeat key benefit

Best for: Product-aware audiences, retargeting`,

  'Before-After-Bridge': `**Before-After-Bridge**
Structure:
1. BEFORE (0:00-0:10) - Show/describe the painful before state
2. AFTER (0:10-0:20) - Show/describe the transformed after state
3. BRIDGE (0:20-0:30) - Viasox is the bridge between the two

Best for: Transformation stories, testimonial-style ads`,

  'Star-Story-Solution': `**Star-Story-Solution**
Structure:
1. STAR (0:00-0:05) - Introduce a relatable character
2. STORY (0:05-0:20) - Their journey with the problem
3. SOLUTION (0:20-0:30) - How Viasox solved it

Best for: Storytelling, longer formats, emotional connection`,

  'Feel-Felt-Found': `**Feel-Felt-Found**
Structure:
1. FEEL (0:00-0:08) - "I know how you feel about..."
2. FELT (0:08-0:18) - "I felt the same way / Others felt..."
3. FOUND (0:18-0:30) - "But here's what I found..."

Best for: Overcoming skepticism, premium price objection`,

  'Problem-Promise-Proof-Push': `**Problem-Promise-Proof-Push**
Structure:
1. PROBLEM (0:00-0:07) - Specific pain point
2. PROMISE (0:07-0:14) - What Viasox delivers
3. PROOF (0:14-0:24) - Data, quotes, social proof
4. PUSH (0:24-0:30) - CTA with urgency

Best for: Direct response, conversion-focused ads`,

  'Hook-Story-Offer': `**Hook-Story-Offer**
Structure:
1. HOOK (0:00-0:05) - Irresistible opening line
2. STORY (0:05-0:22) - Customer story with specific details
3. OFFER (0:22-0:30) - What they get + CTA

Best for: Social media ads, UGC-style content`,

  'Empathy-Education-Evidence': `**Empathy-Education-Evidence**
Structure:
1. EMPATHY (0:00-0:10) - Show you understand their struggle
2. EDUCATION (0:10-0:20) - Teach them something (why regular socks hurt)
3. EVIDENCE (0:20-0:30) - Prove Viasox is the answer

Best for: Building trust, premium positioning`,

  'The Contrast Framework': `**The Contrast Framework**
Structure:
1. THE OLD WAY (0:00-0:10) - How things used to be
2. THE NEW WAY (0:10-0:20) - How Viasox changes everything
3. THE PROOF (0:20-0:30) - Why it works

Best for: Competitive positioning, innovation messaging`,

  'The Skeptic Converter': `**The Skeptic Converter**
Structure:
1. THE OBJECTION (0:00-0:08) - Voice the skepticism directly
2. THE TWIST (0:08-0:18) - Unexpected revelation
3. THE CONVERT (0:18-0:30) - From skeptic to believer

Best for: Addressing price objection, overcoming "just socks" mindset`,

  'The Day-in-Life': `**The Day-in-Life**
Structure:
1. MORNING (0:00-0:10) - Start of the day, putting on socks
2. THROUGHOUT (0:10-0:20) - How they feel during the day
3. EVENING (0:20-0:30) - End of day, the difference

Best for: Relatability, specific-use scenarios (nurses, teachers)`,

  'The Myth Buster': `**The Myth Buster**
Structure:
1. THE MYTH (0:00-0:08) - Common misconception
2. THE TRUTH (0:08-0:20) - What the data actually shows
3. THE SOLUTION (0:20-0:30) - How Viasox embodies the truth

Best for: Education, thought leadership, PR content`,
};

export function buildScriptPrompt(
  params: ScriptParams,
  analysis: FullAnalysis,
): { system: string; user: string } {
  const frameworkDetail =
    FRAMEWORK_DETAILS[params.framework] ??
    `Framework: ${params.framework}`;

  const durationGuide: Record<string, string> = {
    '15s': 'Very tight. Every word counts. Max 40 words. Hook must be instant.',
    '30s': 'Standard social ad. Hook in first 3 seconds. 60-80 words total.',
    '60s': 'Room for story. Hook + problem + solution + proof + CTA. 120-160 words.',
  };

  const system = `${buildSystemBase()}

## SCRIPT FRAMEWORK
${frameworkDetail}

## DURATION GUIDE: ${params.duration}
${durationGuide[params.duration]}

## AD TYPE: ${params.adType}
${buildAdTypeGuideCompact(params.adType)}

## FUNNEL STAGE: ${params.funnelStage}
${buildFunnelGuide(params.funnelStage)}

${getAwarenessScriptGuide(params.awarenessLevel)}

${buildScriptProductGuide(params.product)}

## MARKETING BOOK FOCUS
${buildBookFocus(params.bookReference)}

${params.offer !== 'None' ? `## OFFER TO INCLUDE: ${params.offer}
Weave the ${params.offer === 'B1G1' ? 'Buy 1 Get 1' : 'Buy 2 Get 3'} offer naturally into the script. The offer should appear in the CTA section and optionally be teased earlier. Per Hopkins: frame the offer as SERVICE, not desperation. Per Schwartz: use the offer to reduce the "price barrier" dimension.` : ''}

${params.promoPeriod !== 'None' ? `## PROMO PERIOD: ${params.promoPeriod}
Incorporate the ${params.promoPeriod} timing naturally. Use seasonal urgency (Schwartz's "forces of change") — this moment ACTIVATES the existing desire. Do not force it; let the timing enhance the core message.` : ''}

${params.conceptAngleContext ? `## ⚠️ PRE-GENERATED CONCEPT & ANGLE — THIS IS YOUR PRIMARY STRATEGY

**THIS CONCEPT IS THE #1 DIRECTIVE FOR THIS SCRIPT.** The user selected this specific concept from a Concepts & Angles report and clicked "Write Script" — meaning this concept IS the strategy. Everything in this script must serve this concept.

**HOW TO USE THIS CONCEPT:**
1. **The angle in this concept IS the script's angle.** Do not invent a new angle — execute THIS one.
2. **The emotional core in this concept IS the script's emotional core.** Every line should serve this emotion.
3. **The proof points cited in this concept are your PRIMARY evidence.** Use them. Quote them. Build on them.
4. **The persona/audience described in this concept IS your target.** Cast talent, set scenes, write hooks for THIS person.
5. **The insight in this concept IS your "big idea."** The hook, the body, the CTA should all orbit this insight.
6. **All other selectors (framework, awareness, funnel, ad type, book reference) are TOOLS to execute this concept** — they shape HOW you deliver the concept, not WHAT the concept is.

If any element of the framework, funnel guide, or awareness rules contradicts the concept's strategy, **the concept wins.** The concept was hand-selected by the user. The other selectors are configurable tools.

<concept_strategy>
${params.conceptAngleContext}
</concept_strategy>` : ''}

## SCRIPT OUTPUT FORMAT

### 1. STRATEGY SUMMARY (at the top, before the script)
Start with a clear summary block:

**Hypothesis:** [What we believe about the audience and why this approach will work]
**Ad Type:** [The ad type selected] (Video or Static Image)
**Primary Persona:** [The specific customer segment this targets]
**Awareness Level:** [The awareness level]
**Angle:** [The strategic angle — the emotional/logical frame being used]

### 2. SCRIPT TABLE (markdown table format)
Write the ENTIRE script as a markdown table with these columns:
| Timestamp | Visuals | Line | Delivery | Shot |
Where:
- **Timestamp** = Timecode (e.g., 0:00–0:03)
- **Visuals** = What the viewer sees on screen (setting, talent action, product shots, text overlays)
- **Line** = The exact spoken/written copy
- **Delivery** = Either "DTC" (Direct to Camera) or "VO" (Voiceover) or "Text" (on-screen text only) or "Dialogue" (conversation between people)
- **Shot** = Brief camera/shot description (e.g., "CU face", "Wide establishing", "Product insert", "OTS", "Handheld POV")

**IMPORTANT — HOOKS GO FIRST:**
All hook variations MUST be in the FIRST rows of the table, ABOVE the body script. Label them clearly:
- Row label in Timestamp column: "HOOK 1", "HOOK 2", "HOOK 3", etc.
- After all hooks, add a row: "--- BODY SCRIPT STARTS BELOW ---" spanning all columns
- Then continue with the body script using normal timestamps (starting from where the hook ends)

Example table structure:
| Timestamp | Visuals | Line | Delivery | Shot |
|-----------|---------|------|----------|------|
| HOOK 1 (0:00–0:03) | [visuals] | "[line]" | DTC | CU face |
| HOOK 2 (0:00–0:03) | [visuals] | "[line]" | VO | Wide shot |
| HOOK 3 (0:00–0:03) | [visuals] | "[line]" | DTC | Medium |
| **BODY** | **---** | **Script continues below** | **---** | **---** |
| 0:03–0:08 | [visuals] | "[line]" | DTC | Medium |
| 0:08–0:15 | [visuals] | "[line]" | VO | Product CU |
| ... | ... | ... | ... | ... |

For Static ad type, replace the table with:
| Element | Content | Visual Direction |
With rows for: Headline, Subhead, Body Copy, CTA Button, Visual Description.

### 3. FRAMEWORK BREAKDOWN (below the table)
After the script table, include a section:
## How ${params.framework} Was Applied
Explain specifically how the selected framework was translated into this script. Walk through each phase of the framework (e.g., for PAS: "The PROBLEM phase appears in rows 0:03–0:08 where we..."). Reference the specific rows/timestamps. This helps the creative team understand the strategic reasoning behind each section of the script.

## ADVERTISING MASTERY PRINCIPLES
Apply these principles from the four foundational marketing texts throughout every script:

### FROM SCIENTIFIC ADVERTISING (Claude Hopkins)

**The Service Principle:**
The only purpose of advertising is to sell. Do not aim to amuse or entertain. Every frame of this script must advance the sale. The best advertising looks like news, feels like a service, and acts like a salesperson.

**The Specificity Principle:**
Specifics outperform generalities by orders of magnitude. Never say "many customers love our socks." Say "47% of reviewers mentioned comfort in their first sentence." Never say "helps with swelling." Say "reduces ankle circumference noticeably, according to nurses who tested them on 12-hour shifts." Specific facts SELL. Vague claims are ignored.

**The Headline-As-Selector Principle:**
Your headline (and your hook) exists to select the RIGHT audience. Address the people you seek, and THEM ONLY. A headline about sock marks selects people with sock marks. A headline about 12-hour shifts selects nurses. Do not try to speak to everyone.

**The Psychology of Service:**
People do not buy from advertisers. They buy from servants. The best ads offer something — information, a solution, a gift, a free sample, a useful tip. Always lead with what you GIVE, not what you want.

**The Sample Principle:**
Let the product speak for itself. In a video ad, the equivalent of a sample is SHOWING the product in action — the ease of putting it on, the comfort throughout the day, the absence of marks at the end. Show, don't just tell.

### FROM BREAKTHROUGH ADVERTISING (Eugene Schwartz)

**Mass Desire = Sales Power:**
Copy cannot create desire. It can ONLY channel desire that already exists in millions of hearts onto YOUR product. Your script's job is to TAP the desire (comfort, independence, dignity, relief from pain) and AIM it at Viasox.

**The Three Dimensions of Copy:**
Every great script works on three levels simultaneously:
1. DESIRE — Make them WANT. Intensify the desire by making them visualize the fulfillment.
2. IDENTIFICATION — Make them SEE THEMSELVES as the kind of person who uses this product.
3. BELIEF — Make them TRUST. Build conviction through mechanism, proof, and documentation.

**Schwartz's Awareness Scale Applied to Scripts:**
Follow the detailed awareness level guide above — it dictates the ENTIRE script architecture: time allocation, product placement timing, proof density, CTA directness, and emotional sequencing. The awareness level is not a surface adjustment — it changes EVERYTHING about the script.

**The Intensification Technique:**
To strengthen desire in your script:
- Build MOMENTUM — each frame should make the viewer want MORE
- Use SENSORY LANGUAGE — "soft," "plush," "warm hug for your feet" (from actual reviews)
- VISUALIZE THE RESULT — show the after state vividly: no marks, no swelling, beautiful patterns
- NAME THE ENEMY — the old way, the beige socks, the tourniquet compression, the daily struggle

**The Identification Technique:**
Make the viewer see themselves in the script:
- Use SPECIFIC CHARACTERS they recognize: "I'm a nurse," "I'm a mom of 3," "I bought these for my 85-year-old mother"
- Mirror their LANGUAGE — pull exact phrases from reviews
- Show their WORLD — the break room, the living room, the morning routine

**The Mechanization Technique:**
Give a REASON WHY it works. People need a mechanism:
- Non-binding tops that don't restrict circulation
- Graduated compression that actually feels comfortable
- Wide-mouth opening that slides on without a fight
- Cushioned soles that absorb impact through a 12-hour shift

### FROM THE BRAND GAP (Marty Neumeier)

**Brand = Gut Feeling:**
A brand is not a logo, not an identity system, not a product. It's a person's GUT FEELING about a product. Your script must create a FEELING, not just communicate information. What feeling should a Viasox ad leave? Relief. Warmth. "Finally." Dignity.

**Trust = Reliability + Delight:**
Reliability is table stakes — the socks work as promised. DELIGHT is what creates loyalty and word-of-mouth. Your script should show BOTH: the product performs (reliability), AND there's something unexpectedly wonderful about it (the patterns, the colors, the feeling of being yourself).

**The Charismatic Brand Test:**
A charismatic brand is one for which people believe there's no substitute. Your script should make the viewer feel that nothing else comes close. Not through comparison-bashing, but through showing what Viasox uniquely delivers — the combination of medical support AND beautiful design AND effortless comfort that no one else offers.

**Differentiation Is Survival:**
We're hardwired to notice only what's DIFFERENT. Your script must differentiate in the first 3 seconds. Not "great socks" but "compression socks that nurses actually want to wear." Not "comfortable" but "the first socks that didn't leave marks on her 85-year-old legs."

### FROM THE COPYWRITER'S HANDBOOK (Robert Bly)

**The 4 U's of Copy (Apply to Every Hook):**
1. URGENT — Give a reason to act now
2. UNIQUE — Say something different from competitors
3. ULTRA-SPECIFIC — Use exact numbers, exact quotes, exact details
4. USEFUL — Offer a clear benefit or piece of valuable information

**The BFD Formula:**
Before writing, identify the audience's core:
- BELIEFS — What do they believe about their condition? About socks? About medical products?
- FEELINGS — What emotions dominate? Fear? Frustration? Hope? Embarrassment?
- DESIRES — What do they want most? Comfort? Independence? Style? To stop worrying?
Your script must address all three.

**The Motivating Sequence (for longer scripts):**
1. Get attention (hook)
2. Show the need (agitate the problem)
3. Satisfy the need (introduce the solution)
4. Prove superiority (data, testimonials, mechanism)
5. Ask for action (CTA)

**Bly's Copy Rules That Apply to Scripts:**
- Write to ONE person, not a crowd. "You" not "people."
- Use short sentences. Short paragraphs. Short words.
- Use the prospect's own language — mirror their vocabulary from reviews
- Benefits beat features. Always. But dig ONE LEVEL DEEPER for the real benefit.
  - Feature: Non-binding tops → Benefit: No sock marks → REAL Benefit: No fear of physical decline
  - Feature: Beautiful patterns → Benefit: Style → REAL Benefit: Dignity, refusing to look sick
  - Feature: Easy to put on → Benefit: Convenience → REAL Benefit: Independence, not needing help
- Put the strongest benefit in the headline/hook
- Include PROOF — specific numbers, real testimonials, named sources

## SEGMENT-AWARE SCRIPT WRITING
The product data includes two layers of customer segments:
- **Motivation Segments** (Why They Buy): Use these to choose the primary ANGLE of the script — what desire or pain to lead with
- **Identity Segments** (Who They Are): Use these to cast the TALENT and set the SCENE — who the viewer sees on screen

**Script Targeting Best Practice:**
- The "Target Persona" provided by the user should map to a specific motivation + identity intersection
- The HOOK should resonate with the motivation segment (the WHY)
- The TALENT/SETTING should represent the identity segment (the WHO)
- Example: If targeting "nurses with foot pain" → Motivation = Pain & Symptom Relief, Identity = Healthcare Worker → Script opens in a hospital break room, nurse removing shoes after shift
- Pull customer language from BOTH segment pools — motivation segments give you pain/benefit vocabulary, identity segments give you lifestyle/context vocabulary

## SCRIPT RULES (Non-Negotiable)
1. Every line of copy must be speakable out loud — read it aloud as you write
2. Include specific customer language from the review data — not paraphrased, THEIR words
3. Timestamp every section precisely
4. Include visual direction for each section — be specific about what the camera sees
5. Include a clear, specific CTA — not "learn more" but "try your first pair risk-free"
6. Include at least one real customer quote with the data frequency backing it
7. Keep within word count for duration (15s=40 words, 30s=60-80 words, 60s=120-160 words)
8. Hook must work in first 3 seconds — this is where 80% of viewers drop
9. Do NOT use generic claims — ground EVERYTHING in data
10. Apply Hopkins' specificity principle throughout — numbers, percentages, quotes
11. Apply the detailed awareness level architecture above — it dictates the ENTIRE script structure, timing, product placement, proof density, and CTA approach. The awareness level is NOT a surface adjustment; it changes everything.
12. Every script must work on all three of Schwartz's dimensions: Desire + Identification + Belief — but the EMPHASIS shifts by awareness level (see the guide above)
13. Name the specific motivation + identity segment intersection being targeted in the Strategy Summary

## PRODUCT DATA
${getProductAnalysis(analysis, params.product)}`;

  const offerLine = params.offer !== 'None'
    ? `\nOffer to integrate: ${params.offer === 'B1G1' ? 'Buy 1 Get 1 Free' : 'Buy 2 Get 3'}`
    : '';
  const promoLine = params.promoPeriod !== 'None'
    ? `\nPromo Period: ${params.promoPeriod}`
    : '';
  const conceptLine = params.conceptAngleContext
    ? `

⚠️ **THIS SCRIPT MUST EXECUTE THE PRE-LOADED CONCEPT — IT IS YOUR #1 DIRECTIVE.**
The user hand-selected this concept from a Concepts & Angles report and clicked "Write Script." That concept is NOT background context — it IS the strategy. Specifically:
- The ANGLE from the concept is this script's angle. Do not invent a different one.
- The EMOTIONAL CORE from the concept drives every beat of this script.
- The PROOF POINTS from the concept are your primary evidence. Use them directly.
- The PERSONA from the concept is your target audience. Cast, set, and write for them.
- The INSIGHT from the concept is your "big idea." The hook, body, and CTA all orbit it.
- If any framework rule or awareness guide contradicts the concept, THE CONCEPT WINS.
Do not dilute, reinterpret, or drift from the concept. Execute it faithfully.`
    : '';

  const user = `Write a ${params.duration} ${params.adType} ad script for ${params.product} using the ${params.framework} framework.

Funnel Stage: ${params.funnelStage} (${params.funnelStage === 'TOF' ? 'Top of Funnel — cold audience' : params.funnelStage === 'MOF' ? 'Middle of Funnel — considering' : 'Bottom of Funnel — ready to buy'})
Awareness Level: **${params.awarenessLevel}**
Target Persona: ${params.persona}${offerLine}${promoLine}
Primary Book Reference: ${params.bookReference}${conceptLine}

**CRITICAL — AWARENESS LEVEL IS ${params.awarenessLevel.toUpperCase()}:**
${params.awarenessLevel === 'Unaware' ? `Follow the Unaware script architecture EXACTLY:
- Product name does NOT appear in the first 50%. "Socks," "compression," "marks," "swelling" do NOT appear in the first 40%.
- The script reads like CONTENT/STORY, not an ad, until the final section.
- Time allocation for ${params.duration}: ${params.duration === '15s' ? '0:00-0:10 identification/story → 0:10-0:13 awareness shift → 0:13-0:15 curiosity CTA' : params.duration === '30s' ? '0:00-0:15 identification/story → 0:15-0:22 awareness shift → 0:22-0:27 solution hint → 0:27-0:30 soft CTA' : '0:00-0:30 deep identification/story → 0:30-0:40 awareness shift → 0:40-0:52 solution reveal → 0:52-0:60 soft CTA'}
- CTA is SOFT: "Learn more," "Discover," "See what people found." NO offers, NO prices.
- The "awareness shift" moment (viewer goes from "I don't have a problem" to "Wait...") must be clearly identifiable in the script.` : ''}${params.awarenessLevel === 'Problem Aware' ? `Follow the Problem Aware script architecture EXACTLY:
- Lead with SPECIFIC, VIVID pain from the review data. Use customer language VERBATIM.
- Spend 60-70% of the script on pain naming and intensification BEFORE revealing the solution.
- Time allocation for ${params.duration}: ${params.duration === '15s' ? '0:00-0:03 pain hook → 0:03-0:08 agitate → 0:08-0:12 solution bridge → 0:12-0:15 CTA' : params.duration === '30s' ? '0:00-0:05 pain hook → 0:05-0:15 agitate/intensify → 0:15-0:22 solution reveal → 0:22-0:27 proof → 0:27-0:30 CTA' : '0:00-0:05 pain hook → 0:05-0:20 deep agitation → 0:20-0:35 solution reveal + mechanism → 0:35-0:50 proof cascade → 0:50-0:60 CTA'}
- Product appears in the second half. The first half is entirely about the PAIN.
- CTA is medium-soft: "Try your first pair," "See how it works."` : ''}${params.awarenessLevel === 'Solution Aware' ? `Follow the Solution Aware script architecture EXACTLY:
- Do NOT spend significant time on the problem. Brief acknowledgment (2-3 seconds max).
- Lead with DIFFERENTIATION — what makes Viasox fundamentally different from what they have tried.
- Time allocation for ${params.duration}: ${params.duration === '15s' ? '0:00-0:03 differentiation hook → 0:03-0:08 mechanism → 0:08-0:12 proof → 0:12-0:15 CTA' : params.duration === '30s' ? '0:00-0:05 differentiation hook → 0:05-0:12 mechanism → 0:12-0:20 proof + testimonial → 0:20-0:27 deeper benefit → 0:27-0:30 CTA' : '0:00-0:05 differentiation hook → 0:05-0:10 failed-solution acknowledgment → 0:10-0:25 new mechanism deep-dive → 0:25-0:40 proof cascade → 0:40-0:52 transformation story → 0:52-0:60 CTA'}
- Product appears within the first 30%. Heavy proof density.
- CTA is medium-direct: "See why [X]K switched," "Compare for yourself."` : ''}${params.awarenessLevel === 'Product Aware' ? `Follow the Product Aware script architecture EXACTLY:
- Brand name/product appears in the FIRST 3 SECONDS. They know you.
- Introduce NEW information: deeper data, new testimonial, behind-the-scenes, new product.
- Time allocation for ${params.duration}: ${params.duration === '15s' ? '0:00-0:03 brand + new info hook → 0:03-0:10 deep proof → 0:10-0:15 CTA' : params.duration === '30s' ? '0:00-0:05 brand + new info hook → 0:05-0:15 deep proof/story → 0:15-0:22 intensified desire → 0:22-0:27 offer/urgency → 0:27-0:30 CTA' : '0:00-0:05 brand + new info hook → 0:05-0:20 deep customer story → 0:20-0:35 proof cascade → 0:35-0:47 mechanism deep-dive → 0:47-0:55 offer → 0:55-0:60 CTA'}
- Go DEEP on one proof point, not wide on many. One powerful story > five bullet points.
- CTA is DIRECT: "Shop now," "Get your pair," "Try today."` : ''}${params.awarenessLevel === 'Most Aware' ? `Follow the Most Aware script architecture EXACTLY:
- Product name and offer in the FIRST SENTENCE. No warm-up. No education.
- Keep it SHORT even when the duration allows length. Dead space > unnecessary words.
- Time allocation for ${params.duration}: ${params.duration === '15s' ? '0:00-0:03 product + offer → 0:03-0:10 urgency/details → 0:10-0:15 CTA' : params.duration === '30s' ? '0:00-0:05 product + offer/news → 0:05-0:15 quick proof/urgency → 0:15-0:22 details → 0:22-0:27 risk reversal → 0:27-0:30 CTA' : '0:00-0:05 product + offer → 0:05-0:15 quick proof/social → 0:15-0:25 offer details → 0:25-0:35 urgency → 0:35-0:50 product showcase → 0:50-0:60 CTA'}
- CTA is maximally DIRECT: "Buy now," "Shop the sale," "Add to cart."
- The DEAL is the script. Urgency must be genuine.` : ''}

**CRITICAL — AD TYPE IS ${params.adType.toUpperCase()}:**
The ad type dictates the ENTIRE production style of this script. ${params.adType === 'Static' ? 'This is a STATIC ad — write for a single image with headline, subhead, body copy, and CTA. There is no dialogue, no video, no scenes.' : `This is a VIDEO ad. The script must describe scenes, talent, dialogue/voiceover, camera work, and pacing specific to ${params.adType}.`}
${params.adType.includes('AGC') ? 'AGC (Actor-Generated Content): Polished, cinematic production. Professional talent, multiple angles, produced lighting. The script should read like a production brief — specify camera angles, talent direction, set design, and post-production elements. Every frame is intentional.' : ''}${params.adType.includes('UGC') ? 'UGC (User-Generated Content): Raw, authentic, phone-shot. A real person speaking to camera from their home, car, or break room. The script must sound SPOKEN, not written — natural pauses, conversational language, imperfect delivery. Visuals are handheld, natural light. If it reads like a polished ad script, rewrite it to sound like a real person talking.' : ''}${params.adType === 'Ecom Style' ? 'Ecom Style: Product-hero visual storytelling. Close-ups of fabric, unboxing sequences, product-in-use beauty shots with fast cuts and text overlays. The script is primarily VISUAL with supporting text/VO — not dialogue-driven.' : ''}${params.adType === 'Founder Style' ? 'Founder Style: The founder speaks directly to camera with passion and authority. Personal story, behind-the-brand narrative. The script is a MONOLOGUE — one person, authentic setting, personal conviction. "Let me tell you why I created this..."' : ''}${params.adType === 'Fake Podcast Ads' ? 'Fake Podcast Ads: Two people in podcast setup having a natural CONVERSATION about the product. Must sound like organic discovery, not scripted. Write it as DIALOGUE with natural interruptions, reactions, and genuine surprise.' : ''}${params.adType === 'Street Interview Style' ? 'Street Interview Style: Interviewer approaches people with questions or product challenges. Real reactions, surprise, real-world setting. The script defines the SETUP QUESTION and expected interaction flow — the reactions should feel genuine and unscripted.' : ''}${params.adType === 'Spokesperson' ? 'Spokesperson: Expert or authority figure (doctor, nurse, professional) presenting the product. Credibility-driven. The script should establish AUTHORITY first, then deliver the message with professional gravitas.' : ''}${params.adType === 'Packaging/Employee' ? 'Packaging/Employee: Behind-the-scenes warehouse content. Real team packing orders, showing care and attention. The script describes the SETTING, employee actions, and the "we care about every pair" narrative.' : ''}
A ${params.adType} script and a different ad type script for the same awareness level should be completely different productions — different talent, different visuals, different delivery style.

**CRITICAL — PRODUCT LINE IS ${params.product.toUpperCase()}:**
${params.product === 'EasyStretch' ? 'This is the EasyStretch line — NON-BINDING, NON-COMPRESSION comfort socks. NEVER call these compression socks. Lead with: no sock marks, easy to put on, bamboo softness, beautiful patterns. The independence angle (putting on socks alone) and style angle (not "medical" looking) are the strongest script moments for this product.' : ''}${params.product === 'Compression' ? 'This is the Compression line (15-20 mmHg graduated compression). Lead with: real compression that doesn\'t feel like a tourniquet, survives 12-hour shifts, reduces swelling. Differentiate from pharmacy compression. Healthcare worker insider language is powerful here: shifts, scrubs, break room, charting.' : ''}${params.product === 'Ankle Compression' ? 'This is the Ankle Compression line — graduated compression in ankle-length format. Lead with: versatile, discreet, works with any shoe, same technology shorter length. Position as modern and active. "Invisible compression" is the strongest script moment. Avoid heavy medical messaging.' : ''}${params.product === 'Other' ? 'Focus on universal Viasox value propositions: comfort, no sock marks, beautiful designs, 107K+ customers.' : ''}
The product line changes the messaging pillars, the talent/setting, and the emotional territory. An EasyStretch script and a Compression script should feature different people, different settings, and different proof points.

**CRITICAL — FUNNEL STAGE IS ${params.funnelStage}:**
${params.funnelStage === 'TOF' ? 'Cold audiences. NO brand/product in first 40% of script. Lead with identification and emotion. Proof density LOW — one data point max. CTA soft. The script must feel like content, not an ad. Delivery should be storytelling/confessional, not salesy.' : ''}${params.funnelStage === 'MOF' ? 'Warm audiences. HIGH proof density — at least 2-3 proof elements. Overcome at least one specific objection. Hopkins\' "specifics" rule: every benefit needs data. CTA medium-direct. Include mechanism explanation (why it works).' : ''}${params.funnelStage === 'BOF' ? 'Hot audiences. Brand name in FIRST 3 SECONDS. Offer/urgency/news leads. Keep script SHORT and DIRECT — no education, no problem setup. Specific CTA with action details. Mention risk reducers (free shipping, guarantee, easy returns).' : ''}

**SELECTOR INTERACTION:**
All selectors (awareness, ad type, product, funnel, framework, duration, book) interact and must ALL be reflected. For example:
- Unaware + UGC + EasyStretch + TOF + 30s = A real person on their phone talking about their morning routine struggle with socks, filmed raw, no product mention until 0:22, soft CTA
- Most Aware + AGC + Compression + BOF + 15s = Polished 15-second spot: "Viasox Compression — 20% off this week" with nurse removing shoes after shift, immediate CTA
These should be COMPLETELY DIFFERENT scripts because every selector changes the output.

OUTPUT STRUCTURE (follow this exact order):

**1. STRATEGY SUMMARY** (at the very top)
- Hypothesis
- Ad Type (${params.adType} — ${params.adType === 'Static' ? 'Static Image' : 'Video'})
- Primary Persona
- Awareness Level (${params.awarenessLevel})
- Angle (the strategic messaging angle)

**2. SCRIPT TABLE** (markdown table)
Use the exact table format from the instructions:
| Timestamp | Visuals | Line | Delivery | Shot |

Put ALL ${params.hookVariations} hook variations FIRST in the table (labeled HOOK 1, HOOK 2, etc.), THEN a separator row, THEN the body script with timestamps.

Each hook should use a different approach. After each hook label, note which principle it applies (e.g., "HOOK 1 — Hopkins Selector").

**3. KEY DATA POINTS** — Every statistic and customer quote referenced, with source frequencies.

**4. HOW ${params.framework.toUpperCase()} WAS APPLIED** — Walk through each phase of the ${params.framework} framework and explain how it maps to specific sections of the script table. Reference timestamps.

The script should:
1. Follow the exact ${params.framework} framework structure
2. Be written specifically for ${params.adType} format — match the tone, structure, and delivery style
3. Match the ${params.funnelStage} funnel stage — appropriate hook intensity, CTA directness
4. Use real customer language pulled directly from the review data
5. End with a clear, specific CTA appropriate for ${params.funnelStage}
6. Be within the word count for ${params.duration}
7. Heavily apply the principles from ${params.bookReference} throughout

CRITICAL: Write completely original copy. Every line must be built from the actual review data: real customer language, real frequencies, real quotes. The four books teach you the craft; the review data gives you the material. If any line could have been written without looking at the data, rewrite it.`;

  return { system, user };
}
