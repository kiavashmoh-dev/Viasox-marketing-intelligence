import { useState } from 'react';
import type { FullAnalysis, ProductCategory, SegmentBreakdown } from '../../engine/types';
import { useClaudeApi } from '../../hooks/useClaudeApi';
import { buildSegmentPrompt } from '../../prompts/segmentsPrompt';
import { buildResourceContext } from '../../prompts/systemBase';
import SegmentResultsView from '../SegmentResultsView';

interface Props {
  analysis: FullAnalysis;
  apiKey: string;
  resourceContext: string;
  onBack: () => void;
}

const PRODUCTS: Array<ProductCategory | 'All Products'> = [
  'All Products',
  'EasyStretch',
  'Compression',
  'Ankle Compression',
];

const DEPTHS = [
  { value: 'overview' as const, label: 'Overview', description: 'Executive summary with key metrics & visual charts' },
  { value: 'deep-dive' as const, label: 'Deep Dive', description: 'Full psychographic profiles, fear mapping & messaging blueprints' },
];

function SegmentPreview({ breakdown }: { breakdown: SegmentBreakdown }) {
  const motivationSegs = breakdown.segments.filter((s) => s.layer === 'motivation');
  const identitySegs = breakdown.segments.filter((s) => s.layer === 'identity');
  const maxMotivation = motivationSegs.length > 0 ? Math.max(...motivationSegs.map((s) => s.totalReviews)) : 1;
  const maxIdentity = identitySegs.length > 0 ? Math.max(...identitySegs.map((s) => s.totalReviews)) : 1;

  const renderBars = (segs: typeof breakdown.segments, maxCount: number, color: string) =>
    segs.map((seg) => (
      <div key={seg.segmentName} className="flex items-center gap-3">
        <div className="w-36 text-sm font-medium text-slate-700 capitalize truncate shrink-0">
          {seg.segmentName}
        </div>
        <div className="flex-1 bg-slate-200 rounded-full h-6 relative overflow-hidden">
          <div
            className={`${color} h-full rounded-full transition-all duration-500`}
            style={{ width: `${Math.max((seg.totalReviews / maxCount) * 100, 4)}%` }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-slate-700">
            {seg.totalReviews.toLocaleString()} ({seg.percentage}%)
          </span>
        </div>
        <div className="w-16 text-right text-xs text-slate-500 shrink-0">
          {seg.averageRating}/5
        </div>
      </div>
    ));

  return (
    <div className="bg-slate-50 rounded-lg border border-slate-200 p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
          Segments Found (Deterministic)
        </h3>
        <span className="text-xs text-slate-400">
          {breakdown.totalReviews.toLocaleString()} reviews analyzed
        </span>
      </div>

      {motivationSegs.length > 0 && (
        <div className="mb-4">
          <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">Motivation Segments (Why They Buy)</div>
          <div className="space-y-2">
            {renderBars(motivationSegs, maxMotivation, 'bg-blue-500')}
          </div>
        </div>
      )}

      {identitySegs.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-violet-600 uppercase tracking-wider mb-2">Identity Segments (Who They Are)</div>
          <div className="space-y-2">
            {renderBars(identitySegs, maxIdentity, 'bg-violet-500')}
          </div>
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-slate-200 flex gap-6 text-xs text-slate-500">
        <span>
          Unsegmented: {breakdown.unsegmented.count.toLocaleString()} ({breakdown.unsegmented.percentage}%)
        </span>
        <span>
          Multi-segment: {breakdown.multiSegment.count.toLocaleString()} ({breakdown.multiSegment.percentage}%)
        </span>
      </div>
    </div>
  );
}

export default function SegmentDiscovery({ analysis, apiKey, resourceContext, onBack }: Props) {
  const [product, setProduct] = useState<ProductCategory | 'All Products'>('All Products');
  const [depth, setDepth] = useState<'overview' | 'deep-dive'>('overview');
  const { result, loading, error, generate, reset } = useClaudeApi(apiKey);

  const handleGenerate = () => {
    const { system, user } = buildSegmentPrompt({ product, depth }, analysis);
    // Scale tokens: deep-dive needs ~1K per segment (psychographics, fear mapping, messaging blueprints)
    const segCount = analysis.segmentBreakdown?.segments.length ?? 8;
    const deepDiveTokens = Math.min(Math.max(segCount * 1000 + 2000, 8000), 16000);
    generate(system + buildResourceContext(resourceContext), user, depth === 'deep-dive' ? deepDiveTokens : 6000);
  };

  if (result || loading || error) {
    return (
      <SegmentResultsView
        content={result ?? ''}
        title="Customer Segment Analysis"
        breakdown={analysis.segmentBreakdown ?? null}
        onBack={() => { reset(); onBack(); }}
        onBackToBuilder={reset}
        onRegenerate={handleGenerate}
        loading={loading}
        error={error}
        isDeepDive={depth === 'deep-dive'}
      />
    );
  }

  const breakdown = analysis.segmentBreakdown;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={onBack}
          className="text-sm text-slate-500 hover:text-slate-700 mb-6 flex items-center gap-1"
        >
          {'\u2190'} Back to Dashboard
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-1">
            Customer Segment Discovery
          </h2>
          <p className="text-slate-500 text-sm mb-6">
            Segments are identified by the math engine — the same data always produces the same segments.
            AI enriches the profiles, it doesn't decide them.
          </p>

          {/* Show the deterministic data first */}
          {breakdown && <SegmentPreview breakdown={breakdown} />}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Focus
              </label>
              <select
                value={product}
                onChange={(e) => setProduct(e.target.value as typeof product)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PRODUCTS.map((p) => (
                  <option key={p} value={p}>
                    {p === 'All Products'
                      ? `All Products (${analysis.totalReviews.toLocaleString()} reviews)`
                      : `${p} (${analysis.breakdown[p]?.toLocaleString() ?? 0} reviews)`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Analysis Depth
              </label>
              <div className="grid grid-cols-2 gap-3">
                {DEPTHS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setDepth(d.value)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      depth === d.value
                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-medium text-sm text-slate-800">{d.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{d.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Enrich Segments with AI
          </button>

          <p className="text-xs text-slate-400 text-center mt-3">
            The bars above are fixed math. Running this again on the same data produces the same segments.
            AI adds strategic depth — it cannot change the numbers.
          </p>
        </div>
      </div>
    </div>
  );
}
