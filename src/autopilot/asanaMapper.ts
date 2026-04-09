import type { ProductCategory, AngleType, AwarenessLevel, ScriptParams, AdType, FullAiSpecification, FullAiVisualStyle } from '../engine/types';
import type { ParsedAsanaTask, AutopilotTask } from '../engine/autopilotTypes';
// Custom directives are read in pipelineEngine.ts, not here

function mapProduct(raw: string): ProductCategory {
  const lower = raw.toLowerCase();
  if (lower.includes('ankle')) return 'Ankle Compression';
  if (lower.includes('easy') || lower.includes('stretch')) return 'EasyStretch';
  if (lower.includes('compression')) return 'Compression';
  return 'EasyStretch';
}

/**
 * Map the Asana angle field to an AngleType.
 *
 * The angle field contains the SPECIFIC creative angle (e.g., "Neuropathy",
 * "Varicose Veins", "Swelling", "Diabetes", "Gift Giving", "Comfort",
 * "Standing All Day", "Travel"). This must be preserved and fed into the
 * concept generator as the PRIMARY creative directive.
 *
 * The AngleType determines the STRUCTURAL APPROACH to the concept:
 * - Problem-Based: Lead with the specific pain point (Neuropathy, Swelling, Varicose Veins)
 * - Emotion-Based: Lead with a feeling (Frustration, Relief, Confidence, Freedom)
 * - Identity-Based: Lead with WHO the person is (Nurse, Diabetic, Traveler, Senior)
 * - Testimonial-Based: Lead with a real customer's experience of the angle
 * - Seasonal/Situational: Lead with a moment or occasion (Travel, Holiday, Gift, Mother's Day)
 * - Education-Based: Teach something unexpected about the angle
 * - Aspiration-Based: Show the transformation the angle enables
 * - Solution-Based: Lead with how Viasox uniquely solves this angle
 * - Comparison-Based: Compare life with vs. without for this angle
 * - Fear-Based: The consequences of ignoring this angle
 */
function mapAngleType(raw: string): AngleType {
  const lower = raw.toLowerCase();

  // Identity-first angles — lead with WHO they are
  if (lower.includes('nurse') || lower.includes('healthcare') || lower.includes('standing'))
    return 'Identity-Based';
  if (lower.includes('senior') || lower.includes('elder') || lower.includes('aging'))
    return 'Identity-Based';
  if (lower.includes('pregnan') || lower.includes('expecting'))
    return 'Identity-Based';
  if (lower.includes('diabet'))
    return 'Identity-Based';

  // Seasonal/situational — lead with the moment
  if (lower.includes('gift') || lower.includes('holiday') || lower.includes('christmas') ||
      lower.includes('mother') || lower.includes('father') || lower.includes('valentine'))
    return 'Seasonal/Situational';
  if (lower.includes('travel') || lower.includes('flight') || lower.includes('vacation'))
    return 'Seasonal/Situational';

  // Emotion-based angles
  if (lower.includes('comfort') || lower.includes('relief') || lower.includes('freedom'))
    return 'Emotion-Based';
  if (lower.includes('confidence') || lower.includes('self'))
    return 'Emotion-Based';

  // Testimonial-based
  if (lower.includes('testimonial') || lower.includes('review') || lower.includes('story'))
    return 'Testimonial-Based';

  // Education-based
  if (lower.includes('educat') || lower.includes('science') || lower.includes('how'))
    return 'Education-Based';

  // 3 Reasons/Signs Why
  if (lower.includes('3 reason') || lower.includes('3 sign') || lower.includes('reasons') || lower.includes('signs why'))
    return '3 Reasons/Signs Why';

  // Negative Marketing
  if (lower.includes('negative') || lower.includes('exposé') || lower.includes('expose') || lower.includes('scandal') || lower.includes('myth') || lower.includes('lie'))
    return 'Negative Marketing';

  // Default: Problem-Based for medical/pain conditions
  // (neuropathy, swelling, varicose, circulation, pain, marks, etc.)
  return 'Problem-Based';
}

/**
 * Determine awareness level per task.
 *
 * The majority of TOF ads should be UNAWARE — reaching people who haven't
 * recognized their problem yet. Only condition-specific angles (Neuropathy,
 * Diabetes, Varicose Veins) should use Problem Aware because the audience
 * is actively experiencing and searching for those issues.
 */
function mapAwarenessLevel(angle: string, _medium: string): AwarenessLevel {
  const lower = angle.toLowerCase();

  // Problem Aware: people who KNOW they have a specific medical condition
  // They're searching for solutions — they just don't know about Viasox
  if (lower.includes('neuropath') || lower.includes('diabet') ||
      lower.includes('varicose') || lower.includes('lymph') ||
      lower.includes('dvt') || lower.includes('blood clot') ||
      lower.includes('plantar'))
    return 'Problem Aware';

  // Everything else is Unaware TOF — they don't know they have a problem
  // worth solving, or they've normalized their discomfort.
  // This is the majority of our TOF creative.
  return 'Unaware';
}

/**
 * Dynamically select the best persona for this task based on the angle,
 * product, and awareness level.
 *
 * The persona is drawn from Viasox's real customer segments (identified
 * from 107,993 reviews) and product-specific persona hierarchies. The
 * selection follows this priority:
 *
 * 1. If the angle maps to a specific IDENTITY segment (nurse, senior,
 *    caregiver, pregnant), use that segment × product persona.
 * 2. If the angle is a medical condition, match to the persona most
 *    likely to experience it (e.g., Diabetes → Beth the Quiet Fighter
 *    managing a daily condition).
 * 3. If the angle is lifestyle/situational, match to the persona whose
 *    life situation aligns (e.g., Travel → Linda the Practical Optimist
 *    researching solutions).
 * 4. Rotate between primary archetypes to maintain diversity.
 */
function mapPersona(angle: string, product: ProductCategory, _awarenessLevel: AwarenessLevel): string {
  const lower = angle.toLowerCase();

  // ── Identity-specific personas (angle IS the persona) ──────────────
  if (lower.includes('nurse') || lower.includes('healthcare') || lower.includes('standing')) {
    switch (product) {
      case 'EasyStretch': return 'Healthcare Worker (Nurse/Aide) — woman 50+, on her feet 12-hour shifts. Entry: work endurance. "These are the socks nurses pass around the break room."';
      case 'Compression': return 'Healthcare Worker (Nurse/Aide) — woman 50+, legs carrying the weight of everyone she cares for. Entry: professional necessity. Graduated compression that works as hard as she does.';
      case 'Ankle Compression': return 'Healthcare Worker (Nurse/Aide) — woman 50+, needs invisible support under scrubs. Entry: discreet professional wear. No one knows — but her feet do.';
      default: return 'Healthcare Worker (Nurse/Aide) — woman 50+, on her feet all day. Needs socks that perform through a 12-hour shift without marks or fatigue.';
    }
  }

  if (lower.includes('senior') || lower.includes('elder') || lower.includes('aging') || lower.includes('independen')) {
    switch (product) {
      case 'EasyStretch': return 'Beth the Quiet Fighter — woman 65+, lives with daily discomfort but won\'t complain. The wide-mouth opening means she doesn\'t need to ask for help. Independence is everything.';
      case 'Compression': return 'Beth the Quiet Fighter — woman 65+, needs support but refuses to struggle with pharmacy compression. Entry: ease + efficacy. "Easy to put on AND actually works."';
      case 'Ankle Compression': return 'Beth the Quiet Fighter — woman 65+, body doesn\'t bend like it used to. Ankle-height means she can reach her feet herself. Entry: accessibility + targeted support.';
      default: return 'Beth the Quiet Fighter — woman 65+, lives with daily discomfort silently. Puts others first. When she finds something that works, she\'s quietly loyal.';
    }
  }

  if (lower.includes('caregiv') || lower.includes('gift') || lower.includes('mother') || lower.includes('father')) {
    switch (product) {
      case 'EasyStretch': return 'Caregiver (Adult Daughter) — woman 50+, buying for her mother. "Give her back her independence. Give yourself back your mornings." Dual benefit: wearer + caregiver.';
      case 'Compression': return 'Caregiver (Adult Daughter) — woman 50+, tired of the daily "can you help me" call. Wants socks her mother can wear without help. Entry: peace of mind.';
      case 'Ankle Compression': return 'Caregiver (Adult Daughter) — woman 50+, wants something easy enough for her parent to manage alone. Entry: low-intervention care.';
      default: return 'Caregiver (Adult Daughter) — woman 50+, buying for a parent. The unspoken truth: she\'s exhausted too. Needs a solution for both of them.';
    }
  }

  if (lower.includes('pregnan') || lower.includes('expecting')) {
    return 'Expecting Mother — woman experiencing pregnancy swelling in feet and ankles. Needs support without full-leg squeeze that becomes uncomfortable as pregnancy progresses. Ankle compression is the entry point.';
  }

  // ── Medical condition personas ─────────────────────────────────────
  if (lower.includes('neuropath')) {
    return 'Beth the Quiet Fighter — woman 55+, living with diabetic peripheral neuropathy. Daily reality: tingling, numbness, burning in feet. Fear of progression. Needs non-binding comfort that doesn\'t aggravate nerve pain. She doesn\'t want to be seen as sick.';
  }

  if (lower.includes('diabet')) {
    return 'Beth the Quiet Fighter — woman 55+, managing diabetes daily. Checks her feet every morning. Doctor told her to wear diabetic socks — but the medical-looking ones make her feel old and sick. Needs diabetic-safe design that looks and feels like normal socks.';
  }

  if (lower.includes('varicose') || lower.includes('spider vein')) {
    return 'Linda the Practical Optimist — woman 55+, visible veins she\'s self-conscious about. Has researched compression but hates the ugly beige tubes. Avoids shorts and skirts. Wants medical function without medical-device appearance.';
  }

  if (lower.includes('swell') || lower.includes('edema') || lower.includes('lymph')) {
    return 'Beth the Quiet Fighter — woman 55+, ankles swollen by end of day. Sock marks that take hours to fade. Has tried "extra wide" socks that still leave marks. Doesn\'t complain about it, but it\'s the first thing she notices every evening.';
  }

  if (lower.includes('dvt') || lower.includes('blood clot') || lower.includes('circulat')) {
    return 'Linda the Practical Optimist — woman 55+, managing a circulation condition. Researches everything. Reads every review. Doctor recommended compression but pharmacy options are uncomfortable and hard to put on. She values specifics over emotion.';
  }

  if (lower.includes('plantar') || lower.includes('foot pain') || lower.includes('arch')) {
    return 'Beth the Quiet Fighter — woman 55+, first steps every morning are painful. Has tried insoles, stretches, everything. The foot pain is a daily reminder. Doesn\'t talk about it much, but it shapes every decision about shoes and activity.';
  }

  if (lower.includes('sock mark') || lower.includes('mark')) {
    return 'Linda the Practical Optimist — woman 55+, tired of red rings on her legs at the end of every day. Sees the marks as proof her body is changing. Has a drawer full of failed socks. Ready to try something different but needs convincing evidence.';
  }

  // ── Lifestyle/situational personas ─────────────────────────────────
  if (lower.includes('travel') || lower.includes('flight') || lower.includes('vacation')) {
    return 'Linda the Practical Optimist — woman 55+, planning a trip and researching how to prevent leg swelling on long flights. Reads reviews carefully. Wants something that works AND fits in her luggage without looking medical at the resort.';
  }

  if (lower.includes('comfort') || lower.includes('relief') || lower.includes('freedom')) {
    return 'Beth the Quiet Fighter — woman 55+, has normalized her discomfort for years. "It\'s just part of getting older." Doesn\'t know how much better it could be. When she finds relief, the emotional response is disproportionate — because she\'d stopped hoping.';
  }

  if (lower.includes('style') || lower.includes('fashion') || lower.includes('pattern')) {
    return 'Style-Conscious — woman 55+, refuses to wear anything that looks medical or institutional. Patterns and colors matter. "Why should I have to hide my socks?" Wants compression that gets compliments, not concerned looks.';
  }

  // ── Negative Marketing / Education personas ────────────────────────
  if (lower.includes('negative') || lower.includes('scandal') || lower.includes('myth') ||
      lower.includes('lie') || lower.includes('expose') || lower.includes('exposé')) {
    return 'Linda the Practical Optimist — woman 55+, skeptical and research-driven. Has been burned by products that overpromise. Responds to exposé-style content because it matches how she already thinks: "I knew something was off." Validation through evidence.';
  }

  if (lower.includes('educat') || lower.includes('science') || lower.includes('how') ||
      lower.includes('reason') || lower.includes('sign')) {
    return 'Linda the Practical Optimist — woman 55+, the researcher. Wants to understand WHY something works, not just that it does. Reads the full product page, checks the science, compares options. Informational content converts her because it respects her intelligence.';
  }

  // ── Default: rotate based on product ───────────────────────────────
  // Use product to determine default persona since different products
  // attract different primary segments
  switch (product) {
    case 'EasyStretch':
      return 'Beth the Quiet Fighter — woman 55+, lives with daily discomfort but doesn\'t complain. Has a drawer full of failed socks. Puts others first. When she finds something that works, she\'s quietly loyal and tells everyone.';
    case 'Compression':
      return 'Linda the Practical Optimist — woman 55+, has accepted she needs compression but refuses to accept it has to look and feel medical. Researches everything. Skeptical but hopeful. When convinced, she becomes an evangelist.';
    case 'Ankle Compression':
      return 'Skeptic / Cycle-of-False-Hope — woman 55+, has given up on compression because knee-highs were too much. Doesn\'t know ankle compression exists as a category. This is her re-entry point to compression therapy.';
    default:
      return 'Beth the Quiet Fighter — woman 55+, lives with daily discomfort silently. Doesn\'t ask for help. When she finds something that genuinely works, her quiet loyalty turns into quiet evangelism.';
  }
}

function mapDuration(medium: string): '1-15 sec' | '16-59 sec' | '60-90 sec' {
  const lower = medium.toLowerCase().trim();

  // Direct match on canonical Asana medium column values
  if (lower === '1-15 sec' || lower === '1-15 seconds') return '1-15 sec';
  if (lower === '16-59 sec' || lower === '16-59 seconds') return '16-59 sec';
  if (lower === '60-90 sec' || lower === '60-90 seconds') return '60-90 sec';

  // Expanded / 60-90 sec — documentary, AI doc, extended formats, long-form
  if (lower.includes('60-90') ||
      lower.includes('90') || lower.includes('extra long') || lower.includes('extra-long') ||
      lower.includes('longform') || lower.includes('long form') ||
      lower.includes('expand') || lower.includes('long') || lower.includes('60') ||
      lower.includes('documentary') || lower.includes(' doc ') || lower.endsWith(' doc') ||
      lower.includes('ai doc') || lower.includes('full ai'))
    return '60-90 sec';

  // Short 1-15 sec — shortform / micro
  if (lower.includes('1-15') || lower.includes('short') || lower.includes('15') || lower.includes('micro'))
    return '1-15 sec';

  // Midform default — 16-59 sec
  return '16-59 sec';
}

/**
 * Map the Asana medium/format field to an AdType.
 *
 * Defaults to "Ecom Style" (the workhorse editing brief format), but
 * recognizes Full AI hints in the medium field — e.g., "Full AI",
 * "AI Documentary", "Documentary", "AI Story", "AI Educational",
 * "AI Aspirational", or anything with "ai" + a Full AI specification keyword.
 */
function mapAdType(medium: string, angle: string): AdType {
  const lower = `${medium} ${angle}`.toLowerCase();

  // Explicit Full AI signals
  if (lower.includes('full ai') || lower.includes('fullai')) return 'Full AI (Documentary, story, education, etc)';
  if (lower.includes('ai documentary') || lower.includes('ai doc')) return 'Full AI (Documentary, story, education, etc)';
  if (lower.includes('ai story') || lower.includes('ai narrative')) return 'Full AI (Documentary, story, education, etc)';
  if (lower.includes('ai educational') || lower.includes('ai education')) return 'Full AI (Documentary, story, education, etc)';
  if (lower.includes('ai aspirational')) return 'Full AI (Documentary, story, education, etc)';
  if (lower.includes('ai historical')) return 'Full AI (Documentary, story, education, etc)';
  if (lower.includes('ai emotional')) return 'Full AI (Documentary, story, education, etc)';

  // Default workhorse format
  return 'Ecom Style';
}

/**
 * Pick the best Full AI specification (narrative mode) from medium/angle hints.
 * Defaults to "Documentary" — the most flexible, broadly useful mode.
 */
function mapFullAiSpecification(medium: string, angle: string): FullAiSpecification {
  const lower = `${medium} ${angle}`.toLowerCase();

  if (lower.includes('historical') || lower.includes('history')) return 'Historical';
  if (lower.includes('educational') || lower.includes('education') || lower.includes('teach') || lower.includes('science')) return 'Educational';
  if (lower.includes('emotional') || lower.includes('story') || lower.includes('narrative')) return 'Emotional Story';
  if (lower.includes('aspirational') || lower.includes('aspiration') || lower.includes('freedom') || lower.includes('dignity')) return 'Aspirational';
  return 'Documentary';
}

/**
 * Pick the best Full AI visual style from medium/angle hints.
 * Defaults to "Story with cohesive characters" — the most concrete, audience-friendly default.
 */
function mapFullAiVisualStyle(medium: string, angle: string): FullAiVisualStyle {
  const lower = `${medium} ${angle}`.toLowerCase();

  if (lower.includes('historical') || lower.includes('history')) return 'Historical Visuals and Claims';
  if (lower.includes('voice over') || lower.includes('voiceover') || lower.includes(' vo ')) return 'Fully Voice Over';
  if (lower.includes('talking to camera') || lower.includes('to camera')) return 'Includes Talking To Camera';
  if (lower.includes('no humans') || lower.includes('feet pov') || lower.includes('sock pov') || lower.includes('perspective')) return 'No Humans Shown (Perspective of the feet or socks)';
  return 'Story with cohesive characters';
}

/**
 * Map a parsed Asana task to fully-typed autopilot params.
 *
 * The Asana angle field is the PRIMARY creative directive and must be
 * preserved verbatim (passed through as `parsed.angle`) for the concept
 * generator and script writer to use. The AngleType is the structural
 * approach, not a replacement for the specific angle content.
 */
export function mapAsanaTask(parsed: ParsedAsanaTask): AutopilotTask {
  const product = mapProduct(parsed.product);
  const duration = mapDuration(parsed.medium);
  const angleType = mapAngleType(parsed.angle);
  const awarenessLevel = mapAwarenessLevel(parsed.angle, parsed.medium);
  const persona = mapPersona(parsed.angle, product, awarenessLevel);
  const adType = mapAdType(parsed.medium, parsed.angle);
  const isFullAi = adType === 'Full AI (Documentary, story, education, etc)';
  const fullAiSpecification = isFullAi ? mapFullAiSpecification(parsed.medium, parsed.angle) : undefined;
  const fullAiVisualStyle = isFullAi ? mapFullAiVisualStyle(parsed.medium, parsed.angle) : undefined;

  const scriptParamsBase: Omit<ScriptParams, 'framework' | 'conceptAngleContext'> = {
    product,
    persona,
    duration,
    funnelStage: 'TOF',
    awarenessLevel,
    adType,
    promoPeriod: 'None',
    offer: 'B2G3',
    hookVariations: 3,
    bookReference: 'All Four Books',
    primaryTalkingPoint: parsed.angle,
    ...(isFullAi && {
      fullAiSpecification,
      fullAiVisualStyle,
    }),
  };

  return {
    parsed,
    product,
    duration,
    anglesParams: {
      product,
      awarenessLevel,
      angleType,
      funnelStage: 'TOF',
      adType,
      primaryTalkingPoint: parsed.angle,
      duration,
      ...(isFullAi && {
        fullAiSpecification,
        fullAiVisualStyle,
      }),
    },
    scriptParamsBase,
  };
}
