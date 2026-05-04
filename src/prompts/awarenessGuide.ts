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

**⚠️ STRATEGIC CONTEXT (April 2026 Manifesto Update):**
This is the DEFAULT awareness level for virtually every Viasox TOF ad. The 89,042 reviews we've analyzed are post-education — by the time customers write them, they're Most Aware. That rich review language describes what customers say AFTER they already know they need compression socks. It does NOT describe how unaware prospects think. **DO NOT pull Unaware hooks verbatim from review data.** Reviews guide the reframe and mechanism sections (beats 2-5), not the opening identification (beat 1). What the Unaware viewer hears about their experience is fundamentally different from what a review-writer remembers about it.

**WHO THEY ARE — THREE SUB-PERSONAS:**

Every Unaware ad must resonate with at least ONE of these three sub-personas. Pick the one your concept targets and write to them specifically. Do not try to serve all three in one ad.

**1. The Normalizer**
They have real discomfort — swelling, achy legs, sock marks, fatigue — and they've attributed it to something other than socks:
- "My legs just do that now."
- "I'm on my feet all day, what do you expect?"
- "Everyone my age has this."
- "It's just the weather / my shoes / getting older."
They are NOT looking for compression socks. They don't think socks are the problem. The ad must first break the attribution — then show the real cause.

**2. The Diagnosed Non-Searcher**
They have a medical condition (diabetes, neuropathy, varicose veins, lymphedema) and may even own compression socks from a pharmacy or doctor — but they've never connected their daily frustrations to a BETTER category of sock. They think their discomfort is part of the condition, not something fixable. The ad must reframe the daily friction as solvable and introduce Viasox as a category upgrade — not as "compression socks" (they've already written that category off).

**3. The Incidental Sufferer**
Their job or lifestyle produces the symptoms and they've written it off as part of the territory:
- Nurses, teachers, warehouse workers, hairstylists, servers, factory workers, retail staff
- "It's just part of the job."
- "Everyone at my work deals with this."
The ad must reframe the job pain as NOT inevitable — and position a specific, non-clinical solution that fits their work identity.

---

**SCHWARTZ'S THREE ELIMINATION RULES FOR UNAWARE (Breakthrough Advertising, pp. 36-38) — ALL THREE MUST BE HONORED IN THE HOOK:**

Eugene Schwartz spells out three things your headline/hook to an Unaware audience CANNOT DO. We enforce all three as hard rules:

**Rule 1 — NO PRICE:**
"You cannot mention the price, because your prospect does not yet see the value of that product."
The moment a price or offer appears, the ad dies. An Unaware viewer has no frame for what the thing is worth, so any price feels like an interruption — "why are they asking me for money?"

**Rule 2 — NO PRODUCT NAME:**
"You cannot mention the product, because your prospect does not yet know the product exists."
The brand name (Viasox), category name (compression socks, diabetic socks, non-binding socks), and specific mechanism (graduated compression, wide-mouth tops) are all forbidden in the opening. Mentioning them forces the viewer into "this is an ad for X" mode — and they scroll.

**Rule 3 — NO DIRECT PROBLEM OR SOLUTION STATEMENT:**
"You cannot even mention the need or desire it satisfies, because your prospect is not yet aware of that need or desire."
This is the rule most commonly broken by AI. "Tired of sock marks?" / "Dealing with swelling?" / "Your legs don't have to feel this way" — all three are DEAD on arrival with an Unaware audience. The viewer has not classified their experience as a problem yet, so any problem language rings hollow.

**What you CAN do instead:** Enter through an existing state the viewer ALREADY recognizes — a scene, a time of day, a mundane moment, a micro-behavior, a confusing piece of data, a casual observation. The awareness must be CREATED, not referenced.

---

**THE THREE UNAWARE TECHNIQUES (use one per concept):**

**Technique 1 — Scene Identification**
Open with a specific, sensory-rich scene from the viewer's daily life that has NO product context. The scene IS the hook. The viewer recognizes themselves because the scene is THEIR scene.

- Normalizer example: "It's 6:47 AM. You're sitting on the edge of the bed looking at your feet. Same as every morning. You've been doing this for two years and you don't even think about why anymore."
- Incidental Sufferer example: "The last hour of your shift you stop standing with both feet on the ground. You shift weight. You lean on the counter. Nobody's watching — but your body's already made the decision."
- Diagnosed Non-Searcher example: "You have three pairs of socks you like. Not because they're comfortable. Because they're the ones that leave the least marks."

The scene should feel like a documentary or a short story opening — never like a sock ad. No sock is named. No symptom is labeled. The viewer SEES themselves and stays.

**Technique 2 — The Mundane Reframe**
Take something the viewer does every day without thinking and reveal that it's a coping behavior for a problem they haven't named. The reveal IS the awareness shift.

- "The reason you take your shoes off the minute you get home isn't just because it feels good. Your feet have been trying to tell you something for the last four hours."
- "You cross and uncross your ankles without noticing. It's a signal your nervous system is sending your body. You're responding to it — you just never thought about why."
- "Every morning you roll your socks instead of pulling them. You've been doing it for a decade. When did you start? And why?"

The power of this technique: you bypass the viewer's defensive "this doesn't apply to me" reflex because you're describing something they're physically doing RIGHT NOW.

**Technique 3 — The False Cause Flip**
The viewer has already explained their symptom with a wrong cause. The hook names the wrong cause to earn recognition, then flips it to the real cause.

- "You think it's your shoes. You've bought three pairs in the last year trying to fix it. It's not your shoes."
- "You think you just have bad circulation. Your mom had it. Your aunt had it. You assumed it was in your genes. Turns out the thing you put on your legs every morning has more to do with it than your DNA."
- "You blame your age. You blame the weather. You blame how long you're on your feet. You've never blamed the thing touching your skin for 16 hours a day."

This technique is devastating for Normalizers and Incidental Sufferers specifically, because it speaks directly to attributions they've already made.

---

**THE 5-BEAT UNAWARE BODY STRUCTURE (Required skeleton for every Unaware script/concept):**

Every Unaware concept must be buildable into this 5-beat structure in the script:

1. **IDENTIFICATION (the hook + first ~25% of runtime)** — One of the three techniques above. Zero product, zero category, zero symptom label. Pure scene, mundane reframe, or false-cause flip. The viewer sees themselves.

2. **REFRAME (~25-45% of runtime)** — The "wait..." moment. The normalized experience is named as NOT normal. "That isn't just getting older. That isn't just your shoes." This is Schwartz's gradualization — the gentle shift from "I don't have a problem" to "wait... do I?"

3. **MECHANISM (~45-65% of runtime)** — A SHORT, plain-English explanation of WHY the thing they're doing/feeling is happening. Not a medical lecture. A 1-2 sentence "here's what's actually going on." (Example: "What you're putting on your legs every morning is cutting off circulation slightly. Not enough to alarm you. Just enough to make every hour of your day a little harder.")

4. **CATEGORY REVEAL (~65-85% of runtime)** — Only NOW do we reveal that there is a category of sock designed differently. Not Viasox yet. The category. "Socks that don't do that exist. They've been around for years. Most people don't know they're out there."

5. **PRODUCT REVEAL (~85-100% of runtime)** — Only NOW do we name Viasox. And only with a soft, curiosity-driving CTA. Never a direct "buy now." Never a price. Never an offer. The CTA is about DISCOVERY: "See what 107K people found." / "Learn more." / "See if it's for you."

**This 5-beat structure is NON-NEGOTIABLE.** If a concept cannot be mapped to these 5 beats, it is not a proper Unaware concept — it's mislabeled and should be rejected.

---

**VIASOX-SPECIFIC UNAWARE MESSAGING FRAMEWORK BY SUB-PERSONA:**

| Sub-Persona | Opening Scene Examples | Reframe Examples | Mechanism Hook |
|---|---|---|---|
| **The Normalizer** | Morning sock routine, evening foot-rub, couch leg-prop | "That isn't your age. That's a coping behavior." | "Your legs have been sending you the same signal all day." |
| **Diagnosed Non-Searcher** | Same pharmacy sock for years, drawer of 'failed' socks, doctor visit | "You've been told compression is compression. It isn't." | "There's a category of sock that doesn't exist in your pharmacy." |
| **Incidental Sufferer** | Last hour of shift, parking lot walk to car, taking shoes off in car | "That isn't 'part of the job.' That's a fixable daily tax." | "Nurses who wear the right sock clock out feeling like they clocked in." |

---

**THE UNAWARE POWER WORDS (use these naturally):**
"you," "your," "every night," "at 3pm," "on your feet," "started," "stopped," "notice," "noticed," "just," "always," "never," "something," "that feeling when," "you know that moment when"

**THE UNAWARE AVOID WORDS (banned in the first half of any Unaware concept — these are the words that kill the ad instantly):**
"compression," "diabetic," "neuropathy," "circulation," "swelling," "edema," "varicose," "Viasox," "sock marks," "sock line," "relief," "solution," "finally," "sale," "offer," "discount," "buy," "shop," "cart," "only \$X," "limited time"

---

**CONCEPT FORMAT REQUIREMENTS (Unaware):**
- Every concept must name its SUB-PERSONA (Normalizer / Diagnosed Non-Searcher / Incidental Sufferer) in the "Persona" field.
- Every concept must name which of the three techniques it uses (Scene Identification / Mundane Reframe / False Cause Flip).
- Every concept must describe the IDENTIFICATION beat WITHOUT mentioning socks, compression, marks, swelling, Viasox, or any product feature.
- Every concept must identify the "awareness shift" moment clearly — the exact beat where the normalized experience is reframed.
- Every concept must be mappable to the 5-beat structure (Identification → Reframe → Mechanism → Category Reveal → Product Reveal).
- The CTA must be SOFT: "learn more," "see why," "discover" — never "buy now" or "shop."
- No price, no offer, no Viasox brand name, and no symptom label in the first 50% of any concept.

---

**ANGLE TYPE ADJUSTMENTS FOR UNAWARE:**
- Problem-Based → must lead with LIFE IMPACT via Scene Identification or False Cause Flip — never name the symptom. Don't say "sock marks." Say "those red lines your daughter noticed on your legs last Sunday" — then DON'T call them sock marks until beat 3.
- Emotion-Based → the emotion must be one they ALREADY feel (fatigue, frustration, resignation) — not one about a problem they don't know they have. Pair with Scene Identification.
- Identity-Based → STRONGEST angle type for Unaware. Lead entirely with WHO they are. The problem surfaces through their identity story. Perfect for Incidental Sufferer.
- Education-Based → frame as "things you didn't know" content, not product education. Teach something genuinely useful that creates the awareness shift. Pair with False Cause Flip.
- Comparison-Based → compare LIFE states ("your mornings now vs. 5 years ago"), not products.
- Testimonial-Based → the testimonial must start with LIFE context, not product experience. "I'm a nurse, and for 12 years I thought my feet just hurt because of the job..." Note: testimonial opens with the WRONG attribution, then flips.
- Fear-Based → VERY gentle. Not product fear. Life fear: "What does it mean when your legs look different at the end of the day?" Use sparingly.
- Aspiration-Based → show the AFTER state without explaining HOW. Pure visualization of the life they want — then the bridge to discovery.
- Seasonal/Situational → tie to a LIFE moment (holiday travel, new job, retirement) where the latent problem becomes activated.
- **Solution-Based → DO NOT USE for Unaware.** They don't know they have a problem yet. A solution concept will not resonate. Rejected.

---

**SCHWARTZ HEADLINE RULES FOR UNAWARE (all three rules enforced):**
- Cannot mention the PRODUCT name, category, or mechanism
- Cannot mention the PROBLEM, condition, symptom, or pain
- Cannot mention any PRICE, offer, or CTA-to-purchase
- MUST connect to an existing scene, behavior, attribution, or identity the viewer already holds
- The hook IS the awareness creation mechanism — it must shift them from "I don't have a problem" to "wait... do I?"

---

**⚠️ COMMON MISTAKES WITH UNAWARE — DO NOT DO THESE:**

1. **Pulling hooks verbatim from review data.** Reviews are POST-education — customers writing them already know compression socks helped them. Review language like "no more sock marks!" or "my swelling went away!" is Most-Aware vocabulary. An Unaware viewer doesn't recognize themselves in that language. Use reviews to understand the REALITY of the experience, then write a NEW hook that describes the experience BEFORE the customer had the vocabulary for it.

2. **Being so vague the ad is about nothing.** Unaware does NOT mean "never mention anything related to the condition." It means the HOOK and first half don't lead with the product or name the condition as a diagnosis. The ad MUST still be ABOUT something specific and recognizable. A viewer should understand the ad's WORLD within 3 seconds — she should see a woman's morning, see her legs, see the routine. She just shouldn't hear "neuropathy" or "compression socks" yet. SHOW the condition's reality without NAMING it.
   - WRONG: A vague ad about "comfort" and "feeling good" that could be about anything — mattresses, shoes, lotion.
   - RIGHT: A woman sitting on the edge of her bed, looking at the red marks on her calves. She doesn't say "sock marks" — but the viewer SEES it.

3. **Making the ad so abstract the viewer doesn't know what it's for by the end.** By the END of an Unaware ad, the viewer MUST understand this is about socks/leg comfort. The first half builds identification; beats 3-5 reveal the category and product. If someone watches the full ad and still doesn't know what's being sold, the ad fails.

4. **Confusing "Unaware" with "content that has no commercial intent."** Unaware ads ARE still ads. They have a strategic structure: 5-beat Identification → Reframe → Mechanism → Category Reveal → Product Reveal. Every second serves a purpose. They are just DISGUISED as content in the first half.

5. **Interpreting "don't mention the problem" as "avoid all specificity."** You CAN and SHOULD show specific sensory moments (looking at legs, rubbing ankles, struggling with footwear, wincing). You just don't LABEL them with medical or product terms in the first half. Specificity creates recognition. Vagueness creates nothing.

6. **Making the product reveal feel like a random jump.** The product must feel EARNED through the Reframe → Mechanism → Category Reveal bridge. If the first half is about a woman's morning and beat 5 suddenly pivots to "Buy Viasox!" with no bridge, the ad is structurally broken.

7. **Opening with any variant of "Tired of X?" / "Struggling with Y?" / "If you have Z..."** These are problem-aware openers dressed up as Unaware. They all presume the viewer has classified their experience as a problem. Banned.

8. **Using numbers / research stats / "Did you know..." as the opener.** These feel like advertorials and fail the identification test. A Normalizer scrolls past "68% of adults over 50..." instantly. Start with THEM, not with a statistic.`,

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
- Emotion-Based → the emotion is DESIRE and BELONGING, not pain. "Join the 107,000+ people who..."
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
- Social Proof → numbers only. "107,000+ reviews. 4.8 stars." No explanation needed.
- Comparison-Based → NOT recommended. They're past comparing. Focus on acting.
- Problem-Based → NOT recommended. The problem is solved in their mind. Don't re-open it.
- Emotion-Based → the emotion is EXCITEMENT and ANTICIPATION. "Finally getting the pair you've been eyeing."
- Education-Based → NOT recommended. They know everything. Don't re-educate.
- Fear-Based → only as FOMO: "Don't miss this deal," "This pattern sold out last time."
- Identity-Based → "Join 107,000+ customers" — belonging as the final nudge.
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

**⚠️ FOUNDATIONAL CONSTRAINT (April 2026 Manifesto Update):**
Unaware hooks are the hardest hooks we write. They must honor Schwartz's Three Elimination Rules (no price, no product name, no direct problem/solution statement) AND create enough magnetism to stop a viewer who does not know they have a problem. **Do not pull these hooks from review data** — reviews are post-education and describe the experience with vocabulary the Unaware viewer has not yet developed.

**THE FUNDAMENTAL HOOK CHALLENGE FOR UNAWARE:**
You must stop the scroll of someone who DOES NOT KNOW THEY HAVE A PROBLEM. You cannot use problem language, product language, solution language, or any price/offer. You must enter through a DIFFERENT door — a scene, a behavior, a wrong attribution, a piece of identity, or a mundane action the viewer is physically doing right now.

**WHAT UNAWARE HOOKS MUST DO:**
1. Create curiosity or identification in the first 1-2 seconds WITHOUT referencing socks, compression, marks, swelling, or any product benefit
2. Select the right audience through identity, scene, or situation — never through problem naming
3. Feel like content (a story, an observation, a mundane moment) — NOT like an ad
4. Create an information gap that can ONLY be closed by watching more
5. Target ONE of the three Unaware sub-personas: Normalizer, Diagnosed Non-Searcher, or Incidental Sufferer

---

**THE SIX APPROVED UNAWARE HOOK STYLES (pick one per hook):**

These are the only Unaware hook styles that survive Schwartz's Three Elimination Rules. Every Unaware hook must be one of these six patterns.

**1. Scene Identification Hook**
Open with a specific, sensory-rich scene from the viewer's day. The scene IS the hook. No product, no symptom label, no diagnosis.
- "It's 6:47 AM. You're sitting on the edge of the bed. Same as every morning."
- "The last hour of your shift you stopped standing with both feet on the ground."
- "She's been rearranging her morning around one thing for two years and she doesn't even know she's doing it anymore."
- Best for: Normalizer, Incidental Sufferer

**2. Mundane Reframe Hook**
Name a small daily behavior the viewer does without thinking — then imply it's a coping behavior for something they haven't named.
- "The reason you take your shoes off the second you get home isn't just because it feels good."
- "You cross and uncross your ankles without noticing. Your body's been trying to tell you something."
- "You roll your socks instead of pulling them on. When did that start?"
- Best for: Normalizer, Incidental Sufferer

**3. False Cause Flip Hook**
Name the attribution the viewer has ALREADY MADE (wrong cause) — then flip it.
- "You think it's your shoes. You've bought three pairs in the last year trying to fix it. It's not your shoes."
- "You blame your age. You blame the weather. You've never blamed the thing touching your skin for 16 hours a day."
- "You assumed it was your circulation. It's what's on top of your circulation."
- Best for: Normalizer, Diagnosed Non-Searcher

**4. "Doctor Said Watch Your Feet" Hook**
A medical-adjacent opening that reframes daily frustrations as things their doctor would notice — without naming a condition.
- "Your doctor told you to watch your feet. She didn't tell you what for."
- "At your last check-up, she looked at your ankles longer than normal."
- "There's a reason every doctor asks you to take off your socks."
- Best for: Diagnosed Non-Searcher, Normalizer over 55

**5. Micro-Behavior Hook**
Call out a specific small action — the kind of thing only someone who has the issue actually does — and name it with precision.
- "By 3pm you've already adjusted how you're sitting three times."
- "You have a pair of shoes you only wear before noon."
- "You don't wear ankle socks anymore. You haven't for years. You don't remember deciding to stop."
- Best for: All three sub-personas

**6. Hidden Math Hook**
Introduce a number the viewer can check against their own life — without leading with a statistic or "did you know..."
- "16 hours. That's how long most people wear the same thing against their skin every day. It isn't your shirt."
- "You spend more time in these than in your bed. And you've never thought about them."
- "Three minutes in the morning. Three minutes at night. 36 hours a year fighting with one piece of clothing."
- Best for: Normalizer, Incidental Sufferer

---

**UNAWARE HOOK COPY FORMULAS:**

**Formula A — The Identification Echo:**
"[SPECIFIC TIME or PLACE]. [SPECIFIC BEHAVIOR viewer recognizes]. [EMOTIONAL TRUTH they haven't articulated]."
- Example: "6 PM. You're in the car. You kick your shoes off before you've even pulled out of the parking lot."

**Formula B — The Mundane Reframe:**
"[BEHAVIOR you do without thinking] isn't [COMMON EXPLANATION they've given themselves]. It's [UNNAMED REAL REASON]."
- Example: "Rolling your socks off at the end of the day isn't just habit. It's the only way they come off clean anymore."

**Formula C — The False Cause Flip:**
"You think it's [WRONG CAUSE they've settled on]. It's not [WRONG CAUSE]. It's [CATEGORY HINT — still no product name]."
- Example: "You think it's your shoes. You've replaced them twice this year. It's not your shoes. It's what's underneath them."

---

**UNAWARE HOOK DOs:**
- DO enter through a specific SCENE, BEHAVIOR, or ATTRIBUTION the viewer already holds
- DO use the word "you" / "your" — direct address to pull the viewer in
- DO use specific times ("6 AM," "3pm," "by lunchtime"), specific places ("parking lot," "edge of the bed"), specific micro-actions
- DO target one sub-persona per hook (Normalizer / Diagnosed Non-Searcher / Incidental Sufferer)
- DO make the viewer feel recognized BEFORE they know what's being advertised
- DO let the hook run 2-5 seconds on visual before the voiceover even starts — let them SEE themselves

**UNAWARE HOOK DON'Ts (HARD BANS — any of these kills the ad):**
- ❌ Product name (Viasox) — Rule 2
- ❌ Category words (compression, diabetic, non-binding, graduated compression, wide-mouth) — Rule 2
- ❌ Problem words (sock marks, sock lines, swelling, edema, neuropathy, varicose, circulation, plantar fasciitis) — Rule 3
- ❌ Solution words (support, relief, solution, finally, fix, cure) — Rule 3
- ❌ Any price, any offer, any percentage discount, "sale," "deal" — Rule 1
- ❌ Any direct CTA ("Shop now," "Buy today," "Order yours") — Rule 1
- ❌ "Tired of..." / "Struggling with..." / "If you have..." / "Dealing with..." — all assume the viewer has classified this as a problem
- ❌ "Did you know..." / "Studies show..." / "68% of adults..." — statistical openers fail identification
- ❌ Review language lifted verbatim (review language is post-education vocabulary)
- ❌ Medical diagnosis words (neuropathy, edema, plantar fasciitis, varicose veins, diabetic)
- ❌ Generic emotional openers ("Life is hard..." / "You deserve comfort...") — no scene, no specificity, no recognition
- ❌ Brand-voice comedy openers ("Ever feel like your socks hate you?") — quippy but does not create identification

**HOOK FRAMEWORK BACKING (Schwartz + Hopkins + Neumeier + Bly):**
- Schwartz: "For Unaware audiences, the headline cannot mention price, product, or desire. It must create awareness where none existed — through identification, curiosity, or story alone."
- Hopkins: "Select your audience through their WORLD, not your product."
- Neumeier: "We notice what's DIFFERENT. Your hook must break the pattern of every ad they've scrolled past today."
- Bly: "The sole purpose of the first line is to get them to read the second line. For Unaware, that means pure magnetism — no ask, no pitch, no problem."`,

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

**⚠️ FOUNDATIONAL RULES (April 2026 Manifesto Update):**
Unaware is the DEFAULT awareness level for Viasox TOF ads. Every Unaware script must:
1. Target one of three sub-personas: Normalizer, Diagnosed Non-Searcher, Incidental Sufferer
2. Honor Schwartz's Three Elimination Rules in the first beat: NO price, NO product name, NO direct problem/solution statement
3. Follow the 5-beat body structure: Identification → Reframe → Mechanism → Category Reveal → Product Reveal
4. Use one of the approved techniques: Scene Identification, Mundane Reframe, or False Cause Flip
5. Never lift hooks verbatim from review data (reviews are post-education vocabulary)

---

**THE 5-BEAT UNAWARE BODY STRUCTURE (MANDATORY for every Unaware script):**

**BEAT 1 — IDENTIFICATION (first ~25% of runtime)**
The opening. Uses one of: Scene Identification / Mundane Reframe / False Cause Flip. Zero product, zero category, zero symptom label. Pure scene, behavior, or attribution. The viewer sees themselves.
- Honors Schwartz's Three Elimination Rules (no price, no product name, no problem/solution statement)
- Targets ONE sub-persona and writes to them specifically
- 2-5 seconds of visual before voiceover often maximizes identification

**BEAT 2 — REFRAME (~25-45% of runtime)**
The "wait..." moment. The normalized experience is named as NOT normal. The viewer's wrong attribution is gently overturned.
- "That isn't just getting older."
- "That isn't 'part of the job.'"
- "You've been blaming the wrong thing."
- Schwartz's gradualization in action — from "I don't have a problem" to "wait... do I?"

**BEAT 3 — MECHANISM (~45-65% of runtime)**
A SHORT, plain-English explanation of WHY the thing they're feeling is happening. Not a medical lecture. 1-3 sentences. This is where the ad earns the right to sell.
- "What you're putting on your legs every morning is cutting off circulation slightly. Not enough to alarm you. Just enough to make every hour of your day a little harder."
- "Most socks have an elastic band at the top that wasn't designed for legs that change shape through the day. Yours do."
- Now the viewer can say the word "sock" — because you just EARNED it.

**BEAT 4 — CATEGORY REVEAL (~65-85% of runtime)**
Only NOW do we reveal that there is a different CATEGORY of sock. Not Viasox yet — the category.
- "Socks built differently exist. They've been around for years. Most people don't know they're out there."
- "There's a type of sock for people whose legs aren't the same size at 8 AM and 5 PM."
- The viewer now understands the ad's world and is leaning in.

**BEAT 5 — PRODUCT REVEAL + SOFT CTA (~85-100% of runtime)**
Only NOW do we name Viasox. And only with a curiosity-driving, soft CTA.
- No direct "Buy now." No price. No offer. No discount.
- Approved CTAs: "See what 107K people found." / "Learn more." / "See if it's for you." / "Watch what happens next." / "Discover it."
- The CTA moves them from Unaware to Problem-Aware — not from scroll to checkout.

**⚠️ This 5-beat structure is NON-NEGOTIABLE.** If a script cannot be mapped to these 5 beats, it is not a proper Unaware script.

---

**TIME ALLOCATION (all ranges peg to the MAX of the Asana Medium column — final cut must not exceed the cap):**
- 1-15 sec (final cut MUST be ≤ 15s): 0:00-0:04 Identification → 0:04-0:07 Reframe → 0:07-0:10 Mechanism → 0:10-0:12 Category Reveal → 0:12-0:15 Product Reveal + soft CTA
- 16-59 sec (final cut MUST be ≤ 59s): 0:00-0:15 deep Identification → 0:15-0:25 Reframe → 0:25-0:38 Mechanism → 0:38-0:48 Category Reveal → 0:48-0:58 Product Reveal + soft CTA
- 60-90 sec (final cut MUST be ≤ 90s): 0:00-0:22 deep Identification → 0:22-0:38 Reframe → 0:38-0:58 Mechanism → 0:58-0:75 Category Reveal → 0:75-0:90 Product Reveal + soft CTA

---

**KEY RULES (enforced):**
1. The product name "Viasox" does NOT appear until Beat 5 (Product Reveal). Period.
2. "Socks," "compression," "sock marks," "swelling," "circulation," "diabetic," "neuropathy" do NOT appear in Beat 1 (Identification). They can enter gradually starting in Beat 3 (Mechanism).
3. No price, no offer, no discount, no percentage off — ever. Unaware scripts are curiosity vehicles, not conversion vehicles.
4. The script reads like a STORY or a piece of content — never like an ad — until the Category Reveal (Beat 4).
5. The hook pulls in through Scene Identification, Mundane Reframe, or False Cause Flip — never through the product.
6. CTA is SOFT: "Learn more," "See what [X] people found," "Discover." Never "Shop now," "Buy," "Get yours."
7. Target ONE sub-persona per script (Normalizer / Diagnosed Non-Searcher / Incidental Sufferer) and write to them specifically.
8. Do NOT pull hook language verbatim from review data. Reviews describe the experience in post-education vocabulary that an Unaware viewer does not yet recognize.

---

**POWER WORDS (use naturally throughout):**
"you," "your," "every night," "at 3pm," "on your feet," "started," "stopped," "notice," "noticed," "just," "always," "never," "something"

**AVOID WORDS (banned in Beats 1 & 2, restricted in Beat 3):**
"compression," "diabetic," "neuropathy," "circulation," "swelling," "edema," "varicose," "Viasox," "sock marks," "sock line," "relief," "solution," "finally," "sale," "offer," "discount," "buy," "shop," "cart"

---

**FRAMEWORK ADJUSTMENTS FOR UNAWARE (the framework is always SECONDARY to the 5-beat structure):**
- **The Gradualization (Schwartz)** → NATIVE framework for Unaware. Maps 1:1 to the 5-beat structure.
- **PAS** → Problem phase is framed as LIFE REALITY (Beat 1 Scene Identification). Agitation is the Reframe (Beat 2). Solution is split across Mechanism → Category → Product (Beats 3-5).
- **AIDA-R** → Attention = Identification (Beat 1). Interest = Reframe (Beat 2). Desire = Mechanism + Category (Beats 3-4). Action = soft CTA (Beat 5).
- **Before-After-Bridge** → Before = current life state (Identification). After = hint of life without the normalized struggle (Reframe). Bridge = the Category Reveal.
- **Hook-Story-Offer** → Hook = Identification. Story = Reframe + Mechanism. "Offer" is just "discover" / "learn more" (Beat 5).
- **The Discovery Narrative** → Ideal for Unaware. Narrator discovers the category themselves through the 5 beats.
- ⚠️ **Problem-Promise-Proof-Push** → RISKY for Unaware unless the Problem is reframed as a Mundane Behavior or Scene. Direct problem language violates Schwartz Rule 3.

---

**SCHWARTZ'S THREE DIMENSIONS AT UNAWARE:**
- **DESIRE:** Tap into desires they ALREADY have (comfort, independence, feeling normal, making it through the day) — don't create new ones.
- **IDENTIFICATION:** This is the PRIMARY dimension for Unaware. Show THEIR scene. THEIR morning. THEIR micro-behavior. THEIR wrong attribution.
- **BELIEF:** Not relevant yet. They don't need to believe in the product. They need to believe they HAVE a problem worth solving. The Reframe (Beat 2) starts building this — not the product.

---

**TONE:**
- Conversational, observational, documentary-like
- Warm but never saccharine. Intimate but never preachy.
- NEVER clinical, technical, or salesy (even in Beat 3 Mechanism — keep it plain-English)
- The viewer should think "this isn't an ad" through Beats 1-3
- Mirror the viewer's actual self-talk and daily internal monologue
- Avoid "you deserve" / "you're worth it" / "finally" / "imagine a world where" — all brand-ad clichés

---

**⚠️ CRITICAL: WHAT UNAWARE DOES NOT MEAN:**
- Unaware does NOT mean the ad is vague, abstract, or about nothing. The viewer must still understand the AD'S WORLD within 3 seconds (she sees a woman, a morning, a routine, legs, a struggle). She just doesn't hear medical terms or product names yet.
- Unaware does NOT mean avoiding all specificity. SHOW the condition visually (red marks on calves, swollen ankles, struggling to bend down). Just don't LABEL it as "neuropathy" or "edema" in Beats 1-2.
- Unaware does NOT mean the product reveal comes out of nowhere. The reveal must feel EARNED — the Reframe → Mechanism → Category Reveal bridge is what earns it. "What if the problem isn't your legs? What if it's what you're putting ON your legs?"
- By the END of an Unaware ad, the viewer MUST know this is about socks/leg comfort. If they watched the whole thing and still don't know what's being sold, the ad fails.
- The assigned angle (e.g., Neuropathy, Swelling) still drives the VISUAL WORLD and sensory details — the viewer should recognize the physical experience even if no one says the word. But the WORD "neuropathy" or "swelling" does not appear until Beat 3 at the earliest (and often not at all — the Mechanism can describe what's happening without the medical label).
- Unaware does NOT mean pulling review language verbatim. Reviews are written by Most-Aware customers — their vocabulary describes the AFTER state, not the BEFORE state an Unaware viewer lives in.`,

  'Problem Aware': `## AWARENESS LEVEL: PROBLEM AWARE — SCRIPT ARCHITECTURE

**SCRIPT STRUCTURE RULES (Problem Aware):**
Problem Aware scripts are the AGITATION scripts. The viewer knows their pain — your job is to make it feel MORE URGENT, then reveal the path to relief. This is Schwartz's "intensification" in full force.

**TIME ALLOCATION (all ranges peg to the MAX of the Asana Medium column — final cut must not exceed the cap):**
- 1-15 sec (final cut MUST be ≤ 15s): 0:00-0:03 pain hook → 0:03-0:08 agitate → 0:08-0:12 solution bridge → 0:12-0:15 CTA
- 16-59 sec (final cut MUST be ≤ 59s): 0:00-0:05 pain hook → 0:05-0:20 deep agitation → 0:20-0:35 solution reveal + mechanism → 0:35-0:50 proof cascade → 0:50-0:58 CTA
- 60-90 sec (final cut MUST be ≤ 90s): 0:00-0:06 pain hook → 0:06-0:28 deep agitation → 0:28-0:52 solution reveal + mechanism → 0:52-0:78 proof cascade → 0:78-0:90 CTA

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

**TIME ALLOCATION (all ranges peg to the MAX of the Asana Medium column — final cut must not exceed the cap):**
- 1-15 sec (final cut MUST be ≤ 15s): 0:00-0:03 differentiation hook → 0:03-0:08 mechanism → 0:08-0:12 proof → 0:12-0:15 CTA
- 16-59 sec (final cut MUST be ≤ 59s): 0:00-0:05 differentiation hook → 0:05-0:10 failed-solution acknowledgment → 0:10-0:25 new mechanism deep-dive → 0:25-0:40 proof cascade → 0:40-0:52 transformation story → 0:52-0:58 CTA
- 60-90 sec (final cut MUST be ≤ 90s): 0:00-0:06 differentiation hook → 0:06-0:14 failed-solution acknowledgment → 0:14-0:36 new mechanism deep-dive → 0:36-0:58 proof cascade → 0:58-0:78 transformation story → 0:78-0:90 CTA

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

**TIME ALLOCATION (all ranges peg to the MAX of the Asana Medium column — final cut must not exceed the cap):**
- 1-15 sec (final cut MUST be ≤ 15s): 0:00-0:03 brand recognition + new info hook → 0:03-0:10 deep proof point → 0:10-0:15 CTA
- 16-59 sec (final cut MUST be ≤ 59s): 0:00-0:05 brand recognition + new info hook → 0:05-0:20 deep customer story → 0:20-0:35 proof cascade → 0:35-0:47 mechanism deep-dive → 0:47-0:54 offer → 0:54-0:58 CTA
- 60-90 sec (final cut MUST be ≤ 90s): 0:00-0:07 brand recognition + new info hook → 0:07-0:28 deep customer story → 0:28-0:50 proof cascade → 0:50-0:70 mechanism deep-dive → 0:70-0:82 offer → 0:82-0:90 CTA

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

**TIME ALLOCATION (all ranges peg to the MAX of the Asana Medium column — final cut must not exceed the cap):**
- 1-15 sec (final cut MUST be ≤ 15s): 0:00-0:03 product + offer → 0:03-0:10 urgency/details → 0:10-0:15 CTA
- 16-59 sec (final cut MUST be ≤ 59s): 0:00-0:05 product + offer → 0:05-0:15 quick proof/social → 0:15-0:25 offer details → 0:25-0:35 urgency → 0:35-0:50 product showcase → 0:50-0:58 CTA
- 60-90 sec (final cut MUST be ≤ 90s): 0:00-0:06 product + offer → 0:06-0:20 quick proof/social → 0:20-0:36 offer details → 0:36-0:50 urgency → 0:50-0:78 product showcase → 0:78-0:90 CTA

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
