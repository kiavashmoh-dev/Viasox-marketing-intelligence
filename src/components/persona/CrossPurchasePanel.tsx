/**
 * CrossPurchasePanel — Shows what each selected segment's customers actually buy.
 *
 * For each selected persona that has sales-linked cross-purchase data, renders:
 * - Product line penetration bars (% who bought each product line)
 * - Multi-product combo stats (% who bought specific combinations)
 * - Overall multi-line purchase rate
 */

import type { ProductCategory } from '../../engine/types';
import { getEnrichedSegment } from '../../data/salesEnrichmentLoader';

interface Props {
  selectedSegments: string[];
  product: ProductCategory;
}

const BAR_COLORS: Record<string, string> = {
  EasyStretch: 'bg-blue-500',
  Compression: 'bg-violet-500',
  'Ankle Compression': 'bg-amber-500',
};

function fmtPct(v: number): string {
  return v % 1 === 0 ? `${v}%` : `${v.toFixed(1)}%`;
}

export default function CrossPurchasePanel({ selectedSegments, product }: Props) {
  // Gather segments that have cross-purchase data
  const segmentsWithData = selectedSegments
    .map(name => {
      const enriched = getEnrichedSegment(name);
      if (!enriched?.sales?.crossPurchase) return null;
      const cp = enriched.sales.crossPurchase;
      if (cp.productLinePenetration.length === 0) return null;
      return { name, sales: enriched.sales, crossPurchase: cp };
    })
    .filter(Boolean) as Array<{
      name: string;
      sales: NonNullable<ReturnType<typeof getEnrichedSegment>>['sales'];
      crossPurchase: NonNullable<ReturnType<typeof getEnrichedSegment>>['sales']['crossPurchase'];
    }>;

  if (segmentsWithData.length === 0) return null;

  // Show max 4 segments
  const visible = segmentsWithData.slice(0, 4);
  const overflow = segmentsWithData.length - 4;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
      <h3 className="text-sm font-semibold text-slate-800 mb-1">
        Cross-Purchase Behavior
      </h3>
      <p className="text-xs text-slate-400 mb-4">
        What your selected segments actually buy — product line penetration and multi-product purchasing for {product}.
      </p>

      <div className="space-y-5">
        {visible.map(({ name, crossPurchase }) => {
          const { productLinePenetration, combos, pctBoughtMultiple, boughtMultipleLines } = crossPurchase;
          // Find the max penetration % to scale bars relative to each other
          const maxPct = Math.max(...productLinePenetration.map(p => p.pct), 1);

          return (
            <div key={name} className="bg-slate-50 rounded-lg p-4">
              {/* Segment header */}
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-slate-700">
                  What do {name} customers buy?
                </h4>
                <span className="text-[10px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  {fmtPct(pctBoughtMultiple)} bought multiple lines
                  <span className="text-blue-400 ml-1">({boughtMultipleLines.toLocaleString()})</span>
                </span>
              </div>

              {/* Product line penetration bars */}
              <div className="space-y-2.5 mb-4">
                {productLinePenetration.map(({ category, customers, pct }) => (
                  <div key={category} className="flex items-center gap-3">
                    <span className="text-xs text-slate-600 w-28 shrink-0 truncate" title={category}>
                      {category}
                    </span>
                    <div className="flex-1 bg-slate-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${BAR_COLORS[category] ?? 'bg-slate-500'}`}
                        style={{ width: `${(pct / maxPct) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-slate-700 w-12 text-right">
                      {fmtPct(pct)}
                    </span>
                    <span className="text-[10px] text-slate-400 w-16 text-right">
                      {customers.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {/* Top combos */}
              {combos.length > 0 && (
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 block">
                    Top combos
                  </span>
                  <div className="space-y-1">
                    {combos.slice(0, 3).map(({ combo, customers, pct }) => (
                      <div key={combo} className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">{combo}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-700">{fmtPct(pct)}</span>
                          <span className="text-[10px] text-slate-400">{customers.toLocaleString()} customers</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {overflow > 0 && (
        <p className="text-xs text-slate-400 mt-3 text-center">
          and {overflow} more selected segment{overflow > 1 ? 's' : ''}...
        </p>
      )}
    </div>
  );
}
