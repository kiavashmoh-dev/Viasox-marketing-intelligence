/**
 * Manifesto Reference Data
 *
 * Rich strategic context extracted from the Viasox Marketing Manifesto
 * (107,993 customer reviews, Feb 2026 update). Organized by function
 * so each prompt builder can inject ONLY the relevant context.
 *
 * This file contains the INTERPRETIVE layer — the "so what?" that turns
 * raw data into strategic direction. The raw frequencies live in
 * salesEnrichment.json; this file supplies the psychological insight,
 * named patterns, and strategic implications the manifesto team derived.
 */

import type { ProductCategory } from '../engine/types';

/* ------------------------------------------------------------------ */
/*  Brand Foundation                                                    */
/* ------------------------------------------------------------------ */

export function getBrandPersonality(): string {
  return `## BRAND PERSONALITY

**Archetype Split:** 70% Caregiver / 30% Regular Guy
- Caregiver: Nurturing, protective, empathetic. "We see your struggle and we made this for you."
- Regular Guy: Down-to-earth, honest, relatable. "We're real people making real socks, no BS."
- Combined voice: Warm but never saccharine. Specific but never clinical. Helpful but never condescending.

**Named Persona Archetypes (from 107,993 reviews):**
- **Beth the Quiet Fighter (40%)** — Lives with daily discomfort but doesn't complain. Downplays her struggle. Puts others first. When she finds something that works, she's quietly loyal. She doesn't want to be seen as sick.
- **Linda the Practical Optimist (35%)** — Researches everything. Reads every review. Skeptical but hopeful. When convinced, she becomes an evangelist. She values honesty and specifics over emotion.
- **Other (25%)** — Includes caregivers, gift-buyers, healthcare workers, and the "accidental discoverer" who didn't know they needed these.`;
}

/* ------------------------------------------------------------------ */
/*  Customer Psychology — Deep Fear Profiles                           */
/* ------------------------------------------------------------------ */

export function getCoreFearsDeepDive(): string {
  return `## FOUR CORE FEARS — DEEP PSYCHOLOGICAL PROFILES

### 1. Loss of Independence (Primary Fear)
The sock struggle is a proxy for larger fears. When someone can't put on their own socks, it's not about socks — it's the first domino. "If I can't do this simple thing, what's next?" This fear manifests as:
- Refusing help even when it hurts more
- Buying multiple sock brands in secret, desperate to find one that works alone
- The "morning test" — each day starts with proving they can still manage
- Creative strategy: Show the MOMENT of independent success. The relief isn't about the sock — it's about still being capable.

### 2. Becoming a Burden (427 reviews, 12.6%)
Adult children buying for parents. Spouses helping daily. The person with swollen legs who stopped visiting because they need help with footwear. This fear is HIDDEN — rarely expressed directly but visible in:
- Gift-buyer reviews: "My mother was so happy she could do it herself"
- The unspoken subtext: the buyer is exhausted too, but won't say it
- Creative strategy: Address BOTH people — the wearer AND the caregiver. "Give them comfort, give yourself peace."

### 3. Physical Decline as Symbol
Sock marks aren't just marks — they're "visual proof my body is failing." Every red ring on the leg is a reminder. The sock struggle each morning is a health barometer. This fear connects to:
- The "closet graveyard" (689 reviews, 3.1%) — drawer of failed socks, each one a reminder of decline
- The "never again" breaking point — the morning where they literally couldn't get socks on
- Creative strategy: Position Viasox as evidence that things are GETTING BETTER, not worse.

### 4. Medical Device Stigma
"Those ugly beige things" — the moment compression socks make you look old, sick, or institutional. This fear drives:
- Style/pattern mentions at 12.3% — this is NOT a secondary benefit
- Customers hiding their socks, avoiding sandals, skipping social events
- Shrinking social circle (287 reviews) — choosing not to go out rather than be seen in medical socks
- Creative strategy: Lead with BEAUTY. Show patterns first, compression second. Let them discover the medical benefits AFTER falling in love with the design.`;
}

/* ------------------------------------------------------------------ */
/*  Emotional Pain Patterns                                            */
/* ------------------------------------------------------------------ */

export function getEmotionalPainPatterns(): string {
  return `## EMOTIONAL PAIN PATTERNS (from 107,993 reviews)

These are recurring psychological patterns that go beyond physical symptoms. They represent the EMOTIONAL experience of living with foot/leg problems — and they're the richest source material for advertising.

### The Morning Struggle Ritual
Every day begins with a fight against their own body. The sock goes on wrong, the elastic cuts in, they need help, they're exhausted before the day starts. This isn't minor inconvenience — it's a daily reminder of limitation.

### The Afternoon Countdown
By lunchtime, they're already thinking about when they can take their socks off. The binding, the marks building up, the swelling getting worse. They're watching the clock, not to go home, but to get relief.

### The Closet Graveyard (689 reviews, 3.1%)
A drawer stuffed with failed sock purchases — each one bought with hope, each one a disappointment. Thin diabetic socks that bunch. Compression socks impossible to get on. "Plus-size" socks that still don't fit. This is accumulated defeat, physical evidence of a problem they can't solve.

### The Cycle of False Hope
Try a new brand → Hope it works → Discover it doesn't → Add to the graveyard → Resign to living with the problem → See another ad → Cautiously try again. Each cycle makes them MORE skeptical and HARDER to convert. This is why social proof matters so much — they need to see OTHER people who broke the cycle.

### The "Never Again" Breaking Point
The specific moment that triggers the search — often a single event:
- Deep marks that lasted all day (33.7% of EasyStretch triggers)
- Needing help to dress for the first time
- A doctor visit where they couldn't get their socks on in the exam room
- Seeing a loved one struggle (9.3% — the caregiver trigger)
These are the SCENES to recreate in ads. They're the moments of recognition.

### Search Desperation
"I'd been searching for YEARS." "I thought I'd tried everything." The intensity of the search reflects the depth of the problem. These aren't casual shoppers — they've been to pharmacies, medical supply stores, Amazon rabbit holes, asked doctors.

### The Hidden Suffering
Most people with these problems don't talk about them. They suffer silently. Reviews are often the FIRST TIME they've expressed what they've been going through. This is why emotional, validating copy works — it tells them "we see you" for the first time.`;
}

/* ------------------------------------------------------------------ */
/*  Transformation Journey                                             */
/* ------------------------------------------------------------------ */

export function getTransformationJourney(): string {
  return `## THE THREE-STAGE TRANSFORMATION JOURNEY

### Stage 1: Suffering (Marketing = TOF)
**Psychology:** Accumulated defeat. They've normalized the problem. "This is just what happens when you get older." Hidden suffering — they don't complain because they think nothing can help.
**Internal Monologue:** "It's fine." / "Everyone my age deals with this." / "At least I can still walk."
**Marketing Implication:** Don't lead with the solution. Lead with RECOGNITION of their specific experience. Make them feel SEEN before offering anything. Match their energy — tired, resigned, but with a flicker of "what if?"

### Stage 2: Hoping (Marketing = MOF)
**Psychology:** Guarded optimism. They've found Viasox (or something like it) but the "protector voice" is loud: "Don't get your hopes up." "Remember the last 10 pairs that didn't work?" They're in an internal negotiation between hope and self-protection.
**The Two Voices:**
- Protector: "Don't get hurt again" / "Save your money" / "They're probably all the same"
- Hope: "But what if...?" / "The reviews seem real" / "Maybe this time..."
**Marketing Implication:** Address BOTH voices. Acknowledge skepticism ("we know you've tried everything") while building evidence that this is different. Risk-free offers (30-day guarantee) speak directly to the Protector Voice.

### Stage 3: Success (Marketing = BOF / Retention)
**Psychology:** Identity restoration — not just "my socks are comfortable" but "I'm ME again." The transformation happens in 4 stages:
1. Physical relief → "My legs don't hurt anymore"
2. Emotional shift → "I feel like myself again"
3. Social re-engagement → "I went out with friends for the first time in months"
4. Evangelical sharing → "I tell everyone about these socks"
**Specific Transformation Metrics (use in ads):**
- "After 1 week my feet hurt about 90% less"
- "The swelling went down by MORE THAN HALF the first day"
- "No swelling at end of shift"
- "Game changer" appears in 1.66% of all reviews (1,793 uses)
- "Love" appears in 31.8% of reviews (12,156 uses)
**Marketing Implication:** Use customer-provided NUMBERS. They're more credible than brand claims because they're specific and personal. Let customers tell the transformation story in their own words.`;
}

/* ------------------------------------------------------------------ */
/*  Product-Specific Purchase Triggers                                 */
/* ------------------------------------------------------------------ */

export function getProductPurchaseTriggers(product: ProductCategory): string {
  const triggers: Record<ProductCategory, string> = {
    'EasyStretch': `## EASYSTRETCH PURCHASE TRIGGERS (from 38,341 reviews)

**Why people actually buy EasyStretch (ranked by frequency):**
1. **The Breaking Point (33.7%)** — A particularly bad morning struggle, deep marks that lasted all day, finally admitting regular socks don't work
2. **General Comfort Quest (24.3%)** — Simply tired of uncomfortable socks, wanting softer feeling, gradual realization comfort matters more with age
3. **The Caregiver Crisis (9.3%)** — Watching a loved one struggle, back pain from helping daily, loved one refusing to wear anything
4. **The Size Surrender (8.7%)** — Another pair of XL that didn't fit, swelling making all socks impossible, finding nothing in stores
5. **The Medical Mandate (7.1%)** — Doctor's orders for diabetic socks, neuropathy diagnosis, wound that won't heal

**Pain Points Solved (ranked by review frequency):**
1. Comfort Achieved — 29.0% (11,108 mentions)
2. No Sock Marks — 8.8% (3,385 mentions) KEY DIFFERENTIATOR
3. Finally Fits — 12.7% (4,847 mentions)
4. Style/Patterns — 12.3% (4,694 mentions) UNDERUTILIZED IN MARKETING
5. Easy Application — 5.0% (1,921 mentions) ELEVATED from original 1.3%
6. Stays Up — 5.1% (1,967 mentions)
7. Warmth/Coziness — 5.4% (2,077 mentions) NEW PATTERN

**Critical Insight:** Customers lead with COMFORT (29%), not medical benefits. "No marks" is the killer differentiator but customers express it through comfort language. Style at 12.3% is a PRIMARY driver, not secondary.

**Emerging Segments:**
- Healthcare Worker (3.5%) — Nurses on 12-hour shifts. Evangelical recommenders.
- Accessibility Seeker — People with paralysis, arthritis, hip issues. "Easy to put on" is a MEDICAL necessity.
- Gift-Giver (2.0%) — Adult children buying for elderly parents. Seasonal opportunity.`,

    'Compression': `## COMPRESSION PURCHASE TRIGGERS (from 29,357 reviews)

**Why people actually buy Compression (ranked by frequency):**
1. **General Comfort Need (19.3%)** — Seeking better comfort without specific crisis
2. **The Style Discovery (15.8%)** — Seeing compression that doesn't look medical, friend recommendation, realizing they don't have to hide
3. **The Easy Discovery (9.1%)** — Learning compression doesn't have to be hard, seeing "easy to put on" in reviews
4. **The Work Crisis (7.4%)** — Legs failing during shifts, coworker recommendation, can't afford to miss work
5. **The Swelling Event (4.8%)** — Doctor's prescription, visible swelling worsening, edema health scare

**Pain Points Solved (ranked):**
1. Style Stigma Eliminated — 12.0% (3,523 mentions) "Don't have to wear beige"
2. Application Difficulty Solved — 11.4% (3,347 mentions) MAJOR — jumped from 9.1%
3. Comfort Achieved — 29.0% (8,513 mentions)
4. Too Tight Solved — 10.0% (2,936 mentions)
5. Work Day Endurance — 7.5% (2,202 mentions)
6. Swelling Management — 4.8% (1,409 mentions)
7. Repeat Customer Loyalty — 19.5% (5,725 mentions) COLLECTOR BEHAVIOR

**Critical Insights:**
- "Easy to put on" is a TOP 3 benefit (11.4%). This should be elevated in all messaging.
- Only 0.45% mention doctor recommendation — MASSIVE untapped medical partnership opportunity.
- The Price Journey pattern: "I wasn't sure about spending that much" → "I decided to try" → "Worth every penny" → "I've ordered 15 pairs"
- 19.5% are repeat customers — natural collector behavior. Subscription opportunity.`,

    'Ankle Compression': `## ANKLE COMPRESSION PURCHASE TRIGGERS (from 21,344 reviews)

**Why people actually buy Ankle Compression (ranked by frequency):**
1. **The Comfort Priority (31.2%)** — Seeking general comfort improvement, wanting softer socks
2. **The Targeted Need (26.5%)** — Specific ankle/foot problem, localized swelling, neuropathy management
3. **The Professional Imperative (7.5%)** — Work performance suffering, standing all day, shift fatigue
4. **The Gift Solution (3.7%)** — Buying for spouse or parent, sharing a discovered solution
5. **The Seasonal Shift (3.6%)** — Summer approaching, heat intolerance with knee-highs

**Pain Points Solved (ranked):**
1. Localized Swelling — 12.0% (2,367 mentions) THE primary pain point
2. Comfort Achieved — 27.6% (5,456 mentions)
3. Fashion/Style Appeal — 8.3% (1,635 mentions) This is a FASHION product
4. Work-Related Fatigue — 5.5% (1,079 mentions)
5. Heat Intolerance Solved — 4.0% (790 mentions)
6. Discreet Wear — 3.9% (771 mentions) Fits in any shoe
7. Seasonal Need — 3.7% (726 mentions)

**GATEWAY PRODUCT INSIGHT:** Only 0.06% of ankle compression buyers mention already owning knee-highs. This means Ankle Compression is attracting ENTIRELY NEW customers to compression therapy — not a downsize from knee-highs. Position as: "Compression for people who don't think compression socks are for them."

**Underexploited Segments:**
- Pregnancy swelling (0.48%) — Undermarketed
- Seniors/aging (0.59%) — Undermarketed
- Travel/vacation (1.54%) — Undermarketed
- Healthcare workers (0.45%) — Major opportunity`,

    'Other': `## GENERAL VIASOX PURCHASE TRIGGERS
Top triggers across all products: comfort seeking (25-31%), pain/marks relief (8-12%), style discovery (8-15%), ease of application (5-11%), work endurance (5-8%). Lead with comfort, follow with the product-specific differentiator.`,
  };
  return triggers[product] ?? triggers['Other'];
}

/* ------------------------------------------------------------------ */
/*  Product-Specific Strategic Insights                                */
/* ------------------------------------------------------------------ */

export function getProductStrategicInsights(product: ProductCategory): string {
  const insights: Record<ProductCategory, string> = {
    'EasyStretch': `## EASYSTRETCH STRATEGIC MESSAGING

**Message Hierarchy by Persona:**
- For Caregivers: Lead with "Ease for both of you" → Support with happy testimonials from care recipients
- For Size Warriors: Lead with "Actual measurements and stretch" → Support with plus-size testimonials
- For Medical Mavericks: Lead with "Comfort with compliance" → Support with fun patterns, normal life
- For Freedom Seekers: Lead with "Easy independence" → Support with "No help needed"

**Key Strategic Shifts (Feb 2026):**
- Style/patterns at 12.3% means style IS a primary driver — treat it as a lead benefit, not afterthought
- Warmth/coziness at 5.4% — position EasyStretch as comfort/wellness product, not just medical
- "Easy to put on" was SEVERELY underestimated (original 1.3% → now 5.0%). Elevate in messaging.`,

    'Compression': `## COMPRESSION STRATEGIC MESSAGING

**Message Hierarchy by Persona:**
- For Style Rebels: Lead with "Patterns and designs" → Support with "Oh, and they're real compression too"
- For Working Women: Lead with "All-day comfort and support" → Support with value and durability
- For Compression Converts: Lead with "Easy to put on" → Support with gentle but effective compression
- For Swelling Sufferers: Lead with "Medical effectiveness" → Support with comfort as bonus

**The Core Insight:** The Compression customer has already accepted they need medical support — they're just refusing to accept it has to LOOK and FEEL medical. The emotional benefit of dignity through style actually outweighs the medical benefit for many. The compression revolution isn't about mmHg — it's about permission to enjoy something you have to wear.

**Key Strategic Shifts (Feb 2026):**
- Doctor recommendation at only 0.45% — untapped medical professional partnership opportunity
- 19.5% repeat/collector behavior — build around natural loyalty, subscription model
- Price journey is well-documented: hesitation → trial → "worth every penny" → loyal evangelist`,

    'Ankle Compression': `## ANKLE COMPRESSION STRATEGIC MESSAGING

**Message Hierarchy by Persona:**
- For Targeted Problem Solvers: Lead with "Precise compression zones" → Support with specific condition results
- For Seasonal Switchers: Lead with "Summer-ready compression" → Support with breathability
- For Professional Pragmatists: Lead with "All-shift comfort" → Support with durability and value
- For Compression Refugees: Lead with "Freedom from knee-highs" → Support with "Easier, still effective"

**The Core Insight:** The Ankle customer isn't compromising — they're optimizing. Strategic, targeted support can be more effective than blanket solutions. Every message must celebrate this intelligent choice.

**Updated Positioning:**
- OLD: "Ankle compression for targeted support"
- NEW: "Finally, compression that fits your life"
- Message order: 1) Lead with COMFORT (27.6%) → 2) Follow with FASHION (8.3%) → 3) Surprise with RESULTS

**Key Strategic Shifts (Feb 2026):**
- Gateway product positioning — this is an ENTRY POINT to compression, not a downgrade
- "Game changer" appears in 1.66% of reviews — use this language
- Fashion-forward positioning: "Beautiful enough to love, effective enough to work"`,

    'Other': '',
  };
  return insights[product] ?? '';
}

/* ------------------------------------------------------------------ */
/*  Script Frameworks (from Manifesto 4.3)                             */
/* ------------------------------------------------------------------ */

export function getScriptFrameworks(): string {
  return `## 12 PROVEN SCRIPT FRAMEWORKS

Use these as structural blueprints — adapt timing to the selected ad duration. Never copy the example scripts; use the STRUCTURE with fresh creative from the actual review data.

### 1. PAS (Problem-Agitate-Solve)
Problem (0-20%) → Agitate (20-50%) → Solve (50-85%) → CTA (85-100%)
Best for: Problem-Aware & Solution-Aware. Amplify existing pain before revealing relief.

### 2. Before-Bridge-After (BBA)
Before/life with problem (0-25%) → Bridge/discovery moment (25-60%) → After/life transformed (60-90%) → CTA (90-100%)
Best for: All awareness levels. Creates a mental movie of transformation. Stories are 22x more memorable than facts.

### 3. AIDA-R (Attention-Interest-Desire-Action-Retention)
Attention/pattern interrupt (0-10%) → Interest/unique angle (10-35%) → Desire/benefits stacking (35-70%) → Action/CTA (70-90%) → Retention/risk reversal (90-100%)
Best for: Product-Aware audiences. Build momentum toward purchase.

### 4. The Skeptic's Journey
Doubt (0-15%) → Reluctant try (15-40%) → Surprise/unexpected success (40-65%) → Conversion/true believer (65-90%) → Challenge CTA (90-100%)
Best for: Solution-Aware & Product-Aware skeptics. Mirrors viewer's doubt, building trust through shared skepticism. Increases credibility dramatically.

### 5. The Enemy Framework
Identify enemy/bad solution (0-15%) → Validate hatred (15-40%) → Reveal alternative (40-65%) → Prove superiority (65-90%) → CTA/join the rebellion (90-100%)
Best for: Solution-Aware. Creates in-group dynamics against the "old way." Enemies: pharmacy compression, beige medical socks, tight elastic, impossible-to-put-on socks.

### 6. The Discovery Narrative
Search phase (0-20%) → Discovery moment (20-45%) → First experience (45-70%) → Realization/"this is it" (70-90%) → Sharing CTA (90-100%)
Best for: Problem-Aware. Taps into the powerful "found treasure" narrative.

### 7. The Professional Authority
Credential (0-10%) → Professional problem (10-35%) → Failed solutions (35-55%) → Viasox discovery (55-75%) → Professional proof/results (75-90%) → Peer recommendation CTA (90-100%)
Best for: All awareness levels. Occupational credibility — "people like me" testimonials outperform celebrities.

### 8. The Demonstration Proof
Challenge setup/"watch this" (0-15%) → Live demo (15-50%) → Feature callouts (50-70%) → Comparison vs. regular (70-90%) → Confidence CTA (90-100%)
Best for: Product-Aware. Visual demonstration increases purchase intent significantly. Show, don't tell.

### 9. The Life Moment
Scenario setup (0-15%) → Problem peak (15-40%) → Viasox solution (40-65%) → Outcome/situation resolved (65-90%) → Relate CTA (90-100%)
Best for: Problem-Aware. Specific scenarios trigger episodic memory. Much more memorable than general claims.

### 10. The Comparison Truth
Side A/current solution (0-15%) → Problems with it (15-35%) → Side B/Viasox (35-55%) → Benefits/why better (55-85%) → Clear winner + Switch CTA (85-100%)
Best for: Solution-Aware. Direct comparison makes differences far more apparent.

### 11. The Objection Crusher
State objection/their thought (0-12%) → Acknowledge/"I get it" (12-25%) → Counter evidence (25-60%) → Testimonial support (60-80%) → Risk-free CTA (80-100%)
Best for: Product-Aware skeptics. Preemptively addressing concerns increases conversion.

### 12. The Identity Alignment
Identity statement/"You're someone who..." (0-12%) → Values connection (12-35%) → Current conflict/how socks violate this (35-55%) → Viasox alignment (55-85%) → Belong CTA (85-100%)
Best for: All awareness levels. Identity-based decisions are 5x stronger than feature-based.`;
}

/* ------------------------------------------------------------------ */
/*  Hook Don'ts (from Manifesto 4.1)                                   */
/* ------------------------------------------------------------------ */

export function getHookDonts(): string {
  return `## HOOK DON'TS (from Manifesto)

### Never Start With:
- Generic greetings ("Hey there!", "Hi everyone!")
- Product name before problem
- Benefits before pain acknowledgment
- "Just try..." (dismissive of their journey)
- Medical claims without context
- Prices or discounts (for cold traffic)
- Hyperbole ("The best socks ever!")

### Always Avoid:
- Multiple problems in one hook (pick ONE)
- Vague pain points ("discomfort" — say WHAT discomfort)
- Corporate speak ("innovative solution", "revolutionary")
- Assuming they know what Viasox is (cold audiences)
- Minimizing their struggle ("simple fix", "easy answer")
- Complex medical terminology (unless targeting medical professionals)`;
}

/* ------------------------------------------------------------------ */
/*  Awareness Messaging Techniques (from Manifesto 4.4)                */
/* ------------------------------------------------------------------ */

export function getAwarenessMessagingTechniques(): string {
  return `## ADVANCED AWARENESS-LEVEL TECHNIQUES

### Mirror Language Technique (Problem-Aware)
Use their EXACT words from reviews, not clinical equivalents:
- Say "cutting off my blood flow" (NOT "circulation issues")
- Say "legs swollen like balloons" (NOT "edema")
- Say "the daily battle with my socks" (NOT "difficulty dressing")
- Say "given up" (NOT "resigned to the issue")

### Temporal Suffering Technique (Problem-Aware)
Acknowledge the accumulated, time-based nature of their pain:
- Morning: "Another morning, another sock fight?"
- Midday: "By lunch, you're already counting down to sock removal"
- Evening: "Ending another day with deep red marks?"

### The Two Voices Framework (Solution-Aware)
Every Solution-Aware prospect has two internal voices. Address BOTH:

**The Protector Voice:** "Don't get your hopes up" / "Remember last time?" / "They're probably all the same" / "Save your money"
**Your Response:** "We know you're protecting yourself" / "This isn't like last time because..." / "Here's exactly what's different..." / "Risk-free for skeptics like you"

**The Hope Voice:** "But what if...?" / "Reviews seem genuine" / "Maybe this time..."
**Your Reinforcement:** "What if you're right to hope?" / "Real people, real relief" / "This time IS different"

### Progression Formula
- Problem-Aware: EMPATHY (70%) + Information (30%)
- Solution-Aware: PROOF (70%) + Empathy (30%)
- Product-Aware: SPECIFICS (70%) + Urgency (30%)
- Most-Aware: CELEBRATION (70%) + Expansion (30%)

### Power Words by Awareness Level
- **Problem-Aware:** "understand," "know," "tried," "difficult" | AVOID: "easy," "simple," "just try"
- **Solution-Aware:** "different," "actually," "finally," "unlike" | AVOID: "guaranteed," "definitely"
- **Product-Aware:** "specifically," "exactly," "proven," "patented" | AVOID: "maybe," "might," "could"
- **Most-Aware:** "family," "exclusive," "celebrate," "expand" | AVOID: "try," "struggle," "problem"`;
}

/* ------------------------------------------------------------------ */
/*  Emerging Segments                                                   */
/* ------------------------------------------------------------------ */

export function getEmergingSegments(): string {
  return `## EMERGING CUSTOMER SEGMENTS (Feb 2026 Update)

These segments were newly identified from 107,993 reviews and represent undertapped opportunities:

### The Healthcare Worker (3.5% of EasyStretch reviews)
Nurses, stylists, teachers, retail workers on feet 8-12+ hours.
- Trigger: Leg pain/fatigue from long shifts
- Core Need: All-day support that doesn't restrict
- Message: Lead with "Pain-free after 12-hour shifts" → Support with "No marks even after all day"
- Key insight: These are EVANGELICAL recommenders — one nurse can influence an entire unit

### The Accessibility Seeker (New Persona)
People with physical limitations (paralysis, arthritis, hip issues) where "easy to put on" is a MEDICAL necessity, not convenience.
- Trigger: Inability to dress independently
- Core Need: Maintain independence and dignity
- Message: Lead with "Independence restored" → Support with "No struggle, no help needed"
- Key insight: This segment sees "easy to put on" as TRANSFORMATIVE. Partnership opportunity with occupational therapists.

### The Gift-Giver (2.0-3.7% depending on product)
Adult children buying for elderly parents, spouses buying for partners.
- Trigger: Watching loved one struggle with socks
- Core Need: Give comfort to someone they care about
- Message: Lead with "Give comfort they'll actually wear" → Support with "Fun patterns they'll love"
- Seasonal opportunity: Christmas, Mother's Day, Father's Day

### The Collector (19.5% of Compression reviews)
Repeat customers buying 10+ pairs, collecting patterns.
- Behavior: "I bought so many of these socks that I'm beginning to worry about my sanity"
- Indicates deep satisfaction and natural advocacy
- Opportunity: Subscription model, new pattern drops, loyalty rewards

### The Seasonal Switcher (3.6% of Ankle reviews)
Customers who need compression in summer but find knee-highs too hot.
- Trigger: Summer approaching + existing compression need
- Message: "Summer-ready compression" — breakthrough positioning
- Cross-sell opportunity: Knee-highs for winter, ankle for summer`;
}
