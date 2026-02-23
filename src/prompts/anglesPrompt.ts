import type { AnglesParams, AngleType, FullAnalysis, FunnelStage, ProductCategory } from '../engine/types';
import { buildSystemBase, getProductAnalysis } from './systemBase';
import { buildAdTypeGuideFull } from './adTypeGuides';
import { getAwarenessConceptGuide } from './awarenessGuide';

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
  };
  return mandates[angleType] ?? '';
}

function buildProductLineGuide(product: ProductCategory): string {
  const guides: Record<ProductCategory, string> = {
    'EasyStretch': `**THE EASYSTRETCH LINE — Non-Binding Diabetic & Comfort Socks**

**PRODUCT IDENTITY:** EasyStretch is Viasox's COMFORT-FIRST line. These are non-binding, non-compression socks designed for people who need maximum comfort without any constriction. They are NOT compression socks.

**PRIMARY AUDIENCE:** Diabetics, neuropathy patients, seniors, people with edema, anyone who has experienced painful sock marks, swelling, or circulation issues from regular socks.

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

**PRODUCT IDENTITY:** Viasox Compression is the PERFORMANCE + MEDICAL line. These are true graduated compression socks (15-20 mmHg) designed for people who need active circulatory support — but with the comfort and style that Viasox is known for.

**PRIMARY AUDIENCE:** Healthcare workers (nurses, doctors), standing workers (retail, warehouse, teachers), travelers, post-surgery recovery, people with chronic venous insufficiency, athletes, pregnant women.

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

**PRODUCT IDENTITY:** Viasox Ankle Compression is the TARGETED SUPPORT line. These are ankle-length graduated compression socks for people who want compression benefits in a low-profile, versatile format.

**PRIMARY AUDIENCE:** Active professionals, athletes, people who wear low-cut shoes, warmer climates, those who want compression but dislike crew-length socks, standing workers in summer.

**CORE MESSAGING PILLARS (in priority order):**
1. **Compression Without the Crew** — Full graduated compression in ankle length. Get the benefits without the visible sock.
2. **Versatile & Discreet** — Works with any shoe: sneakers, loafers, dress shoes, boots. No one knows you're wearing compression.
3. **All-Season Comfort** — Perfect for warm weather when crew-length compression is too hot.
4. **Same Technology, Shorter Length** — Same graduated compression technology as the full line, just in ankle format.
5. **Active Lifestyle Fit** — For people who are mobile, active, and don't want to feel "medical."

**MESSAGING RULES FOR ANKLE COMPRESSION:**
- Position as the MODERN, ACTIVE choice — younger, more mobile audience
- Lead with VERSATILITY and LIFESTYLE FIT, then compression benefits
- The "invisible compression" angle is unique to this line — compression nobody sees
- Summer/warm weather is a natural seasonal hook
- Athletic and fitness contexts work well for this product
- Avoid heavy medical messaging — this line skews younger and more active
- The "I didn't know they made ankle compression" discovery angle is effective

**EMOTIONAL TERRITORY:** Freedom, modern/active lifestyle, versatility, "compression my way," style-conscious health decisions, discreet self-care`,

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
6. CTA must be soft and curiosity-driven: "Learn more," "See why 107K+ people switched," "Watch this," "Discover." NEVER "Buy now" or "Shop."
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
7. CTA is medium-direct: "Try your first pair," "See the reviews," "Compare for yourself," "Join 107K+ customers." NOT passive ("learn more") or aggressive ("buy now").

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
): { system: string; user: string } {
  const system = `${buildSystemBase()}

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

## PRODUCT LINE STRATEGY: ${params.product}
${buildProductLineGuide(params.product)}

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

  const user = `Generate exactly 5 creative ${params.angleType} concepts & angles for ${params.product} at the **${params.awarenessLevel}** awareness level, optimized for ${params.funnelStage} (${params.funnelStage === 'TOF' ? 'Top of Funnel' : params.funnelStage === 'MOF' ? 'Middle of Funnel' : 'Bottom of Funnel'}) using ${params.adType} format.

**CRITICAL — AWARENESS LEVEL IS ${params.awarenessLevel.toUpperCase()}:**
${params.awarenessLevel === 'Unaware' ? 'These concepts CANNOT mention the product, problem, or solution in the first 50% of the concept. Lead with pure identification, story, or curiosity. The concept structure must be: Identification → Disruption → Discovery → Curiosity. The product appears LAST. CTA is soft ("learn more," "discover"). This must read like CONTENT, not an ad.' : ''}${params.awarenessLevel === 'Problem Aware' ? 'These concepts must lead with SPECIFIC, VIVID pain that the viewer recognizes instantly. Use exact customer language from the reviews. Spend 60-70% of the concept on the PAIN (naming it, intensifying it) before bridging to the solution. CTA is medium-soft ("try your first pair," "see how it works").' : ''}${params.awarenessLevel === 'Solution Aware' ? 'These concepts must lead with DIFFERENTIATION — what makes Viasox fundamentally different from what they have tried. Do NOT belabor the problem (they know it). Spend 60-70% on the NEW MECHANISM, proof, and why this solution succeeds where others failed. CTA is medium-direct ("see why X switched," "compare for yourself").' : ''}${params.awarenessLevel === 'Product Aware' ? 'These concepts must assume the viewer ALREADY KNOWS Viasox. Lead with the brand name, deepened proof, or what is NEW. Go deep on a single powerful proof point rather than wide on many benefits. CTA is direct ("shop now," "get your pair").' : ''}${params.awarenessLevel === 'Most Aware' ? 'These concepts must be the MOST DIRECT and OFFER-FOCUSED. Lead with the product name + offer/news. Keep concepts tight — recognition → offer/urgency → CTA. No education, no problem agitation. The deal IS the concept. CTA is maximally direct ("buy now," "claim your pair," "add to cart").' : ''}

The awareness level must FUNDAMENTALLY change the concept structure, not just adjust a few words. An Unaware concept and a Most Aware concept for the same persona and ad type should look like completely different ads.

**CRITICAL — AD TYPE IS ${params.adType.toUpperCase()}:**
Every concept MUST be designed specifically for ${params.adType} production. ${isStatic ? 'This is a STATIC ad — describe a SINGLE compelling image, not a video sequence. Focus on visual composition, headline placement, color, and art direction. There are no scenes, no movement, no dialogue.' : `This is a VIDEO ad type. The concept must describe scenes, movement, talent, dialogue or voiceover, pacing, and visual storytelling specific to the ${params.adType} format.`}
${params.adType.includes('AGC') ? 'AGC (Actor-Generated Content): Polished, cinematic production. Multiple camera angles, professional lighting, high production value. Think broadcast-quality with strategic messaging. Concepts should describe PRODUCED scenes that require a production team, talent direction, and post-production.' : ''}${params.adType.includes('UGC') ? 'UGC (User-Generated Content): Raw, authentic, phone-shot aesthetic. Single person speaking to camera, natural lighting, real environments (home, car, office). The concept must describe what the "real person" says and does — NOT a produced video. Must feel unscripted, genuine, relatable.' : ''}${params.adType === 'Ecom Style' ? 'Ecom Style: Product-focused visual storytelling. Hero shots, close-ups of fabric/texture, unboxing moments, product-in-use beauty shots. Fast-paced editing, text overlays, lifestyle context. The concept must describe VISUAL sequences centered on the product itself.' : ''}${params.adType === 'Static' ? 'Static: Single image that stops the scroll. Every element must earn its place: headline, subhead, visual focal point, brand element, CTA. Describe the composition, color palette, typography hierarchy, and visual hook in detail.' : ''}${params.adType === 'Founder Style' ? 'Founder Style: The founder/brand representative speaking directly to camera. Personal, passionate, authoritative. "Let me tell you why I created this..." energy. Concepts must describe what the founder SAYS, their setting, their tone, and the story arc of their message.' : ''}${params.adType === 'Fake Podcast Ads' ? 'Fake Podcast Ads: Two people in a podcast-style setup casually discussing the product. Feels like an organic recommendation, not an ad. Conversational, unscripted feel. Concepts must describe the dialogue between hosts, the natural discovery of the product, and the authentic reaction.' : ''}${params.adType === 'Street Interview Style' ? 'Street Interview Style: An interviewer approaches real people with questions or challenges. Authentic reactions, surprise, real-world setting. Concepts must describe the setup question, the interaction, and the genuine moment of product discovery or reaction.' : ''}${params.adType === 'Spokesperson' ? 'Spokesperson: A relatable expert or authority figure presents the product. Think doctor, nurse, or credentialed professional who lends authority. Not celebrity — expertise. Concepts must describe who the spokesperson is, their credentials, what they say, and how they demonstrate authority.' : ''}${params.adType === 'Packaging/Employee' ? 'Packaging/Employee: Behind-the-scenes, warehouse/fulfillment content. Shows the real team packing orders, the care that goes into each shipment. Humanizes the brand. Concepts must describe the setting, the employees, the product handling, and the "we care about every pair" narrative.' : ''}
The ad type must FUNDAMENTALLY shape the creative execution. A UGC concept and an AGC concept for the same angle and awareness level should be completely different productions.

**CRITICAL — ANGLE TYPE IS ${params.angleType.toUpperCase()}:**
Follow the ${params.angleType} structural mandate from the system instructions. The angle type determines the CONCEPT ARCHITECTURE — the opening/middle/closing structure, the mandatory elements, and what's banned. A Problem-Based concept and an Aspiration-Based concept for the same product and awareness level must have completely different structures.

**CRITICAL — PRODUCT LINE IS ${params.product.toUpperCase()}:**
${params.product === 'EasyStretch' ? 'This is the EasyStretch (non-binding comfort) line. Lead with COMFORT, NO SOCK MARKS, and EASY TO PUT ON. These are NOT compression socks — never position as compression. The style/fashion angle is strongest for this line. Independence messaging (putting on socks alone) is a key differentiator.' : ''}${params.product === 'Compression' ? 'This is the Compression line (15-20 mmHg graduated compression). Lead with PERFORMANCE and RESULTS — real compression that doesn\'t feel like a tourniquet. The "12-hour shift" and "survives all day" proof context is strongest. Differentiate from pharmacy/drugstore compression.' : ''}${params.product === 'Ankle Compression' ? 'This is the Ankle Compression line. Lead with VERSATILITY and DISCREET COMPRESSION — full compression benefits in a low-profile ankle format. Position as modern and active. "Invisible compression" and warm-weather/athletic contexts are strongest.' : ''}${params.product === 'Other' ? 'Focus on universal Viasox value propositions: superior comfort, no sock marks, beautiful designs, and the 107K+ customer base.' : ''}
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

For each of the 5 concepts, use this EXACT structure with the numbered header format "## Concept 1:", "## Concept 2:", etc.:

## Concept [N]: [Concept Title]

**Hypothesis:** What we believe about the audience and why this concept will work. Frame as: "We believe [target audience] will respond to [approach] because [insight]."

**Ad Type:** ${params.adType}${isStatic ? ' (Static Image)' : ' (Video)'}

**Primary Persona:** The specific customer segment this concept targets (e.g., "Healthcare workers doing 10+ hour shifts", "Daughters buying for aging mothers")

**Awareness Level:** ${params.awarenessLevel}

**The Concept:** A vivid, detailed description of the creative execution. ${isStatic ? 'Describe the image composition, visual elements, talent (if any), setting, mood, headline placement, and overall art direction.' : 'Describe who we see on screen, the setting/location, what happens, the tone, the visual style, any unique production elements. Paint a picture of the ad the viewer will experience.'} This should be specific to ${params.adType} — not generic. Make it something a creative team could immediately visualize and produce.

**The Angle:** The strategic messaging approach within this concept. What emotional or logical frame are we using? What desire are we channeling? What belief are we challenging or reinforcing? This is the "why" behind the creative.

**Core Insight:** The customer truth this is built on, with a specific data point or frequency from the review analysis.

**Hook Line:** A sample opening line (${isStatic ? 'headline' : 'first 3 seconds of the video'}) that brings this concept to life, following the awareness level rules.

**Key Proof Point:** The specific data, quote, or pattern from the reviews that makes this concept credible.

**Customer Quote Anchor:** A real quote from the review data that embodies this concept.

**Headline Variations:** 3 different headline approaches for this concept (applying Schwartz's awareness-level headline rules).

**Why It Works:** The psychological principle behind this concept (cite Schwartz, Hopkins, Bly, or Neumeier).

---

CRITICAL: Do NOT recycle the example angle frames listed in the instructions (e.g., "The Sock Mark Problem", "Compression Without Compromise", "For Nurses Who Never Sit"). Those are reference examples showing the STRATEGIC LOGIC of each angle type. Your job is to mine the actual review data for fresh insights and build entirely original concepts and angles. Every concept must contain a specific data point or customer quote that proves it was born from THIS dataset, not copied from a template.

Generate EXACTLY 5 concepts. Ground every one in real review data. These should feel fresh, strategically deep, and immediately executable.`;

  return { system, user };
}
