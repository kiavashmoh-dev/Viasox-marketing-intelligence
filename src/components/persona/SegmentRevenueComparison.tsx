/**
 * SegmentRevenueComparison — Side-by-side horizontal bar chart
 * comparing selected segments on revenue, LTV, repeat rate,
 * and cross-purchase rate. Pure CSS bars, no chart library.
 */

import { getEnrichedSegment, hasSalesEnrichment } from '../../data/salesEnrichmentLoader';

interface Props {
  selectedSegments: string[];
}

interface SegmentMetrics {
  name: string;
  revenue: number;
  ltv: number;
  repeatRate: number;
  crossPurchaseRate: number;
}

const BAR_COLORS = [
  'bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-teal-500',
];

function fmtRev(v: number): string {
  return v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${(v / 1_000).toFixed(0)}K`;
}

export default function SegmentRevenueComparison({ selectedSegments }: Props) {
  if (!hasSalesEnrichment() || selectedSegments.length === 0) return null;

  const segments: SegmentMetrics[] = selectedSegments
    .map(name => {
      const enriched = getEnrichedSegment(name);
      if (!enriched?.sales) return null;
      const s = enriched.sales;
      return {
        name,
        revenue: s.totalRevenue,
        ltv: s.avgLifetimeValue,
        repeatRate: s.repeatPurchaseRate,
        crossPurchaseRate: s.crossPurchase.pctBoughtMultiple,
      };
    })
    .filter((s): s is SegmentMetrics => s !== null);

  if (segments.length === 0) return null;

  const maxRevenue = Math.max(...segments.map(s => s.revenue), 1);
  const maxLtv = Math.max(...segments.map(s => s.ltv), 1);

  const METRICS: { key: keyof SegmentMetrics; label: string; format: (v: number) => string; max: number }[] = [
    { key: 'revenue', label: 'Total Revenue', format: fmtRev, max: maxRevenue },
    { key: 'ltv', label: 'Avg Lifetime Value', format: (v) => `$${v}`, max: maxLtv },
    { key: 'repeatRate', label: 'Repeat Purchase Rate', format: (v) => `${v}%`, max: 100 },
    { key: 'crossPurchaseRate', label: 'Cross-Purchase Rate', format: (v) => `${v}%`, max: 100 },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Segment Comparison</h4>
        <p className="text-[10px] text-slate-400">
          Key metrics side by side for your selected personas.
        </p>
      </div>

      {METRICS.map(metric => (
        <div key={metric.key}>
          <div className="text-[10px] font-semibold text-slate-600 mb-2">{metric.label}</div>
          <div className="space-y-1.5">
            {segments.map((seg, i) => {
              const value = seg[metric.key] as number;
              const pct = Math.round((value / metric.max) * 100);
              return (
                <div key={seg.name} className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-500 w-28 truncate shrink-0" title={seg.name}>
                    {seg.name}
                  </span>
                  <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${BAR_COLORS[i % BAR_COLORS.length]} transition-all duration-500`}
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-700 w-16 text-right shrink-0">
                    {metric.format(value)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
        {segments.map((seg, i) => (
          <div key={seg.name} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${BAR_COLORS[i % BAR_COLORS.length]}`} />
            <span className="text-[10px] text-slate-500">{seg.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
