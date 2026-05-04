import type { AnglesParams, AngleType, FullAnalysis, FunnelStage, ProductCategory } from '../engine/types';
import { buildSystemBase, getProductAnalysis } from './systemBase';
import { buildAdTypeGuideFull } from './adTypeGuides';
import { getAwarenessConceptGuide } from './awarenessGuide';
import { buildFullAiSkillContext } from './fullAiSkillContext';
import { buildBriefConstraintsBlock, getDurationTarget, isShortFormDuration } from './creativeConstraints';
import {
  getProductPurchaseTriggers,
  getProductStrategicInsights,
  getEmotionalPainPatterns,
  getEmergingSegments,
  getMessagingPillars,
  getEmotionalArchitecture,
  getBehavioralCodes,
  getVocabularyProtectionRules,
  getCustomerVoiceBank,
  getEmotionalLanguageBoundaries,
  getVoiceToneExamples,
  getProductObjectionBank,
  getSegmentProductMatrix,
  getWinningAdReferenceBank,
} from './manifestoReference';

function buildAngleTypeMandate(angleType: AngleType): string {
  const mandates: Record<AngleType, string> = {
    'Problem-Based': `## ANGLE TYPE MANDATE: PROBLEM-BASED

**STRUCTURAL REQUIREMENT:** Every concept must be ARCHITECTURED AROUND A SPECIFIC PAIN POINT. The problem is not a backdrop — it IS the concept.

**CONCEPT STRUCTURE:**
- Opening 40%: Dramatize the SPECIFIC problem in vivid, sensory detail. The viewer must FEEL the pain, not just understand it. Use customer language from the reviews — exact words like "marks," "swelling," "struggle," "can't put them on."
- Middle 35%: Intensify the problem — show consequences, daily reality, what they've tried and failed. Build the emotional weight so the viewer thinks "that's exactly me."
- Final 25%: Introduce Viasox as the answer to THIS SPECIFIC problem. The solution must feel earned, not pitched.

**MANDATORY ELEMENTS:**
1. Name the problem in the first 3 seconds with SPECIFIC language (not "foot discomfort" but "those red sock marks that take 2 hours to fade")
2. Include at least ONE sensory detail about the problem (what it LOOKS like, FEELS like, or what others SEE)
3. Show the DAILY IMPACT — not just the symptom but how it affects their life, confidence, or independence
4. The solution must directly answer the stated problem — no generic benefits
5. Each concept must target a DIFFERENT problem (no two concepts about the same pain point)

**BANNED:** Generic "uncomfortable socks" language. Every problem must be specific enough that the viewer says "wait, that's MY problem."`,

    'Emotion-Based': `## ANGLE TYPE MANDATE: EMOTION-BASED

**STRUCTURAL REQUIREMENT:** Every concept must be ARCHITECTURED AROUND A PRIMARY EMOTION. The emotion drives every creative decision — visuals, tone, pacing, music, and copy.

**CONCEPT STRUCTURE:**
- Opening 30%: Trigger the target emotion immediately — through a scenario, image, or statement that the viewer FEELS before they think. No logical setup.
- Middle 40%: Deepen and sustain the emotion. Layer related feelings. Build emotional momentum. Use Schwartz's "three dimensions" — tap into desires, identifications, AND beliefs.
- Final 30%: Channel the emotion toward the product — the product becomes the vehicle for RESOLVING or FULFILLING the emotion.

**MANDATORY ELEMENTS:**
1. Identify ONE primary emotion per concept: independence, dignity, relief, joy, confidence, gratitude, love (gifting), or pride
2. The concept must evoke the emotion through SHOWING, not telling — "She can finally put on her own socks" (independence) vs. "Feel independent"
3. Include a TRANSFORMATION moment — the emotional shift from before to after
4. The product is tied to the emotional resolution, not just mentioned alongside it
5. Each concept must target a DIFFERENT primary emotion

**BANNED:** Leading with product features. Listing benefits. Using the word "comfortable" as the emotional hook (it's a feature, not an emotion).`,

    'Solution-Based': `## ANGLE TYPE MANDATE: SOLUTION-BASED

**STRUCTURAL REQUIREMENT:** Every concept must be ARCHITECTURED AROUND THE MECHANISM — the HOW and WHY Viasox works. The viewer should leave understanding the product's unique solution, not just its claims.

**CONCEPT STRUCTURE:**
- Opening 20%: Briefly acknowledge the known problem (they already know it exists) — then pivot immediately to "here's what's different."
- Middle 55%: Deep dive into the MECHANISM — graduated compression, non-binding tops, wide-mouth design, bamboo fiber, moisture-wicking. Explain HOW it solves the problem in a way competitors don't.
- Final 25%: Proof that the mechanism works — data, customer results, before/after.

**MANDATORY ELEMENTS:**
1. Each concept must feature a SPECIFIC mechanism or product innovation — not just "better socks"
2. Use Schwartz's "new mechanism" principle: position Viasox as a fundamentally different APPROACH, not just a better version of the same thing
3. Include a "reason why" — the scientific or design principle behind the solution
4. At least ONE proof point that the mechanism delivers results (data from reviews)
5. Each concept should highlight a DIFFERENT mechanism or solution aspect

**BANNED:** Vague "our socks are better" claims. Emotion-first approaches (save for Emotion-Based). Problem dwelling beyond 20% (they know the problem).`,

    'Identity-Based': `## ANGLE TYPE MANDATE: IDENTITY-BASED

**STRUCTURAL REQUIREMENT:** Every concept must be ARCHITECTURED AROUND WHO THE CUSTOMER IS. The product is a symbol of their identity, not a purchase. The concept should make the viewer think "this brand understands ME."

**CONCEPT STRUCTURE:**
- Opening 35%: Immerse the viewer in a SPECIFIC identity world — the nurse's station at 3 AM, the grandmother's morning routine, the warehouse worker's steel-toed boots. Make it unmistakably THEIR world.
- Middle 35%: Deepen the identity connection — show the values, challenges, and pride of this person. The product appears as something that BELONGS in their world.
- Final 30%: The product becomes a badge of identity — "made for people like you" without saying it literally.

**MANDATORY ELEMENTS:**
1. Target a SPECIFIC identity segment from the data (Healthcare Worker, Caregiver/Gift Buyer, Diabetic/Neuropathy, Standing Worker, Accessibility/Mobility, Traveler, Senior, Pregnant/Postpartum, Medical/Therapeutic)
2. Cross-reference with a motivation segment for sharper targeting — e.g., "Nurse + Pain Relief" or "Senior + Skeptic Converted"
3. Include INSIDER DETAILS that only someone in that identity group would recognize (specific to their daily reality)
4. Use Neumeier's "brand is what THEY say" principle — let the identity define the brand positioning
5. Each concept must target a DIFFERENT identity segment

**BANNED:** Generic "everyone" targeting. Surface-level identity mentions ("for nurses" without showing nurse reality). Product-first approaches.`,

    'Comparison-Based': `## ANGLE TYPE MANDATE: COMPARISON-BASED

**STRUCTURAL REQUIREMENT:** Every concept must be ARCHITECTURED AROUND A CLEAR CONTRAST — before vs. after, old solution vs. Viasox, expectation vs. reality. The comparison IS the concept.

**CONCEPT STRUCTURE:**
- Opening 30%: Establish the "BEFORE" or "OLD WAY" — what they've been using, what they expected, what the category normally looks like. Make it familiar and slightly frustrating.
- Middle 40%: The REVEAL — introduce Viasox as the contrasting alternative. Show the difference through direct side-by-side comparison, reaction, or demonstration.
- Final 30%: Amplify the gap — make the difference undeniable. Data, reactions, or visual proof that the comparison is dramatic.

**MANDATORY ELEMENTS:**
1. Each concept must have a CLEAR "A vs. B" structure — old/new, expected/actual, competitor category/Viasox
2. Use Schwartz's "sophistication" principle: don't just claim better — show a new MECHANISM that makes the comparison inevitable
3. The comparison must be SPECIFIC and VISUAL — not "better than regular socks" but "here's what pharmacy compression looks like vs. Viasox"
4. Include a "moment of surprise" — the point where the difference becomes undeniable
5. Each concept must compare against a DIFFERENT reference point (different competitor category, different expectation, different past experience)

**BANNED:** Naming specific competitor brands. Vague "better than the rest" claims. Comparisons that don't show the actual difference.`,

    'Testimonial-Based': `## ANGLE TYPE MANDATE: TESTIMONIAL-BASED

**STRUCTURAL REQUIREMENT:** Every concept must be ARCHITECTURED AROUND A REAL CUSTOMER VOICE. The customer's story is the entire ad — not a quote dropped into a product pitch. Authenticity is everything.

**CONCEPT STRUCTURE:**
- Opening 25%: The customer introduces themselves and their CONTEXT — who they are, what they deal with daily. This is identity + credibility building.
- Middle 50%: Their STORY — what the problem was, what they tried, the moment of discovery, their experience with Viasox. This must feel like a genuine narrative arc with a transformation.
- Final 25%: Their VERDICT and recommendation — the specific outcome, what changed, why they'd recommend it. End on the most powerful proof statement.

**MANDATORY ELEMENTS:**
1. Each concept must be built around a specific customer ARCHETYPE with a unique story arc
2. Use Hopkins' principle: "One customer's experience is more convincing than all the claims in the world"
3. Include SPECIFIC DETAILS that make the testimonial credible — duration of use, measurable results, specific moments of change
4. Use Bly's rule: testimonials need identity (who), specifics (what), and results (measurable outcome)
5. Each concept must feature a DIFFERENT customer archetype with a different transformation story

**BANNED:** Generic "I love these socks" testimonials. Quoting without context. Multiple testimonials crammed into one concept (one deep story beats five shallow ones).`,

    'Seasonal/Situational': `## ANGLE TYPE MANDATE: SEASONAL/SITUATIONAL

**STRUCTURAL REQUIREMENT:** Every concept must be ARCHITECTURED AROUND A SPECIFIC MOMENT, EVENT, OR LIFE SITUATION that makes Viasox suddenly and urgently relevant. Timing is the strategy.

**CONCEPT STRUCTURE:**
- Opening 30%: Set the SITUATION — the specific moment, season, event, or life change that creates the need. Make it timely and recognizable.
- Middle 40%: Connect the situation to the specific product benefit — why THIS moment makes Viasox essential (not just nice to have).
- Final 30%: Create situational urgency — the window of relevance, the gifting deadline, the seasonal opportunity.

**MANDATORY ELEMENTS:**
1. Each concept must tie to a SPECIFIC moment: holiday (Mother's Day, Christmas, Father's Day), life event (surgery, pregnancy, new job), season (summer travel, winter cold), or occasion (gifting, self-care)
2. Use Schwartz's "forces of change" principle: show how the situation ACTIVATES a latent desire
3. The product must feel like the PERFECT answer for THIS moment — not just any moment
4. Include situational urgency that's genuine — seasonal availability, gifting deadlines, recovery timelines
5. Each concept must tie to a DIFFERENT situation or moment

**BANNED:** Forced seasonal relevance (Viasox aren't a "summer product" without a clear connection). Generic "holiday sale" messaging without situational storytelling.`,

    'Fear-Based': `## ANGLE TYPE MANDATE: FEAR-BASED

**STRUCTURAL REQUIREMENT:** Every concept must be ARCHITECTURED AROUND A SPECIFIC HEALTH OR LIFE ANXIETY — but with empathy and resolution, NEVER exploitation. The fear is the entry point, not the destination.

**CONCEPT STRUCTURE:**
- Opening 25%: Name the fear with EMPATHY — "Have you noticed..." or "That moment when you realize..." Make the viewer feel seen, not scared.
- Middle 40%: Validate the fear with INFORMATION — what the signs mean, why they matter, what happens if ignored. Use education to build urgency without exploitation.
- Final 35%: Provide the RESOLUTION — how Viasox addresses the underlying concern. The product is the antidote to the fear.

**MANDATORY ELEMENTS:**
1. Each concept must target a SPECIFIC fear from Viasox data: losing independence, health deterioration signals (swelling, marks, numbness), inability to care for oneself, looking "sick" or "old," becoming a burden
2. Use Schwartz's rule: "Fear works when directed at loved ones, not at the prospect themselves" — frame fears in terms of impact on family, daily life, or dignity
3. The fear must be REAL and DATA-BACKED — cite review patterns that show real customers expressing this fear
4. Every fear concept MUST include a clear resolution — never leave the viewer in anxiety
5. Each concept must address a DIFFERENT fear

**BANNED:** Medical fearmongering. Exploiting health anxiety without resolution. Clinical or scary imagery. Shame-based messaging. Leaving the viewer more afraid than when they started.`,

    'Aspiration-Based': `## ANGLE TYPE MANDATE: ASPIRATION-BASED

**STRUCTURAL REQUIREMENT:** Every concept must be ARCHITECTURED AROUND THE AFTER STATE — the better life, the freedom, the joy. The aspiration is the concept. The product is the bridge.

**CONCEPT STRUCTURE:**
- Opening 35%: Paint the AFTER state in vivid, sensory detail — what life LOOKS like, FEELS like when the problem is solved. Start with the destination, not the journey.
- Middle 35%: Show the CONTRAST with current reality — the gap between where they are and where they could be. Make the aspiration feel achievable, not fantasy.
- Final 30%: Position Viasox as the BRIDGE — the practical step that turns aspiration into reality. The product is the means, not the end.

**MANDATORY ELEMENTS:**
1. Each concept must focus on a SPECIFIC aspiration: walking pain-free, dancing again, wearing what you want, staying independent, keeping up with grandkids, finishing a shift without pain, traveling comfortably
2. Use Schwartz's "intensification" principle: make the prospect visualize the fulfillment so vividly they practically live in it
3. The aspiration must be GROUNDED — drawn from real customer outcomes in the review data, not generic lifestyle imagery
4. Include a SPECIFIC customer example or data point showing the aspiration is achievable
5. Each concept must paint a DIFFERENT aspirational outcome

**BANNED:** Unrealistic promises. Generic "live your best life" messaging. Aspirations disconnected from the product's actual capabilities.`,

    'Education-Based': `## ANGLE TYPE MANDATE: EDUCATION-BASED

**STRUCTURAL REQUIREMENT:** Every concept must be ARCHITECTURED AROUND TEACHING SOMETHING VALUABLE. The viewer should learn something they didn't know — and in the process, understand why Viasox matters.

**CONCEPT STRUCTURE:**
- Opening 25%: Hook with a SURPRISING FACT, question, or myth-bust that makes the viewer want to learn more. "Did you know..." or "Most people don't realize..."
- Middle 50%: TEACH — deliver genuine educational value. Explain the science, the mechanism, the health implications, or the industry secrets. This must be genuinely informative, not a disguised sales pitch.
- Final 25%: Connect the education to the product — Viasox as the embodiment of what they just learned. The sale feels like a natural conclusion, not a pivot.

**MANDATORY ELEMENTS:**
1. Each concept must teach a SPECIFIC, VALUABLE insight: how compression works, why sock marks form, the impact of standing all day, what graduated compression means, how bamboo fiber differs, why non-binding matters for diabetics
2. Use Hopkins' principle: "The best advertising educates — give the consumer a reason to pay attention beyond the pitch"
3. Use Bly's principle: "Informational content converts better than pure sales pitches for skeptical audiences"
4. The education must be ACCURATE and drawn from real product/health information
5. Each concept must educate on a DIFFERENT topic

**BANNED:** Fake "did you know" hooks that are really just benefit claims. Surface-level "fun facts" without depth. Education that contradicts medical advice.`,

    '3 Reasons/Signs Why': `## ANGLE TYPE MANDATE: 3 REASONS/SIGNS WHY

**STRUCTURAL REQUIREMENT:** Every concept must be ARCHITECTURED AROUND A NUMBERED LIST — 3 specific reasons, signs, or facts that build a compelling case. The list format creates structure, curiosity, and a natural progression. This is a proven high-performing format in DTC advertising because it promises specific, digestible value.

**CONCEPT STRUCTURE:**
- Opening 15%: Hook with the PROMISE of the list — "3 signs your socks are hurting you," "3 reasons nurses switched to these socks," "3 things your feet are trying to tell you." The number "3" must appear in the hook. The viewer stays because they want to see all 3.
- Middle 65%: Deliver the 3 items with ESCALATING impact. Reason/Sign #1 is the most relatable (easy entry). #2 is surprising or educational. #3 is the most emotionally powerful or urgent — the one that makes them act.
- Final 20%: The solution — Viasox addresses all 3. CTA connects back to the list promise.

**MANDATORY ELEMENTS:**
1. The number "3" must appear in the hook — this is a LIST-PROMISE format
2. Each of the 3 reasons/signs must be SPECIFIC and DATA-BACKED from review data or medical reality — not vague platitudes
3. The 3 items must ESCALATE — start accessible, end powerful. The last item should be the emotional gut-punch or the most compelling proof
4. Each item must be DISTINCT — three variations of the same point = FAIL
5. The 3 items together must build an INEVITABLE case for the product — by the time the viewer has heard all 3, the CTA feels like a natural conclusion, not a pitch
6. Use customer language from the review data for each sign/reason — real words, not marketing speak

**FORMAT VARIATIONS:**
- "3 signs your socks are making your [condition] worse" (problem-focused, great for Problem Aware)
- "3 reasons 107,000+ women switched to these socks" (social proof + list, great for Solution Aware)
- "3 things I wish I knew before I spent $200 on socks that don't work" (confession + list, great for Unaware)
- "3 signs you need to change your socks today" (urgency + list, great for Problem Aware)
- "3 reasons your doctor would approve of these" (authority + list, great for Diabetes/Neuropathy)
- "3 things that happened when I stopped wearing regular compression socks" (transformation + list)

**AWARENESS LEVEL ADJUSTMENTS:**
- Unaware: "3 signs" format works best — signs of a problem they haven't recognized yet. Each sign creates an "oh wait" moment.
- Problem Aware: "3 reasons why [their current solution] isn't working" — validate their frustration with specific failures.
- Solution Aware: "3 reasons this compression is different from what you've tried" — differentiation through proof.

**BANNED:** Vague reasons like "they're comfortable" or "they feel great." Each reason must be specific enough to stand alone as a hook.`,

    'Negative Marketing': `## ANGLE TYPE MANDATE: NEGATIVE MARKETING

**STRUCTURAL REQUIREMENT:** Every concept must be ARCHITECTURED AROUND WHAT'S WRONG — with the industry, with competing products, with conventional wisdom, or with what the viewer is currently doing. This is NOT fear-based (which focuses on health anxiety). Negative Marketing focuses on FRUSTRATION, INJUSTICE, and EXPOSING PROBLEMS with alternatives. The emotional engine is righteous indignation, not fear.

**CONCEPT STRUCTURE:**
- Opening 30%: ATTACK the status quo — name what's broken, unfair, or unacceptable about current options. Be specific and bold. Call out the industry, the "one-size-fits-all" lie, the ugly medical socks, the impossible-to-wear compression, the overpriced pharmacy brands. The viewer should feel validated: "FINALLY someone is saying what I've been thinking."
- Middle 40%: PROVE the problem — specific evidence that the current options are failing people. Use measurements, comparisons, failed product experiences, and customer frustration language. Stack the evidence so the viewer feels increasingly frustrated with what they've been settling for.
- Final 30%: THE ALTERNATIVE — Viasox as the answer to everything that's wrong. The product introduction feels like vindication, not a sales pitch. "There's a reason 107,000+ people stopped settling."

**MANDATORY ELEMENTS:**
1. Each concept must name a SPECIFIC enemy — not just "bad socks" but the specific failure: pharmacy compression that takes 10 minutes to put on, "diabetic socks" that look medical and feel worse, the $40 socks that still leave marks, the sizing lie, the ugly beige tubes
2. The negativity must be JUSTIFIED — backed by real customer frustrations from the review data. This isn't complaining — it's exposing genuine problems
3. The tone is CONFIDENT and ASSERTIVE — not angry or bitter. Think "investigative journalist" or "fed-up consumer advocate," not "angry complainter"
4. The product reveal must feel EARNED — the viewer has been so well-primed with frustration that Viasox feels like sweet relief
5. Each concept must target a DIFFERENT enemy/problem

**EMOTIONAL ENGINE:**
- "I've been ripped off" → price injustice (drugstore socks that fail, expensive medical socks that are ugly)
- "I've been lied to" → false promises ("one-size-fits-all" that doesn't, "comfortable" socks that leave marks)
- "I've been ignored" → size exclusion (socks designed for average bodies, ignoring anyone over 18-inch calves)
- "I deserve better" → settling fatigue (accepting ugly/uncomfortable because they didn't know alternatives existed)
- "Nobody told me" → information gap (didn't know non-binding existed, didn't know compression could be easy)

**AWARENESS LEVEL ADJUSTMENTS:**
- Unaware: "The thing nobody tells you about your socks" — expose a problem they didn't know they had. The negativity is about the INDUSTRY keeping them in the dark.
- Problem Aware: "Why your 'diabetic socks' are actually making things worse" — attack the viewer's current solution directly. They already know the problem; show them their current solution is part of it.
- Solution Aware: "I spent $200 on compression socks before I found these" — attack the alternatives they've considered or tried.

**REFERENCE:** Top performers E194 "The Sock Sizing Scandal" and E171 "The 30-Inch Truth" are both Negative Marketing — they attack the industry's sizing lies with specific measurement proof. C163 "The Pressure" attacks the compression industry's 50-year-old approach.

**BANNED:** Personal attacks on competitors by name. Medical fearmongering (that's Fear-Based, not Negative Marketing). Bitterness or whining tone — this must feel empowering, not victimized. Negativity without a resolution (every concept must end with the Viasox solution).`,
  };
  return mandates[angleType] ?? '';
}

function buildProductLineGuide(product: ProductCategory): string {
  const guides: Record<ProductCategory, string> = {
    'EasyStretch': `**THE EASYSTRETCH LINE — Non-Binding Diabetic & Comfort Socks**

**PRODUCT IDENTITY:** EasyStretch is Viasox's COMFORT-FIRST line. These are non-binding, non-compression socks designed for people who need maximum comfort without any constriction. They are NOT compression socks.

**PRIMARY AUDIENCE:** Women 50+ — diabetics, neuropathy patients, seniors, people with edema, anyone who has experienced painful sock marks, swelling, or circulation issues from regular socks.

**CORE MESSAGING PILLARS (in priority order):**
1. **No Sock Marks / No Constriction** — The #1 selling point. Emphasize the non-binding top that eliminates red marks and indentations.
2. **Easy to Put On** — Wide-mouth design for people with limited mobility, arthritis, or dexterity issues. The "easy on" experience is a major differentiator.
3. **All-Day Comfort** — Bamboo fiber softness, moisture-wicking, seamless toe. Comfort they forget they're wearing.
4. **Style & Dignity** — Beautiful patterns and colors that look nothing like "medical socks." Fashion-forward design.
5. **Diabetic-Safe** — Designed with diabetic foot care in mind: seamless toe, no pressure points, moisture management.

**MESSAGING RULES FOR EASYSTRETCH:**
- NEVER position as compression socks — these are the OPPOSITE of compression
- Lead with COMFORT and FREEDOM, not medical function
- The "easy to put on" story is unique to this line — use it prominently
- Style/fashion angle is strongest here — these are the most visually distinctive socks
- When targeting diabetics, lead with safety and comfort, not fear
- The "no sock marks" message resonates across ALL segments — it's the universal entry point
- Independence messaging is critical: putting on socks alone = dignity preserved

**EMOTIONAL TERRITORY:** Relief, independence, dignity, "finally something that works," style confidence, "I can do this myself"`,

    'Compression': `**THE COMPRESSION LINE — Graduated Compression Socks**

**PRODUCT IDENTITY:** Viasox Compression is the PERFORMANCE + MEDICAL line. These are graduated compression socks at **12-15 mmHg** (the "sweet spot" — strong enough to actually work, gentle enough to wear all day), designed for people who need active circulatory support but also need socks they will actually keep wearing.

**PRIMARY AUDIENCE:** Women 50+ with swelling/edema/varicose veins, healthcare workers (nurses on 12-hour shifts), standing workers (retail, warehouse, teachers), travelers, post-surgery recovery, people with chronic venous insufficiency.

**CORE MESSAGING PILLARS (in priority order):**
1. **Real Compression, Real Comfort** — Medical-grade graduated compression that DOESN'T feel like a tourniquet. This is the key differentiator vs. pharmacy compression.
2. **Survives 12-Hour Shifts** — Durability and sustained compression through long days. Healthcare worker proof.
3. **Reduces Swelling & Fatigue** — Functional circulatory benefits: less leg fatigue, reduced swelling, better recovery.
4. **Not Your Pharmacy Compression** — Differentiation from cheap, ugly, painful compression socks.
5. **Style Meets Function** — Compression socks that look good enough to show off, not hide.

**MESSAGING RULES FOR COMPRESSION:**
- ALWAYS position as superior to pharmacy/drugstore compression — the comparison is powerful
- Lead with PERFORMANCE and RESULTS, then comfort
- The "12-hour shift" and "on your feet all day" stories are the strongest proof contexts
- When targeting healthcare workers, use insider language: shifts, scrubs, break room, charting
- The "tourniquet effect" comparison (old compression vs. Viasox compression) is a killer angle
- Travel compression (flights, road trips) is a strong secondary market
- Recovery messaging must be careful — don't make medical claims, use customer language

**EMOTIONAL TERRITORY:** Endurance, professional pride, relief after long days, "socks that work as hard as I do," discovery/surprise ("I didn't know compression could feel like this")`,

    'Ankle Compression': `**THE ANKLE COMPRESSION LINE — Targeted Ankle Support**

**PRODUCT IDENTITY:** Viasox Ankle Compression is the TARGETED SUPPORT line. These are ankle-length socks with **uniform compression around the ankle and arch** (NOT graduated — uniform pressure focused exactly where the support matters). For people who want targeted compression benefits in a low-profile, versatile format.

**PRIMARY AUDIENCE:** Women 50+ with localized ankle/foot swelling, standing workers (nurses, retail, teachers), women who prefer ankle-length socks for shoe versatility, warm-climate customers who find knee-highs too hot, and anyone new to compression who finds knee-highs intimidating.

**CORE MESSAGING PILLARS (in priority order):**
1. **Compression Without the Crew** — Targeted ankle-and-arch compression in ankle length. Get the support without the visible sock.
2. **Versatile & Discreet** — Works with any shoe: sneakers, loafers, dress shoes, boots. No one knows you're wearing compression.
3. **All-Season Comfort** — Perfect for warm weather when crew-length compression is too hot.
4. **Targeted Where It Matters** — Uniform compression concentrated on the ankle and arch — the specific pressure points that need support.
5. **Gateway to Compression** — For people who've never tried compression and find knee-highs too medical or too much.

**MESSAGING RULES FOR ANKLE COMPRESSION:**
- Lead with VERSATILITY and LIFESTYLE FIT, then compression benefits
- The "invisible compression" angle is unique to this line — compression nobody sees
- Summer/warm weather is a natural seasonal hook
- The "I didn't know they made ankle compression" discovery angle is effective
- NEVER target gym-goers, athletes, or young fitness audiences — our customer is a woman 50+ who wants ankle support without the knee-high commitment
- Even when the angle feels "active," the person is a 55-year-old woman who walks daily or stands for work, NOT a 30-year-old at the gym

**EMOTIONAL TERRITORY:** Freedom, versatility, "compression my way," style-conscious health decisions, discreet self-care, "I can finally try compression without it feeling like a medical event"`,

    'Other': `**GENERAL VIASOX LINE**

When the product line is not specified, focus on the UNIVERSAL Viasox value propositions that apply across all lines:
1. Superior comfort vs. anything else in the market
2. No sock marks / non-binding comfort
3. Beautiful designs that eliminate "medical sock" stigma
4. Purpose-built for people with real foot and leg challenges
5. 107K+ customer base as social proof

Tailor the messaging based on the angle type, awareness level, and funnel stage rather than product-specific features.`,
  };
  return guides[product] ?? guides['Other'];
}

function buildFunnelGuide(stage: FunnelStage): string {
  const guides: Record<FunnelStage, string> = {
    'TOF': `## FUNNEL STAGE: TOP OF FUNNEL (TOF) — Cold Audiences

**WHO THEY ARE:**
These people have NEVER heard of Viasox. They may not even know they have a problem worth solving. They are scrolling past ads. They do not care about your product, your brand, or your offer. You must earn every second of their attention.

**CONCEPT MANDATE — TOF STRUCTURAL RULES:**
1. The concept must stop the scroll through RECOGNITION, CURIOSITY, or EMOTION — never through product claims.
2. The first 40% of the concept must be entirely about the VIEWER'S WORLD — their daily reality, their pain, their identity. Zero product language.
3. Brand name, product name, and explicit product benefits must NOT appear until the final 30% of the concept.
4. The concept must feel like CONTENT, not advertising. If it reads like an ad in the first half, it fails TOF.
5. Use Hopkins' "select your audience" principle: the opening must call out a SPECIFIC person ("nurses," "moms," "anyone who stands 8+ hours") so the right viewer self-selects.
6. CTA must be soft and curiosity-driven: "Learn more," "See why 107,000+ people switched," "Watch this," "Discover." NEVER "Buy now" or "Shop."
7. Proof density should be LOW — one surprising data point or one emotional customer voice maximum. Save the proof stack for MOF.

**HOOK PRIORITY:** Emotional/curiosity hooks > identity hooks > "did you know" hooks. Product hooks are BANNED at TOF.

**CONCEPT STRUCTURE:**
- Opening 40%: Audience identification + emotional hook + relatable scenario
- Middle 30%: Problem recognition or disruption + curiosity bridge
- Final 30%: Product discovery (feels earned, not pitched) + soft CTA

**BEST CONCEPT APPROACHES FOR TOF:**
- "Day in the life" scenarios that mirror the viewer's reality
- Curiosity gaps ("What nurses know about socks that you don't")
- Identity-first storytelling ("If you're the daughter who worries about mom...")
- Pattern interrupts (unexpected visuals or statements that break scrolling)
- Relatable frustrations presented without immediately solving them

**AVOID AT TOF:**
- Leading with features, benefits, or product specs
- Brand mentions in the first 3 seconds
- Price, offers, or promotions
- Medical jargon or clinical language
- Direct comparison with competitors
- Hard CTAs or urgency language`,

    'MOF': `## FUNNEL STAGE: MIDDLE OF FUNNEL (MOF) — Warm, Considering

**WHO THEY ARE:**
These people know Viasox exists (or have engaged with a TOF ad). They are INTERESTED but NOT CONVINCED. They have questions, objections, and alternatives. They need evidence, social proof, and a reason to believe.

**CONCEPT MANDATE — MOF STRUCTURAL RULES:**
1. The concept must OPEN with a hook that references the problem or desire they already recognize — no need to start from scratch.
2. The first 25% sets up the tension (objection, question, or comparison) — then the remaining 75% builds the case.
3. PROOF DENSITY must be HIGH — every concept needs at least 2-3 proof elements (customer quotes, data points, demonstrations, before/after).
4. Schwartz's "three dimensions" rule: every MOF concept must work on at least TWO of the three dimensions — intensify DESIRE, strengthen IDENTIFICATION, or build BELIEF.
5. Hopkins' "specifics" rule: vague claims are banned. Every benefit must have a measurable or observable proof point. "Comfortable" is banned — "90% reported less pain in one week" is required.
6. The concept must OVERCOME at least one specific objection (price, skepticism, "I've tried compression before," "socks can't really help").
7. CTA is medium-direct: "Try your first pair," "See the reviews," "Compare for yourself," "Join 107,000+ customers." NOT passive ("learn more") or aggressive ("buy now").

**HOOK PRIORITY:** Proof hooks > social proof hooks > "reason why" hooks > before/after hooks.

**CONCEPT STRUCTURE:**
- Opening 25%: Problem/desire recognition + tension setup (objection or question)
- Middle 50%: Proof stack — mechanism explanation, customer evidence, data points, demonstrations
- Final 25%: Resolution + differentiation + medium CTA

**BEST CONCEPT APPROACHES FOR MOF:**
- Customer story arcs (skeptic → tried it → transformed)
- Side-by-side comparisons (old socks vs. Viasox, before/after)
- "Reason why" mechanism reveals (how graduated compression actually works)
- Social proof compilations (multiple customers, review highlights)
- Objection-then-answer frameworks ("I thought compression socks were ugly until...")
- Product demonstrations with real reactions
- Expert or authority endorsements

**AVOID AT MOF:**
- Starting from zero awareness (they already know the problem)
- Pure emotional appeals without evidence
- Generic benefit claims without data
- Overly soft CTAs (they're past the curiosity stage)
- Offer-heavy messaging (save deep offers for BOF)
- Long intros before getting to proof`,

    'BOF': `## FUNNEL STAGE: BOTTOM OF FUNNEL (BOF) — Hot, Ready to Convert

**WHO THEY ARE:**
These people have visited the site, added to cart, engaged with multiple ads, or are returning customers. They KNOW Viasox. They WANT the product. They need a FINAL PUSH — remove the last objection, create urgency, or present an irresistible offer.

**CONCEPT MANDATE — BOF STRUCTURAL RULES:**
1. The concept must OPEN with brand recognition — Viasox name, logo, or immediately recognizable brand element in the first 3 seconds.
2. The first 30% delivers the OFFER, NEWS, or URGENCY message — do not make them wait.
3. Every BOF concept must have a CLEAR, SPECIFIC, ACTIONABLE CTA — not just "shop now" but "Get 20% off your first pair — code COMFORT20" or "Free shipping ends tonight."
4. Schwartz's BOF rule: "Use the product name, the price, the offer, or what's new." These are the ONLY valid lead elements.
5. Hopkins' "make action easy" rule: reduce friction in the concept itself — mention free shipping, easy returns, guarantee, risk-free trial.
6. The concept must create URGENCY without being deceptive — limited time, limited stock, seasonal relevance, or "while supplies last."
7. Keep it SHORT and DIRECT. BOF concepts should be the most concise. No lengthy education, no problem setup, no awareness building. They know all that.

**HOOK PRIORITY:** Offer hooks > urgency hooks > reminder hooks > "back in stock" hooks. Education hooks are BANNED at BOF.

**CONCEPT STRUCTURE:**
- Opening 30%: Brand recognition + offer/news/urgency lead
- Middle 40%: Final proof point + objection removal + risk reduction (guarantee, free returns)
- Final 30%: Specific CTA + urgency reinforcement

**BEST CONCEPT APPROACHES FOR BOF:**
- Flash sale / limited-time offer announcements
- Cart abandonment reminders ("Still thinking about it?")
- Bundle deal presentations
- Final testimonial from someone who was on the fence
- "Last chance" or seasonal urgency
- New product launch or restock alerts
- Guarantee/risk-reversal focused ("Try for 30 days, love them or return free")
- Social proof urgency ("X pairs sold this week")

**AVOID AT BOF:**
- Long educational content
- Problem awareness building (they already know)
- Soft or vague CTAs
- Concepts that don't mention the brand name
- Generic "great product" messaging without specificity
- Emotional storytelling without a conversion mechanism
- Any concept that could work equally well at TOF (it's not BOF enough)`,
  };
  return guides[stage] ?? '';
}

export function buildAnglesPrompt(
  params: AnglesParams,
  analysis: FullAnalysis,
  memoryBriefing?: string,
  inspirationContext?: string,
): { system: string; user: string } {
  // Duration-specific constraints (VO-by-length + length calibration).
  // Concepts must respect the same rules so downstream scripts don't
  // inherit an impossible starting point (e.g., a concept pitched as
  // "silent text-only montage" for a 16-59 sec or 60-90 sec brief).
  const durationTarget = getDurationTarget(params.duration);
  const briefConstraints = buildBriefConstraintsBlock(params.duration);
  const isShortForm = isShortFormDuration(params.duration ?? '');
  const hasInspiration = !!inspirationContext;

  // ─── TOP-PRIORITY USER DIRECTIVES ──────────────────────────────────────
  // These are the user's four concrete creative choices. They MUST dominate
  // the model's attention BEFORE it reaches the manifesto context (which is
  // voluminous and otherwise becomes the gravitational center). Authority
  // hierarchy below makes explicit that manifesto is supporting context,
  // not the primary signal.
  const userPrimaryDirectives = `## ⚠️⚠️⚠️ TOP-PRIORITY USER DIRECTIVES — READ FIRST, WEIGHT HIGHEST

The user has made specific creative choices for this brief. Those choices are
the non-negotiable foundation of every concept you generate. Before you absorb
the Viasox manifesto, strategic principles, or background context below,
internalize these directives — they OUTRANK everything else.

${params.primaryTalkingPoint ? `### 1. PRIMARY TALKING POINT (= WHAT THE AD IS ABOUT)
**"${params.primaryTalkingPoint.toUpperCase()}"**

This is the SUBJECT of every concept. It is NOT "socks in general," NOT
"comfortable lifestyle," NOT "healthcare workers." It is **${params.primaryTalkingPoint}**.
Every concept must be unmistakably about ${params.primaryTalkingPoint}. If a concept
could exist without ${params.primaryTalkingPoint}, it is wrong and must be rewritten.

` : ''}### ${params.primaryTalkingPoint ? '2' : '1'}. ANGLE TYPE (= HOW WE APPROACH IT)
**${params.angleType.toUpperCase()}**

Every concept must use the ${params.angleType} architecture — not Problem-Based
unless specified, not a blend, not whatever the manifesto's "winning ad bank"
suggests. The specific angle type above.

### ${params.primaryTalkingPoint ? '3' : '2'}. DURATION / MEDIUM (= FORMAT CONSTRAINT)
**${params.duration ?? '16-59 sec'}**

${isShortForm ? `This is **1-15 sec short-form** — a fundamentally different creative format.
Single moments are valid. No framework required. Native style is preferred.
Engagement or awareness goals are valid (not just conversion). CTAs are text-on-screen only.
The short-form philosophy below supersedes any manifesto guidance that would
push for narrative arcs or multi-beat structures.` : `This is ${params.duration}. Every concept must fit comfortably in this time
budget. Word budget: ${durationTarget.sweetSpot} (hard ceiling ${durationTarget.hardCeiling} words).
Concepts that require more spoken content than the budget are disqualified.`}

${hasInspiration ? `### ${params.primaryTalkingPoint ? '4' : '3'}. INSPIRATION REFERENCE (= THE CREATIVE BLUEPRINT)
A reference ad has been hand-picked for this exact combination of ad type +
angle + duration. It is THE BLUEPRINT. Every concept you generate MUST
structurally mirror the reference — same hook archetype, same emotional entry,
same narrative shape, same product-bridge timing, same key-language register.
Do NOT ignore the reference and default to manifesto patterns. Study the
"INSPIRATION BANK" section (appears later in this prompt) CAREFULLY before
writing any concept.

` : ''}---

**HIERARCHY OF AUTHORITY** (highest to lowest — when they conflict, the higher rule wins):
1. User directives above (talking point, angle type, duration${hasInspiration ? ', inspiration reference' : ''})
2. Awareness level rules (Schwartz Three Elimination Rules for Unaware, etc.)
3. Ad type format rules (UGC raw vs AGC polished vs Static, etc.)
4. Funnel stage pacing (TOF cold-audience rules, BOF urgency rules, etc.)
5. Manifesto background (emotional pain patterns, voice of customer, segments, winning ad bank)
6. General marketing principles (Hopkins specificity, Bly benefits, Neumeier differentiation)

**The manifesto and marketing principles are BACKGROUND CONTEXT. They inform
tone, vocabulary, and strategic reasoning — they do NOT choose the subject,
override the angle, or reshape the duration. Your job is to channel the
manifesto intelligence THROUGH the user's chosen directives, not to drift
toward generic manifesto patterns because they're more voluminous in this prompt.**
`;

  const system = `${buildSystemBase()}

${userPrimaryDirectives}

${briefConstraints}

## CREATIVE CONCEPTS & ANGLES FRAMEWORK

You generate creative advertising **concepts with angles**. A CONCEPT is the big-picture creative idea — it defines the format, setting, talent, and visual world of the ad. An ANGLE is the strategic messaging approach within that concept — the specific emotional or logical framing used to position the product.

**CONCEPT vs. ANGLE:**
- **CONCEPT** = The creative execution idea (e.g., "A nurse finishing a 12-hour shift sits on the break room bench and speaks directly to camera about what her feet go through daily")
- **ANGLE** = The strategic messaging within that concept (e.g., "The daily battle between loving your job and your feet paying the price — repositioning Viasox as the gear that keeps up with your calling")

Every concept must be tailored to the selected AD TYPE. The concept should describe what the viewer will SEE and EXPERIENCE. The angle describes the strategic WHY behind it.

**IMPORTANT — VIDEO vs. STATIC:**
All ad types produce VIDEO ads EXCEPT "Static" which produces single-image ads. When the ad type is anything other than Static, your concepts must describe video scenes, movement, dialogue, and visual storytelling. When the ad type is Static, describe a single compelling image with headline and copy.

## THE 10 ANGLE TYPES (DEEP REFERENCE)

### 1. Problem-Based Angles
Focus on a specific pain point the customer experiences. Lead with their suffering.
**Strategic Principle (Hopkins):** Be specific about the problem. "Sock marks that take 2 hours to fade" beats "uncomfortable socks."
**Schwartz Application:** This is the Problem Aware headline — name the desire or its solution directly.
**Viasox Examples from Manifesto:**
- "The Sock Mark Problem" — Red indentations that won't fade, visible to others
- "The 12-Hour Shift Struggle" — Nurses and healthcare workers whose feet swell and ache
- "The Putting-On Battle" — Arthritis, limited mobility, the daily indignity of asking for help
- "The Tourniquet Effect" — Compression socks that hurt more than they help
- "The Swelling Spiral" — Edema that worsens through the day

### 2. Emotion-Based Angles
Lead with the emotional impact, not the physical problem. Target the FEELING behind the symptom.
**Strategic Principle (Schwartz):** The three dimensions: Desires (what they want), Identifications (who they want to be), Beliefs (what they accept as true).
**Key Emotions from Viasox Data:**
- Independence ("I can still do this myself")
- Dignity ("I don't have to look sick")
- Relief ("Finally, something that actually works")
- Joy ("Beautiful enough to love")
- Confidence ("I don't have to hide my legs anymore")
- Gratitude ("These changed my life" — transformation language)

### 3. Solution-Based Angles
Position the product as the answer to a known problem. The prospect already knows the problem — show them the better way.
**Strategic Principle (Bly):** Benefits beat features, but the REAL benefit is always one level deeper. "No sock marks" -> "No embarrassment" -> "No fear of what's happening to my body."
**Viasox Solution Frames:**
- "Compression Without Compromise" — Medical support that doesn't sacrifice comfort
- "Medical Support, Fashion Forward" — Health socks that look like they belong in a boutique
- "The Easy-On Revolution" — Wide-mouth, non-binding tops that slide on without a fight

### 4. Identity-Based Angles
Speak to WHO the customer IS, not what they need. The product becomes part of their identity story.
**Strategic Principle (Schwartz - Identifications):** People buy to confirm who they are. The nurse, the caregiver, the independent grandmother.
**Strategic Principle (Neumeier):** A brand is what THEY say it is. Let the customer's identity define the brand.
**Use the Identity Segments from the data:** Healthcare Worker, Caregiver/Gift Buyer, Diabetic/Neuropathy, Standing Worker, Accessibility/Mobility, Traveler, Senior, Pregnant/Postpartum, Medical/Therapeutic. Each identity segment has its own world, daily reality, and emotional landscape. The most powerful identity angles combine an identity segment with a motivation segment — e.g., "Nurse + Pain Relief" or "Senior + Skeptic Converted."
**Viasox Identity Frames (reference patterns — write ORIGINAL):**
- "For Nurses Who Never Sit" — 12-hour shifts, you deserve socks that work as hard as you do
- "For the Parent Who Won't Slow Down" — Aging, but refusing to surrender
- "For the Daughter Who Worries" — The caregiver gift-buyer, showing love through action
- "For the Woman Who Refuses Beige" — Style-conscious, medical device stigma rebel

### 5. Comparison-Based Angles
Contrast with what they've tried before. Position Viasox as the evolution, not just an alternative.
**Strategic Principle (Schwartz - Sophistication):** In a sophisticated market, you can't just make the same claim louder. You need a new MECHANISM — a reason why this product is fundamentally different.
**Viasox Comparison Frames:**
- "Not Your Grandmother's Compression Socks" — Evolution from beige medical devices
- "vs. Pharmacy Compression" — Mass-market vs. purpose-built
- "What They Tried Before vs. What They Found" — Direct review before/after language

### 6. Testimonial-Based Angles
Let the customer's voice be the entire angle. Pure social proof, pure authenticity.
**Strategic Principle (Hopkins):** One customer's experience is more convincing than all the claims in the world.
**Strategic Principle (Bly):** Testimonials are most powerful when they include specific details, measurable results, and the person's identity/context.
**Viasox Testimonial Frames:**
- "She Said It Changed Her Life" — Transformation language (track % who use it)
- "90% Less Pain In One Week" — Specific measurable claims from reviews
- "My Husband Asked Me to Buy Him a Pair" — Organic word-of-mouth expansion

### 7. Seasonal/Situational Angles
Tied to specific moments, occasions, or life events that make the product suddenly relevant.
**Strategic Principle (Schwartz - Forces of Change):** Timing matters. The same desire exists year-round, but specific moments ACTIVATE it.
**Viasox Seasonal Frames:**
- "Holiday Gift Guide for the Person Who Has Everything"
- "Summer Travel Essential" — Flights, vacations, swelling during travel
- "Post-Surgery Recovery" — Specific medical events as purchase triggers
- "Mother's Day: Give Her Comfort" — Caregiver angle with seasonal urgency

### 8. Fear-Based Angles
Address underlying health anxieties — gently, not clinically. Never exploit; always empathize then solve.
**Strategic Principle (Schwartz):** Fear works when directed at loved ones, not at the prospect themselves.
**Viasox Fear Frames:**
- "What Your Swollen Ankles Are Telling You" — Health signal awareness
- "The Sock Marks Nobody Talks About" — Hidden suffering made visible
- "When Putting On Socks Becomes a Struggle" — Independence fear trigger

### 9. Aspiration-Based Angles
Focus on the AFTER state — the better life waiting on the other side. Pure positive visualization.
**Strategic Principle (Schwartz - Intensification):** Make the prospect visualize the fulfillment so vividly they practically live in it.
**Viasox Aspiration Frames:**
- "Walk Further" — Freedom of movement restored
- "Dance Again" — Joy and physical ability reclaimed
- "Feel Like Yourself" — Identity preservation, the deepest aspiration
- "No More Hiding" — Style confidence, legs they're proud to show

### 10. Education-Based Angles
Teach something valuable, position the brand as an authority. Give value before asking for the sale.
**Strategic Principle (Hopkins):** The best advertising educates. Give the consumer a reason to pay attention beyond the pitch.
**Strategic Principle (Bly):** Informational content converts better than pure sales pitches for skeptical audiences.
**Viasox Education Frames:**
- "Why Regular Socks Cause Marks (And What To Do About It)"
- "The Science of Graduated Compression"
- "What Nurses Wish You Knew About Foot Health"
- "3 Signs Your Socks Are Hurting You"

## AD TYPE GUIDE: ${params.adType}
${buildAdTypeGuideFull(params.adType)}

## FUNNEL STAGE: ${params.funnelStage}
${buildFunnelGuide(params.funnelStage)}

${getAwarenessConceptGuide(params.awarenessLevel)}

${buildAngleTypeMandate(params.angleType)}

${params.primaryTalkingPoint ? `## ⚠️ PRIMARY TALKING POINT: "${params.primaryTalkingPoint.toUpperCase()}"

**THIS IS THE #1 CREATIVE DIRECTIVE. Every concept MUST be about "${params.primaryTalkingPoint}."**

The Primary Talking Point defines WHAT the ad is about. The Angle Type (${params.angleType}) defines HOW we approach it. Together they create the concept:
- Angle Type "${params.angleType}" = the STRUCTURAL approach (how we frame, sequence, and emotionally architect the concept)
- Primary Talking Point "${params.primaryTalkingPoint}" = the SUBJECT MATTER (the condition, topic, or focus that every concept must center on)

**MANDATORY REQUIREMENTS:**
1. The word "${params.primaryTalkingPoint}" (or its direct medical/common synonym) MUST appear in every concept — but for Unaware concepts, it only appears in Beat 3 (Mechanism) or later, NEVER in Beat 1 (Identification). For Problem-Aware and later, it appears in the hook.
2. Every concept must describe scenarios, symptoms, or experiences SPECIFICALLY related to "${params.primaryTalkingPoint}"
3. The viewer must understand within the first 3 seconds that this ad is about "${params.primaryTalkingPoint}" (for Problem Aware+) or recognize the SENSORY EXPERIENCE of "${params.primaryTalkingPoint}" visually (for Unaware — shown, not labeled)
4. Generic "comfortable socks" concepts are BANNED. If a concept could work without mentioning "${params.primaryTalkingPoint}", it's too generic — rewrite it
5. Use the specific customer language, pain descriptions, and emotional triggers from the Angle Language Bank for "${params.primaryTalkingPoint}" if available — but for Unaware concepts, use the language ONLY for the Reframe/Mechanism beats, NOT the opening (review language is post-education vocabulary)

**HOW AWARENESS LEVEL CHANGES THE TALKING POINT TREATMENT:**
- **Unaware:** The talking point's REALITY is shown visually and through life moments — the viewer RECOGNIZES the experience of ${params.primaryTalkingPoint} without it being named in the first half. The word "${params.primaryTalkingPoint}" (and any medical synonym) does NOT appear in Beats 1-2 of the 5-beat structure. It may enter in Beat 3 (Mechanism) if naturally woven in, but often the Mechanism describes the sensation without using the clinical label at all. The VISUAL WORLD shows ${params.primaryTalkingPoint} (red marks on calves, swollen ankles, nerve-pain wincing) but the VOICEOVER never labels it in Beats 1-2. Pick one of the three Unaware sub-personas (Normalizer / Diagnosed Non-Searcher / Incidental Sufferer) who experiences ${params.primaryTalkingPoint} in their specific life context.
- **Problem Aware (Upper-MOF):** "${params.primaryTalkingPoint}" is named in the HOOK. Lead with the specific pain. The viewer should think "that's EXACTLY my ${params.primaryTalkingPoint} experience."
- **Solution Aware:** "${params.primaryTalkingPoint}" is assumed known. Lead with why Viasox solves it DIFFERENTLY than what they've tried.
- **Product Aware / Most Aware:** "${params.primaryTalkingPoint}" is referenced as the reason they already know Viasox. Deepen the proof.

**DO NOT** create concepts about other conditions. If the talking point is "${params.primaryTalkingPoint}", do NOT drift to generic comfort, general swelling, or unrelated conditions. Stay laser-focused.` : ''}

## PRODUCT LINE STRATEGY: ${params.product}
${buildProductLineGuide(params.product)}

${getProductPurchaseTriggers(params.product)}

${getProductStrategicInsights(params.product)}

${getEmotionalPainPatterns()}

${getEmergingSegments()}

${getMessagingPillars()}

${getEmotionalArchitecture()}

${getBehavioralCodes()}

${getVocabularyProtectionRules()}

${getCustomerVoiceBank()}

${getEmotionalLanguageBoundaries()}

${getVoiceToneExamples()}

${getProductObjectionBank(params.product)}

${getSegmentProductMatrix()}

${getWinningAdReferenceBank()}

## SEGMENT-AWARE CONCEPT TARGETING
When creating concepts, leverage the two-layer segmentation model from the product data:

**Primary Persona** should name BOTH the motivation segment and identity segment being targeted:
- BAD: "People who want comfortable socks"
- GOOD: "Pain & Symptom Relief seekers who are Healthcare Workers — nurses whose feet swell after 12-hour shifts"
- GOOD: "Skeptic Converted buyers who are Seniors — the 70-year-old who didn't believe socks could help"

The product data below shows segment frequencies for both layers. Use the larger motivation segments for broad appeal concepts, and cross-reference with identity segments for sharper creative targeting.

## ANGLE QUALITY CHECKLIST
Every angle you generate must pass these tests:
1. **Data-Grounded**: Can you cite a specific frequency or quote from the review data?
2. **Emotionally Resonant**: Does it tap into one of the four core fears or a genuine desire?
3. **Awareness-Appropriate**: Does the framing match the specified awareness level?
4. **Scalable**: Can this angle spawn at least 5 different ads across multiple formats?
5. **Differentiated**: Is this angle meaningfully different from generic sock/compression advertising?
6. **Brand-Aligned**: Does it respect the message hierarchy (Comfort > No Marks > Style > Easy > Compression)?
7. **Segment-Specific**: Does it target a clear motivation + identity intersection from the data?

## PRODUCT DATA
${getProductAnalysis(analysis, params.product)}`;

  const isStatic = params.adType === 'Static';
  const formatNote = isStatic
    ? 'This is a STATIC (image) ad type. Each concept should describe a single compelling image with headline, subhead, and visual composition.'
    : 'This is a VIDEO ad type. Each concept should describe video scenes, movement, dialogue/voiceover, talent, setting, and visual storytelling.';

  const isFullAi = params.adType === 'Full AI (Documentary, story, education, etc)';
  const fullAiDirective = isFullAi
    ? `\n\n## ⚠️ FULL AI AD TYPE — SPECIAL DIRECTIVE

This is a **Full AI ad**. 100% of the footage is AI-generated — there are NO Viasox clips, no stock footage, no real talent. Every visual is synthesized. This ad type exists to tell stories, explore historical or educational territory, and deliver emotional narratives that would be impossible (or prohibitively expensive) with real production.

**SPECIFICATION (narrative mode): ${params.fullAiSpecification ?? 'Documentary'}**
${params.fullAiSpecification === 'Documentary' ? 'Documentary mode — grounded, observational, journalistic. Real-feeling moments, voiceover-led, cinéma vérité. Think Netflix documentary. The viewer should momentarily forget this is an ad.' : ''}${params.fullAiSpecification === 'Historical' ? 'Historical mode — reach into the past. Period-accurate settings, archival aesthetics, a journey through time. Use history to illuminate the present problem/solution (e.g., how compression was discovered, how nurses\' foot care has evolved, the history of sock design).' : ''}${params.fullAiSpecification === 'Educational' ? 'Educational mode — teach something genuinely valuable. Visual explanations, anatomy/physiology, metaphors that clarify complex ideas. The ad earns attention by giving knowledge first.' : ''}${params.fullAiSpecification === 'Emotional Story' ? 'Emotional Story mode — character-driven narrative with real emotional stakes. A small, specific moment that unfolds into something universal. Think short film, not ad. The product is the resolution, never the star.' : ''}${params.fullAiSpecification === 'Aspirational' ? 'Aspirational mode — lift the viewer. Beauty, freedom, dignity, possibility. Paint a world the viewer wants to live in. Lean into ethereal/cinematic visuals.' : ''}

**VISUAL STYLE: ${params.fullAiVisualStyle ?? 'Story with cohesive characters'}**
${params.fullAiVisualStyle === 'Story with cohesive characters' ? 'A cohesive character (or characters) appears across the full ad — same face, same wardrobe, same world. The AI must maintain identity consistency across every shot. Build the concept around ONE protagonist the viewer follows from scene to scene.' : ''}${params.fullAiVisualStyle === 'Fully Voice Over' ? 'No dialogue, no lip sync, no talking. 100% voiceover carries the story. The visuals are pure imagery — scenes, textures, moments. The VO does the work; the visuals deepen it. Concepts must describe the VO script arc and the visual montage that accompanies it.' : ''}${params.fullAiVisualStyle === 'Includes Talking To Camera' ? 'An AI-generated character speaks directly to the camera at least once. Must feel believable — tight shots, natural gestures, realistic expressions. The concept must include what the AI talent says, how they look, and the moment(s) they break the fourth wall.' : ''}${params.fullAiVisualStyle === 'No Humans Shown (Perspective of the feet or socks)' ? 'No humans visible. The entire ad is shot from the perspective of the feet, the socks themselves, or abstract/environmental POVs. Close-ups of textures, floors, shoes, fabrics. The voiceover or on-screen text carries meaning. This is the most avant-garde visual style — embrace it.' : ''}${params.fullAiVisualStyle === 'Historical Visuals and Claims' ? 'Historical visuals: period costumes, aged film grain, archival-style footage, old photographs coming to life. The claims must also be historically grounded — cite real history (the origin of compression therapy, ancient foot care, WWII nurses, etc.) to give the ad gravity and authority.' : ''}

**MANDATORY CREATIVE RULES FOR FULL AI CONCEPTS:**
1. Every concept MUST describe visuals that are feasible for AI generation (text-to-video models like Veo/Sora/Runway). Avoid scenes requiring fine-grained product interaction, brand logos, or real trademarked settings.
2. The specification (${params.fullAiSpecification ?? 'Documentary'}) and visual style (${params.fullAiVisualStyle ?? 'Story with cohesive characters'}) must FUNDAMENTALLY shape each concept. A Documentary + No Humans Shown concept should look completely different from an Aspirational + Story with cohesive characters concept.
3. Concepts must exploit what AI can uniquely do: impossible scale, time travel, surreal transitions, visual metaphor, dreamlike imagery. Do NOT describe concepts that would be better shot live.
4. Product presence is MINIMAL and symbolic — a brief product beat, a logo end card. The story is the ad; the product is the resolution.
5. The persona is still a woman 50+ per the core audience mandate. Even in AI-generated worlds, the protagonist (if shown) must be a believable 50+ woman.

${buildFullAiSkillContext({
  specification: params.fullAiSpecification,
  visualStyle: params.fullAiVisualStyle,
  duration: params.duration ?? '60-90 sec',
  mode: 'compact',
})}
`
    : '';

  const talkingPointNote = params.primaryTalkingPoint
    ? `\n\n**⚠️ PRIMARY TALKING POINT: "${params.primaryTalkingPoint}"** — Every concept MUST be specifically about "${params.primaryTalkingPoint}". The word "${params.primaryTalkingPoint}" (or its direct synonym) must appear in every concept. If a concept could exist without mentioning "${params.primaryTalkingPoint}", it is too generic and must be rewritten. The talking point is the SUBJECT; the angle type is the APPROACH.`
    : '';

  const user = `Generate exactly 5 creative ${params.angleType} concepts & angles for ${params.product}${params.primaryTalkingPoint ? ` focused on "${params.primaryTalkingPoint}"` : ''} at the **${params.awarenessLevel}** awareness level, optimized for ${params.funnelStage} (${params.funnelStage === 'TOF' ? 'Top of Funnel' : params.funnelStage === 'MOF' ? 'Middle of Funnel' : 'Bottom of Funnel'}) using ${params.adType} format.${talkingPointNote}${fullAiDirective}

**BRIEF LENGTH: ${params.duration ?? '16-59 sec'}** (final cut MUST be ≤ ${durationTarget.maxSeconds}s) — Target ${durationTarget.sweetSpot} (hard ceiling ${durationTarget.hardCeiling} words). Every concept must fit comfortably in this time budget.${durationTarget.voRequired ? ` Recommended frameworks for this length: ${durationTarget.recommendedFrameworks.join(', ')}.` : ''}

**VO REQUIREMENT FOR CONCEPTS:** ${durationTarget.voRequired
  ? `This is a ${params.duration} brief — VOICEOVER OR SPOKEN DIALOGUE IS MANDATORY. Do NOT pitch concepts built around text-only/silent b-roll or pure visual montage with no spoken words. Every concept MUST include a voiceover, on-camera dialogue, founder monologue, podcast conversation, or spokesperson delivery. A concept for ${params.duration} without a spoken track is a creative failure and will be rejected.`
  : `This is a ${params.duration} SHORT-FORM brief — the most EXPERIMENTAL format in our toolkit.

**SHORT-FORM CONCEPT GENERATION RULES:**
- Mix VO and no-VO concepts across the 5 options. At least 1 concept should be native-style (no VO, minimal text, organic social feel) and at least 1 should use VO.
- NOT every concept needs to sell or drive conversion. Include at least 1 concept aimed purely at ENGAGEMENT (comments, shares, reactions) or AWARENESS (brand recall, scroll-stop impact) rather than direct response.
- NO framework is required. If a concept works as a single powerful moment, a visual punch, or a native clip — that is a valid concept. Do not force-fit arcs.
- CTAs should be TEXT ON SCREEN ONLY (or absent entirely for engagement/awareness concepts). No spoken CTAs for short-form.
- NATIVE STYLE is strongly valued — concepts that look and feel like organic social content (not polished ads) should be represented.
- This is the creative playground. Propose at least 1 concept that is genuinely experimental — unusual hook, unexpected format, bold creative risk.`}

**CRITICAL — AWARENESS LEVEL IS ${params.awarenessLevel.toUpperCase()}:**
${params.awarenessLevel === 'Unaware' ? `⚠️ UNAWARE IS THE DEFAULT TOF AWARENESS LEVEL (April 2026 Manifesto). Every concept must honor Schwartz's Three Elimination Rules in the opening: NO price, NO product name, NO direct problem/solution statement.

MANDATORY STRUCTURE — every Unaware concept must map to the 5-beat body:
1. IDENTIFICATION (Beat 1, ~0-25%) — uses Scene Identification, Mundane Reframe, or False Cause Flip. Zero product, zero category, zero symptom label.
2. REFRAME (Beat 2, ~25-45%) — the "wait..." moment. The normalized experience is named as NOT normal.
3. MECHANISM (Beat 3, ~45-65%) — short plain-English explanation of WHY. Not a medical lecture.
4. CATEGORY REVEAL (Beat 4, ~65-85%) — reveal that a different CATEGORY of sock exists. Not Viasox yet.
5. PRODUCT REVEAL + SOFT CTA (Beat 5, ~85-100%) — Viasox is finally named with a curiosity CTA ("Learn more," "See what 107K people found"). No price, no offer, no direct buy.

TARGET ONE SUB-PERSONA per concept (label it in the Primary Persona field):
- The Normalizer — attributes discomfort to age/weather/shoes
- The Diagnosed Non-Searcher — has the condition, owns pharmacy compression, never connected it to a better category
- The Incidental Sufferer — job/lifestyle produces the pain, writes it off as "part of the job"

PICK ONE TECHNIQUE per concept and name it in the concept description:
- Scene Identification — specific sensory scene from the viewer's day
- Mundane Reframe — micro-behavior they do without thinking, revealed as coping behavior
- False Cause Flip — name the wrong attribution they've made, then flip it

HARD BANS in the opening of any Unaware concept: "compression," "diabetic," "neuropathy," "circulation," "swelling," "edema," "varicose," "Viasox," "sock marks," "sock line," "relief," "solution," "finally," any price, any offer, any "Tired of...", "Struggling with...", "Did you know...", "Dealing with...", "If you have...".

DO NOT pull hook language verbatim from review data — reviews are post-education vocabulary. Use reviews to understand the REALITY of the experience, then describe that reality in language the viewer uses BEFORE they find us.` : ''}${params.awarenessLevel === 'Problem Aware' ? 'These concepts must lead with SPECIFIC, VIVID pain that the viewer recognizes instantly. Use exact customer language from the reviews. Spend 60-70% of the concept on the PAIN (naming it, intensifying it) before bridging to the solution. CTA is medium-soft ("try your first pair," "see how it works"). Note: Problem-Aware is classified as Upper-MOF in the April 2026 manifesto — use it when the audience has already recognized they have a problem but hasn\'t committed to a solution.' : ''}${params.awarenessLevel === 'Solution Aware' ? 'These concepts must lead with DIFFERENTIATION — what makes Viasox fundamentally different from what they have tried. Do NOT belabor the problem (they know it). Spend 60-70% on the NEW MECHANISM, proof, and why this solution succeeds where others failed. CTA is medium-direct ("see why X switched," "compare for yourself").' : ''}${params.awarenessLevel === 'Product Aware' ? 'These concepts must assume the viewer ALREADY KNOWS Viasox. Lead with the brand name, deepened proof, or what is NEW. Go deep on a single powerful proof point rather than wide on many benefits. CTA is direct ("shop now," "get your pair").' : ''}${params.awarenessLevel === 'Most Aware' ? 'These concepts must be the MOST DIRECT and OFFER-FOCUSED. Lead with the product name + offer/news. Keep concepts tight — recognition → offer/urgency → CTA. No education, no problem agitation. The deal IS the concept. CTA is maximally direct ("buy now," "claim your pair," "add to cart").' : ''}

The awareness level must FUNDAMENTALLY change the concept structure, not just adjust a few words. An Unaware concept and a Most Aware concept for the same persona and ad type should look like completely different ads.

**CRITICAL — AD TYPE IS ${params.adType.toUpperCase()}:**
Every concept MUST be designed specifically for ${params.adType} production. ${isStatic ? 'This is a STATIC ad — describe a SINGLE compelling image, not a video sequence. Focus on visual composition, headline placement, color, and art direction. There are no scenes, no movement, no dialogue.' : `This is a VIDEO ad type. The concept must describe scenes, movement, talent, dialogue or voiceover, pacing, and visual storytelling specific to the ${params.adType} format.`}
${params.adType.includes('AGC') ? 'AGC (Actor-Generated Content): Polished, cinematic production. Multiple camera angles, professional lighting, high production value. Think broadcast-quality with strategic messaging. Concepts should describe PRODUCED scenes that require a production team, talent direction, and post-production.' : ''}${params.adType.includes('UGC') ? 'UGC (User-Generated Content): Raw, authentic, phone-shot aesthetic. Single person speaking to camera, natural lighting, real environments (home, car, office). The concept must describe what the "real person" says and does — NOT a produced video. Must feel unscripted, genuine, relatable.' : ''}${params.adType === 'Ecom Style' ? 'Ecom Style (Editing Brief): Built entirely from EXISTING footage with AI voiceover — no new filming. The concept must be grounded in footage that actually exists. Available footage: talking head takes, putting on socks, feet up lifestyle, bare legs/condition shots, walking, standing feet, before/after reveals, studio product shots, product flat lays, material close-ups, warehouse/EGC, outdoor settings, branded shipping boxes. We do NOT have: gym, medical offices, sports, travel, hiking, children, or pet footage. The concept should describe a narrative arc with a compelling voiceover and visual sequences the editor can build from existing clips. Think about the STORY the voiceover tells while the editor cuts between existing footage. Concepts must specify a script framework (confession arc, observation, reframe, permission narrative, skeptic journey, contrast/split, day-in-the-life) — don\'t default to the same "problem → solution → CTA" arc. Every concept should describe the emotional world, the POV (first-person, second-person, third-person narrator), and the visual pacing.' : ''}${params.adType === 'Static' ? 'Static: Single image that stops the scroll. Every element must earn its place: headline, subhead, visual focal point, brand element, CTA. Describe the composition, color palette, typography hierarchy, and visual hook in detail.' : ''}${params.adType === 'Founder Style' ? 'Founder Style: The founder/brand representative speaking directly to camera. Personal, passionate, authoritative. "Let me tell you why I created this..." energy. Concepts must describe what the founder SAYS, their setting, their tone, and the story arc of their message.' : ''}${params.adType === 'Fake Podcast Ads' ? 'Fake Podcast Ads: Two people in a podcast-style setup casually discussing the product. Feels like an organic recommendation, not an ad. Conversational, unscripted feel. Concepts must describe the dialogue between hosts, the natural discovery of the product, and the authentic reaction.' : ''}${params.adType === 'Spokesperson' ? 'Spokesperson: A relatable expert or authority figure presents the product. Think doctor, nurse, or credentialed professional who lends authority. Not celebrity — expertise. Concepts must describe who the spokesperson is, their credentials, what they say, and how they demonstrate authority.' : ''}${params.adType === 'Packaging/Employee' ? 'Packaging/Employee: Behind-the-scenes, warehouse/fulfillment content. Shows the real team packing orders, the care that goes into each shipment. Humanizes the brand. Concepts must describe the setting, the employees, the product handling, and the "we care about every pair" narrative.' : ''}
The ad type must FUNDAMENTALLY shape the creative execution. A UGC concept and an AGC concept for the same angle and awareness level should be completely different productions.

**CRITICAL — ANGLE TYPE IS ${params.angleType.toUpperCase()}:**
Follow the ${params.angleType} structural mandate from the system instructions. The angle type determines the CONCEPT ARCHITECTURE — the opening/middle/closing structure, the mandatory elements, and what's banned. A Problem-Based concept and an Aspiration-Based concept for the same product and awareness level must have completely different structures.

**CRITICAL — PRODUCT LINE IS ${params.product.toUpperCase()}:**
${params.product === 'EasyStretch' ? 'This is the EasyStretch (non-binding comfort) line — stretches up to 30 inches, no elastic band. Lead with COMFORT, NO SOCK MARKS, and EASY TO PUT ON. These are NOT compression socks — never position as compression. The style/fashion angle is strongest for this line. Independence messaging (putting on socks alone) is a key differentiator.' : ''}${params.product === 'Compression' ? 'This is the Compression line — graduated compression at 12-15 mmHg (the "sweet spot"; pharmacy/medical compression is typically 20-30 mmHg, which is why it feels like a tourniquet). Lead with PERFORMANCE and RESULTS — real compression that doesn\'t feel like a tourniquet. The "12-hour shift" and "survives all day" proof context is strongest. Differentiate from pharmacy/drugstore compression.' : ''}${params.product === 'Ankle Compression' ? 'This is the Ankle Compression line — uniform compression around the ankle and arch (NOT graduated; targeted pressure where it matters). Lead with VERSATILITY and DISCREET COMPRESSION — targeted ankle/arch support in a low-profile format. Position as modern and active. "Invisible compression" is strongest. NEVER call this graduated compression.' : ''}${params.product === 'Other' ? 'Focus on universal Viasox value propositions: superior comfort, no sock marks, beautiful designs, over 1 million pairs sold, 107,000+ positive reviews.' : ''}
Product-specific features, audiences, and emotional territories must be reflected in every concept. An EasyStretch concept and a Compression concept for the same angle and awareness level should target different audiences with different messaging.

**CRITICAL — FUNNEL STAGE IS ${params.funnelStage} (${params.funnelStage === 'TOF' ? 'Top of Funnel' : params.funnelStage === 'MOF' ? 'Middle of Funnel' : 'Bottom of Funnel'}):**
${params.funnelStage === 'TOF' ? 'Cold audiences. NO brand mentions in the first 40%. Lead with audience identification and emotion. Proof density LOW. CTA soft. Concepts must feel like content, not ads.' : ''}${params.funnelStage === 'MOF' ? 'Warm audiences. HIGH proof density required — at least 2-3 proof elements per concept. Overcome specific objections. Hopkins\' "specifics" rule: every benefit needs a data point. CTA medium-direct.' : ''}${params.funnelStage === 'BOF' ? 'Hot audiences ready to convert. Brand name in first 3 seconds. OFFER/URGENCY/NEWS lead. Keep concepts short and direct. CTA maximally direct with specific action.' : ''}
The funnel stage must shape proof density, CTA style, brand mention timing, and concept length. A TOF concept and a BOF concept should be structurally different ads.

${formatNote}

**SELECTOR INTERACTION RULES:**
All five selectors (awareness level, ad type, angle type, product line, funnel stage) interact and must ALL be reflected in every concept. For example:
- Unaware + UGC + Problem-Based + EasyStretch + TOF = A real person in their bathroom struggling to put on tight socks, never mentioning Viasox until the very end, filmed on a phone
- Most Aware + AGC + Aspiration-Based + Compression + BOF = A polished, cinematic 15-second spot opening with "Viasox Compression — 20% off this week" showing a nurse confidently walking out of the hospital at shift end
These should feel like COMPLETELY DIFFERENT ADS because every selector changes the output.

## STEP 0 — STRATEGIC TERRITORY MAP (MANDATORY — PRODUCE BEFORE THE CONCEPTS)

Before writing any concepts, you MUST produce a brief territory map that commits you to 5 DISTINCT creative territories for ${params.primaryTalkingPoint ? `"${params.primaryTalkingPoint}"` : `${params.product}`}. This prevents concept drift, repetition, and generic output. Output this map ABOVE the 5 concepts:

### TERRITORY MAP FOR ${params.primaryTalkingPoint ? `"${params.primaryTalkingPoint.toUpperCase()}"` : `${params.product.toUpperCase()}`}
For each of the 5 concept slots, declare:
1. **Territory:** The specific facet of ${params.primaryTalkingPoint ? `"${params.primaryTalkingPoint}"` : `${params.product}`} this concept will explore (e.g., for Diabetes: "the morning blood sugar ritual," "the feet your doctor warned you about," "the invisible neuropathy no one sees," etc.). Each territory must be DIFFERENT — if two territories could describe the same ad, merge them and find a new one.
2. **Emotional Entry:** The specific emotion the viewer feels in the first 3 seconds (frustration, fear, recognition, curiosity, hope, etc.). No two concepts should share the same emotional entry.
3. **Proof Anchor:** The specific data point or customer quote from the review data that this concept is built on. Each concept MUST have a unique proof anchor.
4. **Hook Archetype:** question / statement / revelation / action / statistic / scene. Distribute across the 5 concepts — no archetype may appear more than twice.
5. **Framework Lean:** Which script framework this concept naturally lends itself to. Spread across at least 3 different frameworks.

**SELF-CHECK:** After mapping, verify: (1) all 5 territories are genuinely distinct facets of ${params.primaryTalkingPoint ? `"${params.primaryTalkingPoint}"` : `the assigned angle`}, not generic comfort/lifestyle topics, (2) no two concepts share the same emotional entry, (3) hook archetypes are distributed, (4) every proof anchor is unique. If any check fails, revise the map before writing concepts.

Then write the 5 concepts below the territory map, executing each territory as planned.

For each of the 5 concepts, use this EXACT structure with the numbered header format "## Concept 1:", "## Concept 2:", etc.:

## Concept [N]: [Concept Title]

**Hypothesis:** What we believe about the audience and why this concept will work. Frame as: "We believe [target audience] will respond to [approach] because [insight]."

**Ad Type:** ${params.adType}${isStatic ? ' (Static Image)' : ' (Video)'}

**Primary Persona:** ${params.awarenessLevel === 'Unaware' ? 'The specific Unaware SUB-PERSONA this concept targets — MUST be one of: "The Normalizer", "The Diagnosed Non-Searcher", or "The Incidental Sufferer". Add a short descriptor (e.g., "The Incidental Sufferer — a 52-year-old ICU nurse who writes off her end-of-shift foot pain as part of the job").' : 'The specific customer segment this concept targets (e.g., "Healthcare workers doing 10+ hour shifts", "Daughters buying for aging mothers")'}

**Awareness Level:** ${params.awarenessLevel}${params.awarenessLevel === 'Unaware' ? '\n\n**Unaware Technique:** MUST be one of: "Scene Identification", "Mundane Reframe", or "False Cause Flip". Name the technique and briefly explain why it fits this sub-persona.\n\n**5-Beat Breakdown:** Provide a 1-line description for each beat:\n- Beat 1 — IDENTIFICATION (0-25%): [what we see/hear, no product/problem/solution language]\n- Beat 2 — REFRAME (25-45%): [the "wait..." moment]\n- Beat 3 — MECHANISM (45-65%): [plain-English explanation of why]\n- Beat 4 — CATEGORY REVEAL (65-85%): [the category — not Viasox yet]\n- Beat 5 — PRODUCT REVEAL + SOFT CTA (85-100%): [Viasox named + curiosity CTA, no price/offer]' : ''}

**The Concept:** A vivid, detailed description of the creative execution. ${isStatic ? 'Describe the image composition, visual elements, talent (if any), setting, mood, headline placement, and overall art direction.' : 'Describe who we see on screen, the setting/location, what happens, the tone, the visual style, any unique production elements. Paint a picture of the ad the viewer will experience.'} This should be specific to ${params.adType} — not generic. Make it something a creative team could immediately visualize and produce.

**The Angle:** The strategic messaging approach within this concept. What emotional or logical frame are we using? What desire are we channeling? What belief are we challenging or reinforcing? This is the "why" behind the creative.

**Core Insight:** The customer truth this is built on, with a specific data point or frequency from the review analysis.${params.awarenessLevel === 'Unaware' ? ' Remember: review data informs Beats 2-5; Beat 1 (Identification) must describe the experience in pre-education vocabulary the Unaware viewer recognizes.' : ''}

**Hook Line:** A sample opening line (${isStatic ? 'headline' : 'first 3 seconds of the video'}) that brings this concept to life, following the awareness level rules.${params.awarenessLevel === 'Unaware' ? ' For Unaware: this hook MUST honor Schwartz\'s Three Elimination Rules (no price, no product name, no direct problem/solution statement). No "Tired of...", "Struggling with...", "Did you know...", "Dealing with...", or "If you have..." openers.' : ''}

**Key Proof Point:** The specific data, quote, or pattern from the reviews that makes this concept credible.

**Customer Quote Anchor:** A real quote from the review data that embodies this concept.

**Headline Variations:** 3 different headline approaches for this concept (applying Schwartz's awareness-level headline rules).${params.awarenessLevel === 'Unaware' ? ' All three Unaware headlines must honor the Three Elimination Rules.' : ''}

**Why It Works:** The psychological principle behind this concept (cite Schwartz, Hopkins, Bly, or Neumeier).

---

CRITICAL: Do NOT recycle the example angle frames listed in the instructions (e.g., "The Sock Mark Problem", "Compression Without Compromise", "For Nurses Who Never Sit"). Those are reference examples showing the STRATEGIC LOGIC of each angle type. Your job is to mine the actual review data for fresh insights and build entirely original concepts and angles. Every concept must contain a specific data point or customer quote that proves it was born from THIS dataset, not copied from a template.

Generate EXACTLY 5 concepts. Ground every one in real review data. These should feel fresh, strategically deep, and immediately executable.${params.primaryTalkingPoint ? `

## ⚠️ FINAL VALIDATION — READ THIS LAST

Before writing ANY concept, ask yourself: "Is this concept SPECIFICALLY about ${params.primaryTalkingPoint}?" If the answer is no — if the concept is about sock marks in general, shoe-swapping, gifting, working all day, or any topic OTHER than ${params.primaryTalkingPoint} — DELETE IT and write one that IS about ${params.primaryTalkingPoint}. Every single concept must be unmistakably, specifically, laser-focused on ${params.primaryTalkingPoint}. A concept about "comfortable socks" or "long shifts" that never connects to ${params.primaryTalkingPoint} is a REJECTED concept. The talking point is not a suggestion — it is the assignment.` : ''}${inspirationContext ? `

## ⚠️ REFERENCE AD CONSTRAINT

A reference ad has been provided in the system instructions (look for "PINNED REFERENCE AD" or "INSPIRATION BANK REFERENCES"). Your concepts MUST structurally mirror that reference — same hook archetype, same emotional entry point, same narrative shape, same pacing rhythm. Do NOT ignore the reference and generate unrelated concepts. The reference ad defines the creative DNA; your job is to adapt its approach to this brief's specific talking point and product. If a concept does not visibly echo the reference ad's structure and style, it will be rejected.` : ''}`;

  // Inject memory briefing if available
  const memorySection = memoryBriefing
    ? `\n\n## CREATIVE INTELLIGENCE — INSTITUTIONAL MEMORY\n\nThe following briefing comes from analysis of all previous batches this system has produced. It is a REFERENCE LIBRARY, not a blacklist. Your job is to generate concepts that genuinely serve THIS brief's parameters — if that means revisiting an angle or territory that's appeared recently, that's fine, as long as the new concept serves the parameters well. The enemy is IRRELEVANCE (concepts that drift to generic manifesto territory), not repetition.\n\n**RELEVANCE RULE (supersedes any "freshness" framing you might infer):** Every concept must tightly serve the brief's talking point, duration, product, and inspiration (if selected). If a concept could be swapped to a different talking point unchanged, it fails regardless of whether it's "fresh." Past-batch concepts that served their parameters well can inform new concepts — you're not banned from similar territory. Underperforming past approaches (scores ≤5) are worth rethinking when similar parameters come up.\n\n${memoryBriefing}`
    : '';

  // Inject inspiration bank context if available
  const inspirationSection = inspirationContext ? `\n\n${inspirationContext}` : '';

  return { system: system + memorySection + inspirationSection, user };
}
