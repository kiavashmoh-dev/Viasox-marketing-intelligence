import type { HooksParams, HookStyle, FullAnalysis } from '../engine/types';
import { buildSystemBase, getProductAnalysis } from './systemBase';
import { getAwarenessHookGuide } from './awarenessGuide';

/* ------------------------------------------------------------------ */
/*  Hook-style micro-guides (marketing-book grounded)                 */
/* ------------------------------------------------------------------ */

function buildHookStyleGuides(styles: HookStyle[]): string {
  const allGuides: Record<HookStyle, string> = {
    'Question Hook': `**Question Hook**
Open with a question the viewer mentally answers. It must be specific enough that only YOUR target persona says "yes."
- Hopkins: Questions are selectors — they pull in only the people who have that problem.
- Schwartz: At Problem Aware, ask about the PROBLEM. At Solution Aware, ask about the SOLUTION GAP.
- Best for: Problem Aware, Solution Aware. Video + Static.`,

    'Bold Claim': `**Bold Claim**
Lead with a specific, surprising, data-backed statement that demands attention. Must be provable from review data.
- Hopkins: Specificity IS credibility. Precise numbers beat vague claims.
- Bly: Ultra-specific (one of the 4 U's). The more precise the number, the more believable.
- Best for: Product Aware, Solution Aware. All formats.`,

    'Pattern Interrupt': `**Pattern Interrupt**
Say or show something unexpected that breaks the viewer's scroll pattern. Violate their expectations of what an ad in this category looks like.
- Neumeier: We notice only what's DIFFERENT. Your first 3 seconds must differentiate.
- Schwartz: For sophisticated markets, you need a new MECHANISM or surprising frame.
- Best for: Unaware, TOF cold audiences. Video especially.`,

    'Story Opening': `**Story Opening**
Start mid-story — drop the viewer into a specific moment. Human brains are wired for narrative.
- Schwartz: Identification through character — show a specific person in a specific moment.
- Hopkins: The best ads feel like news or a personal story, never like ads.
- Best for: Unaware, Problem Aware. Video, UGC, Founder Style.`,

    'Curiosity Gap': `**Curiosity Gap**
Create an information gap that can only be closed by watching. Tease the answer without giving it away.
- Schwartz: Curiosity is the most powerful tool for Unaware audiences.
- Bly: The "useful" U — promise information they'll value.
- Best for: Unaware, Problem Aware. Video, Text.`,

    'Social Proof': `**Social Proof**
Lead with numbers, ratings, or collective behavior.
- Schwartz: Mass social proof dissolves skepticism — when the crowd has spoken, individuals follow.
- Hopkins: Testimonials are the most powerful form of advertising.
- Best for: Product Aware, Solution Aware. All formats.`,

    'Contrarian / Myth Buster': `**Contrarian / Myth Buster**
Challenge a widely held belief.
- Schwartz: In a sophisticated market, the contrarian position captures attention because it breaks through noise.
- Bly: The "unique" U — say something different from everyone else.
- Best for: Problem Aware, Solution Aware. Video, Text.`,

    'Identity Callout': `**Identity Callout**
Name the viewer directly by who they ARE.
- Hopkins: Select your audience in the headline. Address THEM only.
- Schwartz: Identification is one of the three dimensions — people buy to confirm who they are.
- Best for: All awareness levels. All formats.`,

    'Pain Agitation': `**Pain Agitation**
Name a specific pain, then intensify it — make it feel MORE urgent before offering relief.
- Schwartz: Intensification — make the desire (or pain) so vivid they can't ignore it.
- Bly: BFD — hit the FEELING behind the problem, not just the symptom.
- Best for: Problem Aware. Video, UGC.`,

    'Transformation Reveal': `**Transformation Reveal**
Show or describe the before/after in the very first beat. The viewer sees the result immediately.
- Schwartz: Visualization of fulfillment — let them SEE the after state vividly.
- Hopkins: Show the product working — the sample principle in the first 3 seconds.
- Best for: Solution Aware, Product Aware. Video, Static.`,

    'Permission Hook': `**Permission Hook**
Give the viewer permission to stop accepting their problem.
- Schwartz: Release from resignation — many people have accepted their problem as "just how it is."
- Bly: Address the belief system — break the belief that nothing will help.
- Best for: Problem Aware, Unaware. Video, Text.`,

    'Insider / Secret': `**Insider / Secret**
Position the information as privileged knowledge from an expert or insider.
- Hopkins: Service principle — the expert GIVES knowledge, which builds trust.
- Schwartz: Expert mechanism — people trust the product because they trust the source.
- Best for: Solution Aware, Problem Aware. Spokesperson, Founder Style.`,

    'Comparison / Versus': `**Comparison / Versus**
Directly contrast the old way vs. the new way, or competitors vs. your product.
- Schwartz: New mechanism — in a sophisticated market, show WHY you're fundamentally different.
- Neumeier: Differentiation is survival — show the gap.
- Best for: Solution Aware, Product Aware. Video, UGC, Static.`,

    'Warning / Urgency': `**Warning / Urgency**
Create genuine urgency — either health-related concern (gentle) or scarcity/timing.
- Schwartz: Forces of change — specific moments ACTIVATE desire.
- Bly: Urgent (first of the 4 U's) — give a reason to act NOW.
- Best for: Problem Aware, BOF retargeting. Video, Static.`,

    'Emotional Trigger': `**Emotional Trigger**
Lead with pure emotion — joy, relief, dignity, independence. Hit the feeling before the logic.
- Neumeier: Brand = gut feeling. Create the FEELING first.
- Schwartz: Work on the desire dimension — make them FEEL the fulfillment.
- Best for: Unaware, Problem Aware. Video, UGC, Founder.`,

    'Direct Address': `**Direct Address**
Speak directly to the viewer as if you know them. Break the fourth wall immediately.
- Bly: Write to ONE person. "You" is the most powerful word in copy.
- Hopkins: The best ads feel like a personal conversation, not a broadcast.
- Best for: Problem Aware, Solution Aware. Video DTC, UGC.`,

    'Shock Value': `**Shock Value**
Lead with a surprising visual or statement that stops the scroll through sheer unexpectedness.
- Neumeier: We notice what's different — shock creates differentiation in the first beat.
- Schwartz: Pattern interrupt for Unaware audiences who don't know they should care.
- Best for: Unaware, TOF. Video.`,

    'Relatable Moment': `**Relatable Moment**
Describe a micro-moment the viewer has experienced — so specific it feels like mind-reading.
- Schwartz: Identification at its most powerful — mirror their exact experience.
- Bly: Use the prospect's own language from reviews.
- Best for: Problem Aware, Unaware. Video, UGC, Text.`,

    'Enemy Callout': `**Enemy Callout**
Name the enemy — the old way, the bad product, the industry lie. Unite the viewer AGAINST something.
- Schwartz: Naming the enemy intensifies desire by creating contrast.
- Hopkins: Position your product as the antidote to what's wrong.
- Best for: Solution Aware, Problem Aware. Video, Founder, UGC.`,

    'Aspirational Vision': `**Aspirational Vision**
Paint the future state so vividly the viewer wants to step into it.
- Schwartz: Intensification of desire — visualize fulfillment so vividly they practically live in it.
- Neumeier: Delight — show something unexpectedly wonderful about the after state.
- Best for: Solution Aware, Product Aware. Video, Static.`,
  };

  if (styles.length === 0) {
    return Object.values(allGuides).join('\n\n');
  }

  return styles.map((s) => allGuides[s]).filter(Boolean).join('\n\n');
}

/* ------------------------------------------------------------------ */
/*  SCRIPT-MODE: Deep script analysis + tailored hook generation      */
/* ------------------------------------------------------------------ */

function buildScriptModeSystem(
  params: HooksParams,
  analysis: FullAnalysis,
): string {
  return `${buildSystemBase()}

## YOUR ROLE: SCRIPT-TAILORED HOOK SPECIALIST

You are an expert hook writer whose SOLE job is to create hooks that plug directly before a specific script. You are NOT generating generic hooks — you are writing the opening line(s) for an existing piece of creative. Every hook you produce must feel like it was ALWAYS the beginning of this script.

## THE SCRIPT YOU ARE WRITING HOOKS FOR
\`\`\`
${params.scriptContext!.slice(0, 8000)}
\`\`\`

## MANDATORY STEP 1: SCRIPT DECOMPOSITION (Do this BEFORE writing any hooks)

Before generating a single hook, you MUST analyze the script and output a brief "Script DNA" section at the top of your response. Extract:

1. **ANGLE** — What is the central persuasion angle running through this script? (e.g., "social proof from a nurse who was skeptical", "pain-to-relief transformation for a standing worker", "style reclamation for someone who hated medical socks"). This is the throughline that EVERY hook must connect to.

2. **PERSONA** — Who is speaking or being depicted? What is their identity, voice, and relationship to the product? (e.g., "A 58-year-old retired nurse, warm and matter-of-fact, slightly humorous, speaking from personal experience"). Every hook must sound like THIS person would say it.

3. **TONE & VOICE** — Is the script casual UGC? Authoritative spokesperson? Emotional testimonial? Playful? Serious? Clinical? The hooks must be written in this EXACT register. If the script uses contractions and slang, the hooks use contractions and slang. If it's measured and professional, the hooks are measured and professional.

4. **CONCEPT** — What is the creative concept? (e.g., "morning routine reveal", "side-by-side comparison with old socks", "emotional gift-giving moment", "day-in-the-life follow"). The hook must SET UP this concept, not contradict it.

5. **FIRST LINE** — Quote the exact first line of the script body. This is the line that comes IMMEDIATELY after your hook. The hook must create a seamless transition INTO this line. Read it out loud: [HOOK] → [FIRST LINE]. If there's any friction, the hook fails.

6. **AWARENESS LEVEL** — What awareness level does the script address? The hooks must match this level.

7. **EMOTIONAL ARC** — What is the emotional journey? (e.g., "frustration → discovery → relief → joy"). The hook must initiate or set up the FIRST emotion in this arc.

8. **KEY DATA POINTS** — What specific review data, customer language, or statistics are referenced or implied in the script? Hooks should connect to these same data points for coherence.

## HOOK STYLES TO USE
${buildHookStyleGuides(params.hookStyles)}

## MANDATORY STEP 2: THE SEAMLESS PLUG-IN TEST

For EVERY hook you write, mentally perform this test:
1. Read the hook out loud
2. Immediately read the script's first line after it
3. Ask: "Does this sound like ONE continuous piece of content, or does it feel like two different ads stitched together?"
4. If it feels stitched → REJECT the hook and write a new one
5. The viewer should NEVER feel a tonal shift, topic change, or jarring transition between the hook and the script body

## THE FOUR-BOOK HOOK MASTERY FRAMEWORK

Apply these principles from the 4 marketing books to EVERY hook, while keeping it anchored to the script:

### Eugene Schwartz — Breakthrough Advertising
- **Channeling desire:** Don't create desire — channel the desire that ALREADY exists in the script's target persona. The hook should tap the same desire the script fulfills.
- **Sophistication matching:** Match the market sophistication level. If the script uses a mechanism play, the hook should set up that mechanism. If it uses identification, the hook should trigger identification.
- **Intensification:** The hook's job is to intensify the desire or pain that the script then resolves. It's the SQUEEZE before the relief.
- **First 50 words rule:** Schwartz says the first 50 words determine if someone reads the rest. Your hook IS those words.

### Claude Hopkins — Scientific Advertising
- **Specificity over cleverness:** A hook grounded in a specific data point from the reviews is worth ten clever turns of phrase. Hopkins would rather say "47% of nurses who tried these..." than "You won't believe these socks."
- **Selector principle:** The hook must SELECT the right audience — the same audience the script is written for. If the script targets caregivers, the hook must pull in caregivers specifically.
- **Service & story:** The best hooks feel like the beginning of useful information or an interesting story, never like the beginning of an ad.
- **Test-minded:** Each hook is a hypothesis. Provide variety so the user can test which opening converts best for this specific script.

### Robert Bly — The Copywriter's Handbook
- **The 4 U's applied to hooks:** Every hook must be Urgent (why now?), Ultra-specific (precise detail from data), Unique (couldn't be written for another brand), and Useful (promises value).
- **BFD (Beliefs, Feelings, Desires):** The hook must connect to the same BFD the script addresses. What does the persona BELIEVE? What do they FEEL? What do they DESIRE? The hook enters through one of these doors.
- **First-line magnetism:** Bly says the sole purpose of the first line is to get them to read the second line. Your hook's sole purpose is to get them into the script's body.

### Marty Neumeier — The Brand Gap / Zag
- **Differentiation in the first beat:** The hook must make the viewer feel this is DIFFERENT from every other ad they've scrolled past. But the differentiation must ALIGN with the script's creative concept, not contradict it.
- **Brand feeling:** Neumeier says brand = gut feeling. The hook must trigger the same gut feeling the script delivers.
- **The onlyness test:** Can you say "this is the ONLY hook that would work for this specific script, for this specific persona, with this specific data"? If not, it's too generic.

${getAwarenessHookGuide(params.awarenessLevel)}

## SCRIPT-MODE HOOK RULES
1. **Tone lock:** The hook MUST be written in the same voice, vocabulary level, and emotional register as the script. If the script says "y'all" the hook can say "y'all." If the script is measured and professional, the hook is measured and professional.
2. **Persona lock:** The hook must sound like it comes from the SAME person (or same type of narrator) as the script. Don't write a third-person hook for a first-person script.
3. **Angle lock:** Every hook must reinforce the SAME persuasion angle running through the script. If the script's angle is "skeptic converted," every hook must enter through skepticism. If the angle is "caregiver love," every hook enters through caregiving.
4. **Concept lock:** The hook must set up the creative concept. If the script is a "morning routine reveal," the hook should place us in the morning. If it's a "comparison," the hook should set up the contrast.
5. **Transition seamlessness:** Read [HOOK] + [FIRST LINE OF SCRIPT] as one continuous thought. Zero friction. Zero topic changes. Zero tonal shifts.
6. **Data grounding:** Despite being script-tailored, each hook must still connect to specific review data — real frequencies, real quotes, real segment insights. The variety comes from WHICH data point you enter through, not from departing from the script's world.
7. **Variety through entry points:** The variety across hooks comes from entering the script's world through DIFFERENT DOORS — a different emotion, a different data point, a different identity segment, a different moment — while always arriving at the same script body.

## HOOK DON'TS
- Never lead with "compression" for cold/unaware audiences
- Never use clinical/medical language
- Never make unsubstantiated health claims
- Never mention specific medical conditions (compliance risk)
- Never be generic — every hook must connect to specific review data AND the specific script
- Never write a hook that could work in front of a DIFFERENT script — that means it's too generic
- Never break the persona, tone, or angle established by the script
- Never create a hook that requires the script body to be modified to make sense

## FORMAT: ${params.format.toUpperCase()}
${params.format === 'Video' ? '- First 3 seconds. Hook must be visual + verbal. Include brief visual direction that matches the script\'s visual style.' : ''}${params.format === 'Static' ? '- Headline that works standalone. Maximum 12 words. Must still connect to the script\'s angle and persona.' : ''}${params.format === 'Text' ? '- First line must stop the scroll. Can be longer but must pull into the script\'s body.' : ''}

## PRODUCT DATA
${getProductAnalysis(analysis, params.product)}`;
}

function buildScriptModeUser(params: HooksParams): string {
  const styleNames = params.hookStyles.length > 0
    ? params.hookStyles.join(', ')
    : 'All styles';

  return `Generate ${params.count} hooks for the script provided in the system prompt.

Product: ${params.product} | Awareness: ${params.awarenessLevel} | Format: ${params.format}
Hook styles: ${styleNames}

## REQUIRED OUTPUT FORMAT

### Script DNA
(Complete the script decomposition — Angle, Persona, Tone, Concept, First Line, Awareness Level, Emotional Arc, Key Data Points)

### Hooks

For each hook:
1. **The Hook** — The actual copy${params.format === 'Video' ? ' (include visual direction in parentheses that matches the script\'s visual style)' : ''}
2. **Style** — Which hook style
3. **Plug-In Test** — Write out: "[Your Hook] → [First Line of Script]" and confirm it reads as one continuous thought
4. **Formula** — The specific principle from Hopkins, Schwartz, Bly, or Neumeier that makes this work for THIS script
5. **Data Anchor** — The specific review data point, frequency, or customer quote this hook connects to
6. **Why It Works For This Script** — How this hook enters the script's world (which door — emotion, identity, pain, aspiration?) and why the transition is seamless

## CRITICAL RULES
- Start with the Script DNA analysis — do NOT skip this step
- EVERY hook must pass the plug-in test: [HOOK] → [FIRST LINE] must read as one continuous piece
- The variety comes from entering the script through DIFFERENT emotional/data doors — NOT from departing from the script's tone, angle, or persona
- Each hook must be grounded in specific review data AND be tailored to this specific script
- Do NOT reuse example hooks from the instructions — write entirely original hooks based on the review data and the script's DNA
- Distribute across the selected hook styles while maintaining script coherence`;
}

/* ------------------------------------------------------------------ */
/*  STANDALONE MODE: No script (original behavior, refined)           */
/* ------------------------------------------------------------------ */

function buildStandaloneModeSystem(
  params: HooksParams,
  analysis: FullAnalysis,
): string {
  return `${buildSystemBase()}

## HOOK GENERATION ENGINE

You are an expert hook writer. Hooks are the first 1–3 seconds of a video ad (or the headline of a static/text ad) that determine whether someone watches or scrolls past.

## HOOK STYLES SELECTED
${buildHookStyleGuides(params.hookStyles)}

## THE FOUR-BOOK HOOK MASTERY FRAMEWORK

### Eugene Schwartz — Breakthrough Advertising
- Channel existing desire — don't create it, redirect it
- Match market sophistication level in your hook approach
- Intensify the desire or pain in the hook — create the SQUEEZE that the ad body resolves
- The first 50 words determine everything

### Claude Hopkins — Scientific Advertising
- Specificity over cleverness — ground every hook in real data
- Selector principle — each hook must pull in the RIGHT audience
- Service & story — hooks should feel like useful information or a compelling story beginning
- Every hook is a testable hypothesis

### Robert Bly — The Copywriter's Handbook
- 4 U's: Urgent, Ultra-specific, Unique, Useful
- BFD: Connect to Beliefs, Feelings, or Desires of the target
- First-line magnetism — sole purpose is to get them to the second line

### Marty Neumeier — The Brand Gap / Zag
- Differentiate in the first beat — be DIFFERENT from every other ad
- Brand = gut feeling — the hook must trigger the right feeling
- Onlyness test — could this hook ONLY be for Viasox? If not, it's too generic

${getAwarenessHookGuide(params.awarenessLevel)}

## SEGMENT-AWARE HOOK TARGETING
- **Motivation Segments** (Why They Buy): Comfort Seeker, Pain & Symptom Relief, Style Conscious, Quality & Value, Daily Wear Convert, Skeptic Converted, Emotional Transformer, Repeat Loyalist
- **Identity Segments** (Who They Are): Healthcare Worker, Caregiver/Gift Buyer, Diabetic/Neuropathy, Standing Worker, Accessibility/Mobility, Traveler, Senior, Pregnant/Postpartum, Medical/Therapeutic

Distribute hooks across DIFFERENT segments — don't target the same one repeatedly.

## HOOK DON'TS
- Never lead with "compression" for cold/unaware audiences
- Never use clinical/medical language
- Never make unsubstantiated health claims
- Never mention specific medical conditions (compliance risk)
- Never be generic — every hook must reference specific review data
- Never write cookie-cutter hooks that could apply to any brand

## FORMAT: ${params.format.toUpperCase()}
${params.format === 'Video' ? '- First 3 seconds. Hook must be visual + verbal. Include brief visual direction.' : ''}${params.format === 'Static' ? '- Headline that works standalone. Maximum 12 words.' : ''}${params.format === 'Text' ? '- First line must stop the scroll.' : ''}

## PRODUCT DATA
${getProductAnalysis(analysis, params.product)}`;
}

function buildStandaloneModeUser(params: HooksParams): string {
  const styleNames = params.hookStyles.length > 0
    ? params.hookStyles.join(', ')
    : 'All styles';

  return `Generate ${params.count} hooks for ${params.product} at the **${params.awarenessLevel}** awareness level, optimized for ${params.format} format.

**CRITICAL — AWARENESS LEVEL IS ${params.awarenessLevel.toUpperCase()}:**
${params.awarenessLevel === 'Unaware' ? 'Hooks CANNOT mention the product, problem, category, or solution. Lead with pure curiosity, identity, or story. These hooks must feel like content, not ads. FORBIDDEN: Viasox, socks, compression, marks, swelling, support, pain — none of these words can appear.' : ''}${params.awarenessLevel === 'Problem Aware' ? 'Hooks must lead with SPECIFIC, VIVID pain the viewer recognizes instantly. Use exact customer language from reviews. The hook is the "squeeze" — intensify the problem to make the solution feel urgent.' : ''}${params.awarenessLevel === 'Solution Aware' ? 'Hooks must lead with DIFFERENTIATION — what makes this solution different from what they have tried. Brief problem acknowledgment only. Focus on the new mechanism, the new proof, the new approach.' : ''}${params.awarenessLevel === 'Product Aware' ? 'Hooks must assume the viewer KNOWS Viasox. Lead with new proof, deeper data, fresh testimonials, or product news. Brand name CAN lead. Go deep on one proof point.' : ''}${params.awarenessLevel === 'Most Aware' ? 'Hooks must be the SHORTEST and MOST DIRECT. Lead with offer, deal, urgency, or what is new. Brand name + offer is a valid hook. No education needed. Get to the point.' : ''}

Every hook must be fundamentally shaped by this awareness level. An Unaware hook and a Most Aware hook should look like they belong to completely different ad campaigns.

Hook styles to use: ${styleNames}

For each hook provide:
1. **The Hook** — The actual copy${params.format === 'Video' ? ' (include a brief visual direction in parentheses)' : ''}
2. **Style** — Which hook style it uses
3. **Awareness Compliance** — Confirm how this hook follows the ${params.awarenessLevel} awareness rules (what it includes/excludes)
4. **Formula** — The specific marketing principle behind it (cite Hopkins, Schwartz, Bly, or Neumeier)
5. **Data Anchor** — The specific data point, frequency, or customer quote that supports it
6. **Why It Works** — Brief explanation of the psychology

CRITICAL: Do NOT reuse example hooks from the instructions. Apply the formulas to the ACTUAL review data and write entirely original hooks. Each hook must reference a specific data point, frequency, or customer phrase from THIS dataset.

Distribute across the selected styles. Use different data points, emotional angles, and customer segments. Every hook must be grounded in actual review data.`;
}

/* ------------------------------------------------------------------ */
/*  Public export — routes to script-mode or standalone-mode          */
/* ------------------------------------------------------------------ */

export function buildHooksPrompt(
  params: HooksParams,
  analysis: FullAnalysis,
): { system: string; user: string } {
  const hasScript = params.scriptContext && params.scriptContext.trim().length > 0;

  if (hasScript) {
    return {
      system: buildScriptModeSystem(params, analysis),
      user: buildScriptModeUser(params),
    };
  }

  return {
    system: buildStandaloneModeSystem(params, analysis),
    user: buildStandaloneModeUser(params),
  };
}
