/**
 * Awareness Level Deep-Dive Guides
 *
 * Grounded in Eugene Schwartz's Breakthrough Advertising awareness scale,
 * supplemented with principles from Hopkins (Scientific Advertising),
 * Bly (The Copywriter's Handbook), and Neumeier (The Brand Gap).
 *
 * Each level produces fundamentally different creative — different concept
 * structures, hook strategies, script architectures, proof ratios, emotional
 * sequencing, and CTA approaches. An "Unaware" ad should look NOTHING like
 * a "Most Aware" ad, even if the ad type and persona are identical.
 */

import type { AwarenessLevel } from '../engine/types';

/* ------------------------------------------------------------------ */
/*  CONCEPT & ANGLE guides (used by anglesPrompt)                     */
/* ------------------------------------------------------------------ */

const CONCEPT_GUIDES: Record<AwarenessLevel, string> = {
  'Unaware': `## AWARENESS LEVEL: UNAWARE — CONCEPT & ANGLE RULES

**WHO THEY ARE:**
These people do NOT know they have a problem worth solving. They may have sock marks, swelling, or discomfort — but they've normalized it. "That's just what happens." They are NOT searching for solutions. They are NOT thinking about socks. Your ad must reach into their world and create a moment of recognition WITHOUT ever feeling like an ad.

**SCHWARTZ'S RULE FOR UNAWARE:**
"Your headline — your first 50 words — has the most difficult job of all. It must literally CREATE awareness where none existed. It cannot mention the product. It cannot mention the problem. It MUST connect with an existing desire, identification, or belief that is already in their mind — and redirect it."

**THE CREATIVE MANDATE — WHAT MAKES UNAWARE CONCEPTS DIFFERENT:**

1. **NEVER lead with the product, the problem, or the solution.** Not in the hook, not in the first 30% of the ad. The viewer doesn't know they should care about socks, marks, swelling, or compression. If you open with any of these, you've already lost them — they'll scroll past because it doesn't feel relevant to their life.

2. **Lead with IDENTIFICATION or STORY.** The concept must open in the viewer's world — their morning routine, their work day, their relationship, their identity. The viewer must see THEMSELVES before they see a product.
   - Hopkins: "The best advertising doesn't look like advertising. It looks like news, a story, or useful information."
   - Neumeier: "We notice only what's DIFFERENT from our expectation." The concept must break their scroll with something that feels like content, not commerce.

3. **The Problem Reveal must feel like a DISCOVERY, not a pitch.** The concept should guide the viewer from their daily reality to a moment of "wait... that ISN'T normal?" This is the awareness shift — the instant where a normalized discomfort becomes a recognized problem. This moment is the entire purpose of an Unaware ad.

4. **Product appears LAST — if at all.** In a 30s ad, the product should not appear until after 0:20. In a 60s ad, not until after 0:40. Some Unaware concepts may end with a curiosity-driving CTA ("see what [X] people discovered") without even naming the product — driving to a landing page where the education continues.

5. **Concept structure must be: Identification → Disruption → Discovery → Curiosity.**
   - Identification: "This is MY world" (the viewer recognizes themselves)
   - Disruption: "Wait, that's not right" (a moment of cognitive dissonance)
   - Discovery: "I never thought about it that way" (the awareness shift)
   - Curiosity: "I need to know more" (the soft pull)

**VIASOX-SPECIFIC UNAWARE MESSAGING (from Manifesto):**
- Lead with life moments, NOT product benefits: "The morning routine that takes longer than it used to" → the viewer recognizes themselves → then the subtle reframe: "But what if the struggle ISN'T your body? What if it's what you're putting ON your body?"
- Identity-first concepts: Show a PERSON the viewer relates to living their life. The sock problem surfaces organically through the story, not through a sales pitch.
- The "normalization disruption": Most unaware prospects have ACCEPTED their discomfort. The concept must BREAK that acceptance. "You've been blaming your legs. Have you tried blaming your socks?"
- Social proof as curiosity, not evidence: "Why are 107,000+ people doing [X]?" — not as a product claim, but as a genuine question that creates a curiosity gap.

**CONCEPT FORMAT REQUIREMENTS (Unaware):**
- Every concept must describe the first 50% of the ad WITHOUT mentioning socks, compression, marks, swelling, Viasox, or any product feature.
- The "awareness shift" moment must be clearly identified in each concept.
- The CTA must be SOFT: "learn more," "see why," "discover" — never "buy now" or "shop."
- Each concept must specify exactly WHEN the product/problem first appears and WHY that timing creates maximum curiosity.

**ANGLE TYPE ADJUSTMENTS FOR UNAWARE:**
- Problem-Based → must lead with LIFE IMPACT, not the problem itself. Don't say "sock marks." Say "those red lines your daughter noticed on your legs last Sunday."
- Emotion-Based → the emotion must be one they ALREADY feel (fatigue, frustration, resignation) — not one about a problem they don't know they have.
- Identity-Based → STRONGEST angle type for Unaware. Lead entirely with WHO they are. The problem surfaces through their identity story.
- Education-Based → frame as "things you didn't know" content, not product education. Teach something genuinely useful that creates the awareness shift.
- Comparison-Based → compare LIFE states ("your mornings now vs. 5 years ago"), not products.
- Testimonial-Based → the testimonial must start with LIFE context, not product experience. "I'm a nurse, and I used to think..." not "I bought these socks and..."
- Fear-Based → VERY gentle. Not product fear. Life fear: "What does it mean when your legs look different at the end of the day?"
- Aspiration-Based → show the AFTER state without explaining HOW. Pure visualization of the life they want — then the bridge to discovery.
- Seasonal/Situational → tie to a LIFE moment (holiday travel, new job, retirement) where the latent problem becomes activated.
- Solution-Based → DO NOT USE for Unaware. They don't know they have a problem yet. A solution concept will not resonate.

**SCHWARTZ HEADLINE RULES FOR UNAWARE:**
- Cannot mention the product name
- Cannot mention the problem directly
- Must connect to an existing mass desire (comfort, independence, confidence, health)
- Must create curiosity or identification strong enough to earn 3+ seconds of attention
- The headline/hook IS the awareness creation mechanism — it must shift them from "I don't have a problem" to "Wait... do I?"`,

  'Problem Aware': `## AWARENESS LEVEL: PROBLEM AWARE — CONCEPT & ANGLE RULES

**WHO THEY ARE:**
These people KNOW they have a problem — sock marks, foot swelling, discomfort on long shifts, difficulty putting on socks, ugly medical hosiery — but they DON'T know a good solution exists. They may have tried generic compression socks (uncomfortable), pharmacy brands (ugly), or just accepted the problem. They are actively experiencing the pain but haven't found relief.

**SCHWARTZ'S RULE FOR PROBLEM AWARE:**
"Your prospect KNOWS the desire — he just doesn't know that a product exists which will satisfy it. Here, the headline starts with the DESIRE or its solution, names it, and identifies with the prospect. The body then channels that identified desire directly onto your product."

**THE CREATIVE MANDATE — WHAT MAKES PROBLEM AWARE CONCEPTS DIFFERENT:**

1. **Lead with the PAIN — name it specifically, make it vivid.** This is where you AGITATE. The viewer already knows this pain. Your job is to make them feel it MORE INTENSELY so the need for a solution becomes urgent. This is Schwartz's "Intensification" technique.
   - Hopkins: "Be specific about the problem. 'Sock marks that take 2 hours to fade and make your daughter ask if you're okay' beats 'uncomfortable socks.'"
   - Bly: "The BFD formula — what do they BELIEVE about this problem? ('Nothing helps.') What do they FEEL? ('Embarrassed, frustrated, resigned.') What do they DESIRE? ('To feel normal again.')"

2. **The viewer must feel SEEN — mirror their exact experience.** Problem Aware is where specificity wins. Use exact customer language from reviews. Describe the micro-moments they recognize: the morning sock struggle, the marks they hide under pants, the way they avoid certain shoes, the comment from a spouse.

3. **Bridge from pain to hope — but don't hard-sell the product yet.** The concept should create a moment of "there's actually something that works" without turning into a product demo. The FEELING of possibility is more important than product features at this stage.

4. **Product appears in the second half.** In a 30s ad, product can appear around 0:15. In a 60s ad, around 0:25-30. The first half is entirely about the PROBLEM — making them nod, wince, and feel understood.

5. **Concept structure: Pain Naming → Intensification → Hope Bridge → Solution Teaser.**
   - Pain Naming: "You know this feeling" (instant recognition)
   - Intensification: "And it's getting worse / And nobody talks about it / And you've tried everything" (Schwartz: squeeze before relief)
   - Hope Bridge: "But what if it didn't have to be this way?" (the emotional pivot)
   - Solution Teaser: Introduce the CATEGORY of solution (not just the product) — then Viasox as the specific answer

**VIASOX-SPECIFIC PROBLEM AWARE MESSAGING (from Manifesto + Four Books):**
- "The Sock Mark Problem" — Red indentations that won't fade, visible to others, source of embarrassment and health anxiety. Name it with Hopkinsian specificity: "Those red rings that are still there 2 hours after you take your socks off."
- "The 12-Hour Shift Struggle" — Feet that swell two shoe sizes by shift end. Lead with the FEELING: "Your shoes fit at 6 AM. By 6 PM, they don't."
- "The Daily Indignity" — Asking for help with socks. The loss-of-independence angle. Schwartz's identification at its most powerful.
- "The Tourniquet Effect" — Compression socks that hurt more than they help. The "old way vs. new way" framing.
- "The Style Surrender" — Being forced into ugly beige medical socks. Neumeier's "medical device stigma" angle.
- Bly's "benefits one level deeper" applied: Sock marks → Embarrassment → "Am I declining?" → Fear of physical decline. The REAL problem is NEVER the socks.

**CONCEPT FORMAT REQUIREMENTS (Problem Aware):**
- Every concept must name a SPECIFIC pain point from the review data in the first 25% of the ad.
- The pain must be intensified — not just stated but made vivid and urgent.
- Include the specific data frequency of the pain point referenced (e.g., "41% of reviewers mentioned sock marks").
- The bridge from pain to solution must feel natural — not a jarring pivot from "complaining" to "selling."
- CTA should be medium-soft: "try your first pair," "see how it works," "see the reviews."

**ANGLE TYPE ADJUSTMENTS FOR PROBLEM AWARE:**
- Problem-Based → STRONGEST angle type. Name the problem with maximum specificity. Use customer language verbatim.
- Emotion-Based → lead with the FEELING behind the problem: embarrassment, frustration, resignation, fear.
- Pain Agitation → pair naturally — intensify before offering relief.
- Fear-Based → "What your [symptom] is telling you" — health anxiety as motivation.
- Comparison-Based → "What you've tried vs. what actually works" — old solutions vs. new.
- Identity-Based → combine identity with pain: "If you're a nurse with swollen feet, you've accepted this. You shouldn't have to."
- Testimonial-Based → "I had the same problem" opening — instant identification through shared pain.
- Education-Based → "Why your socks are making it worse" — reframe the cause.
- Solution-Based → CAN work but must lead with problem first, then bridge.
- Aspiration-Based → "Imagine a day without [specific pain]" — the relief vision.

**SCHWARTZ HEADLINE RULES FOR PROBLEM AWARE:**
- Lead with the DESIRE (comfort, relief, independence) or its SOLUTION
- Name the problem specifically — the more specific, the more it selects the right audience
- Create identification: "If you [specific experience], you're not alone"
- Can mention the product category (socks, compression) but don't lead with Viasox brand name
- The headline must make them feel SEEN — "that's exactly what I go through"`,

  'Solution Aware': `## AWARENESS LEVEL: SOLUTION AWARE — CONCEPT & ANGLE RULES

**WHO THEY ARE:**
These people KNOW they have a problem AND they know solutions exist (compression socks, diabetic socks, non-binding socks). But they either (a) haven't found the right one, (b) have tried solutions that failed, or (c) are comparing options and haven't committed. They are SHOPPING — evaluating alternatives. They may have looked at pharmacy brands, medical brands, or competitors. They need to understand WHY Viasox is fundamentally different.

**SCHWARTZ'S RULE FOR SOLUTION AWARE:**
"Your prospect knows the result he wants. He knows the general approach that will achieve it. He just doesn't know YOUR product yet — or doesn't know it well enough to prefer it. The headline starts with the MECHANISM — the new way, the new approach, the breakthrough that makes your product different."

**THE CREATIVE MANDATE — WHAT MAKES SOLUTION AWARE CONCEPTS DIFFERENT FROM PROBLEM AWARE:**

This is the CRITICAL distinction. A Problem Aware ad and a Solution Aware ad for the same persona MUST be completely different:
- **Problem Aware** spends 60-70% on the PAIN and bridges to hope. It CREATES urgency.
- **Solution Aware** ASSUMES the urgency already exists and spends 60-70% on WHY THIS SOLUTION IS DIFFERENT. It DIFFERENTIATES.

1. **Lead with the MECHANISM or DIFFERENTIATION, not the problem.** They already know the problem. Don't waste time re-agitating it. Instead, open with what makes Viasox fundamentally different from what they've tried or seen.
   - Schwartz: "In a sophisticated market, you need a NEW MECHANISM — a reason why THIS product achieves the desired result when others haven't."
   - Neumeier: "Differentiation is survival. Show the gap between what exists and what you offer."

2. **Address what FAILED before.** Solution Aware prospects often carry skepticism from previous failed solutions. Acknowledge this directly: "Compression socks that actually feel comfortable? We were skeptical too."
   - Bly: "Address the BELIEF system. They believe nothing will work. You must break that belief with a new mechanism."

3. **The "New Mechanism" concept.** Schwartz's most powerful technique for Solution Aware: give them a REASON WHY this product works when others didn't. For Viasox, the mechanisms are:
   - Non-binding wide-mouth tops (why no marks, unlike regular compression)
   - Graduated compression that doesn't feel like a tourniquet (why comfortable)
   - Fashion-forward patterns (why you don't look like you're wearing medical devices)
   - Easy-on design (why you don't need help putting them on)

4. **Product appears EARLY — within the first 30%.** Unlike Unaware (product last) or Problem Aware (product in second half), Solution Aware concepts can introduce Viasox early because the prospect is ready to evaluate solutions. But lead with the DIFFERENTIATION, not just the brand name.

5. **Concept structure: Acknowledged Pain → Failed Solutions → New Mechanism → Proof → Differentiated CTA.**
   - Acknowledged Pain: Brief — "You know the problem" (1-2 seconds, not belabored)
   - Failed Solutions: "You've tried [X] and it didn't work because [Y]" (builds trust through honesty)
   - New Mechanism: "Here's why Viasox is fundamentally different" (the Schwartz mechanism play)
   - Proof: Data, testimonials, reviews — specific evidence this mechanism WORKS
   - CTA: "Compare for yourself," "See why [X]K switched," "Try risk-free"

**VIASOX-SPECIFIC SOLUTION AWARE MESSAGING (from Manifesto + Four Books):**
- "Compression Without Compromise" — Medical support that doesn't sacrifice comfort. The mechanism: graduated compression + non-binding tops.
- "Not Your Grandmother's Compression Socks" — Schwartz's "new mechanism" framing. Old compression = tourniquet pain, ugly beige, hard to put on. New = Viasox's approach.
- "The Skeptic Converter" — Lead with "I didn't believe socks could help either" → mechanism → proof → conversion. 18% of reviewers are Skeptic Converted — massive proof pool.
- "Why 107K+ Reviews" — Social proof at scale. For Solution Aware, review volume IS the mechanism ("this many people can't be wrong").
- Hopkins' specificity applied: Not "comfortable compression" but "compression that 47% of reviewers describe using the word 'comfortable' in their first sentence."
- Neumeier's differentiation: The trifecta positioning — medical support + fashion design + accessibility — no competitor owns all three.

**CONCEPT FORMAT REQUIREMENTS (Solution Aware):**
- Every concept must name what the viewer has ALREADY TRIED or considered (pharmacy compression, medical brands, generic socks).
- The concept must clearly articulate the MECHANISM that makes Viasox different — not just "we're better" but WHY, specifically.
- Include comparative framing: old way vs. new way, or competitor approach vs. Viasox approach (without naming competitors).
- Proof density should be high — more data points, more testimonial references than Problem Aware.
- CTA should be medium-direct: "try your first pair," "see why [X]K switched," "compare for yourself."

**ANGLE TYPE ADJUSTMENTS FOR SOLUTION AWARE:**
- Comparison-Based → STRONGEST angle type. Old way vs. new way. Failed solutions vs. Viasox. The mechanism contrast.
- Solution-Based → directly applicable. Lead with the solution mechanism.
- Testimonial-Based → "Skeptic Converted" testimonials are GOLD here. "I tried everything. Then I found..."
- Education-Based → teach the MECHANISM: "Why non-binding tops work differently than regular compression."
- Identity-Based → combine identity with solution journey: "I'm a nurse. I've tried every compression sock. Here's the one that actually works."
- Problem-Based → only a BRIEF problem acknowledgment (1-2 seconds), then pivot to differentiation.
- Emotion-Based → the emotion is HOPE + DISCOVERY, not pain. "The feeling of finding something that actually works."
- Fear-Based → reframe as "Don't settle for solutions that don't work" — not problem fear but poor-choice fear.
- Aspiration-Based → "Imagine compression that actually feels like THIS" — the after state specifically of THIS solution.
- Contrarian/Myth Buster → "Everything you've been told about compression socks is wrong" — challenge category beliefs.

**SCHWARTZ HEADLINE RULES FOR SOLUTION AWARE:**
- Lead with the MECHANISM or what's NEW about the approach
- Can mention the product category AND differentiation
- Can mention Viasox if the differentiation is the headline focus
- Must frame AGAINST the alternatives: "unlike [old way]," "the first [X] that..."
- Social proof numbers carry maximum weight at this stage`,

  'Product Aware': `## AWARENESS LEVEL: PRODUCT AWARE — CONCEPT & ANGLE RULES

**WHO THEY ARE:**
These people know Viasox EXISTS. They've seen an ad, visited the site, maybe added to cart — but haven't purchased yet. OR they've purchased one product and don't know about others. They know the brand. They know roughly what it does. They need the final push: deeper proof, stronger social proof, specificity that tips them from "interested" to "convinced."

**SCHWARTZ'S RULE FOR PRODUCT AWARE:**
"Your prospect knows your product. He just hasn't decided to buy yet. Your headline must work harder on BUILDING DESIRE — sharpen it, intensify it, concentrate it. Pile up every ounce of proof, every bit of social evidence, every detail that makes the product's mechanism irresistible."

**THE CREATIVE MANDATE — WHAT MAKES PRODUCT AWARE CONCEPTS DIFFERENT:**

Product Aware is the PROOF stage. They don't need awareness (Unaware), pain acknowledgment (Problem Aware), or differentiation (Solution Aware). They need CONVICTION.

1. **Lead with PROOF, SPECIFICITY, or what's NEW.** They know Viasox. Now overwhelm them with evidence that tips the scale.
   - Hopkins: "Specificity IS credibility. The more precise the number, the more believable the claim."
   - Schwartz: "Pile up proof. Documentation, testimonials, demonstrations, data — the WEIGHT of evidence creates conviction."

2. **The brand name can lead.** Unlike every other awareness level, Product Aware ads can open with "Viasox" because the viewer already has positive associations. Use this to your advantage — brand recognition stops the scroll.

3. **Go DEEP on a single benefit, not wide on many.** At Product Aware, the viewer has heard the overview. Now show them the DEPTH of one specific thing — the most impressive data point, the most emotional testimonial, the most surprising specific.
   - Bly: "When someone already knows the product, your job shifts from explaining to INTENSIFYING. Take one benefit and make it undeniable."

4. **Product appears IMMEDIATELY.** Product Aware concepts should show or mention the product in the first 3 seconds. The recognition is your hook — they already know what this is.

5. **Concept structure: Brand/Product Recognition → Intensified Proof → Deeper Desire → Urgency/CTA.**
   - Recognition: "You've seen Viasox..." or show the product/patterns immediately (instant recognition)
   - Intensified Proof: One powerful proof point explored deeply — not a list, a STORY
   - Deeper Desire: Make them feel what owning this would be like — Schwartz's visualization of fulfillment
   - CTA: Direct — "Get yours," "Try your first pair," "Shop now." No softness needed.

**VIASOX-SPECIFIC PRODUCT AWARE MESSAGING (from Manifesto + Four Books):**
- "107,000+ 5-Star Reviews" — The weight of social proof. At Product Aware, review volume converts.
- "Here's What Nurses Are Saying" — Identity-specific proof deep-dive. One segment's overwhelming endorsement.
- "The Socks With a Cult Following" — Repeat purchase data, word-of-mouth expansion ("my husband asked me to buy him a pair").
- "New Patterns Just Dropped" — What's NEW re-engages Product Aware prospects. Fresh product = fresh reason to act.
- Schwartz's Three Dimensions at Product Aware:
  - DESIRE: Show the most vivid customer transformation story — make them WANT
  - IDENTIFICATION: Show their exact identity segment wearing and loving the product
  - BELIEF: Data cascade — review count, star rating, specific percentages, named customer stories
- Hopkins' Sample Principle: "Let the product speak for itself." Show the product in action — the ease of putting on, the comfort throughout the day, the pattern beauty, the absence of marks.

**CONCEPT FORMAT REQUIREMENTS (Product Aware):**
- Every concept should reference a specific data point that builds conviction (review count, specific percentage, customer quote).
- The concept must go DEEPER on proof than Solution Aware — more specific, more vivid, more undeniable.
- Can reference previous touchpoints: "You've seen us in your feed..." or "Everyone's been asking about..."
- CTA should be DIRECT: "Shop now," "Get your pair," "Try today." No "learn more."
- Include urgency where genuine: new arrivals, seasonal relevance, limited patterns.

**ANGLE TYPE ADJUSTMENTS FOR PRODUCT AWARE:**
- Testimonial-Based → STRONGEST. Deep customer stories, not surface quotes. One powerful testimonial explored in depth.
- Social Proof → review cascade, before/after stories, word-of-mouth evidence.
- Identity-Based → show their SPECIFIC segment already loving the product. "Every nurse on my unit wears these."
- Aspiration-Based → the after state IS the product. "This is what your mornings look like with Viasox."
- Comparison-Based → comparative superiority. "The highest-rated [X] in [category]."
- Problem-Based → only as a brief reminder. "Remember those marks? They're gone."
- Emotion-Based → the emotion is DESIRE and BELONGING, not pain. "Join the 107K+ people who..."
- Education-Based → deep-dive on mechanism: "Here's exactly HOW non-binding compression works."
- Solution-Based → the solution IS Viasox. Go deep on specifics.
- Seasonal/Situational → NEW reasons to buy: seasonal patterns, gift occasions, product launches.

**SCHWARTZ HEADLINE RULES FOR PRODUCT AWARE:**
- CAN lead with the brand name
- Lead with the strongest proof point or what's NEW
- Pile up specifics: numbers, percentages, review quotes
- "The only [X] rated [Y] by [Z]" — superiority claims backed by data
- New angles on a known product: "What you didn't know about Viasox..."`,

  'Most Aware': `## AWARENESS LEVEL: MOST AWARE — CONCEPT & ANGLE RULES

**WHO THEY ARE:**
These people are READY TO BUY. They know Viasox, they want Viasox, they just need the final nudge — a deal, a new reason, urgency, or simply a reminder at the right moment. These are cart abandoners, site visitors, past customers considering repurchase, and people who've engaged with multiple ads. The sale is theirs to lose.

**SCHWARTZ'S RULE FOR MOST AWARE:**
"Here, the prospect is completely familiar with the product and its claims. He is on the verge of buying. Your headline need do little more than announce the product by name, state a new benefit, or provide a new price."

**THE CREATIVE MANDATE — WHAT MAKES MOST AWARE CONCEPTS DIFFERENT:**

Most Aware is the CONVERSION stage. Every other stage builds toward this moment. The creative must be tight, direct, and action-oriented. No education needed. No awareness needed. No differentiation needed. Just the PUSH.

1. **Lead with the OFFER, the DEAL, or what's NEW.** They know everything. Give them a REASON TO ACT NOW.
   - Schwartz: "The only new thing you can tell them is a new benefit, a new mechanism of action, or a new price."
   - Hopkins: "Make the next step irresistible. Reduce risk. Make action easy."

2. **URGENCY must be genuine.** Not manufactured scarcity. Real reasons: limited-time offer, seasonal relevance, new pattern drop, restocked favorites, holiday gifting deadline.
   - Bly: "URGENT — the first of the 4 U's. Give a REAL reason to act today, not tomorrow."

3. **Keep it SHORT.** Most Aware ads are the shortest of all awareness levels. They don't need the story, the education, the proof cascade. They need: Recognition → Offer/News → CTA. Done.
   - Hopkins: "Don't waste words on people who are already convinced. Get out of the way and let them buy."

4. **Product is the HERO from frame one.** The product, the brand, the offer — all visible immediately. Zero warm-up needed.

5. **Concept structure: Instant Recognition → News/Offer/Urgency → Frictionless CTA.**
   - Recognition: Product + brand name in the first second
   - News/Offer: The NEW thing — new price, new patterns, limited time, bundle deal
   - CTA: Remove ALL friction. "Shop now," "Get yours before they're gone," "Add to cart."

**VIASOX-SPECIFIC MOST AWARE MESSAGING (from Manifesto + Four Books):**
- Offer-led: "Buy 2 Get 3 Free — This Week Only" — clean, direct, no explanation needed.
- What's New: "6 New Patterns Just Dropped" — novelty for repeat visitors and past customers.
- Reminder/Retargeting: "Still thinking about it? Your cart's waiting." — direct retargeting language.
- Social proof as final push: "107,447 reviews. 4.8 stars. What are you waiting for?"
- Gifting CTA: "The perfect gift for someone you love" — caregiver/gift buyer segment activation.
- Repurchase: "Time to restock? Your favorites are back." — Repeat Loyalist segment.
- Scarcity: "Our best-selling pattern sold out in 3 days last time" — genuine scarcity.
- Risk reversal: "Try risk-free. Love them or return them." — remove the last objection.
- Schwartz's three dimensions at Most Aware:
  - DESIRE: Already maximized. Just REMIND them of it.
  - IDENTIFICATION: "You already know you're a Viasox person."
  - BELIEF: Already established. The offer IS the belief confirmation.

**CONCEPT FORMAT REQUIREMENTS (Most Aware):**
- Concepts should be TIGHT — no lengthy setup, no education, no problem agitation.
- The offer or news must be front and center.
- Every concept must have a clear, frictionless CTA with a specific next step.
- Can be the simplest concepts — sometimes a product shot + headline + CTA is all you need.
- Include urgency mechanisms: time-limited, quantity-limited, seasonal, or occasion-driven.
- For Static ads, Most Aware concepts are essentially product + offer + CTA — clean and direct.

**ANGLE TYPE ADJUSTMENTS FOR MOST AWARE:**
- Seasonal/Situational → STRONGEST. Timing creates urgency: "Mother's Day is Sunday," "Holiday shipping deadline," "New Year, new patterns."
- Testimonial-Based → one POWER quote, not a story. "Life-changing. I've ordered 8 pairs." — quick validation.
- Social Proof → numbers only. "107K+ reviews. 4.8 stars." No explanation needed.
- Comparison-Based → NOT recommended. They're past comparing. Focus on acting.
- Problem-Based → NOT recommended. The problem is solved in their mind. Don't re-open it.
- Emotion-Based → the emotion is EXCITEMENT and ANTICIPATION. "Finally getting the pair you've been eyeing."
- Education-Based → NOT recommended. They know everything. Don't re-educate.
- Fear-Based → only as FOMO: "Don't miss this deal," "This pattern sold out last time."
- Identity-Based → "Join 107K+ customers" — belonging as the final nudge.
- Aspiration-Based → brief vision only: "Imagine never thinking about your socks again. That starts today."

**SCHWARTZ HEADLINE RULES FOR MOST AWARE:**
- Lead with the BRAND NAME + OFFER or NEWS
- "Viasox — Buy 2 Get 3 Free" is a perfectly valid Most Aware headline
- Announce what's NEW: new price, new product, new pattern, new bundle
- Simplest headlines of all awareness levels — clarity over creativity
- The DEAL is the headline. No need to be clever.`
};

/* ------------------------------------------------------------------ */
/*  HOOK guides (used by hooksPrompt)                                  */
/* ------------------------------------------------------------------ */

const HOOK_GUIDES: Record<AwarenessLevel, string> = {
  'Unaware': `## AWARENESS LEVEL: UNAWARE — HOOK RULES

**THE FUNDAMENTAL HOOK CHALLENGE FOR UNAWARE:**
You must stop the scroll of someone who DOES NOT KNOW THEY HAVE A PROBLEM. You cannot use problem language, product language, or solution language. You must enter through a DIFFERENT door — curiosity, identity, story, or emotion they already feel.

**WHAT UNAWARE HOOKS MUST DO:**
1. Create curiosity or identification in the first 1-2 seconds WITHOUT referencing socks, compression, marks, swelling, or any product benefit
2. Select the right audience through identity or situation, not through problem naming
3. Feel like content (a story, an interesting fact, a relatable moment) — NOT like an ad
4. Create an information gap that can ONLY be closed by watching more

**HOOK FRAMEWORK FOR UNAWARE (Schwartz + Hopkins):**
- Schwartz: "For Unaware audiences, the headline must be so compelling on its own that the prospect is drawn in purely by curiosity or identification — before they know what you're selling."
- Hopkins: "Select your audience, but do it through their WORLD, not your product."
- Neumeier: "We notice what's DIFFERENT. Your hook must break the pattern of every other ad."
- Bly: "The sole purpose of the first line is to get them to read the second line. For Unaware, that means pure magnetism."

**UNAWARE HOOK PATTERNS:**
- **Identity opener:** "You know that thing nurses do at 6 PM that nobody talks about?" (identity + curiosity)
- **Disrupted normality:** "I used to think [normalized behavior] was just part of getting older." (reframe)
- **Observation hook:** "I noticed something weird about my legs last Tuesday." (curiosity + story)
- **Social curiosity:** "Why are 107,000 people obsessed with [category hint, not product]?" (mass behavior curiosity)
- **Counter-intuitive:** "The thing you put on first every morning might be the thing hurting you most." (disruption without naming)

**FORBIDDEN IN UNAWARE HOOKS:**
- Product name (Viasox)
- Category words (compression, diabetic, non-binding)
- Problem words (sock marks, swelling, edema, neuropathy)
- Solution words (support, graduated compression, wide-mouth)
- Price, offers, or CTAs
- Any language that assumes the viewer knows they have a problem`,

  'Problem Aware': `## AWARENESS LEVEL: PROBLEM AWARE — HOOK RULES

**THE FUNDAMENTAL HOOK CHALLENGE FOR PROBLEM AWARE:**
You must name their SPECIFIC pain so precisely that they feel instantly SEEN — like you're reading their mind. Then intensify it. The hook is the "squeeze" (Schwartz) that makes the solution feel urgent.

**WHAT PROBLEM AWARE HOOKS MUST DO:**
1. Name a specific pain point they RECOGNIZE in the first 1-2 seconds
2. Use their OWN language — the exact words they'd use to describe their problem
3. Create a "that's exactly what I go through" reaction — instant identification through shared pain
4. Intensify the problem enough that they NEED to see the solution

**HOOK FRAMEWORK FOR PROBLEM AWARE (Schwartz + Hopkins + Bly):**
- Schwartz: "Intensify the desire. Make the pain so vivid, so specific, so PERSONAL that they can't scroll past."
- Hopkins: "Be specific about the problem. The more precise the description, the more the right person feels selected."
- Bly: "Hit the FEELING behind the symptom. Not 'sock marks' but 'the moment you look down and wonder what's happening to your body.'"
- Neumeier: "Empathy is brand's most powerful tool. Show you UNDERSTAND before you SOLVE."

**PROBLEM AWARE HOOK PATTERNS:**
- **Vivid symptom naming:** "Those red lines on your ankles that are still there 2 hours later?" (pain specificity)
- **Emotional impact:** "When putting on socks becomes the hardest part of your morning..." (dignity/independence)
- **Identity + pain:** "Nurses: your feet shouldn't hurt this much after a 12-hour shift." (identity selector + pain)
- **Normalization breaker:** "You've been saying 'my feet just do that now.' They don't have to." (disrupting acceptance)
- **Comparison with suffering:** "Remember when your legs didn't look like this at the end of the day?" (temporal comparison)
- **Hidden suffering:** "Nobody sees the marks under your pants. But you know they're there." (private pain)

**PROBLEM AWARE HOOKS CAN USE:**
- Specific symptom language (marks, swelling, pain, tightness, difficulty)
- Customer language from reviews (verbatim phrases)
- Identity selectors (nurses, diabetics, seniors, caregivers — paired with the pain)
- Emotional language (frustration, embarrassment, fear, resignation)

**FORBIDDEN IN PROBLEM AWARE HOOKS:**
- Product name in the hook (save for the body)
- Solution mechanisms (non-binding, graduated compression — save for the body)
- Offers or prices
- Direct CTAs`,

  'Solution Aware': `## AWARENESS LEVEL: SOLUTION AWARE — HOOK RULES

**THE FUNDAMENTAL HOOK CHALLENGE FOR SOLUTION AWARE:**
You must DIFFERENTIATE in the first 2-3 seconds. They already know the problem. They already know solutions exist. Your hook must communicate "THIS is different from what you've tried" instantly.

**WHAT SOLUTION AWARE HOOKS MUST DO:**
1. Acknowledge that solutions exist but set up WHY this one is different — in the first 2-3 seconds
2. Introduce a new MECHANISM, a new CLAIM, or new PROOF that separates Viasox from alternatives
3. Address the skepticism of someone who may have been disappointed by previous solutions
4. Create the "I haven't heard THIS before" reaction

**HOOK FRAMEWORK FOR SOLUTION AWARE (Schwartz + Hopkins + Neumeier):**
- Schwartz: "New mechanism — give them a REASON WHY this product works when others haven't. The mechanism IS the headline."
- Hopkins: "Specificity is your weapon. The most specific claim wins — '47% of nurses said comfortable in their first sentence' beats 'comfortable compression.'"
- Neumeier: "Differentiate in the first beat. Show the gap between what exists and what you offer."
- Bly: "Address the BELIEF that nothing works. Break it with undeniable specificity."

**SOLUTION AWARE HOOK PATTERNS:**
- **New mechanism:** "Compression that doesn't feel like a tourniquet — here's why." (mechanism differentiation)
- **Failure acknowledgment:** "If every compression sock you've tried hurts by noon, you've been wearing the wrong kind." (empathy + mechanism)
- **Data-led differentiation:** "4.8 stars from 107,000+ reviews. Most compression socks can't even get 1,000." (proof as differentiation)
- **Category contrast:** "Not your grandmother's compression socks." (old vs. new framing)
- **Skeptic conversion:** "I was done trying compression socks. Then someone showed me these." (testimonial-led differentiation)
- **Mechanism specificity:** "Non-binding tops. No sock marks. Here's the science behind it." (mechanism hook)

**SOLUTION AWARE HOOKS CAN USE:**
- Product category language (compression socks, diabetic socks)
- Mechanism language (non-binding, wide-mouth, graduated)
- Comparative framing (vs. pharmacy brands, vs. what they've tried)
- Social proof numbers (review count, star rating)
- Viasox brand name (if paired with differentiation)

**FORBIDDEN IN SOLUTION AWARE HOOKS:**
- Long problem agitation (they know the problem — don't re-agitate)
- Generic claims without proof ("the best compression socks" with no specifics)
- Offer/price in the hook (save for the body/CTA)`,

  'Product Aware': `## AWARENESS LEVEL: PRODUCT AWARE — HOOK RULES

**THE FUNDAMENTAL HOOK CHALLENGE FOR PRODUCT AWARE:**
They already know Viasox. The hook must offer something NEW — new proof, a new angle on a known benefit, deeper data, a fresh testimonial, or news they haven't seen.

**WHAT PRODUCT AWARE HOOKS MUST DO:**
1. Leverage brand recognition — they know who you are, use that
2. Offer NEW information: deeper proof, new data, new customer story, new benefit angle
3. Re-intensify desire with specificity they haven't seen before
4. Create "I already liked them, and NOW I'm definitely buying" momentum

**HOOK FRAMEWORK FOR PRODUCT AWARE (Schwartz + Hopkins):**
- Schwartz: "Sharpen, intensify, and concentrate the desire. Pile up proof. Every specific detail adds weight."
- Hopkins: "The most powerful proof is specific. Not 'thousands love us' but '107,447 reviews and the average rating is 4.82 stars.'"
- Bly: "When they already know the product, your job is to INTENSIFY, not educate."
- Neumeier: "Trust = Reliability + Delight. Show both — it works AND there's something wonderful about it."

**PRODUCT AWARE HOOK PATTERNS:**
- **Data deep-dive:** "107,447 reviews. We read every single one. Here's what surprised us." (fresh angle on known proof)
- **Power testimonial:** "'These socks saved my nursing career.' — Sarah, RN, 12-year veteran." (deep story hook)
- **What's new:** "6 new patterns just dropped. Selling fast." (novelty for existing audience)
- **Deeper benefit:** "You know they're comfortable. But did you know 73% of nurses say they reduced swelling?" (deeper layer)
- **Social belonging:** "The nurse thing is real — every floor at my hospital wears these now." (tribe belonging)
- **Behind-the-scenes:** "Why we made the opening 4 inches wider than any other sock." (mechanism deep-dive)

**PRODUCT AWARE HOOKS CAN USE:**
- Brand name prominently (Viasox)
- Specific data points and statistics
- Named customer stories
- Product news (new colors, patterns, products)
- Strong proof claims

**PRODUCT AWARE HOOKS SHOULD AVOID:**
- Re-explaining what the product is (they know)
- Problem agitation (solved in their mind)
- Generic category language (they're past "compression socks help")
- Soft CTAs (they're close — be direct)`,

  'Most Aware': `## AWARENESS LEVEL: MOST AWARE — HOOK RULES

**THE FUNDAMENTAL HOOK CHALLENGE FOR MOST AWARE:**
These people need the DEAL, the NUDGE, or the REMINDER. The hook is the shortest and most direct of all awareness levels. Don't be clever. Be clear.

**WHAT MOST AWARE HOOKS MUST DO:**
1. Get straight to the point — offer, news, or urgency in the first 1-2 words
2. Create FOMO or urgency that tips them from "I'll buy later" to "I need to buy NOW"
3. Remove the last obstacle: price, timing, risk, or indecision
4. Feel like a reminder from a trusted friend, not a sales pitch

**HOOK FRAMEWORK FOR MOST AWARE (Schwartz + Hopkins):**
- Schwartz: "The headline need do nothing more than announce the product, state a deal, or present what's new."
- Hopkins: "Make the next step irresistible. Reduce risk. Make action easy. Remove friction."
- Bly: "URGENT — the first U. Give them a real reason this moment matters."
- Neumeier: "At this stage, the brand does the heavy lifting. The gut feeling is formed. Just make it easy to act."

**MOST AWARE HOOK PATTERNS:**
- **Offer-first:** "Buy 2 Get 3 Free — this week only." (pure offer)
- **Urgency:** "Last chance: our best-selling pattern sold out in 3 days." (genuine scarcity)
- **Cart reminder:** "Still in your cart. Still waiting for you." (retargeting)
- **Novelty:** "Just dropped: 6 new patterns you haven't seen yet." (news)
- **Risk reversal:** "Try them risk-free. Love them or send them back." (friction removal)
- **Gifting CTA:** "The perfect gift for someone on their feet all day." (occasion)
- **Restock:** "Time to restock your favorites? They're back in stock." (repeat buyer)

**MOST AWARE HOOKS CAN USE:**
- Brand name as the first word
- Price and offer details
- Urgency language (limited time, selling fast, last chance)
- Direct CTAs ("Shop now," "Get yours," "Claim your pair")
- Seasonal/occasion triggers

**MOST AWARE HOOKS ARE:**
- The SHORTEST of all awareness levels
- The most DIRECT of all awareness levels
- The most OFFER-FOCUSED of all awareness levels`
};

/* ------------------------------------------------------------------ */
/*  SCRIPT guides (used by scriptPrompt)                               */
/* ------------------------------------------------------------------ */

const SCRIPT_GUIDES: Record<AwarenessLevel, string> = {
  'Unaware': `## AWARENESS LEVEL: UNAWARE — SCRIPT ARCHITECTURE

**SCRIPT STRUCTURE RULES (Unaware):**
The entire script architecture changes for Unaware. You are not writing a product ad. You are writing a piece of CONTENT that happens to lead to a product.

**TIME ALLOCATION:**
- 15s: 0:00-0:10 identification/story → 0:10-0:13 awareness shift → 0:13-0:15 curiosity CTA
- 30s: 0:00-0:15 identification/story → 0:15-0:22 awareness shift → 0:22-0:27 solution hint → 0:27-0:30 soft CTA
- 60s: 0:00-0:30 deep identification/story → 0:30-0:40 awareness shift → 0:40-0:52 solution reveal → 0:52-0:60 soft CTA

**KEY RULES:**
1. The product name does NOT appear in the first 50% of the script. Period.
2. "Socks," "compression," "marks," "swelling" do NOT appear in the first 40%.
3. The script reads like a STORY or CONTENT piece — never like an ad — until the final section.
4. The hook must pull in through curiosity, identity, or emotion — never through the product.
5. The "awareness shift" is the climax — the moment the viewer goes from "I don't have a problem" to "Wait..."
6. CTA is SOFT: "Learn more," "See what [X] people found," "Discover," "Watch this."
7. NO offers, NO prices, NO deals in Unaware scripts. The CTA is about CURIOSITY, not commerce.

**FRAMEWORK ADJUSTMENTS FOR UNAWARE:**
- PAS → Problem phase must be framed as LIFE REALITY, not product-related pain. "This is what your morning looks like" not "your socks leave marks."
- AIDA-R → Attention phase uses pure curiosity/identity. Interest is about the STORY, not the product.
- Before-After-Bridge → Before is a LIFE state. After is a LIFE state. Bridge is the discovery, not the product.
- Hook-Story-Offer → Story is 80% of the script. "Offer" is just "discover" / "learn more."
- All frameworks shift heavily toward story/identification and away from product.

**SCHWARTZ'S THREE DIMENSIONS AT UNAWARE:**
- DESIRE: Tap into desires they ALREADY have (comfort, independence, health, looking good) — don't create new ones
- IDENTIFICATION: This is the primary dimension. Show THEIR world. THEIR morning. THEIR struggle. THEIR identity.
- BELIEF: Not relevant yet. They don't need to believe in the product. They need to believe they have a problem worth solving.

**TONE:**
- Conversational, warm, relatable
- NEVER clinical, technical, or salesy
- The viewer should think "this isn't an ad" for at least the first half
- Mirror their actual self-talk and daily internal monologue`,

  'Problem Aware': `## AWARENESS LEVEL: PROBLEM AWARE — SCRIPT ARCHITECTURE

**SCRIPT STRUCTURE RULES (Problem Aware):**
Problem Aware scripts are the AGITATION scripts. The viewer knows their pain — your job is to make it feel MORE URGENT, then reveal the path to relief. This is Schwartz's "intensification" in full force.

**TIME ALLOCATION:**
- 15s: 0:00-0:03 pain hook → 0:03-0:08 agitate → 0:08-0:12 solution bridge → 0:12-0:15 CTA
- 30s: 0:00-0:05 pain hook → 0:05-0:15 agitate/intensify → 0:15-0:22 solution reveal → 0:22-0:27 proof → 0:27-0:30 CTA
- 60s: 0:00-0:05 pain hook → 0:05-0:20 deep agitation → 0:20-0:35 solution reveal + mechanism → 0:35-0:50 proof cascade → 0:50-0:60 CTA

**KEY RULES:**
1. The PAIN is the hero of the first half. Name it with extreme specificity.
2. Use customer language VERBATIM from the reviews. Their words, not marketing words.
3. The agitation phase must make them FEEL the problem more acutely — sensory language, vivid details, emotional impact.
4. The bridge from pain to solution must feel EARNED, not forced. "But what if..." is the pivot.
5. The product appears in the second half — the RELIEF after the squeeze.
6. CTA is medium-soft: "Try your first pair," "See how it works," "Read the reviews."
7. Offers can be mentioned but should NOT be the primary CTA driver. The SOLUTION is the driver.

**FRAMEWORK ADJUSTMENTS FOR PROBLEM AWARE:**
- PAS → This is PAS's NATIVE awareness level. Problem and Agitate phases are the longest. Solution is the payoff.
- Before-After-Bridge → Before is the PAIN state in vivid detail. After is the relief. Bridge is the product.
- Feel-Felt-Found → Natural fit. "I know how you feel" = problem acknowledgment.
- Empathy-Education-Evidence → Empathy phase is the pain mirror. Education is "why this happens."

**SCHWARTZ'S THREE DIMENSIONS AT PROBLEM AWARE:**
- DESIRE: Channel the desire for RELIEF. Make the absence of pain feel desperately desirable.
- IDENTIFICATION: Mirror their exact experience. "Is this person ME?" should be the reaction.
- BELIEF: Begin building it. Introduce just enough mechanism to create "this might actually work."

**TONE:**
- Empathetic, understanding, validating — then hopeful
- "I see you. I know what you're going through. And there's something that helps."
- The pain section should feel like someone who GETS IT. Not clinical. Personal.
- The solution section should feel like sharing a genuine discovery, not selling.`,

  'Solution Aware': `## AWARENESS LEVEL: SOLUTION AWARE — SCRIPT ARCHITECTURE

**SCRIPT STRUCTURE RULES (Solution Aware):**
Solution Aware scripts are DIFFERENTIATION scripts. They already know the problem AND that solutions exist. Your script must answer ONE question: "Why THIS solution and not the others?"

**TIME ALLOCATION:**
- 15s: 0:00-0:03 differentiation hook → 0:03-0:08 mechanism → 0:08-0:12 proof → 0:12-0:15 CTA
- 30s: 0:00-0:05 differentiation hook → 0:05-0:12 mechanism/what's different → 0:12-0:20 proof + testimonial → 0:20-0:27 deeper benefit → 0:27-0:30 CTA
- 60s: 0:00-0:05 differentiation hook → 0:05-0:10 failed-solution acknowledgment → 0:10-0:25 new mechanism deep-dive → 0:25-0:40 proof cascade → 0:40-0:52 transformation story → 0:52-0:60 CTA

**KEY RULES:**
1. Do NOT spend significant time on the problem. A brief acknowledgment (2-3 seconds max) is enough.
2. Lead with DIFFERENTIATION — what makes Viasox fundamentally different from what they've tried.
3. The MECHANISM is the star: non-binding tops, graduated compression, wide-mouth design, fashion patterns.
4. Heavy proof: review data, specific percentages, customer quotes, before/after.
5. The product appears EARLY — within the first 30% of the script. They're ready to evaluate.
6. CTA is medium-direct: "Try your first pair," "See why [X]K switched," "Compare for yourself."
7. Offers can support the CTA but the DIFFERENTIATION is the primary driver.

**FRAMEWORK ADJUSTMENTS FOR SOLUTION AWARE:**
- Contrast Framework → NATIVE to Solution Aware. Old way vs. new way. Failed solutions vs. Viasox.
- Skeptic Converter → Perfect for Solution Aware. Objection → twist → conversion.
- Problem-Promise-Proof-Push → Problem is BRIEF (they know). Promise = mechanism. Proof is heavy. Push is direct.
- Myth Buster → Challenge category beliefs. "Everything you know about compression is wrong."

**SCHWARTZ'S THREE DIMENSIONS AT SOLUTION AWARE:**
- DESIRE: Already established. SHARPEN it by showing how close the fulfillment is with this specific product.
- IDENTIFICATION: "People like me have found this" — show their segment already using and loving it.
- BELIEF: PRIMARY dimension. Build conviction through mechanism, proof, and undeniable data.

**TONE:**
- Confident, authoritative, proof-driven
- "Here's why this is different. Here's the proof. Here's what happened when people tried it."
- Acknowledges their skepticism without being defensive
- Data-forward: specifics, percentages, real numbers from reviews`,

  'Product Aware': `## AWARENESS LEVEL: PRODUCT AWARE — SCRIPT ARCHITECTURE

**SCRIPT STRUCTURE RULES (Product Aware):**
Product Aware scripts are PROOF INTENSIFICATION scripts. They know Viasox. They need ONE MORE THING to tip them over the edge. Your script provides that thing — deeper proof, a fresh angle, or an irresistible demonstration.

**TIME ALLOCATION:**
- 15s: 0:00-0:03 brand recognition + new info hook → 0:03-0:10 deep proof point → 0:10-0:15 CTA
- 30s: 0:00-0:05 brand recognition + new info hook → 0:05-0:15 deep proof/story → 0:15-0:22 intensified desire → 0:22-0:27 offer/urgency → 0:27-0:30 CTA
- 60s: 0:00-0:05 brand recognition + new info hook → 0:05-0:20 deep customer story → 0:20-0:35 proof cascade → 0:35-0:47 mechanism deep-dive → 0:47-0:55 offer → 0:55-0:60 CTA

**KEY RULES:**
1. Brand name/product appears in the FIRST 3 SECONDS. They know you. Use recognition as the hook.
2. Introduce NEW information they haven't seen: deeper data, new testimonial, behind-the-scenes, new product.
3. Go DEEP on one proof point rather than wide on many. One powerful story > five bullet points.
4. The product IS the solution — no need to bridge from problem to solution.
5. CTA is DIRECT: "Shop now," "Get your pair," "Try today." They're ready.
6. Offers strengthen Product Aware CTAs significantly. Include if available.

**FRAMEWORK ADJUSTMENTS FOR PRODUCT AWARE:**
- AIDA-R → Attention is brand recognition. Interest is new information. Desire is intensified proof. Action is direct CTA.
- Star-Story-Solution → Star = real customer. Story = deep transformation. Solution = Viasox (named early).
- Hook-Story-Offer → Hook = new angle on known product. Story = deep proof. Offer = direct.

**SCHWARTZ'S THREE DIMENSIONS AT PRODUCT AWARE:**
- DESIRE: INTENSIFY with the most vivid customer story or data point available.
- IDENTIFICATION: Show THEIR specific segment already using the product. "Every nurse on my unit."
- BELIEF: PILE UP proof. At Product Aware, the weight of evidence creates final conviction.

**TONE:**
- Confident, enthusiastic, proof-rich
- "Here's something about Viasox you didn't know. Here's why it matters."
- Feels like a friend sharing new information about something you already like
- More direct and assertive than lower awareness levels`,

  'Most Aware': `## AWARENESS LEVEL: MOST AWARE — SCRIPT ARCHITECTURE

**SCRIPT STRUCTURE RULES (Most Aware):**
Most Aware scripts are the SHORTEST, MOST DIRECT scripts. No education, no proof cascade, no awareness building. Just: recognition → offer/news → CTA. Get out of the way and let them buy.

**TIME ALLOCATION:**
- 15s: 0:00-0:03 product + offer → 0:03-0:10 urgency/details → 0:10-0:15 CTA
- 30s: 0:00-0:05 product + offer/news → 0:05-0:15 quick proof/urgency → 0:15-0:22 details → 0:22-0:27 risk reversal → 0:27-0:30 CTA
- 60s: 0:00-0:05 product + offer → 0:05-0:15 quick proof/social → 0:15-0:25 offer details → 0:25-0:35 urgency → 0:35-0:50 product showcase → 0:50-0:60 CTA

**KEY RULES:**
1. Product name and offer in the FIRST sentence. No warm-up.
2. Keep it SHORT even when the duration is long. Dead space > unnecessary words at Most Aware.
3. Urgency must be GENUINE: real deadlines, real scarcity, real seasonal relevance.
4. Risk reversal handles the last objection: "Love them or return them. Risk-free."
5. CTA is the MOST DIRECT of all levels: "Buy now," "Shop the sale," "Claim your pair," "Add to cart."
6. Offers are the PRIMARY driver. B1G1, B2G3, free shipping, limited-time deals.
7. For retargeting: "You left something in your cart" or "Back in stock" is sufficient as the entire concept.

**FRAMEWORK ADJUSTMENTS FOR MOST AWARE:**
- Problem-Promise-Proof-Push → Skip Problem. Promise = offer. Proof = quick social. Push = CTA.
- Hook-Story-Offer → Hook = brand + offer. Story = brief social proof. Offer = main event.
- Most frameworks are COMPRESSED. The offer IS the story.

**SCHWARTZ'S THREE DIMENSIONS AT MOST AWARE:**
- DESIRE: Already at maximum. Just REMIND them. Show the product looking beautiful.
- IDENTIFICATION: Already established. "You're already a Viasox person."
- BELIEF: Already built. The offer CONFIRMS their belief by making action irresistible.

**TONE:**
- Clean, direct, energetic
- "Here's the deal. It's amazing. Get it now."
- No hemming, no education, no qualification
- Confident brand voice — like a brand you love announcing a sale you've been waiting for`
};

/* ------------------------------------------------------------------ */
/*  Public exports                                                      */
/* ------------------------------------------------------------------ */

export function getAwarenessConceptGuide(level: AwarenessLevel): string {
  return CONCEPT_GUIDES[level] ?? '';
}

export function getAwarenessHookGuide(level: AwarenessLevel): string {
  return HOOK_GUIDES[level] ?? '';
}

export function getAwarenessScriptGuide(level: AwarenessLevel): string {
  return SCRIPT_GUIDES[level] ?? '';
}
