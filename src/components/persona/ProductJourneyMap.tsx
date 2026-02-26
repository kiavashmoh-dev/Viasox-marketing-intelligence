/**
 * ProductJourneyMap — Timeline cards showing sample high-value
 * customer journeys per segment. Visualizes real purchase history
 * from salesEnrichment.customerJourneys.
 */

import { hasSalesEnrichment, salesEnrichment } from '../../data/salesEnrichmentLoader';

interface Props {
  selectedSegments: string[];
}

const PRODUCT_COLORS: Record<string, string> = {
  EasyStretch: 'bg-blue-500',
  Compression: 'bg-violet-500',
  'Ankle Compression': 'bg-amber-500',
};

function fmtSpend(v: number): string {
  return v >= 1000 ? `$${(v / 1000).toFixed(1)}K` : `$${v}`;
}

export default function ProductJourneyMap({ selectedSegments }: Props) {
  if (!hasSalesEnrichment() || selectedSegments.length === 0) return null;

  // Gather journeys for selected segments (max 3 segments, max 2 journeys each)
  const segmentJourneys: { name: string; journeys: typeof salesEnrichment.customerJourneys[string] }[] = [];

  for (const name of selectedSegments.slice(0, 3)) {
    const key = name.toLowerCase();
    const journeys = salesEnrichment.customerJourneys[key];
    if (journeys && journeys.length > 0) {
      segmentJourneys.push({ name, journeys: journeys.slice(0, 2) });
    }
  }

  if (segmentJourneys.length === 0) return null;

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Customer Journey Examples</h4>
        <p className="text-[10px] text-slate-400">
          Real purchase histories from top-spending customers in each segment (anonymized).
        </p>
      </div>

      {segmentJourneys.map(({ name, journeys }) => (
        <div key={name}>
          <div className="text-xs font-semibold text-slate-700 mb-2">{name}</div>
          <div className="space-y-2">
            {journeys.map((journey, j) => (
              <div key={j} className="bg-slate-50 rounded-lg p-3.5 border border-slate-100">
                {/* Top row: spend + orders + location */}
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-emerald-700">
                      {fmtSpend(journey.totalSpend)}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {journey.orderLines} order{journey.orderLines !== 1 ? 's' : ''}
                    </span>
                    {journey.location && (
                      <span className="text-[10px] text-slate-400">{journey.location}</span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {journey.firstOrder} {'\u2192'} {journey.lastOrder}
                  </span>
                </div>

                {/* Products owned — pill badges */}
                <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                  <span className="text-[9px] text-slate-400 mr-1">Products:</span>
                  {journey.productsOwned.map(prod => (
                    <span
                      key={prod}
                      className={`text-[9px] font-medium text-white px-2 py-0.5 rounded-full ${PRODUCT_COLORS[prod] ?? 'bg-slate-400'}`}
                    >
                      {prod}
                    </span>
                  ))}
                </div>

                {/* Timeline bar */}
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-slate-400 shrink-0">{journey.firstOrder}</span>
                  <div className="flex-1 h-1.5 bg-slate-200 rounded-full relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-emerald-400 rounded-full" />
                    {/* Dots for each product */}
                    {journey.productsOwned.map((prod, pi) => {
                      const pct = journey.productsOwned.length > 1
                        ? (pi / (journey.productsOwned.length - 1)) * 100
                        : 50;
                      return (
                        <div
                          key={prod}
                          className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white ${PRODUCT_COLORS[prod] ?? 'bg-slate-400'}`}
                          style={{ left: `${pct}%` }}
                          title={prod}
                        />
                      );
                    })}
                  </div>
                  <span className="text-[9px] text-slate-400 shrink-0">{journey.lastOrder}</span>
                </div>

                {/* Sample quote */}
                {journey.sampleQuote && (
                  <div className="mt-2.5 border-l-3 border-blue-300 pl-3 py-1">
                    <p className="text-[10px] text-slate-500 italic leading-relaxed">
                      &ldquo;{journey.sampleQuote.length > 180
                        ? journey.sampleQuote.slice(0, 180) + '...'
                        : journey.sampleQuote}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
