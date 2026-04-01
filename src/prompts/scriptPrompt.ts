import type { ScriptParams, FullAnalysis, FunnelStage, MarketingBookReference, ProductCategory } from '../engine/types';
import { buildSystemBase, getProductAnalysis } from './systemBase';
import { buildAdTypeGuideCompact } from './adTypeGuides';
import { getAwarenessScriptGuide } from './awarenessGuide';
import {
  buildBuildingBlocksReference,
  buildShotTypesReference,
  buildHookFormulaReference,
  buildAgcRules,
  buildVideoProductionBriefReference,
} from './agcReference';
import {
  getScriptFrameworks,
  getProductPurchaseTriggers,
  getProductStrategicInsights,
  getTransformationJourney,
  getEmotionalArchitecture,
  getVocabularyProtectionRules,
  getCrossProductEmotionalSystem,
  getCustomerVoiceBank,
  getEmotionalLanguageBoundaries,
  getVoiceToneExamples,
  getProductObjectionBank,
  getSegmentProductMatrix,
} from './manifestoReference';

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
  'PAS (Problem-Agitate-Solution)': `**PAS (Problem-Agitate-Solution)** — Hopkins (specificity) + Schwartz (intensification)
Structure: Problem (0-20%) → Agitate (20-50%) → Solve (50-85%) → CTA (85-100%)
Execution:
- PROBLEM: One SPECIFIC pain from reviews — Hopkins demands precision, not "foot pain" but "deep red marks still there at dinner"
- AGITATE: Schwartz's intensification — make the status quo INTOLERABLE. Stack consequences using temporal language. The agitation must escalate.
- SOLVE: Schwartz's mechanization — explain WHY it works (non-binding tops, graduated compression), don't just claim
- CTA: Hopkins' service principle — frame as help, not a demand
Best for: Problem-Aware & Solution-Aware. TOF and MOF.`,

  'AIDA-R (Attention-Interest-Desire-Action-Retention)': `**AIDA-R** — Bly (motivating sequence) + Schwartz (three dimensions)
Structure: Attention (0-10%) → Interest (10-35%) → Desire (35-70%) → Action (70-90%) → Retention (90-100%)
Execution:
- ATTENTION: Bly's 4 U's — Urgent, Unique, Ultra-specific, Useful. Pattern interrupt with surprising data or visual.
- INTEREST: Schwartz's Identification — make viewer see themselves. Unexpected angle from review data that makes them lean in.
- DESIRE: Schwartz's Desire intensification — paint the after-state vividly. Bly's "one level deeper": Feature → Benefit → REAL Benefit.
- ACTION: Bly — make the action easy, specific. Include the offer.
- RETENTION: Risk reversal + repeat strongest benefit. Schwartz's Belief dimension — leave them trusting.
Best for: Product-Aware, retargeting. MOF and BOF.`,

  'Before-After-Bridge': `**Before-After-Bridge** — Schwartz (visualization) + Neumeier (gut feeling)
Structure: Before (0-25%) → After (25-60%) → Bridge (60-90%) → CTA (90-100%)
Execution:
- BEFORE: Schwartz's identification — recreate their painful reality using their exact review language. Neumeier: create a FEELING of frustration.
- AFTER: Schwartz's visualization — paint the transformed state so clearly they experience it. Use real metrics ("90% less pain," "swelling down by half").
- BRIDGE: Viasox is the bridge. Schwartz's mechanization — one key mechanism, one key proof point.
- CTA: Neumeier's trust equation (reliability + delight). Invite them to start their own before/after.
Best for: All awareness levels. Transformation stories.`,

  'Star-Story-Solution': `**Star-Story-Solution** — Hopkins (service) + Schwartz (identification)
Structure: Star/character (0-15%) → Story/journey (15-65%) → Solution (65-90%) → CTA (90-100%)
Execution:
- STAR: Hopkins' headline-as-selector — make the star THEM. Not "a woman" but "a retired nurse whose legs haven't stopped aching." Viewer must IDENTIFY instantly.
- STORY: Follow the Cycle of False Hope — the Star has tried and failed. Include specific brands tried, pharmacy visits, the moment they gave up. Hopkins insists on truth — use actual customer journeys.
- SOLUTION: Discovery of Viasox enters organically. Hopkins' service — the solution feels like help, not selling.
- CTA: Story language — "Start your story" or "Join [X]K people who found theirs."
Best for: Storytelling, longer formats (30s-60s), emotional connection. TOF and MOF.`,

  'Feel-Felt-Found': `**Feel-Felt-Found** — Bly (objection handling) + Schwartz (Two Voices Framework)
Structure: Feel (0-25%) → Felt (25-60%) → Found (60-90%) → CTA (90-100%)
Execution:
- FEEL: Address the Protector Voice directly. "I know you're thinking 'just another pair of socks.'" Bly's BFD: identify their core Belief, Feeling, and Desire.
- FELT: Schwartz's identification — create shared experience. Reference the Closet Graveyard (3.1%), the Cycle of False Hope. Show you understand their JOURNEY.
- FOUND: Bly's proof cascade — specific numbers, specific quotes. "After 1 week, 90% less pain." Every claim backed by review data.
- CTA: Risk-free language for the Protector Voice: "Try them. If I'm wrong, you've lost nothing."
Best for: Overcoming skepticism, price objection. Solution-Aware and Product-Aware.`,

  'Problem-Promise-Proof-Push': `**Problem-Promise-Proof-Push** — Bly (PPPP formula) + Hopkins (specificity)
Structure: Problem (0-20%) → Promise (20-40%) → Proof (40-75%) → Push (75-100%)
Execution:
- PROBLEM: One specific pain point. Hopkins: not "discomfort" but "deep red rings around your calves that take hours to fade."
- PROMISE: Bold, testable claim. Bly's "so what?" test — not "comfortable socks" but "the first socks that won't leave a single mark."
- PROOF: Bly's proof cascade — stack 3+ types: (1) Data from reviews, (2) Customer testimony, (3) Mechanism explanation (Hopkins' reason why).
- PUSH: CTA with urgency. Include risk reversal and offer.
Best for: Direct response, conversion-focused. MOF and BOF.`,

  'Hook-Story-Offer': `**Hook-Story-Offer** — Bly (direct response) + Hopkins (headline-as-selector)
Structure: Hook (0-15%) → Story (15-70%) → Offer (70-100%)
Execution:
- HOOK: Hopkins' selector — grab the RIGHT person. Bly's 4 U's. "I'm a nurse and I just survived my first 12-hour shift without aching."
- STORY: The customer's real story with sensory details. Hopkins: write to ONE person. Include the turning point where Viasox changed the experience. Use review language verbatim.
- OFFER: Bly's direct response CTA — specific about what they get, what it costs, why act now. Include the offer and risk reversal.
Best for: Social media, UGC-style. TOF and MOF.`,

  'Empathy-Education-Evidence': `**Empathy-Education-Evidence** — Neumeier (trust) + Hopkins (service)
Structure: Empathy (0-30%) → Education (30-65%) → Evidence (65-90%) → CTA (90-100%)
Execution:
- EMPATHY: Neumeier — create a GUT FEELING first. Reference the Hidden Suffering pattern. "Nobody talks about the daily fight just to put on socks." Hopkins' service: position as someone who UNDERSTANDS.
- EDUCATION: Hopkins — the best ads feel like useful information. Teach them something: why elastic causes marks, why pharmacy compression is so hard, why diabetic socks don't have to look medical.
- EVIDENCE: Neumeier's reliability (prove it works with data) + delight (show the unexpected bonus — patterns, colors). Evidence proves BOTH function AND joy.
- CTA: Service-oriented: "See what we made for you."
Best for: Building trust, premium positioning. Problem-Aware. TOF and MOF.`,

  'The Contrast Framework': `**The Contrast Framework** — Neumeier (differentiation) + Schwartz (enemy naming)
Structure: Old Way (0-20%) → Problems (20-40%) → New Way (40-65%) → Why better (65-90%) → CTA (90-100%)
Execution:
- OLD WAY: Schwartz's enemy naming — pharmacy compression, tight elastic, ugly beige medical socks. Bash the CATEGORY experience, not specific brands.
- PROBLEMS: Intensify using customer language: "feels like a tourniquet," "those ugly beige things." Reference 12.3% style stigma data.
- NEW WAY: Neumeier's differentiation — what makes Viasox fundamentally DIFFERENT. The contrast must be VISCERAL — side by side visual is most powerful.
- WHY BETTER: Schwartz's mechanization — explain the mechanism (non-binding tops, graduated compression, beautiful patterns).
- CTA: "Switch" language — "Join [X]K who switched" or "See the difference yourself."
Best for: Competitive positioning, Solution-Aware. MOF.`,

  'The Skeptic Converter': `**The Skeptic Converter** — Schwartz (awareness progression) + Bly (objection handling)
Structure: Objection (0-15%) → Acknowledgment (15-30%) → Twist/evidence (30-65%) → Conversion (65-90%) → CTA (90-100%)
Execution:
- OBJECTION: Voice their EXACT skepticism. Schwartz: match their awareness precisely. "Great, another pair of 'miracle' socks." Bly's BFD: address their core Belief.
- ACKNOWLEDGMENT: Schwartz's identification — "I get it. I said the same thing." Don't dismiss. Reference the Cycle of False Hope.
- TWIST: The evidence that cracks skepticism — a specific data point they didn't know, a customer quote that sounds like THEM, a demonstration. Bly: Ultra-specific.
- CONVERSION: The belief shift. "I can't believe I waited so long." Schwartz: the conversion must feel earned.
- CTA: Challenge language: "Prove us wrong" or "Try them risk-free — we'll wait."
Best for: Solution-Aware and Product-Aware skeptics. MOF.`,

  'The Day-in-Life': `**The Day-in-Life** — Schwartz (identification) + Hopkins (specificity)
Structure: Morning (0-20%) → Throughout the day (20-55%) → Evening reveal (55-85%) → CTA (85-100%)
Execution:
- MORNING: Schwartz's identification — show THEIR morning. The specific struggle with socks. Hopkins: make it SPECIFIC to the persona (nurse vs. senior vs. teacher).
- THROUGHOUT: Track using the temporal suffering technique. Morning fight → midday discomfort building → afternoon countdown. Then show the SAME day with Viasox — the contrast of comfort.
- EVENING: The reveal — no marks, no swelling, socks still comfortable. Real metrics: "no swelling at end of shift."
- CTA: Daily routine language: "Change your mornings" or "Start tomorrow different."
Best for: Relatability, specific-use scenarios (nurses, teachers, seniors). Problem-Aware. TOF and MOF.`,

  'The Myth Buster': `**The Myth Buster** — Bly (news-style lead) + Hopkins (reason-why)
Structure: Myth stated (0-15%) → Why people believe it (15-35%) → The truth with evidence (35-70%) → Viasox embodies truth (70-90%) → CTA (90-100%)
Execution:
- MYTH: State a misconception boldly. Bly's "news" lead — present as surprising information. "You've been told compression socks have to be tight to work."
- WHY THEY BELIEVE IT: Hopkins' specificity — explain where the myth came from. Pharmacy compression DOES feel like a tourniquet. Validate WHY they hold this belief.
- THE TRUTH: Hopkins' reason-why — counter-evidence with specific data. "107,993 reviews prove otherwise."
- VIASOX: Schwartz's mechanization — explain the mechanism that makes the myth irrelevant.
- CTA: Education language: "See the truth" or "Discover what 107K people already know."
Best for: Education, thought leadership. Problem-Aware and Solution-Aware. TOF and MOF.`,

  // --- NEW FRAMEWORKS (from Manifesto 4.3 + Marketing Books) ---

  'The Enemy Framework': `**The Enemy Framework** — Schwartz (enemy naming + in-group dynamics)
Structure: Identify enemy (0-15%) → Validate hatred (15-40%) → Reveal alternative (40-65%) → Prove superiority (65-90%) → Rebellion CTA (90-100%)
Execution:
- IDENTIFY: Name the "bad guy" — NOT a brand, but a category experience. Enemies: pharmacy compression (tourniquet), tight elastic (mark-makers), ugly beige medical socks (dignity killers).
- VALIDATE: Schwartz's intensification — use their exact review language: "I threw every pair away." The more specific the complaint, the more they nod.
- REVEAL: Position Viasox as the ANTI-enemy. If enemy is tight elastic → non-binding tops. If enemy is beige medical → 50+ patterns.
- PROVE: Schwartz's three dimensions — intensify desire (show the beautiful alternative), strengthen identification (people like them switched), build belief (data + testimony).
- CTA: Rebellion language: "Join 107K people who said 'never again' to [enemy]."
Best for: Solution-Aware. MOF. Creates powerful in-group dynamics.`,

  'The Discovery Narrative': `**The Discovery Narrative** — Hopkins (sample principle as narrative) + Schwartz (gradualization)
Structure: Search phase (0-20%) → Discovery moment (20-45%) → First experience (45-70%) → Realization (70-90%) → Sharing CTA (90-100%)
Execution:
- SEARCH: Hopkins' selector — open with someone ACTIVELY searching. Mirror the Search Desperation pattern. Show the journey: pharmacies, Amazon, medical supply stores.
- DISCOVERY: Hopkins' sample principle — the discovery must feel like FINDING, not being sold to. "A friend mentioned them" or "I saw a review that sounded exactly like me."
- FIRST EXPERIENCE: Show the first use in sensory detail. Hopkins demands specifics: the feeling of pulling them on, the surprise at ease, the first hours of comfort.
- REALIZATION: The "this is it" moment — the shift from skepticism to belief. Not just "good socks" but "I finally found what I've been looking for."
- CTA: Sharing language: "I had to tell someone" or "Discover what [X]K people found."
Best for: Problem-Aware. TOF and MOF. The "found treasure" narrative.`,

  'The Professional Authority': `**The Professional Authority** — Hopkins (credibility through specifics) + Bly (testimonial lead)
Structure: Credential (0-10%) → Professional problem (10-35%) → Failed solutions (35-55%) → Discovery (55-75%) → Professional proof (75-90%) → Peer CTA (90-100%)
Execution:
- CREDENTIAL: Bly's testimonial lead — establish credibility instantly. "I've been a nurse for 22 years." Hopkins: the credential must be SPECIFIC.
- PROBLEM: The occupation-specific manifestation. Nurses: "My legs were so swollen I couldn't get my shoes on." Teachers: "By 2pm I was teaching from my chair."
- FAILED: What they tried that didn't work — pharmacy compression, cheap socks. Bly: failures establish stakes.
- DISCOVERY: Peer recommendation is strongest: "Another nurse on my unit recommended them."
- PROOF: Results in professional context — "survived a double shift," "no swelling after 14 hours." Hopkins: specific professional metrics sell.
- CTA: Peer frame: "If you're in healthcare, you need these."
Best for: All awareness levels. Healthcare workers (3.5%), standing workers. MOF.`,

  'The Demonstration Proof': `**The Demonstration Proof** — Hopkins (the sample principle — let the product sell itself)
Structure: Challenge setup (0-15%) → Live demo (15-50%) → Feature callouts (50-70%) → Comparison (70-90%) → CTA (90-100%)
Execution:
- CHALLENGE: Hopkins' sample principle translated to video: "Watch what happens..." Set up a visual test the viewer cares about — ease test, mark test, style test.
- DEMO: Let the product speak. Show IN ACTION — wide-mouth opening sliding on, sock sitting comfortably, beautiful pattern being revealed. Let the product demonstrate. Minimal narration.
- FEATURES: Brief, specific explanations. Schwartz's mechanization: "See how the non-binding top sits? That's why no marks." One feature, one mechanism per callout.
- COMPARISON: Side-by-side with the alternative. Hopkins: comparison is one of the most powerful persuasion tools.
- CTA: Confidence language: "See for yourself" or "Try the test with your own pair."
Best for: Product-Aware. MOF and BOF. Visual media.`,

  'The Objection Crusher': `**The Objection Crusher** — Bly (objection handling) + Schwartz (Two Voices Framework)
Structure: State objection (0-12%) → Acknowledge (12-25%) → Counter evidence (25-60%) → Testimonial support (60-80%) → Risk-free CTA (80-100%)
Execution:
- STATE: Bly — voice the objection FOR them. "$30 for socks?" "You've heard it all before." Schwartz's Protector Voice: speak AS the skeptic.
- ACKNOWLEDGE: Never dismiss. "I get it. That's exactly what I thought." Reference the Cycle of False Hope — they've been burned before.
- COUNTER: Bly's proof cascade — (1) Specific data ("last 3x longer — cheaper per wear"), (2) Customer quote addressing the SAME objection, (3) Risk reversal.
- TESTIMONIAL: Find the review that PERFECTLY mirrors this objection and its resolution.
- CTA: Risk-free, no-pressure: "Try one pair. If we're wrong, return them." Schwartz: speak to the Hope Voice.
Best for: Product-Aware skeptics. BOF retargeting. Price and "just socks" objections.`,

  'The Identity Alignment': `**The Identity Alignment** — Schwartz (identification dimension) + Neumeier (brand as identity signal)
Structure: Identity statement (0-12%) → Values connection (12-35%) → Current conflict (35-55%) → Viasox alignment (55-85%) → Belong CTA (85-100%)
Execution:
- IDENTITY: Schwartz — open with WHO the viewer IS. "You're someone who refuses to slow down." Neumeier: people buy what aligns with who they BELIEVE they are.
- VALUES: Connect identity to shared values. "You believe comfort shouldn't mean compromise." Schwartz: identity-based decisions are 5x stronger than feature-based.
- CONFLICT: Show how current situation VIOLATES their identity. "But every morning, those ugly medical socks remind you..." Neumeier: this cognitive dissonance demands resolution.
- ALIGNMENT: Viasox resolves the conflict — medical support AND beautiful style AND easy comfort. Neumeier's charismatic brand: nothing else comes close.
- CTA: Belonging: "Made for people who refuse to compromise."
Best for: All awareness levels. Most powerful for Unaware and Problem-Aware. TOF.`,

  'The Reason-Why (Hopkins)': `**The Reason-Why** — Hopkins (the core of Scientific Advertising)
Structure: Bold claim (0-15%) → Reason #1/mechanism (15-35%) → Reason #2/evidence (35-55%) → Reason #3/social proof (55-80%) → Therefore-CTA (80-100%)
Execution:
- BOLD CLAIM: Hopkins — vague claims are ignored, specific claims demand attention. "107,993 customers agree: most comfortable socks they've ever worn."
- REASON #1 (MECHANISM): Explain WHY the claim is true. Non-binding bamboo fiber, graduated compression that adapts, wide-mouth opening. The mechanism makes the claim believable.
- REASON #2 (EVIDENCE): Stack data. Review frequencies, transformation metrics. Hopkins: each specific fact doubles persuasion.
- REASON #3 (SOCIAL PROOF): Other people's reasons. Customer quotes explaining WHY in their own words. Hopkins: a customer's reason is more powerful than a brand's reason.
- CTA: Logical conclusion: "That's why 107K people switched" or "Now you know why. Try them."
Best for: Solution-Aware and Product-Aware. MOF and BOF. Data-rich content.`,

  'The Gradualization (Schwartz)': `**The Gradualization** — Schwartz (awareness progression for Unaware audiences)
Structure: Relatable scenario (0-30%) → Gradual awareness shift (30-50%) → Connection to problem (50-70%) → Gentle solution intro (70-85%) → Soft CTA (85-100%)
Execution:
- SCENARIO: NO mention of socks, compression, marks, swelling, or ANY product language. Start with a situation they recognize but haven't connected to your category. "You know that feeling when you can't quite get comfortable?"
- SHIFT: The critical moment — "wait, this IS a problem I have." Must feel like THEIR realization, not your pitch. Use the Hidden Suffering pattern — acknowledge what they've never put into words.
- CONNECTION: Bridge dawning awareness to the solution category WITHOUT naming the product. "What if the problem isn't you — it's what you're wearing?"
- INTRODUCTION: Gently introduce Viasox as INFORMATION, not a pitch. "107,000 people discovered the same thing."
- CTA: Maximum softness: "Learn more," "See what they found." Schwartz: NEVER push a sale on Unaware. Goal is moving them to Problem-Aware.
Best for: SPECIFICALLY Unaware audiences. TOF only. The hardest audience needs the most patient framework.`,
};

/**
 * Ad-type-specific production style guidance for non-AGC video production briefs.
 */
function getVideoProductionNotes(adType: string): string {
  switch (adType) {
    case 'UGC (User Generated Content)':
      return `**AD TYPE PRODUCTION STYLE — UGC:**
All footage should look phone-shot, raw, and authentic. No professional lighting or crew feel.
- Primary Shot Type: **ON CAMERA** (selfie/front-facing camera)
- BROLL: Quick, handheld product shots — phone-quality, natural light
- Shot Angles: Primarily **Static (Selfie)**, **Sitting**, or **Standing** — wherever a real person would film themselves
- The script must sound SPOKEN, not written — natural pauses, conversational language, imperfect delivery
- If it reads like a polished production, rewrite it to sound like a real person talking to their phone`;
    case 'Founder Style':
      return `**AD TYPE PRODUCTION STYLE — FOUNDER:**
The founder speaks directly to camera with passion and personal conviction.
- Primary Shot Type: **ON CAMERA** — direct address, face visible
- BROLL: Behind-the-brand footage (warehouse, product design, team), intercut with talking head
- Shot Angles: **Static (Selfie)** or **Sitting** for personal feel, **Standing** for authority
- This is a MONOLOGUE — one person, authentic setting, personal story
- Tone: passionate, knowledgeable, genuine — "Let me tell you why I created this..."`;
    case 'Fake Podcast Ads':
      return `**AD TYPE PRODUCTION STYLE — FAKE PODCAST:**
Two people in a podcast/conversation setup having natural DIALOGUE about the product.
- Primary Shot Type: **ON CAMERA** for both speakers
- BROLL: Product close-ups intercut during conversation highlights
- Shot Angles: **Sitting** (podcast desk/table setup), occasional **Dynamic** for reaction shots
- Write as DIALOGUE — alternate speakers across rows, include natural interruptions and reactions
- Must sound like organic discovery, not scripted endorsement
- Use Talent Notes to specify which speaker (Host/Guest) is talking in each row`;
    case 'Spokesperson':
      return `**AD TYPE PRODUCTION STYLE — SPOKESPERSON:**
Expert or authority figure (doctor, nurse, professional) presenting the product with credibility.
- Primary Shot Type: **ON CAMERA** — direct address with professional gravitas
- BROLL: Medical/professional setting B-roll, product demonstrations
- Shot Angles: **Standing** or **Sitting** — professional environment
- Establish AUTHORITY first (credentials, experience) before delivering the product message
- Tone: Professional, trustworthy, measured — not salesy`;
    case 'Packaging/Employee':
      return `**AD TYPE PRODUCTION STYLE — PACKAGING/EMPLOYEE:**
Behind-the-scenes warehouse/packing room content. Real team showing care and attention.
- Primary Shot Type: Mix of **ON CAMERA** (employees speaking) and **BROLL** (hands packing, product details)
- Shot Angles: **Dynamic (Third-Person)** for warehouse tours, **Standing** for employee speaking, **Ground-Level** for product close-ups
- Show the human side: real team, real care, pride in work
- "We care about every pair" narrative — quality, attention to detail, personal touch`;
    default:
      return '';
  }
}

export function buildScriptPrompt(
  params: ScriptParams,
  analysis: FullAnalysis,
  memoryBriefing?: string,
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

${getProductPurchaseTriggers(params.product)}

${getProductStrategicInsights(params.product)}

${getScriptFrameworks()}

${getTransformationJourney()}

${getEmotionalArchitecture()}

${getVocabularyProtectionRules()}

${getCrossProductEmotionalSystem()}

${getCustomerVoiceBank()}

${getEmotionalLanguageBoundaries()}

${getVoiceToneExamples()}

${getProductObjectionBank(params.product)}

${getSegmentProductMatrix()}

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

${params.adType === 'AGC (Actor Generated Content)' ? `
## AGC REFERENCE MATERIAL

${buildBuildingBlocksReference()}

${buildShotTypesReference()}

${buildHookFormulaReference()}

${buildAgcRules()}
` : (params.adType !== 'Ecom Style' && params.adType !== 'Static') ? `
## VIDEO PRODUCTION BRIEF REFERENCE MATERIAL

${buildVideoProductionBriefReference()}
` : ''}

${params.adType === 'AGC (Actor Generated Content)' ? `## AGC PRODUCTION BRIEF OUTPUT FORMAT

This is an AGC (Actor-Generated Content) production brief. The output format is COMPLETELY DIFFERENT from other ad types. Follow this structure exactly:

### 1. STRATEGY SECTION
Start with a complete strategy block:
- **Concept:** [The creative concept — what is this ad about, what story does it tell?]
- **Angle:** [The strategic angle — the emotional/logical frame]
- **Avatar:** [Who is the person on screen — age range, look, energy, wardrobe, personality]
- **Location:** [Where the shoot takes place — be specific about the environment]
- **Product:** [Product line being featured]
- **Collection:** [Specific collection/patterns if relevant, or "Various"]
- **Promotion:** [Promo period if any, or "Evergreen"]
- **Offer:** [B1G1, B2G3, or None]
- **Pacing:** [${params.agcPacing === 'fast' ? 'Fast (15-30s) — punchy cuts, high energy' : params.agcPacing === 'deliberate' ? 'Deliberate (60-90s) — documentary rhythm, let moments breathe' : 'Standard (30-45s) — balanced pacing'}]
- **Music:** [Music direction — mood, genre, instruments, energy level]
- **Assets:** [Specific props, products, materials needed for the shoot]
- **Additional Notes:** [Production notes, special requirements, creative direction]

### 2. HOOKS — 9-Hook Matrix (3 Visuals × 3 Verbals)
Create EXACTLY 9 hooks by combining 3 Visual approaches with 3 Verbal hooks.

First, describe each Visual and Verbal approach:
**Visual A:** [Description of first camera setup/location/opening visual]
**Visual B:** [Description of second — must be genuinely DIFFERENT from A]
**Visual C:** [Description of third — must be genuinely DIFFERENT from A and B]
**Verbal 1:** [First hook line strategy]
**Verbal 2:** [Second hook line strategy — different emotional trigger]
**Verbal 3:** [Third hook line strategy — different emotional trigger]

Then output all 9 hooks as a markdown table:
| Hook | Building Block | Shot Type | Shot Angle | Talent Notes | Shot Notes | Shot Visual | Lines | Editing Notes | Caption |
|------|----------------|-----------|------------|--------------|------------|-------------|-------|---------------|---------|
| A1 | [label] | [type] | [angle] | [direction] | [technical] | [what viewer sees] | [spoken words] | [post notes] | [on-screen text] |
| A2 | ... | ... | ... | ... | ... | ... | ... | ... | ... |
| A3 | ... | ... | ... | ... | ... | ... | ... | ... | ... |
| B1 | ... | ... | ... | ... | ... | ... | ... | ... | ... |
| B2 | ... | ... | ... | ... | ... | ... | ... | ... | ... |
| B3 | ... | ... | ... | ... | ... | ... | ... | ... | ... |
| C1 | ... | ... | ... | ... | ... | ... | ... | ... | ... |
| C2 | ... | ... | ... | ... | ... | ... | ... | ... | ... |
| C3 | ... | ... | ... | ... | ... | ... | ... | ... | ... |

### 3. BODY SECTION
The main script body. Each row = ONE thought, ONE breath. 20-40 rows depending on pacing.

| # | Building Block | Shot Type | Shot Angle | Talent Notes | Shot Notes | Shot Visual | Lines | Editing Notes | Caption |
|---|----------------|-----------|------------|--------------|------------|-------------|-------|---------------|---------|
| 1 | [label] | [type] | [angle] | [direction] | [technical] | [what viewer sees] | [spoken words] | [post notes] | [on-screen text] |
| 2 | ... | ... | ... | ... | ... | ... | ... | ... | ... |

${params.agcBodyFormat === 'face-to-camera' ? 'Body Format: **Face-to-Camera.** ALL speaking rows use Shot Type = ON CAMERA. Talent speaks directly to camera, face visible.' : "Body Format: **POV (Voiceover Narration).** ALL speaking rows use Shot Type = SCRIPT. Talent's voice is heard as VO but they are NOT on camera speaking. Camera shows hands, product, environment."}
BROLL rows (visual-only cutaways) may appear in either format as brief interruptions between speaking rows.

### 4. EXTRA B-ROLL LIST
8-12 additional shots for editing flexibility (NOT in the main body):

| # | Shot Type | Shot Angle | Shot Notes | Shot Visual | Editing Notes |
|---|-----------|------------|------------|-------------|---------------|
| 1 | BROLL | [angle] | [technical] | [what viewer sees] | [how editors might use this] |

### 5. FRAMEWORK BREAKDOWN
## How ${params.framework} Was Applied
Explain how the framework maps to the Building Block sequence in the body. Reference specific row numbers and Building Block labels.` : params.adType === 'Ecom Style' ? `## ECOM AD BRIEF OUTPUT FORMAT

This is an EDITING BRIEF — a complete production document for an editor who will assemble the ad from existing footage with AI voiceover. The output must follow the dedicated Ecom brief template structure.

### VISUAL GROUNDING RULES (CRITICAL)
This ad is built entirely from EXISTING footage. Every visual must be grounded in footage that actually exists.

**Available Shot Types (use as Shot Type tags):**
- Core: Talking Head, Putting On Socks, Feet Up Lifestyle, Bare Legs – Condition, Walking, Standing Feet, Before/After Reveal, Studio Product Shot, Animation / Motion Graphics, Text/Title Card
- Supplementary: Socks With Shoes, Documentary / Interview, Product Flat Lay (Branded), Branded Shipping Box, EGC / Warehouse, Lifestyle Flat Lay, Material Close-up, PNG Cutout, Home Environment, Outdoor Setting
- Limited: Yoga / Wellness B-Roll (Ankle Compression only), Car Interior, Mall / Public Indoor, Cafe / Seated Public

**Footage we do NOT have — NEVER write visuals implying these:** Indoor gym/fitness, medical offices/clinical settings, sports activities (running, cycling, hiking), travel/airports, restaurants/dining, children/family scenes, pet scenes.

**Visual Description Rules:**
The Suggested Visual column must be a SHORT, CONVERSATIONAL description of what the viewer sees — one natural sentence, 8-20 words.
- GOOD: "Close-up of her pulling the compression socks up over her calves on the couch"
- GOOD: "Her bare legs with visible sock marks and redness around the ankles"
- BAD: "Talking Head" (that's a shot type label, not a visual description)
- BAD: "B-roll of feet" (too vague, the editor can't pull this)

**Visual Pacing:** Vary visuals across the script. If you've written 2+ of the same shot type in a row, switch to something different. The editor needs visual variety.

### SCRIPT WRITING STYLE (NON-NEGOTIABLE)
Every line must sound like a real person talking to a friend. Full, natural sentences with everyday words. NOT fragments, NOT polished copywriting prose, NOT aggressive direct response.
- Use natural filler words ("honestly," "actually," "just," "pretty much")
- NO single-word or two-word lines. NO telegram fragments.
- NO polished metaphors ("heaviness whispers," "legs carry the weight")
- Most lines 10-25 words. Read every line out loud — if it sounds like an ad, rewrite it.

### SCRIPT FRAMEWORK ADAPTIVITY
The script structure must emerge from the concept:
- **Confession Arc** (first-person): Admission → what they used to believe → discovery → new reality
- **The Observation** (third-person narrator): Camera notices → describes what we see → reveal → product
- **The Reframe** (second-person education): Challenge belief → explain why wrong → what works → proof
- **The Permission Narrative** (second-person gentle): Validate struggle → acknowledge → give permission → how
- **The Skeptic's Journey** (first-person): Doubt → why skeptical → what changed mind → converted
- **The Contrast/Split** (mixed): Two outcomes → same situation → reveal difference
- **Day-in-the-Life** (first or third-person): Moment → walk through day → same day with product → different ending

### AVOID THESE OVERUSED PATTERNS
Never use: "3pm fatigue", "sock drawer" metaphors, "Here's the thing...", "What if you could...", "The result?" as a transition.

---

## OUTPUT STRUCTURE — ECOM AD BRIEF

### 1. BRIEF INFO
Output as a markdown table with these exact fields:
| Field | Value |
|-------|-------|
| Brief ID | [Generate: PRODUCT_FUNNEL_ConceptSlug_v1, e.g., ES_TOF_DentTest_v1, COMP_MOF_GravityExplainer_v1, ACS_BOF_AnkleSecret_v1] |
| Date | ${new Date().toISOString().split('T')[0]} |
| Product | ${params.product === 'EasyStretch' ? 'EasyStretch Socks (Non-Binding Diabetic Socks)' : params.product === 'Compression' ? 'Compression Socks (Knee-High)' : 'Ankle Compression Socks'} |
| Collection | [Choose based on concept: "Solid Colors + Patterns", "Solid Colors (Black, Navy)", etc.] |
| Collection Asset | [Specific patterns/colors needed, e.g., "Solid black for demo, patterns at reveal"] |
| Format | 9:16 vertical (Reels/Stories), 1:1 secondary |

### 2. STRATEGY
| Field | Value |
|-------|-------|
| Awareness Level | ${params.awarenessLevel} (${params.funnelStage}) |
| Primary Emotion | [Derived from concept — e.g., Relief, Hope, Confidence, Independence, Trust] |
| Avatar | [Specific person, NOT a label — e.g., "Nurse, 52, who's accepted leg pain as part of the job" or "The Defeated Shopper – Adults 45-75 who have bought countless socks that claim to fit but don't"] |
| Landing Page | [${params.product} Collection] |

### 3. OFFER
| Field | Value |
|-------|-------|
| Promo | ${params.offer === 'B2G3' ? 'Buy 2 Get 3 Free (5 for $60)' : params.offer === 'B1G1' ? 'Buy 1 Get 1 Free' : 'None'} |
| Promo Asset | ${params.offer !== 'None' ? 'Standard end card' : 'None'} |
| Value Callout | ${params.offer === 'B2G3' ? '5 Pairs for $60' : params.offer === 'B1G1' ? '2 Pairs for $30' : 'None'} |
| Urgency Element | [If applicable based on promo period, otherwise "None"] |

### 4. EDITING INSTRUCTIONS
| Field | Value |
|-------|-------|
| Pacing | [Derived from concept — e.g., "Demonstration-focused. Opens on visual evidence, builds through the test, delivers solution. 40-50 seconds."] |
| Resolution | 9:16 primary, 1:1 secondary |
| Caption & Graphics | [Text overlay strategy — what key moments get captions, style notes] |
| Transitions | [Cut style — e.g., "Clean cuts. Zoom on evidence shots. Smooth reveal on solution."] |
| Music | [Mood, genre, energy — e.g., "Curious opening, building through test, warm resolution. Discovery energy."] |
| Voiceover | AI Voiceover – [Tone description derived from concept — e.g., "Warm, observational female voice. Noticing something, then explaining it."] |
| Asset | [List the specific footage categories from the shot type library needed for this brief] |
| Notes | [Production notes — what's most important about this brief's visual approach] |

### 5. SCRIPT (HOOKS) — 3 Variations
Output as a markdown table with EXACTLY these 4 columns:
| # | Shot Type | Suggested Visual | Hook Line |
|---|-----------|-----------------|-----------|
| 1 | [footage tag] | [conversational description, 8-20 words] | "[the hook line — full natural sentence]" |
| 2 | [footage tag] | [conversational description] | "[different hook approach]" |
| 3 | [footage tag] | [conversational description] | "[different hook approach]" |

Each hook must use a DIFFERENT approach. Note which principle it applies (e.g., "Hook 1 — Hopkins Selector").

### 6. SCRIPT (BODY)
Output as a markdown table with EXACTLY these 4 columns:
| # | Shot Type | Suggested Visual | Script Line |
|---|-----------|-----------------|-------------|
| 1 | [footage tag] | [conversational description, 8-20 words] | "[line — must sound like a real person talking]" |
| 2 | ... | ... | ... |

Row count adapts to the concept and duration — more rows for longer scripts, fewer for shorter. Each row = one thought, one breath.

### 7. KEY DATA POINTS
List every statistic and customer quote referenced in the script, with source frequencies.

### 8. HOW ${params.framework} WAS APPLIED
Walk through each phase of the framework and explain how it maps to specific rows in the body. Reference row numbers.` : params.adType === 'Static' ? `## SCRIPT OUTPUT FORMAT

### 1. STRATEGY SUMMARY (at the top, before the script)
Start with a clear summary block:

**Hypothesis:** [What we believe about the audience and why this approach will work]
**Ad Type:** Static (Static Image)
**Primary Persona:** [The specific customer segment this targets]
**Awareness Level:** [The awareness level]
**Angle:** [The strategic angle — the emotional/logical frame being used]

### 2. SCRIPT TABLE (markdown table format)
Write the ENTIRE script as a markdown table with these columns:
| Element | Content | Visual Direction |
With rows for: Headline, Subhead, Body Copy, CTA Button, Visual Description.

### 3. FRAMEWORK BREAKDOWN (below the table)
After the script table, include a section:
## How ${params.framework} Was Applied
Explain specifically how the selected framework was translated into this script. Walk through each phase of the framework. Reference the specific elements. This helps the creative team understand the strategic reasoning behind each section of the script.` : `## VIDEO PRODUCTION BRIEF OUTPUT FORMAT

This is a video production brief. The output uses a detailed table format with building block labels, shot types, and production notes for each line.

${getVideoProductionNotes(params.adType)}

### 1. STRATEGY SUMMARY
Start with a clear summary block:

**Hypothesis:** [What we believe about the audience and why this approach will work]
**Ad Type:** ${params.adType}
**Primary Persona:** [The specific customer segment this targets]
**Awareness Level:** [The awareness level]
**Angle:** [The strategic angle — the emotional/logical frame being used]
${params.agcLocation ? `**Location:** ${params.agcLocation === 'Auto — decide the best location based on the pre-loaded concept, target persona, and DTC marketing best practices' ? '[Choose the best location based on the concept, persona, and ad type — be specific about the environment]' : params.agcLocation}` : '**Location:** [Choose the best location for this ad type — be specific about the environment]'}
${params.agcTalentDescription ? `**Talent:** ${params.agcTalentDescription === 'Auto — decide the best talent profile based on the pre-loaded concept, target persona, and DTC marketing best practices' ? '[Choose the best talent profile based on the concept and persona — describe age range, look, energy, wardrobe]' : params.agcTalentDescription}` : '**Talent:** [Choose the best talent profile for this ad type — describe age range, look, energy, wardrobe]'}
${params.agcPacing ? `**Pacing:** ${params.agcPacing === 'fast' ? 'Fast (15-30s) — punchy cuts, high energy' : params.agcPacing === 'deliberate' ? 'Deliberate (60-90s) — documentary rhythm, let moments breathe' : 'Standard (30-45s) — balanced pacing'}` : ''}
${params.agcMusicDirection ? `**Music:** ${params.agcMusicDirection}` : '**Music:** [Music direction — mood, genre, instruments, energy level]'}
**Offer:** ${params.offer !== 'None' ? params.offer : 'None'}

### 2. HOOKS (${params.hookVariations} variations)
Write all ${params.hookVariations} hook variations as a markdown table with these columns:

| Hook # | Building Block | Shot Type | Shot Angle | Talent Notes | Shot Notes | Shot Visual | Lines | Editing Notes | Caption |
|--------|----------------|-----------|------------|--------------|------------|-------------|-------|---------------|---------|
| 1 | [label] | [type] | [angle] | [direction] | [technical] | [what viewer sees] | [spoken words] | [post notes] | [on-screen text] |
| 2 | ... | ... | ... | ... | ... | ... | ... | ... | ... |

Each hook should use a DIFFERENT Building Block type and approach. Every hook MUST have spoken words in the Lines column.

### 3. BODY SECTION
The main script body. Each row = ONE thought, ONE breath. The number of rows depends on duration — more rows for longer scripts, fewer for shorter.

| # | Building Block | Shot Type | Shot Angle | Talent Notes | Shot Notes | Shot Visual | Lines | Editing Notes | Caption |
|---|----------------|-----------|------------|--------------|------------|-------------|-------|---------------|---------|
| 1 | [label] | [type] | [angle] | [direction] | [technical] | [what viewer sees] | [spoken words] | [post notes] | [on-screen text] |
| 2 | ... | ... | ... | ... | ... | ... | ... | ... | ... |

**CRITICAL BODY RULES:**
- EVERY row MUST have spoken words in the Lines column — NO silent rows. Even BROLL cutaway rows must have voiceover continuing.
- Each row = ONE thought, ONE breath. If you would pause mid-sentence, SPLIT into two rows.
- Every row MUST have a Building Block label that explains its strategic purpose in the persuasion arc.

### 4. FRAMEWORK BREAKDOWN
## How ${params.framework} Was Applied
Explain how the framework maps to the Building Block sequence in the body. Reference specific row numbers and Building Block labels.`}

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
  const isAgc = params.adType === 'AGC (Actor Generated Content)';
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
Do not dilute, reinterpret, or drift from the concept. Execute it faithfully.
${isAgc ? `
**AGC-SPECIFIC CONCEPT EXECUTION:**
The pre-loaded concept must deeply shape EVERY section of the AGC production brief:
- **Strategy Section:** The Concept, Angle, and Avatar fields must be derived DIRECTLY from the pre-loaded concept. Do not invent new ones.
- **9-Hook Matrix:** All 9 hooks must explore different facets of the SAME concept angle. The 3 Verbal hooks should each approach the concept's core insight from a different emotional trigger, but they must all serve the concept's angle — not random angles.
- **Body Section:** The Building Block sequence must follow the persuasion arc that the concept demands. If the concept is about independence, the body should build toward an independence revelation. If it's about hidden health dangers, the body should build suspense toward that danger. Every Building Block choice must serve the concept's narrative.
- **Location & Talent:** If location or talent were set to "Auto (decide based on concept)," choose the location and talent that would most authentically bring THIS specific concept to life. A concept about morning routines needs a bedroom/bathroom. A concept about nursing shifts needs a break room or hospital hallway.
- **Shot Visuals:** The visual descriptions must paint the world of the concept. Every shot should feel like it belongs in the same story the concept is telling.` : ''}`
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
${params.adType.includes('AGC') ? `AGC (Actor-Generated Content): This is a PRODUCTION BRIEF for a professional shoot with hired actors.
Body Format: ${params.agcBodyFormat === 'face-to-camera' ? 'Face-to-Camera (ON CAMERA — talent speaks directly to camera)' : 'POV / Voiceover Narration (SCRIPT — VO over visuals, talent not on camera speaking)'}
${params.agcLocation ? `Location: ${params.agcLocation}` : ''}
${params.agcTalentDescription ? `Talent: ${params.agcTalentDescription}` : ''}
${params.agcPacing ? `Pacing: ${params.agcPacing === 'fast' ? 'Fast (15-30s, punchy cuts)' : params.agcPacing === 'deliberate' ? 'Deliberate (60-90s, documentary rhythm)' : 'Standard (30-45s, balanced)'}` : ''}
${params.agcMusicDirection ? `Music: ${params.agcMusicDirection}` : ''}
Follow the AGC Production Brief output format from the system instructions. Use the 9-hook matrix (3 Visuals x 3 Verbals), Building Block labels on every row, and include 8-12 extra B-roll shots.` : ''}${params.adType.includes('UGC') ? 'UGC (User-Generated Content): Raw, authentic, phone-shot. A real person speaking to camera from their home, car, or break room. The script must sound SPOKEN, not written — natural pauses, conversational language, imperfect delivery. Visuals are handheld, natural light. If it reads like a polished ad script, rewrite it to sound like a real person talking.' : ''}${params.adType === 'Ecom Style' ? 'Ecom Style (Editing Brief): Built entirely from existing footage with AI voiceover. Every visual MUST be grounded in footage that exists — use the Shot Type tags and available footage list from the system instructions. Write conversational visual descriptions (one sentence, 8-20 words) telling the editor what you picture, NOT labels. Script lines must sound like a real person talking to a friend — full natural sentences, everyday words. NO fragments, NO copywriting prose, NO aggressive DR commands. Use the script framework that fits the concept (confession, observation, reframe, permission, skeptic journey, contrast, day-in-the-life). Vary visual pacing — don\'t stack same shot types in a row. We do NOT have gym, medical, sports, travel, hiking, or children footage.' : ''}${params.adType === 'Founder Style' ? 'Founder Style: The founder speaks directly to camera with passion and authority. Personal story, behind-the-brand narrative. The script is a MONOLOGUE — one person, authentic setting, personal conviction. "Let me tell you why I created this..."' : ''}${params.adType === 'Fake Podcast Ads' ? 'Fake Podcast Ads: Two people in podcast setup having a natural CONVERSATION about the product. Must sound like organic discovery, not scripted. Write it as DIALOGUE with natural interruptions, reactions, and genuine surprise.' : ''}${params.adType === 'Spokesperson' ? 'Spokesperson: Expert or authority figure (doctor, nurse, professional) presenting the product. Credibility-driven. The script should establish AUTHORITY first, then deliver the message with professional gravitas.' : ''}${params.adType === 'Packaging/Employee' ? 'Packaging/Employee: Behind-the-scenes warehouse content. Real team packing orders, showing care and attention. The script describes the SETTING, employee actions, and the "we care about every pair" narrative.' : ''}
${!params.adType.includes('AGC') && params.adType !== 'Ecom Style' && params.adType !== 'Static' ? `
Follow the Video Production Brief output format from the system instructions. Use Building Block labels on every row.
${params.agcLocation ? `Location: ${params.agcLocation}` : ''}
${params.agcTalentDescription ? `Talent: ${params.agcTalentDescription}` : ''}
${params.agcPacing ? `Pacing: ${params.agcPacing === 'fast' ? 'Fast (15-30s, punchy cuts)' : params.agcPacing === 'deliberate' ? 'Deliberate (60-90s, documentary rhythm)' : 'Standard (30-45s, balanced)'}` : ''}
${params.agcMusicDirection ? `Music: ${params.agcMusicDirection}` : ''}` : ''}
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

${params.adType === 'AGC (Actor Generated Content)' ? `OUTPUT STRUCTURE — AGC PRODUCTION BRIEF (follow this exact order):

**1. STRATEGY SECTION** — Complete strategy block with: Concept, Angle, Avatar, Location, Product, Collection, Promotion, Offer, Pacing, Music, Assets, Additional Notes

**2. 9-HOOK MATRIX** — First describe the 3 Visual approaches and 3 Verbal hooks, then output all 9 combinations as a markdown table:
| Hook | Building Block | Shot Type | Shot Angle | Talent Notes | Shot Notes | Shot Visual | Lines | Editing Notes | Caption |

**3. BODY SECTION** — 20-40 rows, each row = one thought, one breath. Every row has a Building Block label.
| # | Building Block | Shot Type | Shot Angle | Talent Notes | Shot Notes | Shot Visual | Lines | Editing Notes | Caption |
Body format: ${params.agcBodyFormat === 'face-to-camera' ? 'Face-to-Camera (all speaking rows = ON CAMERA)' : 'POV (all speaking rows = SCRIPT/VO)'}

**4. EXTRA B-ROLL LIST** — 8-12 additional shots for editing flexibility:
| # | Shot Type | Shot Angle | Shot Notes | Shot Visual | Editing Notes |

**5. KEY DATA POINTS** — Every statistic and customer quote referenced, with source frequencies.

**6. HOW ${params.framework.toUpperCase()} WAS APPLIED** — Walk through how the framework maps to the Building Block sequence. Reference row numbers.

The brief should:
1. Apply the ${params.framework} framework through the Building Block sequence — the framework shapes the persuasion arc
2. Follow the AGC production brief format with ALL 9 columns on every row
3. Match the ${params.funnelStage} funnel stage and ${params.awarenessLevel} awareness level
4. Include a Building Block label on EVERY row (hooks and body)
5. Follow the Short Lines Rule — one thought, one breath per row
6. Follow the Format Consistency Rule — ${params.agcBodyFormat === 'face-to-camera' ? 'all speaking rows ON CAMERA' : 'all speaking rows SCRIPT (VO)'}
7. Use real customer language pulled directly from the review data
8. End with 8-12 extra B-roll shots
9. Heavily apply the principles from ${params.bookReference} throughout

CRITICAL: Write completely original copy. Every line must be built from the actual review data: real customer language, real frequencies, real quotes. The four books teach you the craft; the review data gives you the material. If any line could have been written without looking at the data, rewrite it.` : params.adType === 'Ecom Style' ? `OUTPUT STRUCTURE — ECOM AD BRIEF (follow the dedicated Ecom template from system instructions):

Follow the ECOM AD BRIEF OUTPUT FORMAT exactly. Output all 8 sections in order:
1. **BRIEF INFO** — table with Brief ID, Date, Product, Collection, Collection Asset, Format
2. **STRATEGY** — table with Awareness Level, Primary Emotion, Avatar, Landing Page
3. **OFFER** — table with Promo, Promo Asset, Value Callout, Urgency Element
4. **EDITING INSTRUCTIONS** — table with Pacing, Resolution, Caption & Graphics, Transitions, Music, Voiceover, Asset, Notes
5. **SCRIPT (HOOKS)** — 3 hooks in a 4-column table: # | Shot Type | Suggested Visual | Hook Line
6. **SCRIPT (BODY)** — body rows in a 4-column table: # | Shot Type | Suggested Visual | Script Line
7. **KEY DATA POINTS** — every statistic and customer quote referenced, with source frequencies
8. **HOW ${params.framework.toUpperCase()} WAS APPLIED** — walk through how the framework maps to specific rows in the body. Reference row numbers.

ECOM CRITICAL RULES:
- Shot Type column = footage category tag (Talking Head, Putting On Socks, Studio Product Shot, etc.)
- Suggested Visual column = one conversational sentence describing what the viewer sees (8-20 words), NOT a label
- Every visual must be grounded in footage that EXISTS — never reference gym, medical, sports, travel, hiking, children
- Every script line must sound like a real person talking to a friend — full natural sentences, no fragments, no ad copy
- Vary visuals: don't stack 2+ of the same shot type in a row
- Always output exactly 3 hooks with different approaches. Note which principle each applies.
- Script body row count adapts to concept and duration — each row = one thought, one breath
- Choose a script framework that fits the concept, don't default to the same arc every time
- Avoid overused patterns: "3pm fatigue", "sock drawer", "Here's the thing...", "What if you could...", "The result?"

The brief should:
1. Follow the exact ${params.framework} framework structure through the script body
2. Auto-fill all Brief Info, Strategy, Offer, and Editing Instructions from context
3. Match the ${params.funnelStage} funnel stage — appropriate hook intensity, CTA directness
4. Use real customer language pulled directly from the review data
5. Ground every visual in available footage — if you can't picture existing footage for a visual, redirect
6. Write every line as a conversational sentence — read it out loud, if it sounds like an ad, rewrite it
7. Heavily apply the principles from ${params.bookReference} throughout

CRITICAL: Write completely original copy. Every line must be built from the actual review data: real customer language, real frequencies, real quotes. The four books teach you the craft; the review data gives you the material. If any line could have been written without looking at the data, rewrite it.` : params.adType === 'Static' ? `OUTPUT STRUCTURE (follow this exact order):

**1. STRATEGY SUMMARY** (at the very top)
- Hypothesis
- Ad Type (${params.adType} — Static Image)
- Primary Persona
- Awareness Level (${params.awarenessLevel})
- Angle (the strategic messaging angle)

**2. SCRIPT TABLE** (markdown table)
Use the exact table format from the instructions:
| Timestamp | Shot Type | Visuals | Line | Delivery |

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

CRITICAL: Write completely original copy. Every line must be built from the actual review data: real customer language, real frequencies, real quotes. The four books teach you the craft; the review data gives you the material. If any line could have been written without looking at the data, rewrite it.` : `OUTPUT STRUCTURE — VIDEO PRODUCTION BRIEF (follow this exact order):

**1. STRATEGY SUMMARY** (at the very top)
- Hypothesis
- Ad Type (${params.adType})
- Primary Persona
- Awareness Level (${params.awarenessLevel})
- Angle (the strategic messaging angle)
- Location (specific environment for the shoot)
- Talent (who appears on screen — age range, look, energy, wardrobe)
- Pacing${params.agcPacing ? ` (${params.agcPacing})` : ''}
- Music direction
- Offer (${params.offer !== 'None' ? params.offer : 'None'})

**2. HOOKS** — ${params.hookVariations} hook variations as a production brief table:
| Hook # | Building Block | Shot Type | Shot Angle | Talent Notes | Shot Notes | Shot Visual | Lines | Editing Notes | Caption |

Each hook should use a DIFFERENT Building Block type and approach. Every hook MUST have spoken words in Lines.

**3. BODY SECTION** — Main script body. Each row = one thought, one breath. Every row has a Building Block label.
| # | Building Block | Shot Type | Shot Angle | Talent Notes | Shot Notes | Shot Visual | Lines | Editing Notes | Caption |

**4. KEY DATA POINTS** — Every statistic and customer quote referenced, with source frequencies.

**5. HOW ${params.framework.toUpperCase()} WAS APPLIED** — Walk through how the framework maps to the Building Block sequence. Reference row numbers.

The brief should:
1. Apply the ${params.framework} framework through the Building Block sequence — the framework shapes the persuasion arc
2. Follow the production brief format with ALL columns on every row
3. Match the ${params.funnelStage} funnel stage and ${params.awarenessLevel} awareness level
4. Include a Building Block label on EVERY row (hooks and body)
5. Follow the Short Lines Rule — one thought, one breath per row
6. EVERY row must have spoken words in the Lines column — NO silent rows
7. Use real customer language pulled directly from the review data
8. End with a clear, specific CTA appropriate for ${params.funnelStage}
9. Heavily apply the principles from ${params.bookReference} throughout

CRITICAL: Write completely original copy. Every line must be built from the actual review data: real customer language, real frequencies, real quotes. The four books teach you the craft; the review data gives you the material. If any line could have been written without looking at the data, rewrite it.`}`;

  // Inject memory briefing if available — focused on style/voice patterns
  const memorySection = memoryBriefing
    ? `\n\n## CREATIVE INTELLIGENCE — STYLE & VOICE AWARENESS\n\nThe following briefing summarizes the creative history of this system. Use the sections on "Overused Patterns" and "Proven Strengths" to write scripts that feel fresh while building on what works.\n\n${memoryBriefing}`
    : '';

  return { system: system + memorySection, user };
}
