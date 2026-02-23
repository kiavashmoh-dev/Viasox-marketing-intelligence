import { useState } from 'react';
import type { FullAnalysis, ProductCategory, AwarenessLevel, AngleType, FunnelStage, AdType, ConceptContext } from '../../engine/types';
import { useClaudeApi } from '../../hooks/useClaudeApi';
import { buildAnglesPrompt } from '../../prompts/anglesPrompt';
import { buildResourceContext } from '../../prompts/systemBase';
import { buildRegenerationPrompt } from '../../prompts/regenerationPrompt';
import AnglesResultsView from '../AnglesResultsView';

interface Props {
  analysis: FullAnalysis;
  apiKey: string;
  resourceContext: string;
  onBack: () => void;
  onWriteScript?: (context: ConceptContext) => void;
}

const PRODUCTS: ProductCategory[] = ['EasyStretch', 'Compression', 'Ankle Compression'];
const AWARENESS: AwarenessLevel[] = ['Unaware', 'Problem Aware', 'Solution Aware', 'Product Aware', 'Most Aware'];
const FUNNEL_STAGES: { value: FunnelStage; label: string; description: string }[] = [
  { value: 'TOF', label: 'TOF (Top of Funnel)', description: 'Cold audiences, discovery' },
  { value: 'MOF', label: 'MOF (Middle of Funnel)', description: 'Engaged, considering' },
  { value: 'BOF', label: 'BOF (Bottom of Funnel)', description: 'Ready to buy, retargeting' },
];
const AD_TYPES: AdType[] = [
  'AGC (Actor Generated Content)',
  'UGC (User Generated Content)',
  'Ecom Style',
  'Static',
  'Founder Style',
  'Fake Podcast Ads',
  'Street Interview Style',
  'Spokesperson',
  'Packaging/Employee',
];
const ANGLE_TYPES: AngleType[] = [
  'Problem-Based', 'Emotion-Based', 'Solution-Based', 'Identity-Based',
  'Comparison-Based', 'Testimonial-Based', 'Seasonal/Situational',
  'Fear-Based', 'Aspiration-Based', 'Education-Based',
];

export default function AnglesGenerator({ analysis, apiKey, resourceContext, onBack, onWriteScript }: Props) {
  const [product, setProduct] = useState<ProductCategory>('EasyStretch');
  const [awareness, setAwareness] = useState<AwarenessLevel>('Problem Aware');
  const [angleType, setAngleType] = useState<AngleType>('Problem-Based');
  const [funnelStage, setFunnelStage] = useState<FunnelStage>('TOF');
  const [adType, setAdType] = useState<AdType>('UGC (User Generated Content)');
  const { result, loading, error, generate, reset } = useClaudeApi(apiKey);

  // Wrap onWriteScript to bundle current selector state with the concept text
  const handleWriteScript = onWriteScript
    ? (conceptContent: string) => {
        onWriteScript({
          content: conceptContent,
          product,
          awarenessLevel: awareness,
          funnelStage,
          adType,
        });
      }
    : undefined;

  const handleGenerate = (feedback?: string) => {
    const { system, user } = buildAnglesPrompt(
      { product, awarenessLevel: awareness, angleType, funnelStage, adType },
      analysis,
    );
    const finalUser = feedback && result
      ? buildRegenerationPrompt(user, result, feedback)
      : user;
    generate(system + buildResourceContext(resourceContext), finalUser, 12000, 'claude-opus-4-6');
  };

  if (result || loading || error) {
    return (
      <AnglesResultsView
        content={result ?? ''}
        title="Concepts & Angles"
        onBack={() => { reset(); onBack(); }}
        onBackToBuilder={reset}
        onRegenerate={handleGenerate}
        loading={loading}
        error={error}
        onWriteScript={handleWriteScript}
        feedbackPlaceholder="e.g., Make concept 2 more emotional, target the caregiver persona instead, add stronger data points, less clinical tone..."
      />
    );
  }

  const selectClass = 'w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-2xl mx-auto">
        <button onClick={onBack} className="text-sm text-slate-500 hover:text-slate-700 mb-6 flex items-center gap-1">
          {'\u2190'} Back to Dashboard
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-1">Concepts & Angles</h2>
          <p className="text-slate-500 text-sm mb-6">Brainstorm creative angles grounded in review data</p>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Product Line</label>
              <select value={product} onChange={(e) => setProduct(e.target.value as ProductCategory)} className={selectClass}>
                {PRODUCTS.map((p) => (
                  <option key={p} value={p}>{p} ({analysis.breakdown[p]?.toLocaleString() ?? 0} reviews)</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Funnel Stage</label>
              <div className="grid grid-cols-3 gap-3">
                {FUNNEL_STAGES.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFunnelStage(f.value)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      funnelStage === f.value
                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-medium text-sm text-slate-800">{f.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{f.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Awareness Level</label>
              <select value={awareness} onChange={(e) => setAwareness(e.target.value as AwarenessLevel)} className={selectClass}>
                {AWARENESS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Ad Type</label>
              <select value={adType} onChange={(e) => setAdType(e.target.value as AdType)} className={selectClass}>
                {AD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Angle Type</label>
              <select value={angleType} onChange={(e) => setAngleType(e.target.value as AngleType)} className={selectClass}>
                {ANGLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <button onClick={() => handleGenerate()}
            className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
            Generate Concepts & Angles
          </button>
        </div>
      </div>
    </div>
  );
}
