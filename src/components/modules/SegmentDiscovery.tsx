import { useState, useMemo } from 'react';
import type {
  FullAnalysis,
  ProductCategory,
  SegmentBreakdown,
  SegmentProfile,
  YearlyProductData,
} from '../../engine/types';
import { useClaudeApi } from '../../hooks/useClaudeApi';
import { buildSegmentPrompt } from '../../prompts/segmentsPrompt';
import { buildResourceContext } from '../../prompts/systemBase';
import { getEnrichedSegment, hasSalesEnrichment } from '../../data/salesEnrichmentLoader';
import type { GeoEntry, RegionEntry } from '../../data/salesEnrichmentLoader';
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

// ─── Coverage Summary ─────────────────────────────────────────────────────

function CoverageSummary({ breakdown }: { breakdown: SegmentBreakdown }) {
  const classified = breakdown.totalReviews - breakdown.unsegmented.count;
  const classifiedPct = breakdown.totalReviews > 0
    ? Math.round((classified / breakdown.totalReviews) * 1000) / 10
    : 0;
  const unsegPct = breakdown.unsegmented.percentage;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 mb-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
          Coverage Summary
        </h3>
        <span className="text-xs text-slate-400">
          {breakdown.totalReviews.toLocaleString()} total reviews
        </span>
      </div>

      {/* Stacked coverage bar */}
      <div className="relative w-full h-10 rounded-lg overflow-hidden bg-slate-100 mb-3">
        <div
          className="absolute inset-y-0 left-0 bg-blue-500 transition-all duration-700"
          style={{ width: `${classifiedPct}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-sm">
          {classifiedPct}% of reviews matched to at least one segment
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-lg font-bold text-blue-700">{classified.toLocaleString()}</div>
          <div className="text-xs text-blue-600">Classified ({classifiedPct}%)</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="text-lg font-bold text-slate-600">{breakdown.unsegmented.count.toLocaleString()}</div>
          <div className="text-xs text-slate-500">Unclassified ({unsegPct}%)</div>
        </div>
        <div className="bg-violet-50 rounded-lg p-3">
          <div className="text-lg font-bold text-violet-700">{breakdown.multiSegment.count.toLocaleString()}</div>
          <div className="text-xs text-violet-600">Multi-segment ({breakdown.multiSegment.percentage}%)</div>
        </div>
      </div>

      <p className="text-xs text-slate-400 mt-3">
        Reviews can match multiple segments, so individual segment percentages will exceed 100%.
        Unclassified reviews are general praise or complaints without specific segment signals.
      </p>
    </div>
  );
}

// ─── Visual Breakdown (Motivators First, Then Identity) ───────────────────

function VisualBreakdown({
  breakdown,
  yearlyTrends,
}: {
  breakdown: SegmentBreakdown;
  yearlyTrends?: FullAnalysis['yearlyTrends'];
}) {
  const motivationSegs = breakdown.segments.filter((s) => s.layer === 'motivation');
  const identitySegs = breakdown.segments.filter((s) => s.layer === 'identity');

  // Compute YOY growth for each segment (last full year vs previous)
  const segmentGrowth = useMemo(() => {
    if (!yearlyTrends?.overall || yearlyTrends.overall.length < 2) return new Map<string, number>();
    const sorted = [...yearlyTrends.overall].sort((a, b) => a.year.localeCompare(b.year));
    // Use the two most recent full years (exclude current partial year 2026)
    const fullYears = sorted.filter((d) => d.year !== '2026');
    if (fullYears.length < 2) return new Map<string, number>();
    const prev = fullYears[fullYears.length - 2];
    const curr = fullYears[fullYears.length - 1];
    const growth = new Map<string, number>();
    for (const [seg, count] of Object.entries(curr.segments)) {
      const prevCount = prev.segments[seg] ?? 0;
      if (prevCount > 0) {
        const pctChange = Math.round(((count - prevCount) / prevCount) * 100);
        growth.set(seg, pctChange);
      }
    }
    return growth;
  }, [yearlyTrends]);

  const renderBars = (
    segs: SegmentProfile[],
    maxCount: number,
    barColor: string,
  ) =>
    segs.map((seg) => {
      const yoyGrowth = segmentGrowth.get(seg.segmentName);
      return (
        <div key={seg.segmentName} className="flex items-center gap-2">
          <div className="w-36 text-sm font-medium text-slate-700 capitalize truncate shrink-0">
            {seg.segmentName}
          </div>
          <div className="flex-1 bg-slate-200 rounded-full h-6 relative overflow-hidden">
            <div
              className={`${barColor} h-full rounded-full transition-all duration-500`}
              style={{ width: `${Math.max((seg.totalReviews / maxCount) * 100, 4)}%` }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-slate-700">
              {seg.totalReviews.toLocaleString()} ({seg.percentage}%)
            </span>
          </div>
          <div className="w-12 text-right text-xs text-slate-500 shrink-0">
            {seg.averageRating}/5
          </div>
          {yoyGrowth !== undefined && (
            <div
              className={`w-14 text-right text-xs font-semibold shrink-0 ${
                yoyGrowth > 0 ? 'text-green-600' : yoyGrowth < 0 ? 'text-red-500' : 'text-slate-400'
              }`}
            >
              {yoyGrowth > 0 ? '+' : ''}{yoyGrowth}%
            </div>
          )}
        </div>
      );
    });

  const maxMotivation = motivationSegs.length > 0 ? Math.max(...motivationSegs.map((s) => s.totalReviews)) : 1;
  const maxIdentity = identitySegs.length > 0 ? Math.max(...identitySegs.map((s) => s.totalReviews)) : 1;

  // Check if we have YOY data to show the column header
  const hasYOY = segmentGrowth.size > 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 mb-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
          Segment Breakdown
        </h3>
        {hasYOY && (
          <span className="text-xs text-slate-400">YOY = year-over-year growth (2024 vs 2025)</span>
        )}
      </div>
      <p className="text-xs text-slate-400 mb-4">
        Percentages are of total reviews ({breakdown.totalReviews.toLocaleString()}).
        Reviews can match multiple segments.
      </p>

      {/* Motivation segments FIRST (consultant feedback #1) */}
      {motivationSegs.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
              Motivation Segments (Why They Buy)
            </div>
            <div className="flex-1 border-b border-blue-100" />
          </div>
          <div className="space-y-1.5">
            {renderBars(motivationSegs, maxMotivation, 'bg-blue-500')}
          </div>
        </div>
      )}

      {/* Identity segments second */}
      {identitySegs.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="text-xs font-semibold text-violet-600 uppercase tracking-wider">
              Identity Segments (Who They Are)
            </div>
            <div className="flex-1 border-b border-violet-100" />
          </div>
          <div className="space-y-1.5">
            {renderBars(identitySegs, maxIdentity, 'bg-violet-500')}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Lifestyle Context: Identity composition within a motivation segment ──

function LifestyleContext({
  breakdown,
}: {
  breakdown: SegmentBreakdown;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const motivationSegs = breakdown.segments.filter((s) => s.layer === 'motivation');
  const overlaps = breakdown.crossSegmentOverlap ?? [];

  if (motivationSegs.length === 0 || overlaps.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 mb-5">
      <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-1">
        Lifestyle Context
      </h3>
      <p className="text-xs text-slate-400 mb-4">
        Who are the people in each motivation segment? Click to expand.
      </p>

      <div className="space-y-2">
        {motivationSegs.map((seg) => {
          const identityBreakdown = overlaps
            .filter((o) => o.motivation === seg.segmentName)
            .sort((a, b) => b.reviewCount - a.reviewCount);

          if (identityBreakdown.length === 0) return null;
          const isOpen = expanded === seg.segmentName;

          return (
            <div key={seg.segmentName} className="border border-slate-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setExpanded(isOpen ? null : seg.segmentName)}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-blue-700 capitalize">{seg.segmentName}</span>
                  <span className="text-xs text-slate-400">
                    {seg.totalReviews.toLocaleString()} reviews
                  </span>
                </div>
                <span className="text-slate-400 text-sm">{isOpen ? '\u25B2' : '\u25BC'}</span>
              </button>

              {isOpen && (
                <div className="p-4 space-y-2">
                  {identityBreakdown.map((overlap) => {
                    const pct = overlap.percentOfMotivation;
                    return (
                      <div key={overlap.identity} className="flex items-center gap-3">
                        <div className="w-40 text-sm text-slate-700 capitalize truncate shrink-0">
                          {overlap.identity}
                        </div>
                        <div className="flex-1 bg-slate-100 rounded-full h-5 relative overflow-hidden">
                          <div
                            className="bg-violet-400 h-full rounded-full"
                            style={{ width: `${Math.max(pct, 3)}%` }}
                          />
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-slate-700">
                            {overlap.reviewCount.toLocaleString()} ({pct}%)
                          </span>
                        </div>
                        <div className="w-12 text-right text-xs text-slate-500 shrink-0">
                          {overlap.avgRating}/5
                        </div>
                      </div>
                    );
                  })}
                  <p className="text-xs text-slate-400 mt-2">
                    % of this motivation segment that also matches each identity
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── YOY Trend Chart (simple text-based) ───────────────────────────────────

function YoyTrends({
  yearlyTrends,
}: {
  yearlyTrends: FullAnalysis['yearlyTrends'];
}) {
  const [view, setView] = useState<'overall' | ProductCategory>('overall');

  if (!yearlyTrends?.years || yearlyTrends.years.length === 0) return null;

  const data: YearlyProductData[] =
    view === 'overall'
      ? yearlyTrends.overall
      : yearlyTrends.byProduct[view] ?? [];

  if (data.length === 0) return null;

  const maxReviews = Math.max(...data.map((d) => d.totalReviews));

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 mb-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
          Year-over-Year Trends
        </h3>
        <select
          value={view}
          onChange={(e) => setView(e.target.value as typeof view)}
          className="text-xs border border-slate-200 rounded px-2 py-1 text-slate-600"
        >
          <option value="overall">All Products</option>
          <option value="EasyStretch">EasyStretch</option>
          <option value="Compression">Compression</option>
          <option value="Ankle Compression">Ankle Compression</option>
        </select>
      </div>
      <p className="text-xs text-slate-400 mb-4">
        Review volume and satisfaction by year. 2026 is partial (YTD).
      </p>

      <div className="space-y-2">
        {data.map((d, i) => {
          const prevYear = i > 0 ? data[i - 1] : null;
          const growth = prevYear
            ? Math.round(((d.totalReviews - prevYear.totalReviews) / prevYear.totalReviews) * 100)
            : null;
          const isPartial = d.year === '2026';

          return (
            <div key={d.year} className="flex items-center gap-3">
              <div className={`w-12 text-sm font-medium shrink-0 ${isPartial ? 'text-slate-400' : 'text-slate-700'}`}>
                {d.year}{isPartial ? '*' : ''}
              </div>
              <div className="flex-1 bg-slate-100 rounded-full h-7 relative overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${isPartial ? 'bg-slate-300' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.max((d.totalReviews / maxReviews) * 100, 4)}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-slate-700">
                  {d.totalReviews.toLocaleString()} reviews
                </span>
              </div>
              <div className="w-12 text-right text-xs text-slate-500 shrink-0">
                {d.avgRating}/5
              </div>
              <div className="w-10 text-right text-xs text-slate-500 shrink-0">
                {d.fiveStarPct}%{'\u2605'}
              </div>
              {growth !== null && !isPartial && (
                <div
                  className={`w-14 text-right text-xs font-semibold shrink-0 ${
                    growth > 0 ? 'text-green-600' : growth < 0 ? 'text-red-500' : 'text-slate-400'
                  }`}
                >
                  {growth > 0 ? '+' : ''}{growth}%
                </div>
              )}
              {(growth === null || isPartial) && <div className="w-14 shrink-0" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Geography Panel ───────────────────────────────────────────────────────

function GeographyPanel() {
  const [expanded, setExpanded] = useState(false);
  const hasSales = hasSalesEnrichment();
  if (!hasSales) return null;

  // Get top-3 segments by size and show their geography
  const topSegments = ['comfort seeker', 'pain symptom relief', 'style conscious'];
  const geoData: Array<{ name: string; geo: GeoEntry[]; regions: RegionEntry[] }> = [];

  for (const segName of topSegments) {
    const seg = getEnrichedSegment(segName);
    if (seg?.sales?.geography && seg.sales.geography.length > 0) {
      geoData.push({
        name: segName,
        geo: seg.sales.geography.slice(0, 5),
        regions: (seg.sales.topRegions ?? []).slice(0, 5),
      });
    }
  }

  if (geoData.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 mb-5">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
          Geographic Distribution (from Order Data)
        </h3>
        <span className="text-slate-400 text-sm">{expanded ? '\u25B2' : '\u25BC'}</span>
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {geoData.map(({ name, geo, regions }) => (
            <div key={name} className="border-t border-slate-100 pt-3">
              <div className="text-sm font-semibold text-slate-700 capitalize mb-2">{name}</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-medium text-slate-500 uppercase mb-1">Countries</div>
                  {geo.map((g) => (
                    <div key={g.country} className="flex justify-between text-xs text-slate-600 py-0.5">
                      <span>{g.country}</span>
                      <span className="text-slate-400">{g.pct}% ({g.customers.toLocaleString()})</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500 uppercase mb-1">Top Regions</div>
                  {regions.map((r) => (
                    <div key={r.region} className="flex justify-between text-xs text-slate-600 py-0.5">
                      <span className="truncate mr-2">{r.region}</span>
                      <span className="text-slate-400 shrink-0">{r.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          <p className="text-xs text-slate-400 mt-2">
            Geographic data sourced from order records linked to reviewers via email matching.
            Only shows reviewers whose emails matched an order record ({'\u2248'}88% link rate).
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Data Source Transparency ──────────────────────────────────────────────

function DataSourceNote() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-5">
      <div className="flex items-start gap-2">
        <span className="text-amber-500 text-sm mt-0.5">{'\u26A0'}</span>
        <div>
          <div className="text-sm font-semibold text-amber-800">Data Source: DTC Reviews Only</div>
          <p className="text-xs text-amber-700 mt-1">
            All segment data is derived from DTC (Direct-to-Consumer) online reviews.
            Retail and wholesale customer behavior may differ. No retail POS or wholesale
            distributor data feeds into this analysis. Geography data comes from DTC order
            records cross-referenced with reviewer emails.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────

export default function SegmentDiscovery({ analysis, apiKey, resourceContext, onBack }: Props) {
  const [product, setProduct] = useState<ProductCategory | 'All Products'>('All Products');
  const [depth, setDepth] = useState<'overview' | 'deep-dive'>('overview');
  const { result, loading, error, generate, reset } = useClaudeApi(apiKey);

  const handleGenerate = () => {
    const { system, user } = buildSegmentPrompt({ product, depth }, analysis);
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
      <div className="max-w-3xl mx-auto">
        <button
          onClick={onBack}
          className="text-sm text-slate-500 hover:text-slate-700 mb-6 flex items-center gap-1"
        >
          {'\u2190'} Back to Dashboard
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-800 mb-1">
            Customer Segment Discovery
          </h2>
          <p className="text-slate-500 text-sm">
            Segments are identified deterministically by pattern matching — the same data always produces the same results.
            AI enriches the profiles, it doesn't decide them.
          </p>
        </div>

        {/* Data source transparency (consultant feedback #6) */}
        <DataSourceNote />

        {/* Coverage Summary (consultant feedback #1 — numbers adding up) */}
        {breakdown && <CoverageSummary breakdown={breakdown} />}

        {/* Visual Breakdown with Motivators First + YOY indicators (feedback #1, #4) */}
        {breakdown && (
          <VisualBreakdown
            breakdown={breakdown}
            yearlyTrends={analysis.yearlyTrends}
          />
        )}

        {/* Lifestyle Context (consultant feedback #2 — WHY comfort seekers seek comfort) */}
        {breakdown && <LifestyleContext breakdown={breakdown} />}

        {/* Year-over-Year Trends (consultant feedback #4) */}
        {analysis.yearlyTrends && <YoyTrends yearlyTrends={analysis.yearlyTrends} />}

        {/* Geography from sales enrichment (consultant feedback #5) */}
        <GeographyPanel />

        {/* AI Enrichment Controls */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
            AI Enrichment
          </h3>

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
            The data above is fixed math. Running this again on the same data produces the same segments.
            AI adds strategic depth — it cannot change the numbers.
          </p>
        </div>
      </div>
    </div>
  );
}
