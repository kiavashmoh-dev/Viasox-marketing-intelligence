import type { ProductCategory, AngleType, AwarenessLevel, ScriptParams } from '../engine/types';
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

function mapDuration(medium: string): '15s' | '30s' | '60s' {
  const lower = medium.toLowerCase();
  if (lower.includes('short')) return '15s';
  if (lower.includes('expand') || lower.includes('long')) return '60s';
  return '30s'; // Midform default
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

  const scriptParamsBase: Omit<ScriptParams, 'framework' | 'conceptAngleContext'> = {
    product,
    persona: '',
    duration,
    funnelStage: 'TOF',
    awarenessLevel,
    adType: 'Ecom Style',
    promoPeriod: 'None',
    offer: 'B2G3',
    hookVariations: 3,
    bookReference: 'All Four Books',
    primaryTalkingPoint: parsed.angle,
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
      adType: 'Ecom Style',
      primaryTalkingPoint: parsed.angle,
    },
    scriptParamsBase,
  };
}
