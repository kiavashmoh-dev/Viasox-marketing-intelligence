import { useState } from 'react';
import type {
  FullAnalysis, ProductCategory, ScriptFramework, FunnelStage,
  AwarenessLevel, AdType, OfferType, HookVariationCount, MarketingBookReference,
  ConceptContext, AgcBodyFormat, AgcPacing,
} from '../../engine/types';
import { useClaudeApi } from '../../hooks/useClaudeApi';
import { buildScriptPrompt } from '../../prompts/scriptPrompt';
import { buildResourceContext } from '../../prompts/systemBase';
import { buildRegenerationPrompt } from '../../prompts/regenerationPrompt';
import { downloadProductionBriefCsv } from '../../utils/downloadUtils';
import ResultsView from '../ResultsView';

interface Props {
  analysis: FullAnalysis;
  apiKey: string;
  resourceContext: string;
  onBack: () => void;
  conceptAngleContext?: ConceptContext | null;
}

const PRODUCTS: ProductCategory[] = ['EasyStretch', 'Compression', 'Ankle Compression'];
const DURATIONS = ['15s', '30s', '60s'] as const;
const AWARENESS: AwarenessLevel[] = ['Unaware', 'Problem Aware', 'Solution Aware', 'Product Aware', 'Most Aware'];
const FUNNEL_STAGES: { value: FunnelStage; label: string; description: string }[] = [
  { value: 'TOF', label: 'TOF (Top of Funnel)', description: 'Cold audiences' },
  { value: 'MOF', label: 'MOF (Middle of Funnel)', description: 'Considering' },
  { value: 'BOF', label: 'BOF (Bottom of Funnel)', description: 'Ready to buy' },
];
const AD_TYPES: AdType[] = [
  'AGC (Actor Generated Content)',
  'UGC (User Generated Content)',
  'Ecom Style',
  'Static',
  'Founder Style',
  'Fake Podcast Ads',
  'Spokesperson',
  'Packaging/Employee',
];
const OFFERS: { value: OfferType; label: string }[] = [
  { value: 'None', label: 'No Offer' },
  { value: 'B1G1', label: 'Buy 1 Get 1 (B1G1)' },
  { value: 'B2G3', label: 'Buy 2 Get 3 (B2G3)' },
];
const HOOK_COUNTS: HookVariationCount[] = [3, 5, 7, 10];
const BOOK_REFERENCES: { value: MarketingBookReference; label: string }[] = [
  { value: 'All Four Books', label: 'All Four Books (Balanced Mix)' },
  { value: 'Scientific Advertising (Hopkins)', label: 'Scientific Advertising (Hopkins)' },
  { value: 'Breakthrough Advertising (Schwartz)', label: 'Breakthrough Advertising (Schwartz)' },
  { value: 'The Brand Gap (Neumeier)', label: 'The Brand Gap (Neumeier)' },
  { value: "The Copywriter's Handbook (Bly)", label: "The Copywriter's Handbook (Bly)" },
];
const FRAMEWORKS: ScriptFramework[] = [
  'PAS (Problem-Agitate-Solution)',
  'AIDA-R (Attention-Interest-Desire-Action-Retention)',
  'Before-After-Bridge',
  'Star-Story-Solution',
  'Feel-Felt-Found',
  'Problem-Promise-Proof-Push',
  'Hook-Story-Offer',
  'Empathy-Education-Evidence',
  'The Contrast Framework',
  'The Skeptic Converter',
  'The Day-in-Life',
  'The Myth Buster',
];

export default function ScriptWriter({ analysis, apiKey, resourceContext, onBack, conceptAngleContext }: Props) {
  const hasConcept = !!conceptAngleContext;
  const [product, setProduct] = useState<ProductCategory>(conceptAngleContext?.product ?? 'EasyStretch');
  const [persona, setPersona] = useState('');
  const [framework, setFramework] = useState<ScriptFramework>(FRAMEWORKS[0]);
  const [duration, setDuration] = useState<(typeof DURATIONS)[number]>('30s');
  const [funnelStage, setFunnelStage] = useState<FunnelStage>(conceptAngleContext?.funnelStage ?? 'TOF');
  const [awareness, setAwareness] = useState<AwarenessLevel>(conceptAngleContext?.awarenessLevel ?? 'Problem Aware');
  const [adType, setAdType] = useState<AdType>(conceptAngleContext?.adType ?? 'UGC (User Generated Content)');
  const [promoPeriod, setPromoPeriod] = useState('');
  const [offer, setOffer] = useState<OfferType>('None');
  const [hookVariations, setHookVariations] = useState<HookVariationCount>(3);
  const [bookReference, setBookReference] = useState<MarketingBookReference>('All Four Books');

  // AGC-specific state
  const [agcBodyFormat, setAgcBodyFormat] = useState<AgcBodyFormat>('pov');
  const [agcLocationAuto, setAgcLocationAuto] = useState(true);
  const [agcLocation, setAgcLocation] = useState('');
  const [agcPacing, setAgcPacing] = useState<AgcPacing>('standard');
  const [agcMusicDirection, setAgcMusicDirection] = useState('');
  const [agcTalentAuto, setAgcTalentAuto] = useState(true);
  const [agcTalentDescription, setAgcTalentDescription] = useState('');

  const isAgc = adType === 'AGC (Actor Generated Content)';
  const isVideoProductionBrief = !isAgc && adType !== 'Ecom Style' && adType !== 'Static';
  const usesWideTables = isAgc || isVideoProductionBrief;
  const { result, loading, error, generate, reset } = useClaudeApi(apiKey);

  const handleGenerate = (feedback?: string) => {
    const { system, user } = buildScriptPrompt(
      {
        product,
        persona: persona || 'General audience',
        framework,
        duration,
        funnelStage,
        awarenessLevel: awareness,
        adType,
        promoPeriod: promoPeriod || 'None',
        offer,
        hookVariations: isAgc ? 3 : hookVariations, // AGC always uses 3 (3×3 matrix = 9 hooks)
        bookReference,
        conceptAngleContext: conceptAngleContext?.content ?? undefined,
        // Production brief params (AGC + all other video types except Ecom/Static)
        ...((isAgc || isVideoProductionBrief) && {
          ...(isAgc && { agcBodyFormat }),
          agcLocation: agcLocationAuto ? 'Auto — decide the best location based on the pre-loaded concept, target persona, and DTC marketing best practices' : (agcLocation || undefined),
          agcPacing,
          agcMusicDirection: agcMusicDirection || undefined,
          agcTalentDescription: agcTalentAuto ? 'Auto — decide the best talent profile based on the pre-loaded concept, target persona, and DTC marketing best practices' : (agcTalentDescription || undefined),
        }),
      },
      analysis,
    );
    // AGC briefs are much larger (9 hooks × 10 cols + 20-40 body rows + b-roll list)
    // Standard scripts scale with duration + hook count
    const contextBonus = conceptAngleContext ? 1500 : 0;
    const feedbackBonus = feedback ? 1000 : 0;
    let maxTokens: number;
    if (isAgc) {
      maxTokens = Math.min(10000 + contextBonus + feedbackBonus, 16000);
    } else if (isVideoProductionBrief) {
      // Video production briefs use 10-column tables — more output than old 5-column format
      const durationTokens = duration === '60s' ? 6000 : duration === '30s' ? 4500 : 3000;
      const hookTokens = hookVariations * 400;
      maxTokens = Math.min(Math.max(durationTokens + hookTokens + contextBonus + feedbackBonus, 7000), 16000);
    } else {
      const durationTokens = duration === '60s' ? 4000 : duration === '30s' ? 2500 : 1500;
      const hookTokens = hookVariations * 300;
      maxTokens = Math.min(Math.max(durationTokens + hookTokens + contextBonus + feedbackBonus, 6000), 16000);
    }
    const finalUser = feedback && result
      ? buildRegenerationPrompt(user, result, feedback)
      : user;
    generate(system + buildResourceContext(resourceContext), finalUser, maxTokens, 'claude-opus-4-6');
  };

  if (result || loading || error) {
    return (
      <ResultsView
        content={result ?? ''}
        title={isAgc ? 'AGC Production Brief' : isVideoProductionBrief ? 'Production Brief' : 'Ad Script'}
        onBack={() => { reset(); onBack(); }}
        onBackToBuilder={reset}
        onRegenerate={handleGenerate}
        loading={loading}
        error={error}
        feedbackPlaceholder="e.g., Make the hook more attention-grabbing, shorten the middle section, add more urgency to the CTA, change the tone to conversational..."
        wideMode={usesWideTables}
        extraActions={(isAgc || isVideoProductionBrief) && result ? [{
          label: 'Export CSV',
          onClick: () => downloadProductionBriefCsv(result, product, adType),
        }] : undefined}
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
          <h2 className="text-xl font-bold text-slate-800 mb-1">Ad Script Writer</h2>
          <p className="text-slate-500 text-sm mb-6">Write full ad scripts using proven frameworks</p>

          {/* Show concept/angle context if coming from Angles Generator */}
          {conceptAngleContext && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-emerald-800">{'\uD83C\uDFAF'} Writing from Concept & Angle</h3>
                <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-1 rounded">Strategy Locked</span>
              </div>
              <p className="text-xs text-emerald-700 mb-3">
                The full concept has been loaded as the primary strategy. Product, funnel stage, awareness level, and ad type are locked to match the concept.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-medium">{conceptAngleContext.product}</span>
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-medium">{conceptAngleContext.funnelStage}</span>
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-medium">{conceptAngleContext.awarenessLevel}</span>
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-medium">{conceptAngleContext.adType}</span>
              </div>
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Product Line
                {hasConcept && <span className="text-xs text-emerald-600 ml-2">{'\uD83D\uDD12'} From concept</span>}
              </label>
              <select
                value={product}
                onChange={(e) => setProduct(e.target.value as ProductCategory)}
                disabled={hasConcept}
                className={`${selectClass} ${hasConcept ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
              >
                {PRODUCTS.map((p) => (
                  <option key={p} value={p}>{p} ({analysis.breakdown[p]?.toLocaleString() ?? 0} reviews)</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Funnel Stage
                {hasConcept && <span className="text-xs text-emerald-600 ml-2">{'\uD83D\uDD12'} From concept</span>}
              </label>
              <div className="grid grid-cols-3 gap-3">
                {FUNNEL_STAGES.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => !hasConcept && setFunnelStage(f.value)}
                    disabled={hasConcept}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      funnelStage === f.value
                        ? hasConcept
                          ? 'border-emerald-400 bg-emerald-50 ring-1 ring-emerald-400'
                          : 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                        : hasConcept
                          ? 'border-slate-100 bg-slate-50 opacity-40 cursor-not-allowed'
                          : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className={`font-medium text-sm ${hasConcept && funnelStage !== f.value ? 'text-slate-400' : 'text-slate-800'}`}>{f.label}</div>
                    <div className={`text-xs mt-0.5 ${hasConcept && funnelStage !== f.value ? 'text-slate-300' : 'text-slate-500'}`}>{f.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Awareness Level
                {hasConcept && <span className="text-xs text-emerald-600 ml-2">{'\uD83D\uDD12'} From concept</span>}
              </label>
              <select
                value={awareness}
                onChange={(e) => setAwareness(e.target.value as AwarenessLevel)}
                disabled={hasConcept}
                className={`${selectClass} ${hasConcept ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
              >
                {AWARENESS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Ad Type
                {hasConcept && <span className="text-xs text-emerald-600 ml-2">{'\uD83D\uDD12'} From concept</span>}
              </label>
              <select
                value={adType}
                onChange={(e) => setAdType(e.target.value as AdType)}
                disabled={hasConcept}
                className={`${selectClass} ${hasConcept ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
              >
                {AD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Production Brief Settings (AGC + all video types except Ecom/Static) */}
            {(isAgc || isVideoProductionBrief) && (
              <div className={`border rounded-lg p-5 space-y-4 ${isAgc ? 'border-amber-200 bg-amber-50/50' : 'border-blue-200 bg-blue-50/50'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${isAgc ? 'text-amber-800 bg-amber-200' : 'text-blue-800 bg-blue-200'}`}>{isAgc ? 'AGC' : 'VIDEO'}</span>
                  <span className={`text-sm font-medium ${isAgc ? 'text-amber-800' : 'text-blue-800'}`}>Production Brief Settings</span>
                </div>

                {isAgc && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Body Format</label>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { value: 'pov' as const, label: 'POV (VO Narration)', desc: 'Voice heard, not on camera' },
                      { value: 'face-to-camera' as const, label: 'Face-to-Camera', desc: 'Talent speaks directly' },
                    ]).map((f) => (
                      <button
                        key={f.value}
                        onClick={() => setAgcBodyFormat(f.value)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          agcBodyFormat === f.value
                            ? 'border-amber-500 bg-amber-50 ring-1 ring-amber-500'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="font-medium text-sm text-slate-800">{f.label}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{f.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-slate-700">Location</label>
                    <button
                      onClick={() => setAgcLocationAuto(!agcLocationAuto)}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                        agcLocationAuto
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                          : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {agcLocationAuto ? '\u2728 Auto (from concept)' : 'Manual'}
                    </button>
                  </div>
                  {agcLocationAuto ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
                      The tool will decide the best location based on the pre-loaded concept and DTC marketing knowledge.
                    </div>
                  ) : (
                    <input type="text" value={agcLocation} onChange={(e) => setAgcLocation(e.target.value)}
                      placeholder="e.g., Subject's home, warm natural light"
                      className={`${selectClass} bg-white`} />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Pacing</label>
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      { value: 'fast' as const, label: 'Fast', desc: '15-30s' },
                      { value: 'standard' as const, label: 'Standard', desc: '30-45s' },
                      { value: 'deliberate' as const, label: 'Deliberate', desc: '60-90s' },
                    ]).map((p) => (
                      <button
                        key={p.value}
                        onClick={() => setAgcPacing(p.value)}
                        className={`p-3 rounded-lg border text-center transition-all ${
                          agcPacing === p.value
                            ? isAgc ? 'border-amber-500 bg-amber-50 ring-1 ring-amber-500' : 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="font-medium text-sm text-slate-800">{p.label}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{p.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Music Direction</label>
                  <input type="text" value={agcMusicDirection} onChange={(e) => setAgcMusicDirection(e.target.value)}
                    placeholder="e.g., Minimal ambient piano, documentary feel"
                    className={`${selectClass} bg-white`} />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-slate-700">Talent Description</label>
                    <button
                      onClick={() => setAgcTalentAuto(!agcTalentAuto)}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                        agcTalentAuto
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                          : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {agcTalentAuto ? '\u2728 Auto (from concept)' : 'Manual'}
                    </button>
                  </div>
                  {agcTalentAuto ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
                      The tool will decide the best talent profile based on the pre-loaded concept and DTC marketing knowledge.
                    </div>
                  ) : (
                    <input type="text" value={agcTalentDescription} onChange={(e) => setAgcTalentDescription(e.target.value)}
                      placeholder="e.g., Woman 55-65, warm, articulate, not a model"
                      className={`${selectClass} bg-white`} />
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Framework</label>
              <select value={framework} onChange={(e) => setFramework(e.target.value as ScriptFramework)} className={selectClass}>
                {FRAMEWORKS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Duration</label>
              <select value={duration} onChange={(e) => setDuration(e.target.value as typeof duration)} className={selectClass}>
                {DURATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Target Persona (optional)</label>
              <input type="text" value={persona} onChange={(e) => setPersona(e.target.value)}
                placeholder="e.g., Healthcare worker, 30-50, on feet 12 hours"
                className={selectClass} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Specific Promo Period (optional)</label>
              <input type="text" value={promoPeriod} onChange={(e) => setPromoPeriod(e.target.value)}
                placeholder="e.g., Mother's Day, Black Friday, Summer Sale"
                className={selectClass} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Offer</label>
              <div className="grid grid-cols-3 gap-3">
                {OFFERS.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => setOffer(o.value)}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      offer === o.value
                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-medium text-sm text-slate-800">{o.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {isAgc ? (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Hook Variations</label>
                <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <span className="text-2xl font-bold text-amber-700">9</span>
                  <div>
                    <div className="text-sm font-medium text-amber-800">3 Visuals {'\u00D7'} 3 Verbals</div>
                    <div className="text-xs text-amber-600">AGC uses a 3{'\u00D7'}3 hook matrix for maximum testing flexibility</div>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Number of Hook Variations</label>
                <div className="grid grid-cols-4 gap-3">
                  {HOOK_COUNTS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setHookVariations(c)}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        hookVariations === c
                          ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-medium text-sm text-slate-800">{c}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Marketing Book Reference</label>
              <select value={bookReference} onChange={(e) => setBookReference(e.target.value as MarketingBookReference)} className={selectClass}>
                {BOOK_REFERENCES.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
            </div>
          </div>

          <button onClick={() => handleGenerate()}
            className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
            {conceptAngleContext
              ? (isAgc ? 'Generate AGC Brief from Concept' : isVideoProductionBrief ? 'Generate Production Brief from Concept' : 'Write Script from Concept')
              : (isAgc ? 'Generate AGC Production Brief' : isVideoProductionBrief ? 'Generate Production Brief' : 'Write Script')}
          </button>
        </div>
      </div>
    </div>
  );
}
