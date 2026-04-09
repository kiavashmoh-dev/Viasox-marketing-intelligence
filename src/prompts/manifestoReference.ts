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
  return `## 20 PROVEN SCRIPT FRAMEWORKS (from Manifesto 4.3 + Four Marketing Books)

Use these as structural blueprints — adapt timing to the selected ad duration. Never copy example scripts; use the STRUCTURE with fresh creative from the actual review data. Each framework cites the marketing book(s) it draws from and includes execution instructions.

---

### 1. PAS (Problem-Agitate-Solution)
**Book Origin:** Hopkins (specificity in naming pain) + Schwartz (intensification technique)
**Structure:** Problem (0-20%) → Agitate (20-50%) → Solve (50-85%) → CTA (85-100%)
**Best for:** Problem-Aware & Solution-Aware audiences. Works at TOF and MOF.
**How to Execute:**
- PROBLEM: Open with one SPECIFIC pain from review data — not "foot pain" but "those deep red marks still there at dinner." Hopkins demands specifics: name the exact symptom, the exact moment, the exact frustration.
- AGITATE: Schwartz's intensification — make the problem feel URGENT and ESCALATING. Stack consequences: the marks → the embarrassment → the fear of what it means. Use temporal language: "every morning," "all day," "again tonight." The agitation must make the status quo INTOLERABLE.
- SOLVE: Introduce Viasox as the relief. Schwartz's mechanization: give the reason WHY it works (non-binding tops, graduated compression). Don't just claim — explain the mechanism.
- CTA: Hopkins' service principle — frame the CTA as an offer of help, not a demand to buy.

### 2. AIDA-R (Attention-Interest-Desire-Action-Retention)
**Book Origin:** Bly (motivating sequence) + Schwartz (three dimensions of copy)
**Structure:** Attention (0-10%) → Interest (10-35%) → Desire (35-70%) → Action (70-90%) → Retention (90-100%)
**Best for:** Product-Aware and retargeting audiences. MOF and BOF.
**How to Execute:**
- ATTENTION: Bly's 4 U's — the hook must be Urgent, Unique, Ultra-specific, and Useful. Pattern interrupt with a surprising data point or unexpected visual.
- INTEREST: Schwartz's Dimension 2 (Identification) — make the viewer see themselves. "If you're a nurse who..." Use an unexpected angle or insight from the review data that makes them lean in.
- DESIRE: Schwartz's Dimension 1 (Desire intensification) — paint the after-state so vividly they can feel it. Stack benefits using Bly's "one level deeper" technique: Feature → Benefit → REAL Benefit. "Non-binding tops → no marks → no more evidence your body is failing."
- ACTION: Direct, specific CTA. Bly: make the action easy and clear. Include the offer if applicable.
- RETENTION: Risk reversal (30-day guarantee) + repeat the single strongest benefit. Schwartz's Dimension 3 (Belief) — leave them trusting.

### 3. Before-After-Bridge
**Book Origin:** Schwartz (visualization) + Neumeier (gut feeling creation)
**Structure:** Before (0-25%) → After (25-60%) → Bridge (60-90%) → CTA (90-100%)
**Best for:** All awareness levels. Transformation stories. TOF through BOF.
**How to Execute:**
- BEFORE: Schwartz's identification — recreate the viewer's painful reality using their exact language from reviews. Show the morning struggle, the marks, the closet graveyard. Neumeier: create a FEELING of frustration, not just information.
- AFTER: Schwartz's visualization — paint the transformed state so clearly they can experience it. "No marks at dinner." "Put them on without sitting down." "Wore sandals for the first time in two years." Use real customer transformation metrics (90% less pain, swelling down by half).
- BRIDGE: Viasox is the bridge. Schwartz's mechanization — explain WHY it created this transformation. Keep it simple: one key mechanism, one key proof point.
- CTA: Neumeier's trust equation — reliability (it works) + delight (it's beautiful too). Invite them to start their own before/after.

### 4. Star-Story-Solution
**Book Origin:** Hopkins (psychology of service) + Schwartz (identification technique)
**Structure:** Star/relatable character (0-15%) → Story/their journey (15-65%) → Solution (65-90%) → CTA (90-100%)
**Best for:** Storytelling formats, longer durations (16-59 sec and 60-90 sec), emotional connection. TOF and MOF.
**How to Execute:**
- STAR: Introduce a specific, relatable character. Hopkins: select your audience by making the star THEM. Not "a woman" but "a retired nurse whose legs haven't stopped aching since her last shift 5 years ago." Schwartz: the viewer must IDENTIFY with this character instantly.
- STORY: The narrative arc must follow the Cycle of False Hope from the manifesto — the Star has tried and failed before. Include specific details from review data: the brands they tried, the pharmacy visits, the moment they gave up. The story must feel REAL — Hopkins insists on truth in advertising. Use actual customer journeys.
- SOLUTION: The discovery of Viasox enters organically — not as a pitch but as a plot point in the story. Hopkins' service principle: the solution feels like help, not selling.
- CTA: Tie the CTA to the story — "Start your story" or "Join [X]K people who found theirs."

### 5. Feel-Felt-Found
**Book Origin:** Bly (objection handling) + Schwartz (Two Voices Framework)
**Structure:** Feel (0-25%) → Felt (25-60%) → Found (60-90%) → CTA (90-100%)
**Best for:** Overcoming skepticism, premium price objection. Solution-Aware and Product-Aware.
**How to Execute:**
- FEEL: "I know how you feel about [specific concern]." Schwartz's Two Voices: address the Protector Voice directly. "I know you're thinking 'just another pair of socks.' I thought that too." Use Bly's BFD analysis — identify their core Belief, Feeling, and Desire.
- FELT: "I felt the same way." or "Others felt..." Schwartz's identification — create a shared experience. Reference the Closet Graveyard (3.1% of reviews), the Cycle of False Hope. Show you understand their JOURNEY, not just their problem.
- FOUND: "But here's what I found..." The pivot. Bly's proof cascade — specific numbers, specific quotes, specific results. "After 1 week, 90% less pain." "The swelling went down by more than half the first day." Every claim backed by review data.
- CTA: Risk-free language that speaks to the Protector Voice: "Try them. If I'm wrong, you've lost nothing."

### 6. Problem-Promise-Proof-Push
**Book Origin:** Bly (PPPP formula) + Hopkins (specificity principle)
**Structure:** Problem (0-20%) → Promise (20-40%) → Proof (40-75%) → Push (75-100%)
**Best for:** Direct response, conversion-focused ads. MOF and BOF.
**How to Execute:**
- PROBLEM: One specific pain point from review data. Hopkins: specificity is your weapon. Not "discomfort" but "deep red rings around your calves that take hours to fade."
- PROMISE: The bold claim Viasox makes. Bly: the promise must pass the "so what?" test. Not "comfortable socks" but "the first socks that won't leave a single mark." Make the promise specific and testable.
- PROOF: This is the longest section — Bly's proof cascade. Stack at least 3 types of proof: (1) Data from reviews ("8.8% of 107K reviews cite no marks"), (2) Customer testimony (direct quote), (3) Mechanism explanation (Hopkins: give the reason why). Each proof element must be Ultra-specific.
- PUSH: CTA with urgency. Bly: give a reason to act NOW. Include risk reversal (guarantee) and the offer if applicable.

### 7. Hook-Story-Offer
**Book Origin:** Bly (direct response structure) + Hopkins (headline-as-selector)
**Structure:** Hook (0-15%) → Story (15-70%) → Offer (70-100%)
**Best for:** Social media ads, UGC-style content. TOF and MOF.
**How to Execute:**
- HOOK: Hopkins' headline-as-selector — the hook exists to grab the RIGHT person and let everyone else scroll. Bly's 4 U's: it must be Urgent, Unique, Ultra-specific, and Useful. "I'm a nurse and I just survived my first 12-hour shift without my legs aching."
- STORY: The customer's real story with specific details. Hopkins: write like a salesperson talking to ONE person. Include sensory details — what they saw, felt, experienced. The story must include a turning point: the moment Viasox changed their experience. Use review language verbatim.
- OFFER: Bly's direct response CTA — be specific about what they get, what it costs, and why they should act now. Include the offer (B1G1, B2G3) and risk reversal.

### 8. Empathy-Education-Evidence
**Book Origin:** Neumeier (trust = reliability + delight) + Hopkins (service principle)
**Structure:** Empathy (0-30%) → Education (30-65%) → Evidence (65-90%) → CTA (90-100%)
**Best for:** Building trust, premium positioning. Problem-Aware audiences. TOF and MOF.
**How to Execute:**
- EMPATHY: Neumeier: create a GUT FEELING first. Show deep understanding of their struggle. Reference the Hidden Suffering pattern — most people don't talk about these problems. "Nobody talks about the daily fight just to put on socks." Hopkins' service: position yourself as someone who UNDERSTANDS and HELPS.
- EDUCATION: Hopkins: the best ads feel like useful information. Teach them something they didn't know — why regular elastic causes marks, why pharmacy compression is so hard to put on, why diabetic socks don't have to look medical. Give them knowledge that reframes their problem.
- EVIDENCE: Neumeier's reliability — prove it works with specifics. Customer data, transformation metrics, before/after. Neumeier's delight — then show the unexpected bonus (beautiful patterns, fun colors). The evidence proves BOTH that it works AND that it's wonderful.
- CTA: Service-oriented: "See what we made for you" not "Buy now."

### 9. The Contrast Framework
**Book Origin:** Neumeier (differentiation is survival) + Schwartz (enemy naming)
**Structure:** Old Way (0-20%) → Problems with old way (20-40%) → New Way (40-65%) → Why it's better (65-90%) → CTA (90-100%)
**Best for:** Competitive positioning, Solution-Aware audiences. MOF.
**How to Execute:**
- OLD WAY: Schwartz's enemy naming — identify the "villain." Pharmacy compression socks, tight elastic bands, ugly beige medical socks, impossible-to-put-on compression. Don't bash specific brands — bash the CATEGORY experience.
- PROBLEMS: Intensify hatred using customer language: "feels like a tourniquet," "those ugly beige things," "needed help just to get them on." Reference the 12.3% style stigma data.
- NEW WAY: Neumeier's differentiation — show what makes Viasox fundamentally DIFFERENT. Not "better compression" but "compression that actually looks like something you'd choose to wear." The contrast must be VISCERAL — side by side visual is most powerful.
- WHY BETTER: Schwartz's mechanization — explain the mechanism that makes the difference. Non-binding tops, graduated compression that's gentle, beautiful patterns designed for real life.
- CTA: "Switch" language — "Join [X]K people who switched" or "See the difference yourself."

### 10. The Skeptic Converter
**Book Origin:** Schwartz (awareness progression) + Bly (objection handling)
**Structure:** Objection voiced (0-15%) → Acknowledgment (15-30%) → Unexpected twist/evidence (30-65%) → Conversion moment (65-90%) → CTA (90-100%)
**Best for:** Solution-Aware and Product-Aware skeptics. MOF. The Cycle of False Hope audience.
**How to Execute:**
- OBJECTION: Voice the viewer's EXACT skepticism. Schwartz: match their awareness level precisely. "Great, another pair of 'miracle' socks." "I've already tried compression — it doesn't work." "You want me to pay how much for socks?" Bly's BFD: address their core BELIEF that nothing will work.
- ACKNOWLEDGMENT: "I get it. I said the same thing." This is critical — Schwartz's identification. Don't dismiss the objection; validate it. Reference the Cycle of False Hope: "After the 10th pair that didn't work..."
- TWIST: The unexpected evidence that cracks the skepticism. A specific data point they didn't know, a customer quote that sounds like THEM, a demonstration that contradicts their assumption. Bly: the proof must be Ultra-specific.
- CONVERSION: Show the moment of belief shift. The review quote that says "I can't believe I waited so long." Schwartz: the conversion must feel earned, not forced.
- CTA: Challenge language: "Prove us wrong" or "Try them risk-free — we'll wait."

### 11. The Day-in-Life
**Book Origin:** Schwartz (identification) + Hopkins (specificity of scenarios)
**Structure:** Morning setup (0-20%) → Throughout the day (20-55%) → Evening reveal (55-85%) → CTA (85-100%)
**Best for:** Relatability, specific-use scenarios (nurses, teachers, seniors). Problem-Aware. TOF and MOF.
**How to Execute:**
- MORNING: Schwartz's identification — show THEIR morning. The specific struggle: sitting on the bed, fighting with socks, the elastic biting in, needing help. Hopkins: make it SPECIFIC to the persona. A nurse putting on compression before a shift is different from a senior getting dressed for the day.
- THROUGHOUT: Track the day using the temporal suffering technique from the manifesto. Morning sock fight → midday discomfort building → afternoon countdown to removal. Show how the WRONG socks ruin the WHOLE day. Then show the SAME day with Viasox — the contrast of comfort.
- EVENING: The reveal moment. Show the legs at end of day — no marks, no swelling, socks still comfortable. Reference real transformation metrics: "no swelling at end of shift."
- CTA: Tie to the daily routine: "Change your mornings" or "Start tomorrow different."

### 12. The Myth Buster
**Book Origin:** Bly (news-style lead) + Hopkins (reason-why advertising)
**Structure:** Common myth stated (0-15%) → Why people believe it (15-35%) → The real truth with evidence (35-70%) → How Viasox embodies the truth (70-90%) → CTA (90-100%)
**Best for:** Education, thought leadership. Problem-Aware and Solution-Aware. TOF and MOF.
**How to Execute:**
- MYTH: State a misconception boldly. Bly's "news" lead type — present this as surprising information. "You've been told compression socks have to be tight to work." "Everyone says diabetic socks have to look medical." The myth must be something the viewer currently BELIEVES.
- WHY THEY BELIEVE IT: Hopkins' specificity — explain where this myth came from. Pharmacy compression DOES feel like a tourniquet. Medical socks HAVE always been beige. Validate WHY they hold this belief.
- THE TRUTH: Hopkins' reason-why — present the counter-evidence with specific data. "107,993 reviews prove otherwise." "In 29,357 compression reviews, the #1 compliment was COMFORT." Every truth-claim needs a data point.
- VIASOX: Show how the product embodies the busted myth. Schwartz's mechanization: explain the mechanism that makes the myth irrelevant.
- CTA: Education language: "See the truth" or "Discover what 107K people already know."

### 13. The Enemy Framework
**Book Origin:** Schwartz (enemy naming + in-group dynamics)
**Structure:** Identify the enemy (0-15%) → Validate hatred (15-40%) → Reveal the alternative (40-65%) → Prove superiority (65-90%) → CTA/join the rebellion (90-100%)
**Best for:** Solution-Aware audiences who've had bad experiences. MOF.
**How to Execute:**
- IDENTIFY THE ENEMY: Name the "bad guy" — NOT a brand, but a CATEGORY experience. Schwartz: the enemy channels existing frustration. Enemies for Viasox: pharmacy compression (tourniquet feeling), tight elastic bands (mark-makers), ugly beige medical socks (dignity killers), "one-size-fits-all" lies.
- VALIDATE: Schwartz's intensification — make them FEEL the hatred. Use their exact review language: "I threw every pair away," "feels like a blood pressure cuff on my leg." The more specific the complaint, the more they nod along.
- REVEAL: Don't just say "here's something better" — position Viasox as the ANTI-enemy. If the enemy is tight elastic, the reveal is non-binding tops. If the enemy is beige medical, the reveal is 50+ patterns. The alternative must be the EXACT opposite of the enemy's flaw.
- PROVE: Schwartz's three dimensions — intensify desire (show the beautiful alternative), strengthen identification (people like them switched), build belief (data + testimony).
- CTA: Rebellion/community language: "Join 107K people who said 'never again' to [enemy]."

### 14. The Discovery Narrative
**Book Origin:** Hopkins (sample principle as narrative) + Schwartz (the gradualization)
**Structure:** Search phase (0-20%) → Discovery moment (20-45%) → First experience (45-70%) → Realization (70-90%) → Sharing CTA (90-100%)
**Best for:** Problem-Aware audiences. TOF and MOF. Taps into the "found treasure" narrative.
**How to Execute:**
- SEARCH: Hopkins' headline-as-selector — open with someone who is ACTIVELY searching. "I'd been searching for years for socks that actually fit." Mirror the Search Desperation pattern from the manifesto. Show the journey: pharmacies, Amazon, medical supply stores.
- DISCOVERY: The moment they find Viasox. Hopkins' sample principle — the discovery must feel like FINDING, not being sold to. "A friend mentioned them" or "I saw a review that sounded exactly like me." The discovery is the most important beat — it must feel organic.
- FIRST EXPERIENCE: Show the first use in sensory detail. Hopkins demands specifics: the feeling of pulling them on, the surprise at how easy it is, the first few hours of comfort. Use actual first-use descriptions from reviews.
- REALIZATION: The "this is it" moment. Not just "these are good socks" but "I finally found what I've been looking for." Reference the transformation journey — the shift from skepticism to belief.
- CTA: Sharing/community language: "I had to tell someone" or "Discover what [X]K people found."

### 15. The Professional Authority
**Book Origin:** Hopkins (credibility through specifics) + Bly (testimonial lead type)
**Structure:** Credential (0-10%) → Professional problem (10-35%) → Failed solutions (35-55%) → Discovery (55-75%) → Professional proof (75-90%) → Peer CTA (90-100%)
**Best for:** All awareness levels. Healthcare workers (3.5%), standing workers, teachers. MOF.
**How to Execute:**
- CREDENTIAL: Bly's testimonial lead — establish credibility instantly. "I've been a nurse for 22 years." "I teach 6th grade — that's 30,000 steps a day." Hopkins: the credential must be SPECIFIC (years, specialization, daily reality).
- PROFESSIONAL PROBLEM: The occupation-specific manifestation. For nurses: "My legs were so swollen after a 12-hour shift I couldn't get my shoes on." For teachers: "By 2pm I was teaching from my chair." Hopkins demands specifics over generalities.
- FAILED SOLUTIONS: What they tried that didn't work — pharmacy compression, cheap socks, prescription stockings. Bly: the failures establish the stakes and the viewer's belief that nothing works.
- DISCOVERY: How Viasox entered their professional life. Peer recommendation is strongest: "Another nurse on my unit recommended them."
- PROFESSIONAL PROOF: Results in professional context — "survived a double shift," "no swelling after 14 hours," "wore them for my entire 5-day work week." Hopkins: specific professional metrics sell.
- CTA: Peer recommendation frame: "If you're in healthcare, you need these" or "Ask any nurse who wears them."

### 16. The Demonstration Proof
**Book Origin:** Hopkins (the sample principle — let the product sell itself)
**Structure:** Challenge setup (0-15%) → Live demo (15-50%) → Feature callouts (50-70%) → Comparison (70-90%) → CTA (90-100%)
**Best for:** Product-Aware audiences. MOF and BOF. Visual media.
**How to Execute:**
- CHALLENGE: Set up a visual test. Hopkins' sample principle translated to video: "Watch what happens when..." or "Let me show you the difference." The challenge must be something the viewer cares about — putting them on (ease test), wearing all day (mark test), looking at them (style test).
- DEMO: Hopkins: let the product speak for itself. Show the product IN ACTION — the wide-mouth opening sliding on easily, the sock sitting comfortably without binding, the beautiful pattern being revealed. The camera must capture the specific PROOF of the claim. No narration needed over the visual — let the product demonstrate.
- FEATURE CALLOUTS: Brief, specific explanations of WHAT the viewer just saw and WHY it works. Schwartz's mechanization: "See how the non-binding top sits? That's why no marks." Keep each callout to ONE feature, ONE mechanism.
- COMPARISON: Side-by-side with the alternative — regular socks leaving marks, pharmacy compression being impossible to put on. Hopkins: comparison is one of the most powerful persuasion tools.
- CTA: Confidence language: "See for yourself" or "Try the test with your own pair."

### 17. The Objection Crusher
**Book Origin:** Bly (objection handling is the copywriter's primary job) + Schwartz (the Two Voices Framework)
**Structure:** State the objection (0-12%) → Acknowledge it (12-25%) → Counter with evidence (25-60%) → Testimonial support (60-80%) → Risk-free CTA (80-100%)
**Best for:** Product-Aware skeptics. BOF retargeting. Price objection, "just socks" objection.
**How to Execute:**
- STATE: Bly: the most powerful persuasion starts by VOICING the objection for them. "You're probably thinking: $30 for socks?" "I know — you've heard it all before." Schwartz's Protector Voice: speak AS the skeptic, not AT the skeptic.
- ACKNOWLEDGE: "I get it. That's exactly what I thought." Bly: never dismiss the objection. Validate it. Show you understand WHY they're skeptical. Reference the Cycle of False Hope — they've been burned before.
- COUNTER: Bly's proof cascade — stack evidence that dismantles the objection: (1) Specific data — "They last 3x longer than drugstore socks at twice the price — that's actually cheaper per wear." (2) Customer quote addressing the SAME objection — "I thought they were too expensive until I calculated cost per wear." (3) Risk reversal — "30-day guarantee means you literally can't lose."
- TESTIMONIAL: Find the review that PERFECTLY mirrors this objection and its resolution. Bly: nothing sells like a real person who had the same doubt.
- CTA: Risk-free, no-pressure: "Try one pair. If we're wrong, return them." Schwartz: speak to the Hope Voice — "What if this time is different?"

### 18. The Identity Alignment
**Book Origin:** Schwartz (identification dimension) + Neumeier (brand as identity signal)
**Structure:** Identity statement (0-12%) → Values connection (12-35%) → Current conflict (35-55%) → Alignment with Viasox (55-85%) → Belong CTA (85-100%)
**Best for:** All awareness levels. Most powerful for Unaware and Problem-Aware. TOF.
**How to Execute:**
- IDENTITY: Schwartz's identification — open with WHO the viewer IS, not what they need. "You're someone who refuses to slow down." "You've never let anything stop you from being yourself." Neumeier: brands are identity signals — people buy what aligns with who they BELIEVE they are.
- VALUES: Connect their identity to values Viasox shares. "You believe comfort shouldn't mean compromise." "You think looking good is non-negotiable, even in medical products." Schwartz: identification-based decisions are 5x stronger than feature-based.
- CONFLICT: Show how their current situation VIOLATES their identity. "But every morning, those ugly medical socks remind you that you've had to give something up." Neumeier: the conflict between identity and reality creates cognitive dissonance that demands resolution.
- ALIGNMENT: Viasox resolves the conflict — you can have medical support AND beautiful style AND easy comfort. Neumeier's charismatic brand test: make them feel nothing else comes close because nothing else honors their IDENTITY the way Viasox does.
- CTA: Belonging language: "Made for people who refuse to compromise" or "Join people who believe comfort and style aren't opposites."

### 19. The Reason-Why (Hopkins)
**Book Origin:** Hopkins (the core of Scientific Advertising — every claim must have a reason)
**Structure:** Bold claim (0-15%) → Reason why #1/mechanism (15-35%) → Reason why #2/evidence (35-55%) → Reason why #3/social proof (55-80%) → Therefore-CTA (80-100%)
**Best for:** Solution-Aware and Product-Aware audiences. MOF and BOF. Data-rich content.
**How to Execute:**
- BOLD CLAIM: Make a specific, testable claim. Hopkins: vague claims are ignored; specific claims demand attention. "107,993 customers agree: these are the most comfortable socks they've ever worn." "8.8% of all reviewers specifically mention zero sock marks."
- REASON #1 (MECHANISM): Hopkins: give the REASON WHY the claim is true. Explain the mechanism — non-binding bamboo fiber, graduated compression that adapts, wide-mouth opening engineered for easy application. The mechanism makes the claim believable.
- REASON #2 (EVIDENCE): Stack more reasons with data. Review frequencies, customer transformation metrics, comparison data. Hopkins: each specific fact doubles the persuasion. "29% mention comfort first. 12.3% call out the patterns. 8.8% highlight zero marks."
- REASON #3 (SOCIAL PROOF): Other people's reasons. Customer quotes that explain WHY they love it in their own words. Hopkins: a customer giving their reason is more powerful than a brand giving its reason.
- CTA: Logical conclusion language: "That's why 107K people switched" or "Now you know why. Try them."

### 20. The Gradualization (Schwartz)
**Book Origin:** Schwartz (awareness progression for Unaware audiences — the gradualization technique)
**Structure:** Relatable scenario/no product mention (0-30%) → Gradual awareness shift (30-50%) → Connection to solvable problem (50-70%) → Gentle solution introduction (70-85%) → Soft curiosity CTA (85-100%)
**Best for:** SPECIFICALLY for Unaware audiences. TOF only. The hardest audience requires the most patient framework.
**How to Execute:**
- SCENARIO: Schwartz's gradualization — start with a situation the viewer recognizes but hasn't connected to your product category. NO mention of socks, compression, marks, swelling, or ANY product language. Instead: "You know that feeling when you can't quite get comfortable?" or show a person going about their day with subtle signs of discomfort they've normalized.
- AWARENESS SHIFT: Schwartz: the critical moment where the viewer begins to realize "wait, this IS a problem I have." The shift must feel like THEIR realization, not your pitch. Use the manifesto's Hidden Suffering pattern — acknowledge something they've never put into words. "Nobody talks about the little battles that start your day."
- CONNECTION: Bridge their dawning awareness to the category of solution WITHOUT naming the specific product yet. "What if the problem isn't you — it's what you're wearing?" Schwartz: for Unaware audiences, the product must be EARNED through the awareness progression.
- INTRODUCTION: Finally, gently introduce Viasox — but still as INFORMATION, not a pitch. "107,000 people discovered the same thing." Schwartz: Unaware audiences need to feel like they're DISCOVERING, not being sold to.
- CTA: Maximum softness: "Learn more," "See what they found," "Discover." Schwartz: NEVER push a sale on an Unaware audience. Your only goal is to move them to Problem-Aware.`;
}

/* ------------------------------------------------------------------ */
/*  Hook Don'ts (from Manifesto 4.1)                                   */
/* ------------------------------------------------------------------ */

export function getHookDonts(): string {
  return `## HOOK DON'TS (from Manifesto 4.1 — April 2026 Update)

### UNIVERSAL DON'TS (all awareness levels)
- Generic greetings ("Hey there!", "Hi everyone!")
- "Just try..." (dismissive of their journey)
- Hyperbole ("The best socks ever!")
- Multiple problems in one hook (pick ONE)
- Corporate speak ("innovative solution", "revolutionary")
- Minimizing their struggle ("simple fix", "easy answer")

---

### ⚠️ UNAWARE-SPECIFIC DON'TS (the strictest rules — these kill the ad instantly)

Honoring Schwartz's Three Elimination Rules (Breakthrough Advertising, pp. 36-38). Any of these banned in ALL Unaware hooks:

1. **NO product name** — "Viasox" is banned in Beat 1. Product is reveal is Beat 5 only.
2. **NO category words** — "compression," "compression socks," "diabetic socks," "non-binding," "wide-mouth," "graduated compression" are all banned in the opening.
3. **NO problem/symptom labels** — "sock marks," "swelling," "edema," "neuropathy," "varicose," "circulation," "plantar fasciitis" all banned in Beats 1-2.
4. **NO solution/outcome words** — "relief," "solution," "finally," "fix," "cure," "help" — banned. They assume the viewer has classified this as a problem.
5. **NO price, offer, or CTA-to-purchase** — no dollar signs, no percentage off, no "sale," no "buy now," no "shop."
6. **NO "Tired of..." / "Struggling with..." / "Dealing with..." / "If you have..." / "Does your...?"** — all problem-aware openers dressed up. They all presume the viewer has classified the experience as a problem.
7. **NO statistical openers** — "Did you know..." / "68% of adults..." / "Studies show..." fail identification.
8. **NO review language pulled verbatim** — reviews are written by Most-Aware customers in post-education vocabulary. The Unaware viewer has not learned that vocabulary yet.
9. **NO medical diagnosis openers** — opening with "neuropathy," "edema," "varicose veins," "plantar fasciitis," or "diabetes" is banned even when targeting those angles. The CONDITION is shown visually / through sensory scenes; the WORD appears only in Beat 3 Mechanism at the earliest (and often not at all).

---

### PROBLEM-AWARE / SOLUTION-AWARE / PRODUCT-AWARE DON'TS (Upper-MOF and below)
- Product name before problem (Problem-Aware)
- Benefits before pain acknowledgment (Problem-Aware)
- Medical claims without context
- Vague pain points ("discomfort" — say WHAT discomfort)
- Assuming they know what Viasox is (cold audiences)
- Complex medical terminology (unless targeting medical professionals)`;
}

/* ------------------------------------------------------------------ */
/*  Awareness Messaging Techniques (from Manifesto 4.4)                */
/* ------------------------------------------------------------------ */

export function getAwarenessMessagingTechniques(): string {
  return `## ADVANCED AWARENESS-LEVEL TECHNIQUES

## ⚠️ UNAWARE MESSAGING — APRIL 2026 MANIFESTO UPDATE

**STRATEGIC CONTEXT:**
Unaware is now the DEFAULT awareness level for virtually every Viasox TOF ad. Problem-Aware has been re-classified as Upper-MOF. This is a major strategic shift grounded in 89,042 analyzed 2025 reviews + Schwartz's Breakthrough Advertising, Hopkins' Scientific Advertising, Bly's Copywriter's Handbook, and Neumeier's Brand Gap.

**THE BIG GUARDRAIL — WHY WE DON'T PULL UNAWARE HOOKS FROM REVIEW DATA:**
Reviews are written AFTER the customer has been educated. By the time someone writes "these socks changed my life" or "no more sock marks!" they are Most Aware — they have the vocabulary to describe their experience because they've already learned the category exists. An Unaware viewer does NOT have that vocabulary. They live in the experience without having classified it. When we pull a review phrase verbatim into an Unaware hook, we're speaking in a language the viewer hasn't learned yet — they scroll past because nothing registers. Use reviews to understand the REALITY of the experience; then write a NEW hook that describes that reality in language the viewer uses BEFORE they find us.

---

### THE THREE UNAWARE SUB-PERSONAS

Every Unaware ad targets ONE of these three sub-personas. Do not try to serve all three.

**1. The Normalizer**
Has real discomfort — swelling, achy legs, sock marks, fatigue — and has attributed it to something other than socks:
- "My legs just do that now."
- "I'm on my feet all day, what do you expect?"
- "Everyone my age has this."
- "It's just the weather / my shoes / getting older."
Key insight: they're not looking for compression socks. They don't think socks are the problem. The ad must first BREAK the attribution, then show the real cause.

**2. The Diagnosed Non-Searcher**
Has a medical condition (diabetes, neuropathy, varicose veins, lymphedema) and may even own pharmacy compression socks — but has never connected their daily frustrations to a BETTER category of sock. They think their discomfort is part of the condition, not something fixable. Key insight: they've written off "compression socks" as a category. The ad must reframe the daily friction as solvable and position Viasox as a category upgrade — not as "compression socks" (they've already decided those don't work).

**3. The Incidental Sufferer**
Their job or lifestyle produces the symptoms and they've written it off as part of the territory: nurses, teachers, warehouse workers, hairstylists, servers, factory workers, retail staff.
- "It's just part of the job."
- "Everyone at my work deals with this."
Key insight: their identity (work) is tangled with their acceptance of the pain. The ad must reframe the job pain as NOT inevitable — and position a specific, non-clinical solution that fits their work identity.

---

### SCHWARTZ'S THREE ELIMINATION RULES FOR UNAWARE (Breakthrough Advertising, pp. 36-38)

Eugene Schwartz spells out three things an Unaware headline CANNOT DO. We enforce all three as hard rules in every Unaware hook.

**Rule 1 — NO PRICE:**
"You cannot mention the price, because your prospect does not yet see the value of that product."
Any price, offer, or "% off" in an Unaware opening destroys the ad. The viewer has no frame for what the thing is worth.

**Rule 2 — NO PRODUCT NAME:**
"You cannot mention the product, because your prospect does not yet know the product exists."
Brand name (Viasox), category name (compression socks, diabetic socks), and specific mechanism (graduated compression, wide-mouth tops) are all forbidden in the opening.

**Rule 3 — NO DIRECT PROBLEM OR SOLUTION STATEMENT:**
"You cannot even mention the need or desire it satisfies, because your prospect is not yet aware of that need or desire."
This is the rule most commonly broken. "Tired of sock marks?" / "Dealing with swelling?" are dead on arrival.

**What you CAN do instead:** Enter through an existing state the viewer ALREADY recognizes — a scene, a time of day, a mundane moment, a micro-behavior, a wrong attribution. The awareness must be CREATED, not referenced.

---

### THE THREE UNAWARE TECHNIQUES

**Technique 1 — Scene Identification**
Open with a specific, sensory-rich scene from the viewer's daily life that has NO product context. The scene IS the hook.
- Normalizer: "It's 6:47 AM. You're sitting on the edge of the bed looking at your feet. Same as every morning."
- Incidental Sufferer: "The last hour of your shift you stop standing with both feet on the ground. You shift weight. You lean on the counter."
- Diagnosed Non-Searcher: "You have three pairs of socks you like. Not because they're comfortable. Because they're the ones that leave the least marks."

**Technique 2 — The Mundane Reframe**
Name a small daily behavior the viewer does without thinking, then reveal it as a coping behavior for something they haven't named.
- "The reason you take your shoes off the minute you get home isn't just because it feels good."
- "You cross and uncross your ankles without noticing. It's a signal your nervous system is sending."
- "Every morning you roll your socks instead of pulling them. When did that start?"

**Technique 3 — The False Cause Flip**
Name the WRONG attribution the viewer has already settled on, then flip it to the real cause.
- "You think it's your shoes. You've bought three pairs this year trying to fix it. It's not your shoes."
- "You blame your age. You blame the weather. You've never blamed the thing touching your skin for 16 hours a day."
- "You assumed it was circulation problems. Your mom had it. You thought it was genetic."

---

### THE 5-BEAT UNAWARE BODY STRUCTURE (mandatory skeleton)

Every Unaware script maps to these 5 beats:

1. **IDENTIFICATION (~0-25%)** — One of the three techniques. Zero product, zero category, zero symptom label. Pure scene, behavior, or wrong attribution. Schwartz's Three Elimination Rules all honored.

2. **REFRAME (~25-45%)** — The "wait..." moment. The normalized experience is named as NOT normal. "That isn't just getting older." "That isn't part of the job."

3. **MECHANISM (~45-65%)** — Short plain-English explanation of WHY. Not a medical lecture. "What you're putting on your legs every morning is cutting off circulation slightly. Not enough to alarm you. Just enough to make every hour of your day a little harder."

4. **CATEGORY REVEAL (~65-85%)** — There is a different CATEGORY of sock. Not Viasox yet. "Socks designed for legs that change shape through the day exist. Most people don't know they're out there."

5. **PRODUCT REVEAL + SOFT CTA (~85-100%)** — Viasox is named, but only with a curiosity-driving CTA. No price, no offer, no direct buy. "See what 107K people found." / "Learn more." / "See if it's for you."

---

### UNAWARE MESSAGING FRAMEWORK BY SUB-PERSONA

| Sub-Persona | Opening Scene Examples | Reframe Examples | Mechanism Hook |
|---|---|---|---|
| **Normalizer** | Morning sock routine, evening foot-rub, couch leg-prop | "That isn't your age. That's a coping behavior." | "Your legs have been sending you the same signal all day." |
| **Diagnosed Non-Searcher** | Same pharmacy sock for years, drawer of 'failed' socks, doctor visit | "You've been told compression is compression. It isn't." | "There's a category of sock that doesn't exist in your pharmacy." |
| **Incidental Sufferer** | Last hour of shift, parking lot walk to car, taking shoes off in the car | "That isn't 'part of the job.' That's a fixable daily tax." | "Nurses who wear the right sock clock out feeling like they clocked in." |

---

### UNAWARE POWER WORDS (use naturally):
"you," "your," "every night," "at 3pm," "on your feet," "started," "stopped," "notice," "noticed," "just," "always," "never," "something," "that feeling when," "you know that moment when"

### UNAWARE AVOID WORDS (BANNED in opening):
"compression," "diabetic," "neuropathy," "circulation," "swelling," "edema," "varicose," "Viasox," "sock marks," "sock line," "relief," "solution," "finally," "sale," "offer," "discount," "buy," "shop," "cart," "limited time"

---

### UNAWARE DOs
- DO enter through a scene, behavior, or attribution the viewer already holds
- DO use specific times ("6:47 AM," "3pm," "by lunch"), specific places ("parking lot," "edge of the bed"), specific micro-actions
- DO target one sub-persona per ad and write to them specifically
- DO let the viewer see themselves BEFORE they know what's being advertised
- DO honor all three of Schwartz's Elimination Rules in Beat 1
- DO earn the right to name the product through the 5-beat structure
- DO use a soft, curiosity-driving CTA (the CTA moves them to Problem-Aware, not to checkout)

### UNAWARE DON'Ts (hard bans)
- ❌ Don't lead with price, product, or problem — Schwartz's Three Rules
- ❌ Don't use "Tired of..." / "Struggling with..." / "Dealing with..." / "If you have..."
- ❌ Don't lead with a statistic ("68% of adults...") or "Did you know..."
- ❌ Don't pull hook language verbatim from reviews (reviews are post-education vocabulary)
- ❌ Don't use medical diagnosis words (neuropathy, edema, varicose, diabetic) in Beat 1-2
- ❌ Don't name the product until Beat 5
- ❌ Don't include offers, discounts, or direct "Shop now" CTAs
- ❌ Don't be vague to avoid mentioning the problem — be SPECIFIC about scenes and behaviors instead

---

## ADVANCED AWARENESS-LEVEL TECHNIQUES (Upper-MOF / Problem-Aware and later)

### Mirror Language Technique (Problem-Aware / Upper-MOF)
Use their EXACT words from reviews, not clinical equivalents:
- Say "cutting off my blood flow" (NOT "circulation issues")
- Say "legs swollen like balloons" (NOT "edema")
- Say "the daily battle with my socks" (NOT "difficulty dressing")
- Say "given up" (NOT "resigned to the issue")
⚠️ NOTE: Mirror Language is a POST-education technique. It works at Problem-Aware and later, but NOT at Unaware — an Unaware viewer does not yet have this vocabulary.

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
- Unaware: IDENTIFICATION (70%) + Reframe/Mechanism (30%) — NO product, NO problem, NO price
- Problem-Aware: EMPATHY (70%) + Information (30%)
- Solution-Aware: PROOF (70%) + Empathy (30%)
- Product-Aware: SPECIFICS (70%) + Urgency (30%)
- Most-Aware: CELEBRATION (70%) + Expansion (30%)

### Power Words by Awareness Level
- **Unaware:** "you," "your," "just," "always," "started," "stopped," "notice," "every night," "at 3pm" | AVOID: all product/problem/solution words, all review language
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

/* ------------------------------------------------------------------ */
/*  5 Messaging Pillars (from Insiders Intelligence, March 2026)       */
/* ------------------------------------------------------------------ */

export function getMessagingPillars(): string {
  return `## THE 5 MESSAGING PILLARS — IMMOVABLE RULES FOR ALL CREATIVE
Source: Facebook Insiders Intelligence (124 community comments, behavioral coding & emotional mapping), cross-validated with 107,993 reviews. These pillars define WHAT CAN BE SAID across all Viasox creative. They are not copy — they are the immovable rules that all copy must align to. When pillars conflict, follow the numbered priority order.

### PILLAR 1 — Ease Is the Win
Central belief: Life is already hard. Getting dressed shouldn't be.
What this allows: Talking about effort reduction. Naming struggle without dramatizing. Positioning ease as meaningful, not trivial.
What it is NOT: Laziness framing. Convenience fluff. "Effortless lifestyle" clichés.
System truth: Ease is not a feature. It is the emotional payoff.

### PILLAR 2 — You're Not the Problem
This is one of the strongest emotional levers in the system.
What this allows: Reframing self-blame. Validating lived experience. Quietly assigning fault to bad design.
What it is NOT: Fix-your-body narratives. Before/after body correction framing. Hustle or "push through" language.
System truth: Good products don't correct people. They correct bad assumptions.

### PILLAR 3 — Relief Before Everything
Relief comes before joy, style, or loyalty.
What this allows: Leading with pain resolution. Slowing down the promise. Letting customers arrive at joy themselves.
What it is NOT: Aspirational-first messaging. Overpromising transformation. Skipping emotional steps.
System truth: If relief isn't believable, nothing else matters.

### PILLAR 4 — Quiet Confidence
This brand never needs to shout.
What this allows: Calm certainty. "It just works" energy. Understated authority.
What it is NOT: Performance bravado. Aggressive superiority claims. Tech-heavy flexing.
System truth: Confidence is felt most when it's not forced.

### PILLAR 5 — Normal Is the Goal
This is subtle and powerful.
What this allows: Positioning normalcy as aspirational. Celebrating the absence of problems. Making reliability desirable.
What it is NOT: Extreme transformation stories. Peak-performance narratives. "Next level" framing.
System truth: For this audience, normal life is the luxury.

### PILLAR PRIORITY RULE
If pillars conflict in any piece of creative, ALWAYS prioritize in this order: Ease → Relief → Normalcy → Independence → Joy. Never reverse this order.`;
}

/* ------------------------------------------------------------------ */
/*  Emotional Architecture & Behavioral Laws                           */
/* ------------------------------------------------------------------ */

export function getEmotionalArchitecture(): string {
  return `## EMOTIONAL ARCHITECTURE — THE VIASOX EMOTIONAL HIERARCHY
Source: Facebook Insiders Intelligence, validated against 107,993 reviews. This is the most important behavioral finding. It has a HARD RULE attached.

Customers move through emotions in a PREDICTABLE, SEQUENTIAL ORDER:
**Struggle → Relief → Normalcy → Independence → Trust → Joy → Advocacy**

### How Each Stage Works
- **Struggle** — Entry point. Customers arrive in pain, frustration, or defeat. Creative must ACKNOWLEDGE the struggle without dramatizing beyond what customers say.
- **Relief** — The dominant emotional driver across all personas. Relief is NOT framed as medical. It is framed as ABSENCE OF FRICTION. "Finally" is one of the most powerful words in the dataset. Relief is quiet, not dramatic.
- **Normalcy** — The emotional destination most customers didn't realize they were missing. "I feel normal" and "this is how it should be." For this audience, NORMAL LIFE IS THE LUXURY — not transformation, not peak performance.
- **Independence** — Emotionally sharper than normalcy, especially for aging or mobility-limited users. Being able to dress without help restores DIGNITY. The win is autonomy, not the sock.
- **Trust** — Built post-purchase, never before. Trust that the product won't hurt, will fit the same tomorrow, that they don't need to keep searching.
- **Joy** — Appears ONLY after relief is secured. Patterns, colors, collection behavior, gifting. Joy is ALLOWED because pain is gone — it is never promised upfront.
- **Advocacy** — Users self-initiate promotion. They recommend without hype, framing the product as "the answer," not a brand.

### THE HIERARCHY RULE
If creative messaging conflicts on emotional tone, ALWAYS prioritize: Ease → Relief → Normalcy → Independence → Joy.
**Never reverse this order.** Leading with joy before relief is established feels hollow. Leading with independence before acknowledging struggle feels tone-deaf.

### THE IDENTITY SHIFT — "You're Not the Problem"
One of the strongest emotional levers. Customers undergo a specific identity reframe after experiencing relief.
- Before Viasox: "My legs are the problem" / "This is just how my body is now" / "I have to work around this" / "I need help with small things"
- After Viasox: "The socks were the problem" / "I wasn't difficult — the product was wrong" / "This is manageable" / "I can do this myself"
Customers feel VALIDATED, NOT FIXED. Good products don't correct people — they correct bad assumptions about what people need.
- In TOF ads: Quietly assign fault to "regular socks" or "other brands," never to the customer's body
- In testimonials: Let customers voice the shift themselves ("I thought my legs were the problem...")
- In copy: Avoid any framing that implies the customer needs to be fixed, improved, or empowered. They need to be UNDERSTOOD
- NEVER use: "Fix your legs," "Don't let pain stop you," "Power through discomfort" — pain ALREADY stopped them, that's the point

### EMOTIONAL SAFETY SIGNAL
Users feel safe trying this product, safe wearing it all day, safe recommending it.
Safety here is EMOTIONAL, not clinical. It means: "This won't hurt me. This won't make things worse. This won't embarrass me."
This is why Viasox's quiet, gentle tone works. Aggressive marketing triggers the opposite of safety — it reminds customers of all the products that overpromised and hurt them.`;
}

/* ------------------------------------------------------------------ */
/*  10 Behavioral Codes                                                */
/* ------------------------------------------------------------------ */

export function getBehavioralCodes(): string {
  return `## 10 BEHAVIORAL CODES — REUSABLE STRATEGIC TRUTHS
Source: Insiders Intelligence behavioral coding, validated against 107,993 reviews. Each code is a system-level principle that applies across products, channels, and campaigns.

### Code 1: Friction Elimination Restores Normalcy
Customers describe a before-state of friction that shaped daily behavior — avoiding socks, delaying getting dressed, needing help, choosing shoes based on sock tolerance. After Viasox, socks fade into the background. The product wins by DISAPPEARING FROM CONSCIOUS THOUGHT.
**Use when:** Structuring before/after narratives. The "after" is not dramatic — it's invisible.

### Code 2: Autonomy Is the Emotional Win, Not the Sock
Explicit mentions of "I can do this myself" are disproportionately emotional for a product category. Relief tied to not needing help carries more weight than any feature.
**Use when:** Writing caregiver or independence-angle creative. The hero moment is doing it alone.

### Code 3: Low-Effort Products Outperform High-Performance Ones When Mobility Is Limited
"Easy to put on" appears more than medical or compression terms. Success is defined by lack of struggle, not intensity of support.
**Use when:** Deciding whether to lead with ease or compression specs. For this audience, ease wins.

### Code 4: Trust Converts Trial Into Routine
Once trust is established, usage becomes habitual. Customers transition from "trying" to "wear every day." Extended wear contexts emerge (all day, night, travel).
**Use when:** Planning retention or reorder messaging. Trust language beats promo language.

### Code 5: Relief Products Collapse Choice Sets
Customers do not layer or rotate — they REPLACE. They stop buying regular socks, donate old ones, re-purchase the same product, and reduce experimentation.
**Use when:** Framing value props. The promise isn't "add this to your collection" — it's "replace everything else."

### Code 6: Once Pain Is Solved, Joy Is Allowed
After functional trust is established, expressive behavior emerges — buying multiple pairs, choosing patterns, collecting, gifting.
**Use when:** Planning creative sequencing. Joy-based creative (patterns, colors, fun) works for retargeting and retention, NOT for cold prospecting.

### Code 7: Good Products Rewrite Self-Narratives
Customers reframe self-blame after relief. Before: assumed body was the problem. After: reassign blame to product design and feel validated.
**Use when:** Writing testimonial angles or "realization" hooks. The most powerful moment is when the customer realizes it was never their fault.

### Code 8: High Disappointment History Amplifies Loyalty When Expectations Are Exceeded
High skepticism before purchase converts to high loyalty after. "Tried everything" + "Didn't expect much" → strong post-purchase certainty.
**Use when:** Writing skeptic-to-believer narratives. The deeper the doubt, the stronger the conversion story.

### Code 9: Relief Creates Loss Aversion (Desire Protection)
Once relief is achieved, users become PROTECTIVE of it. They avoid new brands, buy extras "just in case," and recommend only what they trust.
**Use when:** Planning promo strategy. Discounts are not about excitement — they are about SECURING CONTINUITY. Users buy more to lock in relief, avoid running out, and protect their baseline comfort. "Stock up on the comfort you count on" beats "Exciting new deals!"

### Code 10: Relief Products Move Users From Coping Mode to Living Mode
Customers stop thinking short-term. "Every day," "from now on," "never going back" signal a permanent shift from managing a problem to living without one.
**Use when:** Writing long-term value messaging. The product doesn't solve a moment — it changes a default.`;
}

/* ------------------------------------------------------------------ */
/*  Vocabulary Protection Rules                                        */
/* ------------------------------------------------------------------ */

export function getVocabularyProtectionRules(): string {
  return `## VOCABULARY PROTECTION RULES — LANGUAGE THAT CONVERTS
Source: Customer vocabulary bank (124 community comments + 107,993 reviews). Customer words > brand words > marketing words.

### CORE LOCKED LANGUAGE — Use These Exact Words
These appear repeatedly in customer feedback and should NEVER be replaced:
easy to put on, easy, no struggle, no pain, doesn't hurt, not tight, not restrictive, soft, stretchy, comfortable, gentle, goes on easily, slips on, doesn't dig in, doesn't cut off circulation, doesn't leave marks, no sock lines

### VOCABULARY SUBSTITUTION RULES
- Do NOT replace "easy" with "effortless" — "Easy" is their word. "Effortless" is a copywriter's word.
- Do NOT replace "comfortable" with "luxurious" — Luxury implies aspiration. Comfort implies relief. Different emotional registers.
- Do NOT over-medicalize relief — Customers say "my legs feel better," not "improved venous return."
- Do NOT dramatize pain beyond customer language — Customers describe struggle plainly. Escalating into dramatic suffering feels exploitative and breaks trust.
- Do NOT reframe independence as "empowerment" — Customers frame it as regaining normal life, not being empowered. "Empowerment" is a brand word, not a customer word.
- Clarity beats cleverness. Every time.

### WORDS CUSTOMERS RARELY USE — Use Cautiously or Avoid
performance, athletic, high-compression, medical-grade, power, endurance, effortless (unless quoting), luxurious, empowerment, next level, game-changing (use sparingly — customers say "game changer" but it's earned, not promised)

### RELIEF POWER WORDS — Use Liberally
- "finally" — THE most powerful word in the entire dataset. Signals the end of a long search.
- "at last," "immediate relief," "huge difference," "so much better," "problem solved"
- "wish I found these sooner," "never going back," "won't buy anything else," "only socks I wear now"

### COMPARISON LANGUAGE CUSTOMERS USE
Customers compare EXPERIENCES, not specs:
"unlike other socks," "not like regular socks," "better than compression socks I tried," "nothing else worked," "tried everything before this," "these are different," "way better than Amazon ones"

### COPY AUDIT FRAMEWORK
1. Read the copy out loud
2. Ask: "Would a customer say this in a Facebook comment?"
3. If not, find the customer-language equivalent
4. If no equivalent exists, question whether the message belongs at all`;
}

/* ------------------------------------------------------------------ */
/*  Cross-Product Emotional System                                     */
/* ------------------------------------------------------------------ */

export function getCrossProductEmotionalSystem(): string {
  return `## CROSS-PRODUCT EMOTIONAL SYSTEM
Source: Insiders Intelligence, validated against 107,993 reviews.

### How the Products Connect Emotionally
- **EasyStretch** — Earns trust. Rewrites sock expectations. This is where the brand relationship begins. Emotional job: remove friction, restore normalcy, rebuild trust with socks as a category.
- **Compression** — Extends trust into support. Maintains relief across needs. Emotional job: provide stability without reintroducing pain. Protects RELIEF CONTINUITY.
- **Ankle Compression** — Lowers the barrier. Introduces support gently. Emotional job: make compression approachable for people who don't think compression is for them. Widens the TRUST FUNNEL.

### The Upgrade Insight
PEOPLE DON'T UPGRADE FOR PERFORMANCE. THEY UPGRADE TO PROTECT RELIEF.
When a customer moves from EasyStretch to Compression, or tries Ankle alongside regulars, it's not because they want "more." It's because they want to EXTEND AND PROTECT the relief they already have. This distinction matters for cross-sell messaging — NEVER frame it as an upgrade. Frame it as expanding what already works.

### Desire Protection Behavior
Once relief is achieved, customers become PROTECTIVE of it:
- They avoid trying new brands
- They buy extras "just in case"
- They recommend only what they trust
- They stock up during sales to secure continuity

What this means for promos: Discounts are not about excitement. They are about SECURING CONTINUITY. "Stock up on the comfort you count on" beats "Exciting new deals!"

### One-Line Product Summaries
- EasyStretch: Removes the fight
- Compression: Maintains relief
- Ankle Compression: Makes support approachable`;
}

/* ------------------------------------------------------------------ */
/*  Deep Customer Voice Bank                                           */
/* ------------------------------------------------------------------ */

export function getCustomerVoiceBank(): string {
  return `## DEEP CUSTOMER VOICE BANK — REAL QUOTES BY EMOTIONAL STAGE
These are REAL customer quotes organized by psychological pattern. Use these as creative fuel — the language, the specificity, the emotion. Never use verbatim in ads, but use as the emotional register to match.

### PHYSICAL PAIN VOICES
**Sock Marks (8.8%, 9,485 reviews):**
- "Deep red rings around my calves"
- "Marks that last for hours after taking them off"
- "Indentations so deep you can feel the grooves"
- "Look like someone tied rubber bands around my legs"
Hidden psychology: Sock marks represent visible evidence of a failing body — a daily reminder that even basic clothing has become an enemy.

**Binding & Constriction (5.3%, 5,724 reviews):**
- "Feel like tourniquets"
- "Cutting off my circulation"
- "Squeezing the life out of me"
- "Can't wait to rip them off"

**Swelling & Edema (6.6%, 7,128 reviews):**
- "Legs swell up like balloons"
- "Can't fit in my shoes by evening"
- "Ankles disappear into cankles"
- "The swelling went down by MORE THAN HALF the first day" (transformation metric — USE IN ADS)
Product connection: ACS customers mention swelling in 12.0% of reviews — THE pain point for ankle compression.

**The Daily Dressing Struggle (5-11.4%, MAJOR UPDATE):**
- "Takes me 20 minutes to put on socks"
- "Need my husband to help me"
- "Gave up wearing compression socks"
- "I simply could not get normal socks on due to hip issues"
- "Finally, a pair I can put on without struggling"
CRITICAL: This was SEVERELY underestimated. "Easy to put on" is a TOP 3 benefit, especially for Compression (11.4%).

### EMOTIONAL PAIN VOICES
**The Morning Struggle:**
- "Some mornings I just wear slippers all day because I can't face the struggle"
- "I have to psyche myself up for 10 minutes before attempting"
- "Start every day already defeated and exhausted"

**The Afternoon Countdown:**
- "Watch the clock from 2 PM onward — can't focus on anything else"
- "Have considered leaving work early just to take them off"
- "Keep spare socks in my desk for when I can't stand it anymore"
- "Decline after-work invitations because I need to get home to my feet"

**The Closet Graveyard (3.1%, 689 reviews):**
- "Counted 23 pairs of failed socks — over $500 wasted"
- "Feel stupid every time I open that drawer"
- "Keep them as reminder not to believe marketing lies"
- "It's proof that my body is the problem, not the socks"

**The "Never Again" Breaking Point:**
- "When the ER nurse had to cut my socks off — circulation completely cut"
- "Morning I missed my daughter's recital because I couldn't get dressed"
- "When my feet turned purple and I thought I was having a medical emergency"
- "The business trip where I had to ask a colleague for help"

**Search Desperation:**
- "This is attempt #47 — yes, I keep count"
- "If these don't work, I'm done trying"
- "Spent my entire tax refund on different socks"
- 3 reviews explicitly mention "last try," 1 mentions completely "giving up"

### SOCIAL PAIN VOICES
**The Burden Fear (427 reviews, 12.6%):**
- "Don't want to ask for help"
- "Hate that my kids see me struggle"
- "Wife has to help me dress"
Gift-giving pattern (100 reviews, 3.7%) reveals widespread family involvement in sock struggles.

**The Shrinking Social Circle (287 reviews):**
- "Don't go out as much"
- "Skip family gatherings"
- "Gave up walking group"
- "The ankle socks in black and navy... easy to wear around the house and wear out when running errands" — reveals how limited activities have become when basic errands are noteworthy accomplishments.

### TRANSFORMATION VOICES
**The Revelation Moment:**
- "I couldn't believe the difference they made. Sure keeps my swelling down in feet and ankles. Love them, already ordered another pair and one for my husband!"
- "It is exciting to do what the doctors have wanted me to do and it is no longer a struggle as before. I couldn't be happier."
- "I was shocked when they actually worked"

**The Skeptic-to-Believer Arc (624 reviews with skepticism, avg 4.6 stars):**
1. "I didn't believe it either"
2. "I almost didn't try"
3. "Something made me order"
4. "I was shocked when..."
5. "Now I tell everyone"

**The Language of Liberation:**
- Temporal markers: "Now I can..." / "Finally able to..." / "For the first time in years..." / "No longer have to..."
- Capability: "I can walk again" / "I can work all day" / "I can travel" / "I can keep up"
- Emotional: "I love my Viasox" (12,156 mentions, 31.8%) / "Game changer" (1,793 uses, 1.66%) / "Worth every penny"
- Specific metrics (GOLD FOR ADS): "After 1 week my feet hurt about 90% less" / "The swelling went down by MORE THAN HALF the first day" / "No swelling at end of shift"

### SUCCESS INDICATORS (from 107,993 reviews)
1. Multiple purchases — 19.5% become repeat customers
2. Gift giving — 2-6.7% buy for others (sharing liberation)
3. Active recommendation — "Telling all my friends and family"
4. Collector behavior — "I bought so many I'm beginning to worry about my sanity" (15+ pairs)
5. Regret language — "Wish I had bought more" (0.54%) — signals strong reorder intent`;
}

/* ------------------------------------------------------------------ */
/*  Emotional Language Boundaries                                      */
/* ------------------------------------------------------------------ */

export function getEmotionalLanguageBoundaries(): string {
  return `## EMOTIONAL LANGUAGE BOUNDARIES

### What Does NOT Resonate With This Audience
- Aggressive performance framing
- "Power through it" language
- Over-medicalization
- Minimizing struggle ("it's just socks")
- Hustle or grit narratives
- "Empowerment" buzzwords
- Extreme transformation stories
- Peak-performance narratives
- "Next level" framing

### What DOES Resonate
- Gentleness
- Understanding
- Quiet confidence
- "You're not the problem" framing
- Calm certainty
- "It just works" energy
- Celebrating the absence of problems
- Making reliability desirable

### The Brand Emotional Identity
This brand represents:
- Consideration over correction
- Ease over force
- Thoughtfulness over toughness
- Humanity over performance
Viasox does not "push people through pain." It removes the need for pain entirely.

### What We Are vs. What We're Not
✅ A comfort-first brand that happens to help medical issues
✅ A community of people who "get it"
✅ An inclusive solution for multiple leg/foot issues
✅ Selling daily relief and dignity
✅ Using empathy and humor to connect
❌ Not a medical device company
❌ Not a fashion brand
❌ Not a one-size-fits-all solution
❌ Not selling transformation
❌ Not using fear to sell`;
}

/* ------------------------------------------------------------------ */
/*  Voice & Tone Examples — "Write Like This / Not Like This"          */
/* ------------------------------------------------------------------ */

export function getVoiceToneExamples(): string {
  return `## VOICE & TONE — WORKED EXAMPLES

These are calibration examples. Every script, hook, and concept generated must match the quality and tone of the GOOD examples. If it reads like a BAD example, rewrite it.

### HOOKS — GOOD vs. BAD

**GOOD Hook (Problem Aware / Neuropathy):**
"I used to dread the walk from my bed to the bathroom. Not because of the distance — because I couldn't feel the floor beneath me."
WHY IT WORKS: Sensory detail. Specific moment. The reader feels the scene. No product mention. Emotional entry through loss of feeling, not "foot pain."

**BAD Hook (same brief, common AI mistake):**
"Are you tired of dealing with neuropathy pain in your feet? Discover the socks that 107,000 customers swear by!"
WHY IT FAILS: Generic question hook. "Tired of dealing with" is dead language. Leads with product category. Sounds like every sock ad. No sensory detail, no scene, no emotion.

**GOOD Hook (Unaware / Swelling — Scene Identification technique):**
"By 3pm, she's already thinking about getting home — not because she's tired of work, but because her shoes stopped fitting two hours ago."
WHY IT WORKS: Third-person Scene Identification. Specific time (3pm). Relatable micro-behavior. No product, no medical language, no problem label. Honors all three of Schwartz's Elimination Rules. Targets the Incidental Sufferer sub-persona. The viewer self-selects ("that's me") through the scene, not through a symptom.

**GOOD Hook (Unaware / Swelling — False Cause Flip technique):**
"You think it's your shoes. You've bought three pairs this year trying to fix it. It's not your shoes."
WHY IT WORKS: Names the wrong attribution the viewer has already made. Creates cognitive dissonance without naming the problem. Perfect for the Normalizer sub-persona. No product, no symptom label.

**GOOD Hook (Unaware / Neuropathy — Mundane Reframe technique):**
"You roll your socks off at the end of the day instead of pulling them. You don't remember when you started doing that."
WHY IT WORKS: Mundane Reframe on a micro-behavior the viewer is physically doing. Creates self-recognition without naming neuropathy, pain, or socks as a problem. No product. No diagnosis.

**BAD Hook (same brief, common AI mistake — violates Schwartz Rule 3):**
"Did you know that leg swelling affects millions of Americans? There's finally a solution that actually works."
WHY IT FAILS: "Did you know" is the weakest hook formula. Leading with statistics on an Unaware audience. "Finally a solution" is a review-language cliché. Sounds like a pharma commercial. Names the problem ("leg swelling") — banned in Unaware Beat 1. Mentions "solution" — banned in Unaware Beat 1.

**BAD Hook (same brief, another common AI mistake — violates Schwartz Rule 2):**
"Tired of sock marks ruining your day? Our non-binding compression socks are the answer."
WHY IT FAILS: "Tired of..." is a Problem-Aware opener — it assumes the viewer has classified this as a problem. "Sock marks" is a symptom label (banned in Unaware Beat 1). "Non-binding compression socks" is a category reveal (banned in Beat 1 — goes in Beat 4). "The answer" is a solution statement (banned in Beat 1).

**BAD Hook (another AI mistake — pulling review language verbatim):**
"These socks changed my life. The swelling went down by more than half the first day!"
WHY IT FAILS: This is actual review language — written by a Most-Aware customer. An Unaware viewer has no frame for "changed my life" in the context of socks. "Swelling" is a banned symptom label. This hook works at Product-Aware/Most-Aware as social proof, but it's dead at Unaware.

**GOOD Hook (Problem Aware / Sock Marks):**
"Those lines were still there at dinner. Eight hours after I took my socks off — still there. Red. Deep. Like my legs were branded."
WHY IT WORKS: Visceral. Specific timeframe (8 hours). The word "branded" creates a powerful image. The reader who has this problem will feel SEEN.

**BAD Hook (same brief):**
"Sock marks can be painful and embarrassing. But they don't have to be — not anymore."
WHY IT FAILS: Tells instead of shows. "Painful and embarrassing" is generic. "Not anymore" is an overused copywriting crutch.

### BODY COPY — GOOD vs. BAD

**GOOD Body (Confession Arc / EasyStretch):**
"I have a drawer full of socks I can't wear. Some cost $40. Some were gifts. Every single one leaves marks so deep my husband thinks I'm having a reaction. Last month I counted — eleven pairs, bought over three years. Each one I bought thinking 'this will be different.' I was running out of options, and honestly, I was running out of hope."
WHY IT WORKS: Uses the "closet graveyard" pattern from review data. Specific details ($40, eleven pairs, three years). The husband detail adds social dimension. "Running out of hope" — earned emotional weight, not stated emotion.

**BAD Body (same concept):**
"If you're like thousands of other women, you've struggled to find comfortable socks that don't leave marks. Regular socks just don't cut it when you have swelling or circulation issues. You've probably tried many different brands without success."
WHY IT FAILS: "If you're like thousands" — generic targeting. "Regular socks just don't cut it" — cliché. "You've probably tried" — assumes instead of showing. No sensory detail. No story. Could be any product.

**GOOD Body (Permission Narrative / Compression):**
"Nobody told me I was allowed to have compression socks that looked like this. For six years, I hid my legs. Beige tubes under long pants in August. My daughter said I looked like I was in a hospital and I just… stopped going out. Then my nurse friend showed me her pair. Purple with little flowers. I said 'Those are compression socks?' She laughed. 'Girl, I wear these on 14-hour shifts.'"
WHY IT WORKS: "Nobody told me I was allowed" — Permission language. Specific details (six years, beige tubes, August, purple with flowers, 14-hour shifts). Dialogue feels real. Hits the Medical Device Stigma fear. The nurse friend is social proof embedded in narrative.

**BAD Body (same concept):**
"Many people avoid compression socks because they think they're ugly. But Viasox has changed the game with stylish designs that look great while providing medical-grade support. With over 100 patterns to choose from, you'll never have to sacrifice style for comfort again."
WHY IT FAILS: "Changed the game" — banned cliché. "Medical-grade" — over-medicalized. "100 patterns" is a feature list, not a story. "Sacrifice style for comfort" — generic ad language. No human voice, no scene, no emotion.

### CTA — GOOD vs. BAD

**GOOD CTA (TOF):**
"See why 107,993 people stopped settling. Your feet already know what they need."
WHY IT WORKS: Social proof number. "Stopped settling" frames the action as empowerment. "Your feet already know" — gentle, confident, body-wisdom language. Soft — no "buy now."

**BAD CTA (TOF):**
"Shop our bestselling collection today and experience the Viasox difference! Use code COMFORT20 for 20% off your first order!"
WHY IT FAILS: TOF = soft CTA only. "Shop today" is hard sell. "Experience the difference" is meaningless. Promo code at TOF is premature — they don't know who you are yet.

### AWARENESS LEVEL — STRUCTURAL DIFFERENCES (same product, same angle)

**UNAWARE script opening (Neuropathy / EasyStretch):**
"She reorganized her morning routine around one thing. Not breakfast. Not the kids. The ten minutes she needs to get dressed from the waist down. She doesn't talk about it. Her husband doesn't know it takes that long. But every morning, before anyone else is up, she sits on the edge of the bed and fights with her own feet."
STRUCTURE: No product. No medical language. Pure story. Identification. The product doesn't appear until the final 20%.

**PROBLEM AWARE script opening (same angle/product):**
"The tingling starts before your feet even hit the floor. You know the feeling — that pins-and-needles burn that your doctor calls 'peripheral neuropathy' but you call 'my morning reminder that things aren't getting better.' You've tried the diabetic socks from the pharmacy. You've tried going barefoot. You've tried ignoring it."
STRUCTURE: Names the problem immediately with sensory detail. Uses customer language ("pins-and-needles burn"). Acknowledges failed solutions (Cycle of False Hope). Product appears around 40%.

**SOLUTION AWARE script opening (same angle/product):**
"You already know you need non-binding socks. The question is — why do all of them feel like they were designed by someone who's never actually had neuropathy? Because here's what nobody tells you: non-binding and non-compressing are NOT the same thing."
STRUCTURE: Assumes they know the solution category. Leads with DIFFERENTIATION — the mechanism gap. No problem setup needed. Product appears within the first 30%.`;
}

/* ------------------------------------------------------------------ */
/*  Angle-Specific Customer Language Banks                             */
/* ------------------------------------------------------------------ */

export function getAngleLanguageBank(angle: string): string {
  const banks: Record<string, string> = {
    'Neuropathy': `## ANGLE LANGUAGE BANK: NEUROPATHY

### How Customers Describe Their Pain (Use These EXACT Phrases)
**Physical Sensations:**
- "Tingling that never stops"
- "Pins and needles — but not the kind that goes away"
- "Burning on the bottoms of my feet"
- "Feels like I'm walking on hot coals"
- "Numbness that creeps up from my toes"
- "Can't feel the floor / can't feel my feet"
- "Like my feet are wrapped in cotton — but the bad kind"
- "The buzzing" / "electric feeling" / "constant static"
- "Sharp, stabbing pain that comes in waves"
- "Hypersensitive — even the sheet on my feet at night hurts"

**Daily Impact Language:**
- "I dread the walk to the bathroom every morning"
- "I have to look at my feet to know where they are"
- "I stumble because I can't feel the ground"
- "I'm afraid of stepping on something and not knowing"
- "I check my feet every night for cuts I couldn't feel"
- "I can't walk barefoot anymore"
- "My balance is getting worse"
- "I'm afraid to walk on uneven ground"

**Emotional Language:**
- "It's getting worse and that scares me"
- "I'm afraid of what comes next" (progression fear)
- "My doctor said it's permanent — that word destroyed me"
- "I feel like my body is betraying me from the feet up"
- "I used to love walking. Now I count steps."
- "Nobody can see it. Nobody understands it."
- "I look fine. My feet are screaming."

**Sock-Specific Frustration:**
- "Every sock I try makes it worse — they squeeze the nerves"
- "Even diabetic socks feel too tight on bad days"
- "I need something that barely touches me but still stays on"
- "Seamless is the only thing I can tolerate"
- "The seam across the toes is torture"

**Transformation Language (post-Viasox):**
- "First socks that don't aggravate my neuropathy"
- "I forgot I was wearing them — and that's the best thing I can say"
- "Gentle enough for my worst days"
- "No pressure on the nerves. Finally."
- "I can wear socks again without dreading it"

### Words to AVOID for Neuropathy Ads
- "Cure" / "heal" / "fix" (neuropathy is often permanent — never promise reversal)
- "Compression" as a lead benefit (neuropathy patients fear compression = squeezing damaged nerves)
- "High-performance" / "athletic" (misreads the audience completely)
- "Mild discomfort" (minimizes their experience — it's NOT mild to them)
- "Diabetic socks" as sole framing (not all neuropathy is diabetic)

### Neuropathy-Specific Emotional Triggers for Ads
1. **Progression Fear** — "What if I lose feeling entirely?" → Position Viasox as "protecting what you still have"
2. **Invisible Suffering** — "I look fine but I'm not" → Validate the hidden struggle
3. **The Barefoot Test** — The moment they realize they can't feel the floor → Recreate this scene
4. **Night Pain** — Sheets touching feet, can't sleep → Evening relief angle
5. **The Nerve Squeeze** — Regular socks compressing damaged nerves → "Finally socks that don't fight your nerves"`,

    'Swelling': `## ANGLE LANGUAGE BANK: SWELLING (EDEMA)

### How Customers Describe Their Pain (Use These EXACT Phrases)
**Physical Sensations:**
- "My legs swell up like balloons by afternoon"
- "Ankles disappear by 3pm"
- "Puffy feet that don't fit in shoes anymore"
- "Heavy — like I'm carrying water bags on each leg"
- "When I press my shin, the dent stays for minutes"
- "Tight skin that feels like it might split"
- "My feet look like loaves of bread"
- "The throbbing starts around noon and just builds"
- "Can see the outline of my socks for HOURS after taking them off"
- "Deep red rings / grooves / channels in my legs"

**Daily Impact Language:**
- "I buy shoes a size up just to make it through the day"
- "By lunchtime I'm already thinking about taking my socks off"
- "I have morning shoes and afternoon shoes — two different sizes"
- "I stopped wearing sandals because people stare"
- "I elevate my legs the second I get home"
- "I dread the afternoon. My legs just... expand."
- "Flying is a nightmare — my ankles triple in size"
- "I can't wear boots anymore. My calves won't fit by end of day."

**Emotional Language:**
- "I feel disgusting when my legs swell"
- "I used to have nice ankles. Now I have... pillows."
- "I avoid any situation where someone might see my legs"
- "My husband pretends not to notice but I catch him looking"
- "I feel like an old person and I'm only 48"
- "Summer used to be my favorite season. Now I dread it."
- "I just want to feel normal again"

**Sock/Compression-Specific Frustration:**
- "Regular socks just create a tourniquet effect"
- "Compression socks were so hard to get on I gave up"
- "The elastic digs in and makes the swelling WORSE above the sock"
- "Tried support hose from the pharmacy — beige, ugly, impossible to get on"
- "I need help just to get compression socks on"
- "Everything either too tight (more marks) or too loose (no support)"

**Transformation Language (post-Viasox):**
- "The swelling went down by MORE THAN HALF the first day"
- "No marks. For the first time in YEARS, no marks."
- "I could see my ankles again by the second week"
- "My shoes fit all day now"
- "I forgot to elevate my legs because I didn't need to"
- "I wore a skirt for the first time in three years"

### Words to AVOID for Swelling Ads
- "Water retention" as sole framing (feels clinical, not emotional)
- "Edema" in hooks (customers say "swelling" — save medical terms for body copy)
- "Bloated" (associated with stomach, confuses the issue)
- "Fluid" on its own (too vague — say "the fluid that pools in your legs")
- "Lymphatic" in TOF (too medical for cold audiences)

### Swelling-Specific Emotional Triggers for Ads
1. **The 3pm Dread** — The afternoon countdown when swelling peaks → Show the clock, the tight shoes, the relief fantasy
2. **The Mark Reveal** — Taking off socks to find deep red grooves → This is the "before" scene that hits hardest
3. **The Two-Size Life** — Owning shoes in two sizes → Relatable detail that signals you understand
4. **Summer Shame** — Hiding legs in heat → Connect to dignity and social confidence
5. **The Impossible Sock** — Can't get compression socks on, gave up → This is the entry point for "easy to put on" messaging`,

    'Diabetes': `## ANGLE LANGUAGE BANK: DIABETES (FOOT CARE)

### How Customers Describe Their Pain (Use These EXACT Phrases)
**Physical Concerns:**
- "My doctor said I need to protect my feet — that's not optional"
- "I check my feet every night for cuts or sores"
- "Can't feel small injuries — a blister could become a big problem"
- "Circulation is the issue — anything too tight cuts off blood flow"
- "My feet are always cold because of poor circulation"
- "Dry, cracking skin on my feet that won't heal"
- "I'm terrified of a foot wound that won't close"
- "Tingling and numbness — diabetic neuropathy is getting worse"
- "My toes are always cold, even in summer"

**Daily Impact Language:**
- "I can't just grab any socks — everything has to be diabetic-safe"
- "I read labels on socks like I read labels on food"
- "One wrong pair and I'm dealing with blisters for a week"
- "Seams across the toes are the enemy"
- "I need moisture-wicking or I get fungal infections"
- "I have to be careful with EVERYTHING that touches my feet"
- "My feet need more care than the rest of my body combined"
- "I've spent more on socks in the last year than on regular clothes"

**Emotional Language:**
- "Diabetes takes everything, one body part at a time"
- "My feet are the thing I worry about most"
- "The fear of amputation is always in the back of my mind"
- "I feel like I'm managing a ticking time bomb"
- "I don't want socks that remind me I'm diabetic — I know I'm diabetic"
- "Every pair of diabetic socks I've tried looks medical and feels worse"
- "I want to feel normal. Just normal socks that are safe for me."
- "My wife worries about my feet more than I do"

**Sock-Specific Frustration:**
- "Diabetic socks from the pharmacy are ugly, thin, and fall down"
- "They say 'diabetic' on them. I don't want that."
- "Either they're medical-looking or they're not actually safe"
- "No one makes diabetic socks in patterns. It's always white or black."
- "I need non-binding AND moisture-wicking AND seamless — that combination barely exists"
- "Most so-called diabetic socks are just regular socks with a label"

**Transformation Language (post-Viasox):**
- "Finally, diabetic socks that don't LOOK like diabetic socks"
- "It is exciting to do what the doctors have wanted me to do and it is no longer a struggle"
- "Safe for my diabetes AND I actually like wearing them"
- "My doctor approved them — that matters to me"
- "I don't have to choose between my health and looking normal anymore"

### Words to AVOID for Diabetes Ads
- "Cure" / "treat" / "manage your diabetes" (socks don't manage diabetes)
- "Medical device" / "clinical" / "therapeutic" (they want NORMAL, not medical)
- "Diabetic" in the brand positioning (it's one feature, not the identity — lead with comfort)
- "Blood sugar" as a sock benefit (socks don't affect blood sugar)
- "Complication prevention" (too scary for TOF, too clinical overall)

### Diabetes-Specific Emotional Triggers for Ads
1. **The Normalization Desire** — "I just want normal socks that are safe for me" → Position comfort FIRST, diabetic safety as a bonus
2. **The Doctor Mandate** — Doctor said "protect your feet" but didn't say HOW → Fill the knowledge gap with a warm recommendation
3. **The Medical-Device Rebellion** — Refusing to look sick → Lead with style and patterns, reveal diabetic-safe SECOND
4. **The Caregiver's Search** — Spouse/child looking for the right socks → Gift angle with care language
5. **The Foot Check Ritual** — Nightly foot inspection routine → Show how the right socks reduce the anxiety of this ritual`,

    'Varicose Veins': `## ANGLE LANGUAGE BANK: VARICOSE VEINS

### How Customers Describe Their Pain (Use These EXACT Phrases)
**Physical Sensations:**
- "Visible veins that keep getting worse"
- "Blue and purple ropes running down my legs"
- "Spider veins spreading like a roadmap"
- "Aching, heavy legs especially at end of day"
- "Throbbing behind my knees"
- "My legs feel like they weigh twice as much by evening"
- "Burning along the vein lines"
- "Itching over the veins — drives me crazy"
- "Restless legs at night, can't get comfortable"
- "Legs cramp up if I stand too long"

**Daily Impact Language:**
- "I haven't worn shorts in five years"
- "I cross my legs to hide them in every meeting"
- "Summer is my enemy — how do you hide legs in July?"
- "I used to have great legs. Now I can't look at them."
- "I cover my legs even at the beach"
- "My daughter asked 'what's wrong with your legs, mommy?'"
- "I cancelled a vacation because it was a pool resort"
- "Standing at work all day makes them visibly worse by shift end"

**Emotional Language:**
- "I feel like my legs are aging faster than the rest of me"
- "It's vanity AND pain — people dismiss the vanity part but it matters"
- "I used to be confident. Now I plan every outfit around hiding my legs."
- "My husband says he doesn't care but I care"
- "I feel like I've lost a part of my femininity"
- "Every new vein that appears feels like losing a battle"
- "People think it's cosmetic. The pain is real."

**Sock/Compression-Specific Frustration:**
- "Compression stockings make me look like a grandma"
- "The support hose my doctor recommended are UGLY"
- "I can't get them on by myself — they're like wrestling a snake"
- "They're hot, they roll down, they look terrible under anything"
- "I need the support but I refuse to wear those things"
- "Compression socks that actually look like normal socks? That doesn't exist... does it?"

**Transformation Language (post-Viasox):**
- "I can finally support my veins without looking like I'm in a hospital"
- "The aching was noticeably better after the first full day"
- "My legs don't throb anymore at the end of shifts"
- "I wore a dress for the first time in years — the socks gave me confidence"
- "Pretty AND functional — I didn't think that was possible in compression"

### Words to AVOID for Varicose Veins Ads
- "Ugly veins" / "hideous" (never insult the viewer's body)
- "Vein disease" / "venous insufficiency" in hooks (too clinical for TOF)
- "Old" / "aging" as descriptors (they already fear it — don't confirm)
- "Cure varicose veins" (compression supports, it doesn't cure)
- "Medical-grade compression" as a lead (triggers ugly-stockings association)

### Varicose Veins-Specific Emotional Triggers for Ads
1. **The Visibility Shame** — Hiding legs in every season → Show the liberation of not having to hide
2. **Beauty + Function** — "I can't believe these are compression socks" → The reveal moment
3. **The Aching Evening** — Legs throbbing after standing all day → Evening relief narrative
4. **The Style Reclamation** — Wearing what they want again → Pair with confidence/dignity
5. **The Dismissal** — "People say it's just cosmetic" → Validate that appearance AND pain both matter`,
  };

  // Default for any angle not in the bank
  const defaultBank = `## ANGLE LANGUAGE BANK: ${angle.toUpperCase()}

Focus on the specific symptoms, daily impact, emotional weight, and customer vocabulary associated with ${angle}. Use sensory details — what does this condition LOOK like, FEEL like, and how does it change someone's daily routine? What socks have they tried and why did those fail? What words do THEY use (not medical terms)?`;

  return banks[angle] ?? defaultBank;
}

/* ------------------------------------------------------------------ */
/*  Product Deep Dives with Objection Banks                            */
/* ------------------------------------------------------------------ */

export function getProductObjectionBank(product: ProductCategory): string {
  const banks: Record<ProductCategory, string> = {
    'EasyStretch': `## PRODUCT OBJECTION BANK: EASYSTRETCH

### Top Objections & Counter-Arguments

**1. "They're just socks. Why would I pay $12/pair?"**
Counter: "The average customer who switches to EasyStretch spends LESS per year on socks. They stop buying 3-4 failed pairs from the drugstore ($8-15 each) that end up in the sock graveyard. EasyStretch is the last pair they buy — 19.5% become repeat customers who collect 5-15+ pairs because they work."
Proof: 19.5% repeat purchase rate. "Worth every penny" appears in 4,200+ reviews.

**2. "How are these different from regular diabetic socks?"**
Counter: "Most diabetic socks are thin, beige, medical-looking, and fall down. They check the medical box but fail on every comfort metric. EasyStretch was designed from the CUSTOMER experience backward — wide-mouth opening (you can actually get them on yourself), non-binding top (no marks, no tourniquet feeling), bamboo blend (softer than anything in a pharmacy), and 100+ patterns (you'd never guess they're diabetic-safe). The medical benefits are built IN, not bolted ON."
Proof: 12.3% cite style/patterns as a primary reason. "Doesn't look medical" appears in 1,800+ reviews.

**3. "I've tried 'comfortable' socks before. They all leave marks."**
Counter: "That's the Cycle of False Hope — and we know it well because 3.1% of our reviews mention a 'drawer full of failed socks.' EasyStretch's non-binding bamboo top is engineered differently. It stays up through gentle grip, not elastic squeeze. 8.8% of reviews specifically mention 'no marks' — that's 3,385 people who had the same drawer of failures and found the exit."
Proof: 8.8% (3,385 reviews) specifically cite no sock marks. Closet graveyard pattern in 689 reviews.

**4. "Are they actually medical-grade? My doctor said I need diabetic socks."**
Counter: "EasyStretch meets every criterion doctors specify for diabetic-safe socks: non-binding, seamless toe construction, moisture-wicking, no tight elastic. But unlike pharmacy diabetic socks, they're also genuinely comfortable and beautiful. Several customers report their doctors approving them after seeing them."
Proof: 7.1% bought specifically on medical mandate. "Doctor recommended" / "doctor approved" in customer language.

**5. "Will they actually fit? I have very swollen legs/wide calves."**
Counter: "EasyStretch is designed for the bodies that other socks forget. The wide-mouth opening means you don't have to wrestle them on — they slide. The non-binding top means they don't create a tourniquet above the swelling. 12.7% of reviews specifically mention 'finally fits' — these are people who had given up on finding socks that accommodate their real body."
Proof: 12.7% (4,847 reviews) cite "finally fits." Wide-mouth opening is the #1 accessibility feature.

**6. "My [parent/spouse] needs help getting dressed. Will these help?"**
Counter: "This is exactly why the wide-mouth opening exists. 9.3% of EasyStretch buyers are caregivers — adult children or spouses who were exhausted from the daily sock struggle. The most common feedback: 'My mother can put them on HERSELF now.' That's not just convenience — it's dignity for both of you."
Proof: 9.3% caregiver purchase trigger. "Can do it myself" = independence restored.

**7. "They'll probably stretch out and fall down after a few washes."**
Counter: "The bamboo blend maintains its shape through wash cycles. 5.1% of reviews specifically mention 'stays up all day' — not through tight elastic (which creates marks) but through the fabric's natural grip. Customers report wearing the same pairs for 12+ months with no sagging."
Proof: 5.1% (1,967 reviews) cite stays-up performance.

### EasyStretch Proof Hierarchy (Strongest → Supporting)
1. **No Marks** (8.8%, 3,385 reviews) — THE killer differentiator. Lead with this.
2. **Finally Fits** (12.7%, 4,847) — For the size/swelling audience, this IS the message
3. **Easy to Put On** (5.0%, 1,921) — For accessibility/independence, this IS the message
4. **Style/Patterns** (12.3%, 4,694) — Against medical-device stigma, THIS is the counter
5. **Comfort** (29.0%, 11,108) — Universal baseline, strongest frequency but least differentiating

### EasyStretch Biggest Misconceptions to Proactively Address
1. "Non-binding means they'll fall down" → Wrong. Non-binding = no elastic squeeze. They stay up through fabric grip.
2. "These are compression socks" → NEVER call EasyStretch compression. They are the OPPOSITE — non-binding comfort socks.
3. "Diabetic socks = ugly and thin" → EasyStretch breaks this assumption. 100+ patterns. Thicker bamboo blend.
4. "I need help to put on any special sock" → Wide-mouth opening changes this. Independence is the value prop.

### EasyStretch Transformation Metrics (Use in Scripts)
- "Zero marks after 8 hours of wear" (derived from 8.8% no-marks data)
- "Put them on myself for the first time in months" (from caregiver/independence data)
- "I went from 0 comfortable pairs to ordering my 15th" (from collector behavior data)
- "After 1 week my feet hurt about 90% less" (direct customer quote)
- "No more morning sock struggle" (from 5.0% easy application data)`,

    'Compression': `## PRODUCT OBJECTION BANK: COMPRESSION

### Top Objections & Counter-Arguments

**1. "Compression socks are impossible to get on."**
Counter: "That's exactly what 11.4% of our customers said about EVERY compression sock they tried before Viasox. The reason most compression socks are hard to put on is poor design, not compression level. Viasox uses a graduated compression design with a wider opening that doesn't require the wrestling match. 'Easy to put on' jumped from 9.1% to 11.4% in our reviews — it's now a TOP 3 benefit."
Proof: 11.4% (3,347 reviews) specifically cite easy application. This is the #2 solved pain point.

**2. "Compression socks look like medical devices. I refuse to wear beige tubes."**
Counter: "You're describing the OLD generation of compression socks. 12.0% of our reviews are from people who specifically mention escaping the 'beige tube' look. Viasox Compression comes in 100+ patterns — flowers, geometric, bold colors. Nurses wear them on 14-hour shifts and get compliments. These don't look like compression socks because they weren't designed to."
Proof: 12.0% (3,523 reviews) cite style stigma eliminated. 15.8% bought specifically because of the style discovery.

**3. "I tried compression before and it made things worse — too tight, too painful."**
Counter: "Most compression socks use a one-size-squeezes-all approach. Viasox graduated compression is stronger at the ankle and gradually decreases up the leg — working WITH your circulation, not against it. 10.0% of reviews specifically mention solving the 'too tight' problem. If your last compression socks felt like tourniquets, they were designed wrong."
Proof: 10.0% (2,936 reviews) cite "too tight" problem solved. Graduated compression vs. uniform squeeze.

**4. "Compression socks are for old/sick people. I don't need medical socks."**
Counter: "The fastest-growing segment buying Viasox Compression is healthcare workers on 12-hour shifts and people who stand all day. This isn't about being sick — it's about legs that work as hard as you do. 7.5% of reviews are from people who need their legs to perform at work. Nurses, teachers, retail workers, servers."
Proof: 7.5% work-related purchases. 7.4% "work crisis" as purchase trigger.

**5. "$30 for socks? That's expensive."**
Counter: "Track the price journey our customers take: '$30 for socks seemed crazy' → 'I decided to try one pair' → 'Worth every penny' → 'I now own 15 pairs.' The math: a $30 pair that lasts 12+ months vs. 4 drugstore pairs at $8-12 that fail within weeks. The real cost is the sock graveyard — all the money you've already wasted on socks that didn't work."
Proof: 19.5% become repeat customers (collector behavior). "Worth every penny" in 4,200+ reviews. Average repeat customer owns 5-15 pairs.

**6. "How do I know what compression level I need?"**
Counter: "Viasox compression is designed for everyday wear — the level that helps circulation and reduces swelling without requiring a prescription or medical fitting. If your doctor prescribed specific mmHg, check with them. But for the 93% of customers who buy for daily comfort, work endurance, or swelling management — Viasox is the sweet spot between 'too loose to help' and 'too tight to wear.'"
Proof: Only 0.45% mention doctor recommendation — vast majority are self-selecting for comfort, not medical prescription.

**7. "Will they last? I'm buying for daily wear / long shifts."**
Counter: "7.5% of our compression reviews come from people wearing them on full work shifts — 8, 10, 14 hours. They report consistent compression throughout the day, no rolling down, no losing shape. 19.5% become repeat buyers who rotate multiple pairs for daily use."
Proof: 7.5% work endurance testimonials. 19.5% repeat/collector rate.

### Compression Proof Hierarchy (Strongest → Supporting)
1. **Easy to Put On** (11.4%, 3,347 reviews) — THE differentiator vs. all other compression brands
2. **Style/No Stigma** (12.0%, 3,523) — Against the "medical device" perception, this wins
3. **Too-Tight Solved** (10.0%, 2,936) — For burned-by-compression audience, this IS the message
4. **Work Endurance** (7.5%, 2,202) — For professional/shift-worker audience
5. **Comfort** (29.0%, 8,513) — Universal baseline

### Compression Biggest Misconceptions to Proactively Address
1. "All compression socks feel like tourniquets" → Graduated compression ≠ uniform squeeze
2. "Compression socks = old people socks" → Fastest growth is nurses, teachers, athletes
3. "If they're easy to put on, the compression must be weak" → Engineering, not force
4. "I need a prescription" → 93%+ buy without prescription for daily comfort

### Compression Transformation Metrics (Use in Scripts)
- "No swelling at end of shift" (from work endurance data)
- "My legs don't ache at 3pm anymore" (from afternoon relief pattern)
- "I wore a skirt for the first time in three years" (from style stigma data)
- "I went from dreading putting them on to forgetting they're compression" (from easy application data)
- "The swelling went down by MORE THAN HALF the first day" (direct customer quote)`,

    'Ankle Compression': `## PRODUCT OBJECTION BANK: ANKLE COMPRESSION

### Top Objections & Counter-Arguments

**1. "Ankle-length compression can't be as effective as knee-high."**
Counter: "Ankle compression targets the area where most swelling concentrates — the foot and ankle. For localized swelling (12.0% of reviews), ankle-length compression directly addresses the problem zone. Not everyone needs full-leg compression. If your swelling is concentrated below the calf, ankle compression gives you targeted support without the heat, hassle, and knee-high commitment."
Proof: 12.0% (2,367 reviews) cite localized swelling as primary pain point. Only 0.06% migrated from knee-highs.

**2. "These are just regular ankle socks with a marketing label."**
Counter: "Graduated compression in ankle socks is engineered differently from regular ankle socks — the compression is concentrated around the arch and ankle where it matters most. 27.6% of reviews mention comfort that goes beyond what regular socks provide. The difference is measurable in how your feet feel after 8 hours standing."
Proof: 27.6% comfort achieved. 5.5% work-related fatigue solved.

**3. "I need full compression socks for my condition."**
Counter: "For many conditions, ankle compression is the ENTRY POINT — not a compromise. 31.2% of our ankle compression customers bought for general comfort, discovering the benefits of compression for the first time. Only 0.06% already owned knee-highs. This isn't a downgrade — for most people, it's where compression begins."
Proof: Gateway product insight — 0.06% crossover from knee-highs. 26.5% targeted need purchases.

**4. "Will these work with my shoes / work dress code?"**
Counter: "That's exactly why 3.9% of reviews specifically mention discreet wear — ankle compression fits inside any shoe without showing. No knee-high sock lines under pants, no visible compression. 8.3% cite fashion/style appeal. They work with sneakers, dress shoes, loafers — anything you'd wear regular ankle socks with."
Proof: 3.9% (771 reviews) cite discreet wear. 8.3% (1,635) style appeal.

**5. "They'll be too hot in summer."**
Counter: "This is one of the top reasons people switch FROM knee-highs TO ankle compression. 4.0% of reviews specifically mention solving heat intolerance, and 3.7% cite seasonal need as their purchase trigger. When it's 90 degrees and you still need support, ankle-length compression is the answer."
Proof: 4.0% (790 reviews) heat intolerance solved. 3.6% seasonal shift as trigger.

**6. "I'm pregnant — is ankle compression safe and enough for me?"**
Counter: "Pregnancy swelling concentrates in feet and ankles — exactly where ankle compression targets. The current 0.48% of reviews mentioning pregnancy represents a massively underserved segment. Ankle compression provides the support without the full-leg squeeze that becomes uncomfortable as pregnancy progresses."
Proof: 0.48% pregnancy segment — underexploited opportunity.

**7. "I'm on my feet all day at work. Will ankle socks give enough support?"**
Counter: "5.5% of ankle compression reviews come from people solving work-related fatigue. Nurses, teachers, retail workers — people who need foot and ankle support but can't (or won't) wear knee-highs on shift. Healthcare workers are 0.45% of reviews and growing — another major underserved segment."
Proof: 5.5% (1,079 reviews) work-related fatigue. 7.5% professional imperative trigger.

### Ankle Compression Proof Hierarchy (Strongest → Supporting)
1. **Localized Swelling Relief** (12.0%, 2,367) — THE core value proposition
2. **Fashion/Style** (8.3%, 1,635) — This is a FASHION product that happens to compress
3. **Work Fatigue Solved** (5.5%, 1,079) — For the professional audience
4. **Heat/Season Solution** (4.0%, 790) — Summer compression alternative
5. **Discreet Wear** (3.9%, 771) — Invisible support, any shoe

### Ankle Compression Biggest Misconceptions to Proactively Address
1. "Ankle = less effective" → Ankle = TARGETED for where most swelling occurs
2. "This is a compromise product" → This is a GATEWAY product that reaches people who'd never try knee-highs
3. "Compression socks have to be tall" → Only if your problem is above the ankle
4. "These are just for summer" → Year-round product for targeted support + shoe versatility

### Ankle Compression Transformation Metrics (Use in Scripts)
- "My ankles looked normal again by the second week" (from localized swelling data)
- "I can wear my favorite shoes again" (from discreet wear data)
- "No more end-of-shift foot throb" (from work fatigue data)
- "Summer compression without the heat trap" (from seasonal data)
- "I didn't even know ankle compression existed — now I own 8 pairs" (from gateway insight)

### Ankle Compression: Segment × Product Intersections
- **Healthcare Workers** → "Invisible compression under scrubs and work shoes. No one knows you're wearing support."
- **Pregnant Women** → "Ankle support that grows with you. No wrestling with knee-highs at 8 months."
- **Seniors** → "Easy to reach, easy to put on. Ankle-height means no bending to your knees."
- **Travelers** → "Flight socks that don't scream 'compression.' Pack light, support your ankles on long flights."
- **Standing Workers** → "8 hours on your feet. Your ankles absorb every minute. Give them backup."`,

    'Other': `## PRODUCT OBJECTION BANK: GENERAL

Common objections across all Viasox products:
1. Price → "Worth every penny" (4,200+ reviews). Cost per wear is lower than drugstore alternatives.
2. "Just socks" → 107,993 reviews and 19.5% repeat purchase rate say otherwise.
3. Skepticism → 624 skeptic-to-believer reviews averaging 4.6 stars.
4. Medical concerns → Designed with medical needs in mind but looks/feels like premium regular socks.`,
  };

  return banks[product] ?? banks['Other'];
}

/* ------------------------------------------------------------------ */
/*  Segment × Product Intersection Matrix                              */
/* ------------------------------------------------------------------ */

export function getSegmentProductMatrix(): string {
  return `## SEGMENT × PRODUCT INTERSECTION MATRIX

Different customer segments enter differently for each product. This matrix defines HOW to speak to each segment × product combination.

### HEALTHCARE WORKERS (Nurses, Aides, Standing Professionals)
- **+ EasyStretch:** "12-hour shifts destroy your feet. These are the socks nurses pass around the break room." Entry: work endurance, word-of-mouth. Key proof: "No marks after a double shift."
- **+ Compression:** "Your legs carry the weight of everyone you care for. Graduated compression that works as hard as you do." Entry: professional necessity. Key proof: "No swelling at end of shift."
- **+ Ankle Compression:** "Invisible support under scrubs. No one knows — but your feet do." Entry: discreet professional wear. Key proof: "No more end-of-shift throb."

### SENIORS (65+, Independence-Focused)
- **+ EasyStretch:** "The wide-mouth opening means you don't need to ask for help. Put them on yourself — every single morning." Entry: independence preservation. Key proof: "My mother can do it herself now."
- **+ Compression:** "Support your legs without the pharmacy-aisle struggle. Slides on. No wrestling. Real compression." Entry: ease + efficacy. Key proof: "Easy to put on AND actually works."
- **+ Ankle Compression:** "Reach your feet, not your knees. Ankle-height compression for bodies that don't bend like they used to." Entry: accessibility + targeted support. Key proof: "I can reach these myself."

### CAREGIVERS (Adult Children, Spouses Buying for Others)
- **+ EasyStretch:** "Give them back their independence. Give yourself back your mornings." Entry: dual benefit (wearer + caregiver). Key proof: "She can dress herself again."
- **+ Compression:** "The socks you stop worrying about. They're wearing support, they look great, and they didn't need your help to put them on." Entry: peace of mind. Key proof: "I stopped getting the 'can you help me' call."
- **+ Ankle Compression:** "Easy enough for them to manage alone. Supportive enough that you stop worrying." Entry: low-intervention care. Key proof: "Dad puts them on without me."

### SKEPTICS / CYCLE-OF-FALSE-HOPE (Burned by Past Purchases)
- **+ EasyStretch:** "You have a drawer full of failures. We know — 3.1% of our reviews mention that exact drawer. This is the pair that ends the cycle." Entry: shared understanding of defeat. Key proof: 689 "closet graveyard" reviews.
- **+ Compression:** "You 'tried compression before.' But you tried the OLD kind. 10.0% of our reviews say the same thing — and then they found these." Entry: differentiation from past failures. Key proof: 10.0% "too tight solved" reviews.
- **+ Ankle Compression:** "If you've given up on compression because knee-highs were too much, this is the re-entry point." Entry: second chance at compression. Key proof: 0.06% crossover — 99.94% are NEW to compression.

### STYLE-CONSCIOUS (Fashion + Function Seekers)
- **+ EasyStretch:** "100+ patterns. Your friends will ask where you got them. You'll casually mention they're also diabetic-safe." Entry: style discovery. Key proof: 12.3% cite patterns as primary driver.
- **+ Compression:** "Compression socks that get compliments — not concerned looks. This is what medical support looks like in 2026." Entry: anti-stigma style revolution. Key proof: 12.0% style stigma eliminated.
- **+ Ankle Compression:** "Ankle socks that actually do something. The style you want with the support you need." Entry: fashion-forward compression. Key proof: 8.3% fashion/style appeal.`;
}

/* ------------------------------------------------------------------ */
/*  Winning Ad Reference Bank — Top-Performing Scripts Studied         */
/* ------------------------------------------------------------------ */

export function getWinningAdReferenceBank(): string {
  return `## WINNING AD REFERENCE BANK — STUDIED TOP PERFORMERS

These are real briefs that produced the highest ad spends and returns on the Viasox account. They have been analyzed for what makes them work. DO NOT copy or recreate these scripts. Instead, STUDY the patterns, language choices, emotional arcs, and structural decisions — then apply those principles to create ORIGINAL work at the same quality level.

### PATTERN 1: THE MEASUREMENT/PROOF DEMONSTRATION
**Why it works:** Transforms an abstract claim ("our socks fit better") into a concrete, visual, undeniable demonstration. The viewer watches the proof happen in real time. Numbers create specificity. Measurements create authority.

**Reference: E194 "The Sock Sizing Scandal" (Ankle Compression, Problem Aware, ~45s)**
- Hook: "Sock companies think all legs are 14 inches around. Mine are 22."
- Structure: Investigation/exposé format → measures competing socks (all fail) → measures Viasox (succeeds dramatically) → emotional payoff
- WHY IT PERFORMED: The hook uses a SPECIFIC number gap (14 vs 22 inches) that immediately creates injustice. The "investigation" framing makes it feel like content, not an ad. Each failed measurement BUILDS frustration before the payoff. The viewer is rooting for a solution by the time Viasox appears.
- KEY LANGUAGE: "The sock sizing lie," "Translation: Fits small to medium only," "8-inch difference. No wonder they hurt," "They design for average. Ignore everyone else," "If your calves are over 18 inches? You don't exist."
- EMOTIONAL ARC: Injustice → validation ("your body isn't the problem") → vindication → relief

**Reference: E171 "The 30-Inch Truth" (EasyStretch, Problem Aware, ~45s)**
- Hook: "30 inches. That's how far these socks stretch."
- Structure: Measures regular socks (12-14") → "extra wide" (18") → pharmacy ($40, 20") → Viasox (30") → personal demo with 26-inch calves from lymphedema
- WHY IT PERFORMED: Builds a ladder of failures with ESCALATING specificity (each sock type named with exact measurement). "$40 medical socks from the pharmacy" adds price injustice. "26-inch calves from lymphedema" names the REAL condition — not vague "swelling" but a specific medical reality. "After 20 years of sock torture" — temporal weight.
- KEY LANGUAGE: "Let me show you the truth," "on a good day" (sarcastic), "THIRTY" (single word for emphasis), "No cutting. No marks. No pain," "socks that tell the truth"
- EMOTIONAL ARC: Skeptical investigation → escalating disappointment → shock reveal → emotional relief → "I finally found"

**PRINCIPLE TO APPLY:** When writing scripts about fit, comfort, or performance — use SPECIFIC MEASURABLE PROOF. Don't say "they stretch more." Say how far. Don't say "other socks fail." Show EXACTLY how they fail with numbers. Create a ladder of failures before the reveal.

### PATTERN 2: THE MECHANISM REFRAME
**Why it works:** Takes a product category the viewer thinks they understand (compression socks) and reframes the MECHANISM — revealing that the entire industry approach was wrong. This creates a "wait, I never thought about it that way" moment.

**Reference: C163 "The Pressure" (EasyStretch, Problem Aware, ~30-35s)**
- Hook: "What if everything you know about compression socks is backwards?"
- Structure: States industry standard (20-30 mmHg) → explains WHY that fails (10 min to put on, marks, you stop wearing them) → zero compression is worse → reveals the "sweet spot" (12-15 mmHg) → demonstrates ease → shows results
- WHY IT PERFORMED: The MECHANISM is the star — not the sock, but the INSIGHT about pressure levels. "12-15 mmHg is the sweet spot where compression actually works AND you can wear it all day" — this is a genuinely useful piece of information that makes the viewer smarter. The argument is LOGICAL, not emotional: you can't benefit from compression you don't wear.
- KEY LANGUAGE: "The compression sock industry has been solving the wrong problem for 50 years," "So you stop wearing them. Which means zero compression. Zero benefits. Zero relief," "gentle enough that you forget you're wearing compression," "The best compression is the compression you actually wear"
- EMOTIONAL ARC: Curiosity → "aha" moment → logical persuasion → effortless proof → satisfaction

**PRINCIPLE TO APPLY:** When the product has a technical advantage, don't just LIST it. REFRAME the category. Explain WHY the old approach was broken. Give the viewer a genuinely useful insight that makes them feel smarter. The product becomes the logical conclusion of the insight, not the pitch.

### PATTERN 3: THE ANTI-KNEE-HIGH / SHORTCUT ANGLE
**Why it works:** Positions ankle compression as the SMART choice by framing knee-high compression as overkill. Creates an "I've been doing this wrong" realization.

**Reference: A162 "The Ankle Compression Shortcut" (Ankle Compression, Solution Aware MOF, ~20-25s)**
- Hook: "Stop paying for 12 inches of sock you don't need."
- Structure: Names the mistake → locates the real problem zone → shows targeted solution → versatility montage → daily timeline → value/offer
- WHY IT PERFORMED: The hook is PROVOCATIVE — tells the viewer they're wasting money. "The real issue is down here" with a visual zoom creates the reframe. "6 inches of targeted ankle compression" is a specific mechanism claim. The versatility montage (any shoe, any outfit, any season) addresses the #1 objection.
- KEY LANGUAGE: "Most people with swollen ankles make the same mistake," "But the real issue is down here," "Just 6 inches of targeted ankle compression," "Full compression benefits. Zero sweat. Zero bulky fabric"
- EMOTIONAL ARC: Challenge → reframe → "that makes sense" → versatility proof → urgency

### PATTERN 4: THE UNEXPECTED DISCOVERY / "WASN'T EXPECTING" ARC
**Why it works:** Low expectations → surprising results is the most persuasive narrative structure in DTC advertising. The viewer identifies with the skepticism, which makes the positive outcome MORE believable.

**Reference: A48 "Wasn't Expecting" (Ankle Compression, Problem Aware, ~45s)**
- Hook: "I didn't think ankle socks could make a difference. I was wrong."
- Structure: States low expectations → names the specific problem (swelling, soreness) → dismisses full compression for summer → tries Viasox → notices specific unexpected improvements → explains mechanism → endorsement
- WHY IT PERFORMED: "I didn't think" + "I was wrong" is the PUREST skeptic-to-believer arc. The specific surprise moments ("My feet weren't sore at dinner," "My shoes didn't feel tight," "I wasn't rushing to sit down") are DAILY LIFE observations — not product claims. The viewer recognizes their own routine in these moments.
- KEY LANGUAGE: "Full-length compression socks were just too much — especially in summer," "I noticed something weird," "My feet weren't sore at dinner," "My shoes didn't feel tight," "I wasn't rushing to sit down," "Don't take my word for it — wear them once, and you'll get it"
- EMOTIONAL ARC: Skepticism → reluctant trial → surprise → specific proof moments → genuine advocacy

**Reference: A60 (Ankle Compression, TOF Mashup)**
- Hook: "The difference these compression socks made... I felt it day one!"
- Structure: Meet the product → NOT like regular tight compression → easy application with pull tab detail → targeted compression mechanism → padded bottom → energy/comfort results → conversion CTA
- WHY IT PERFORMED: "I felt it day one" creates immediate-results framing. Specifically calls out what it's NOT ("not like your regular, tight compression socks"). The PULL TAB detail — a tiny product feature — becomes memorable because it solves a specific micro-frustration. "I used to think compression socks had to be uncomfortable to work. Turns out, they don't" — belief reframe.
- KEY LANGUAGE: "A sock that delivers support, comfort and reduces swelling, effortlessly," "It's a small thing, but it makes a big difference," "Their light, targeted compression hits exactly where it matters," "I feel like I have a lot more energy now"

**PRINCIPLE TO APPLY:** Start with LOW expectations or SKEPTICISM. Name specific moments of daily life where the viewer NOTICES the difference (not product features — life changes). Use "I noticed," "I realized," "I wasn't expecting" language. The small specific details (pull tab, shoes fitting, not rushing to sit down) are MORE persuasive than big claims.

### PATTERN 5: THE HOW-TO / EDUCATIONAL AUTHORITY
**Why it works:** Positions the ad as a TUTORIAL that happens to feature the product. The viewer learns something genuinely useful. The product becomes the tool that executes the lesson.

**Reference: A133 "How to Fix Your Feet in 10 Seconds" (Ankle Compression, Problem Aware, ~45s)**
- Hook: "10-second ankle swelling fix that lasts all day"
- Structure: Names the cause (blood pooling) → simple anatomy explanation → "here's the fix" → 2-step tutorial (get ankle compression, slide on) → explains what happens next (360-degree pressure, circulation) → hourly timeline of results → features → authority ("Physical therapists know this")
- WHY IT PERFORMED: "10 seconds" creates a curiosity gap — can swelling really be fixed that fast? The anatomy explanation (gravity + veins + blood pooling) makes the viewer UNDERSTAND why they swell. Understanding creates buy-in. The hourly timeline (Hour 1, Hour 4, Hour 8) is a PROOF STRUCTURE that builds credibility through specificity. "This is when you'd usually be dying. But you're not." — directly names the viewer's daily pain point.
- KEY LANGUAGE: "Blood pooling. Right here. In your ankle and arch," "Gravity pulls blood down. Your veins can't push it back up," "By noon, you've got a swamp in your shoes," "This is when you'd usually be dying. But you're not. Your feet feel... normal?"
- EMOTIONAL ARC: Promise → education → "that makes sense" → simple solution → progressive proof → authority validation

**PRINCIPLE TO APPLY:** When using educational/how-to framing, teach something REAL about the body or the condition. Don't fake expertise — explain the actual mechanism simply. Use a TIMELINE to show progressive results (Hour 1, Hour 4, Hour 8). End with authority validation.

### PATTERN 6: THE AGC TESTIMONIAL WITH OFFER MATH
**Why it works:** Combines genuine testimonial energy with a B2G3 offer that's broken down into specific math. The viewer simultaneously gets social proof AND calculates the value.

**Reference: AGC 107 (Ankle Compression, AGC format, ~45s)**
Hooks (3 variations):
1. Solution hook: "I ditched the knee-high compression for these — and my feet have never felt better." (BROLL: compression knee-highs cut to Viasox ACS on feet)
2. Curiosity hook: "I was ready to give up on compression socks... until I found these." (BROLL: zooming on tight socks, transition to Viasox)
3. Reactions hook: "The difference these compression socks made... I felt it day one." (BROLL: extreme closeup of ACS on tippy toes, hop)
- Script arc: Product intro → compare against knee-highs → "they squeeze the life out of you" → ankle-length = right where support matters → soft/breathable → pull tab genius → no marks reveal → "real comfort and actual relief" → B2G3 math → skeptic-to-believer ("I was skeptical about ankle-only compression") → "swelling stops at the source" → daily use → CTA
- WHY IT PERFORMED: Three hooks give three DIFFERENT emotional entry points (solution, curiosity, reaction). The body advances from ALL hooks without repeating any. Specific anti-knee-high comparison ("squeeze the life out of you") validates the viewer's frustration. The no-marks reveal is a VISUAL PROOF moment. "Swelling stops at the source" is a mechanism phrase that sticks. Real review quotes read on camera add authenticity.

**Reference: AGC 144 / A141 (Ankle Compression, AGC format)**
Hooks (3 variations):
1. "I bought 2 pairs. They sent me 5. This wasn't a mistake..."
2. "This is the only time you should be buying socks because of this one fact..."
3. "I almost didn't buy. Now I have 5 pairs. Let me explain..."
- Script arc: Shock/excitement at B2G3 → explain the deal math → "That's $90 worth of free socks" → callback to swelling problem → "Those balloon ankles" → put on compression easily → "14 mmHg compression, only where you need it" → "Not those knee-high torture devices" → social proof (3,847 people, review quotes) → pattern selection → skeptic-to-believer → "The swelling stops at the source" → daily rotation → CTA
- WHY IT PERFORMED: The B2G3 hooks are IRRESISTIBLE curiosity triggers — "they sent me 5, this wasn't a mistake" makes the viewer need to know why. The deal math ($90 worth of free socks, $12 per pair) is SPECIFIC and calculable. "Balloon ankles" and "knee-high torture devices" are vivid, memorable phrases. Reading real reviews on camera builds trust.

**PRINCIPLE TO APPLY:** For AGC scripts, use offer math as a HOOK (not just a CTA). Make the deal CALCULABLE ("$90 worth of free socks"). Compare against the bad alternative with vivid language ("torture devices," "squeeze the life out of you"). Include at least one real review read on camera. Build a skeptic-to-believer arc within the testimonial.

### PATTERN 7: THE SWELLING RELIEF JOURNEY (Long-form testimonial)
**Why it works:** Deep emotional testimonial that traces the full journey from suffering through discovery to transformation. Works for longer formats where emotional investment builds over time.

**Reference: AGC 107 Second Script (Ankle Compression, long-form ~60s)**
- Opening: "I'm finally getting relief from the swelling in my feet and ankles and I didn't need any expensive treatments."
- Arc: Frustration with medical advice ("doctor visits or prescriptions") → simple tool discovery → daily improvement ("every day it gets better") → understanding mechanism ("once you understand how swelling works... and how these socks help with circulation") → body healing framing ("you're not causing harm — you're actually helping your body heal") → relief + freedom
- WHY IT PERFORMED: "I didn't need expensive treatments" immediately positions socks as the ALTERNATIVE to medical intervention — not a medical device, but a practical solution. "You realize you're not causing harm — you're actually helping your body heal" is the most powerful reframe — from passive suffering to active healing. The progression from skepticism to understanding to freedom mirrors the actual customer journey.
- KEY LANGUAGE: "I feel so relieved," "Like I've finally given my feet the support they've been needing," "It's like saying hello to my feet again — without the constant discomfort," "that feeling... that freedom... it's worth its weight in gold"

---

## UNIVERSAL PRINCIPLES FROM TOP PERFORMERS

### 1. SPECIFICITY OVER GENERALITY — ALWAYS
Every winning script uses SPECIFIC details: "22-inch calves," "30 inches," "12-15 mmHg," "$40 pharmacy socks," "Hour 8," "3,847 people bought this deal last week." Generic language ("comfortable," "supportive," "great socks") appears NOWHERE in top performers. If a claim can't be made specific, it shouldn't be in the script.

### 2. THE CONDITION IS NAMED AND CONTEXTUALIZED
Top performers don't say "sock marks are bad." They say WHY sock marks are bad for THIS person: "26-inch calves from lymphedema" (E171), "blood pooling in your ankle and arch" (A133), "those balloon ankles and swelled feet" (AGC 144), "heavy, uncomfortable swelling in my ankles and feet" (AGC 107). The condition is always placed in the context of the person's DAILY LIFE, not presented as an abstract medical fact.

### 3. THE ANTI-ALTERNATIVE IS AS IMPORTANT AS THE PRODUCT
Every winning script spends significant time on what the viewer ALREADY TRIED and why it failed: "extra wide socks — 18 inches, still not enough" (E194), "$40 medical socks from the pharmacy" (E171), "20-30 mmHg socks that take 10 minutes to put on" (C163), "knee-high torture devices" (AGC 144), "full-length compression in summer — just too much" (A48). The product's value is defined by the failures that preceded it.

### 4. DAILY LIFE PROOF > PRODUCT CLAIMS
Winners prove the product through LIFE CHANGES, not features: "My feet weren't sore at dinner" (A48), "My shoes didn't feel tight" (A48), "I wasn't rushing to sit down" (A48), "By evening, your ankles are still normal sized" (C163), "Hour 8: This is when you'd usually be dying. But you're not" (A133). These are moments the viewer RECOGNIZES from their own life.

### 5. ONE SMALL DETAIL CREATES MEMORABILITY
The pull tab (A60, AGC 107), the measuring tape (E194, E171), the pressure gauge sweet spot (C163), "tippy toes hop" (AGC 107). Each winning script has ONE specific visual/product detail that becomes the memorable anchor. Don't try to feature everything — make ONE detail unforgettable.

### 6. THE OFFER IS A STORY, NOT A BANNER
B2G3 isn't presented as "Buy 2 Get 3 Free." It's: "I bought 2 pairs. They sent me 5" (AGC 144), "$90 worth of free socks" (AGC 144), "Five pairs of wearable compression for $40" (C163), "$12 per pair" (A162). The offer is CALCULATED for the viewer and integrated into the narrative.

### 7. REAL LANGUAGE, NOT AD COPY
Compare winning language vs. what AI typically generates:
- WINNING: "By noon, you've got a swamp in your shoes" → AI DEFAULT: "Experience discomfort throughout your day"
- WINNING: "Those knee-high ones that squeeze the life out of you" → AI DEFAULT: "Unlike traditional compression socks"
- WINNING: "This is when you'd usually be dying" → AI DEFAULT: "At the end of a long day"
- WINNING: "My shoes didn't feel tight" → AI DEFAULT: "Reduced swelling and improved comfort"
- WINNING: "If your calves are over 18 inches? You don't exist" → AI DEFAULT: "Many people struggle to find properly fitting socks"
The winning scripts sound like a REAL PERSON talking about their real experience. They use humor, frustration, sarcasm, and surprise. They never sound like marketing copy.

### 8. PERSONA IS ALWAYS 50+ WOMAN WITH A REAL CONDITION
Every top performer features or speaks to a woman 50+ dealing with: lymphedema (E171), swelling/edema (A48, A133, AGC 107), larger calves (E194), compression fatigue (C163, A162), ankle swelling (A60, AGC 144). The persona is NEVER vague ("someone who wants comfortable socks"). She always has a SPECIFIC condition and a SPECIFIC frustration with alternatives.`;
}
