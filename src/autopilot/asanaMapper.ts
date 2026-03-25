import type { ProductCategory, AngleType, ScriptParams } from '../engine/types';
import type { ParsedAsanaTask, AutopilotTask } from '../engine/autopilotTypes';

function mapProduct(raw: string): ProductCategory {
  const lower = raw.toLowerCase();
  if (lower.includes('ankle')) return 'Ankle Compression';
  if (lower.includes('easy') || lower.includes('stretch')) return 'EasyStretch';
  if (lower.includes('compression')) return 'Compression';
  return 'EasyStretch';
}

function mapAngleType(_raw: string): AngleType {
  // All Viasox angles (Neuropathy, Swelling, Diabetes, Varicose Veins)
  // are pain-point / condition-based angles → Problem-Based
  return 'Problem-Based';
}

function mapDuration(medium: string): '15s' | '30s' | '60s' {
  const lower = medium.toLowerCase();
  if (lower.includes('short')) return '15s';
  if (lower.includes('expand') || lower.includes('long')) return '60s';
  return '30s'; // Midform default
}

/**
 * Map a parsed Asana task to fully-typed autopilot params.
 */
export function mapAsanaTask(parsed: ParsedAsanaTask): AutopilotTask {
  const product = mapProduct(parsed.product);
  const duration = mapDuration(parsed.medium);

  const scriptParamsBase: Omit<ScriptParams, 'framework' | 'conceptAngleContext'> = {
    product,
    persona: '',
    duration,
    funnelStage: 'TOF',
    awarenessLevel: 'Problem Aware',
    adType: 'Ecom Style',
    promoPeriod: 'None',
    offer: 'B2G3',
    hookVariations: 3,
    bookReference: 'All Four Books',
  };

  return {
    parsed,
    product,
    duration,
    anglesParams: {
      product,
      awarenessLevel: 'Problem Aware',
      angleType: mapAngleType(parsed.angle),
      funnelStage: 'TOF',
      adType: 'Ecom Style',
    },
    scriptParamsBase,
  };
}
