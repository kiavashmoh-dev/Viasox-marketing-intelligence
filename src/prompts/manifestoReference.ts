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
**Best for:** Storytelling formats, longer durations (30s-60s), emotional connection. TOF and MOF.
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
