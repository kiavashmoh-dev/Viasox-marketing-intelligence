/**
 * MarketComparisonBar — Side-by-side Viasox % vs Market % bars
 * with classification badge. Used inside the Market Opportunity section.
 */

import type { MarketComparisonData } from './personaParser';

const CLASSIFICATION_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  'established core': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'growth engine': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'emerging opportunity': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'niche strength': { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  'underserved whitespace': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
};

function getClassStyle(classification: string) {
  return CLASSIFICATION_STYLES[classification.toLowerCase()] ?? {
    bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200'
  };
}

export default function MarketComparisonBar({ data }: { data: MarketComparisonData }) {
  const { viasoxPercent, marketPercent, classification } = data;

  // Need at least one percent to render
  if (viasoxPercent == null && marketPercent == null) return null;

  const maxVal = Math.max(viasoxPercent ?? 0, marketPercent ?? 0, 1);
  const viasoxWidth = viasoxPercent != null ? Math.max((viasoxPercent / maxVal) * 100, 3) : 0;
  const marketWidth = marketPercent != null ? Math.max((marketPercent / maxVal) * 100, 3) : 0;

  // Determine over/under index
  let indexLabel = '';
  let indexColor = 'text-slate-500';
  if (viasoxPercent != null && marketPercent != null && marketPercent > 0) {
    const ratio = viasoxPercent / marketPercent;
    if (ratio >= 1.2) {
      indexLabel = `${ratio.toFixed(1)}x over-indexed`;
      indexColor = 'text-emerald-600';
    } else if (ratio <= 0.8) {
      indexLabel = `${ratio.toFixed(1)}x under-indexed`;
      indexColor = 'text-amber-600';
    } else {
      indexLabel = 'Balanced';
      indexColor = 'text-slate-500';
    }
  }

  return (
    <div className="bg-slate-50 rounded-xl p-4 mb-4">
      {/* Classification badge */}
      {classification && (
        <div className="mb-3">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getClassStyle(classification).bg} ${getClassStyle(classification).text} ${getClassStyle(classification).border}`}>
            {classification}
          </span>
          {indexLabel && (
            <span className={`ml-2 text-xs font-medium ${indexColor}`}>
              {indexLabel}
            </span>
          )}
        </div>
      )}

      {/* Bars */}
      <div className="space-y-2.5">
        {viasoxPercent != null && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">Viasox (Review Data)</span>
              <span className="text-xs font-bold text-slate-800">{viasoxPercent}%</span>
            </div>
            <div className="bg-slate-200 rounded-full h-3 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-700"
                style={{ width: `${viasoxWidth}%` }}
              />
            </div>
          </div>
        )}
        {marketPercent != null && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Market Estimate</span>
              <span className="text-xs font-bold text-slate-600">{marketPercent}%</span>
            </div>
            <div className="bg-slate-200 rounded-full h-3 overflow-hidden">
              <div
                className="h-full rounded-full bg-slate-400 transition-all duration-700"
                style={{ width: `${marketWidth}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Index label (if no classification shown above) */}
      {!classification && indexLabel && (
        <div className="mt-2">
          <span className={`text-xs font-medium ${indexColor}`}>{indexLabel}</span>
        </div>
      )}
    </div>
  );
}
