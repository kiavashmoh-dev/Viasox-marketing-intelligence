/**
 * MarketGeoComparison — Deterministic US vs CA side-by-side comparison.
 *
 * Uses STATIC data from US_MARKET_DATA / CA_MARKET_DATA (marketIntelligence.ts).
 * Always renders — no AI dependency. Each metric includes its source citation.
 */

import type { MarketRegion } from '../../engine/types';
import { US_MARKET_DATA, CA_MARKET_DATA, type GeoMarketData, type MarketDataPoint } from '../../data/marketIntelligence';

interface Props {
  markets: MarketRegion[];
}

function MetricRow({ point }: { point: MarketDataPoint }) {
  return (
    <div className="flex items-baseline justify-between py-1.5 border-b border-slate-100 last:border-b-0">
      <span className="text-xs text-slate-600">{point.label}</span>
      <div className="text-right shrink-0 ml-3">
        <span className="text-xs font-semibold text-slate-800">{point.value}</span>
        <span className="text-[9px] text-slate-400 ml-1.5 italic">{point.source}, {point.sourceYear}</span>
      </div>
    </div>
  );
}

function MarketCard({ data }: { data: GeoMarketData }) {
  const borderColor = data.country === 'US' ? 'border-blue-200' : 'border-red-200';
  const headerBg = data.country === 'US' ? 'bg-blue-50' : 'bg-red-50';
  const headerText = data.country === 'US' ? 'text-blue-800' : 'text-red-800';

  const metrics: MarketDataPoint[] = [
    data.marketSize,
    data.compressionSegment,
    ...(data.medicalCompression ? [data.medicalCompression] : []),
    ...(data.fashionLifestyle ? [data.fashionLifestyle] : []),
    ...(data.dtcBrands ? [data.dtcBrands] : []),
    ...(data.avgHouseholdSpend ? [data.avgHouseholdSpend] : []),
    ...(data.compressionPriceRange ? [data.compressionPriceRange] : []),
  ];

  const demographics: MarketDataPoint[] = [
    data.diabeticPopulation,
    data.seniorPopulation,
    data.healthcareWorkers,
    data.standingWorkers,
  ];

  return (
    <div className={`border-2 ${borderColor} rounded-xl overflow-hidden`}>
      {/* Header */}
      <div className={`${headerBg} px-4 py-3 flex items-center gap-2.5`}>
        <span className="text-xl">{data.flag}</span>
        <div>
          <h4 className={`text-sm font-bold ${headerText}`}>{data.countryName}</h4>
          <span className={`text-[10px] ${headerText} opacity-70`}>{data.currency}</span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Market Size */}
        <div>
          <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Market Size</h5>
          {metrics.map((m, i) => <MetricRow key={i} point={m} />)}
        </div>

        {/* Demographics */}
        <div>
          <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Key Demographics</h5>
          {demographics.map((m, i) => <MetricRow key={i} point={m} />)}
        </div>

        {/* Key Retailers */}
        <div>
          <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Key Retailers</h5>
          <div className="flex flex-wrap gap-1.5">
            {data.keyRetailers.map((r, i) => (
              <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {r}
              </span>
            ))}
          </div>
        </div>

        {/* Key Differences */}
        <div>
          <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Key Differences</h5>
          <ul className="space-y-1">
            {data.keyDifferences.map((d, i) => (
              <li key={i} className="text-[11px] text-slate-600 leading-relaxed flex gap-1.5">
                <span className="text-slate-400 shrink-0">{'\u2022'}</span>
                {d}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function MarketGeoComparison({ markets }: Props) {
  const showUS = markets.includes('US');
  const showCA = markets.includes('CA');

  if (!showUS && !showCA) return null;

  const singleMarket = showUS !== showCA;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
      <h3 className="text-sm font-semibold text-slate-800 mb-1">
        {singleMarket
          ? `${showUS ? '\uD83C\uDDFA\uD83C\uDDF8 US' : '\uD83C\uDDE8\uD83C\uDDE6 CA'} Market Overview`
          : '\uD83C\uDF0E US vs. Canada — Market Comparison'
        }
      </h3>
      <p className="text-xs text-slate-400 mb-4">
        {singleMarket
          ? 'Key market metrics with source citations for every data point.'
          : 'Side-by-side market metrics. Every figure includes its source citation.'
        }
      </p>

      <div className={`grid gap-4 ${singleMarket ? 'grid-cols-1 max-w-lg mx-auto' : 'grid-cols-1 md:grid-cols-2'}`}>
        {showUS && <MarketCard data={US_MARKET_DATA} />}
        {showCA && <MarketCard data={CA_MARKET_DATA} />}
      </div>

      <p className="text-[9px] text-slate-400 mt-3 text-center italic">
        All figures are approximate market estimates from public sources. Not Viasox proprietary data.
      </p>
    </div>
  );
}
