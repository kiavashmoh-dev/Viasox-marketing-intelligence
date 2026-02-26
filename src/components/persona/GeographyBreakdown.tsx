/**
 * GeographyBreakdown — Country split (US vs CA stacked bar)
 * and top regions per segment. Data from salesEnrichment.
 */

import { getEnrichedSegment, hasSalesEnrichment } from '../../data/salesEnrichmentLoader';

interface Props {
  selectedSegments: string[];
}

function fmtRev(v: number): string {
  return v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${(v / 1_000).toFixed(0)}K`;
}

export default function GeographyBreakdown({ selectedSegments }: Props) {
  if (!hasSalesEnrichment() || selectedSegments.length === 0) return null;

  const segmentsWithGeo = selectedSegments
    .map(name => {
      const enriched = getEnrichedSegment(name);
      if (!enriched?.sales?.geography || enriched.sales.geography.length === 0) return null;
      return { name, geo: enriched.sales.geography, regions: enriched.sales.topRegions };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null)
    .slice(0, 4);

  if (segmentsWithGeo.length === 0) return null;

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Geographic Distribution</h4>
        <p className="text-[10px] text-slate-400">
          Where each segment's customers are located and their revenue contribution by region.
        </p>
      </div>

      <div className={`grid gap-4 ${segmentsWithGeo.length <= 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}>
        {segmentsWithGeo.map(({ name, geo, regions }) => {
          const us = geo.find(g => g.country === 'US');
          const ca = geo.find(g => g.country === 'CA');
          const usPct = us?.pct ?? 0;
          const caPct = ca?.pct ?? 0;

          return (
            <div key={name} className="bg-slate-50 rounded-lg p-3.5 border border-slate-100">
              <div className="text-xs font-semibold text-slate-700 mb-2.5">{name}</div>

              {/* Country stacked bar */}
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] text-slate-500 w-8">US</span>
                  <div className="flex-1 flex rounded-full h-4 overflow-hidden bg-slate-200">
                    {usPct > 0 && (
                      <div
                        className="bg-blue-500 h-full flex items-center justify-center"
                        style={{ width: `${usPct}%` }}
                      >
                        {usPct > 15 && (
                          <span className="text-[8px] font-bold text-white">{usPct}%</span>
                        )}
                      </div>
                    )}
                    {caPct > 0 && (
                      <div
                        className="bg-red-400 h-full flex items-center justify-center"
                        style={{ width: `${caPct}%` }}
                      >
                        {caPct > 15 && (
                          <span className="text-[8px] font-bold text-white">{caPct}%</span>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-500 w-8 text-right">CA</span>
                </div>
                <div className="flex items-center gap-4 text-[9px] text-slate-400">
                  {us && <span>{'\uD83C\uDDFA\uD83C\uDDF8'} {us.customers.toLocaleString()} customers · {fmtRev(us.revenue)}</span>}
                  {ca && <span>{'\uD83C\uDDE8\uD83C\uDDE6'} {ca.customers.toLocaleString()} customers · {fmtRev(ca.revenue)}</span>}
                </div>
              </div>

              {/* Top regions */}
              {regions && regions.length > 0 && (
                <div>
                  <div className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Top Regions</div>
                  <div className="space-y-1">
                    {regions.slice(0, 4).map((r, ri) => (
                      <div key={ri} className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-600">{r.region}</span>
                        <span className="text-slate-500">
                          {r.customers.toLocaleString()} · {fmtRev(r.revenue)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
