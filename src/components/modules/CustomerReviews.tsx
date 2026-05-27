/**
 * CustomerReviews — interactive dashboard over the uploaded review data.
 *
 * Lives in the sidebar's Context Hub group. Reads exclusively from the
 * existing FullAnalysis structure (already computed during the initial
 * upload + processing phase). No new engine work, no extra Claude calls,
 * no extra analysis pass — this is a presentation layer over data the
 * tool already has.
 *
 * Design choices (per the operator's brief):
 *   - Dashboard / chart-heavy, NOT essay-heavy. No paragraph executive
 *     summaries. No prose narrations. Just numbers, bars, and labels.
 *   - Interactive: product filter pills at the top swap the theme charts
 *     and segment grid between "all products" and a single product.
 *   - Surfaces the breakdowns the tool actually uses downstream: per-
 *     product ratings, top pains / benefits / transformations, discovered
 *     segments, year-over-year trends. The shape mirrors what feeds into
 *     the brain + brief generators so the user can SEE what the tool sees.
 */
import { useMemo, useState } from 'react';
import type { FullAnalysis, ProductCategory, ProductAnalysis, SegmentProfile, CategoryAnalysis } from '../../engine/types';
import { formatNumber } from '../../utils/formatters';

interface Props {
  analysis: FullAnalysis;
  apiKey: string;
  resourceContext: string;
  onBack: () => void;
}

type ProductFilter = 'all' | ProductCategory;

const ALL_PRODUCTS: ProductCategory[] = ['EasyStretch', 'Compression', 'Ankle Compression', 'Other'];

// ─── Helpers ───────────────────────────────────────────────────────────

/** Aggregate per-pattern data across multiple products. Returns sorted
 *  [theme, count, percentage] tuples. Percentage is recomputed against
 *  the total reviews of the included products so it stays meaningful
 *  even when the user filters to a single product. */
function aggregateCategoryAnalysis(
  products: ProductAnalysis[],
  field: 'pain' | 'benefits' | 'transformation',
): Array<{ theme: string; count: number; percentage: number }> {
  const totalReviews = products.reduce((sum, p) => sum + p.totalReviews, 0) || 1;
  const counts = new Map<string, number>();
  for (const p of products) {
    const cat: CategoryAnalysis = p[field];
    for (const [theme, result] of Object.entries(cat)) {
      if (!result || result.count <= 0) continue;
      counts.set(theme, (counts.get(theme) ?? 0) + result.count);
    }
  }
  return Array.from(counts.entries())
    .map(([theme, count]) => ({
      theme,
      count,
      percentage: Math.round((count / totalReviews) * 1000) / 10, // 1 decimal
    }))
    .sort((a, b) => b.count - a.count);
}

/** Weighted average rating across multiple products. */
function weightedAvgRating(products: ProductAnalysis[]): number {
  const totalReviews = products.reduce((sum, p) => sum + p.totalReviews, 0);
  if (totalReviews === 0) return 0;
  const weighted = products.reduce((sum, p) => sum + p.averageRating * p.totalReviews, 0);
  return weighted / totalReviews;
}

/** Weighted N-star percent across multiple products. */
function weightedStarPct(products: ProductAnalysis[], star: 'five' | 'one'): number {
  const totalReviews = products.reduce((sum, p) => sum + p.totalReviews, 0);
  if (totalReviews === 0) return 0;
  const weighted = products.reduce((sum, p) => {
    const pct = star === 'five' ? p.fiveStarPercent : p.oneStarPercent;
    return sum + pct * p.totalReviews;
  }, 0);
  return weighted / totalReviews;
}

// ─── Component ─────────────────────────────────────────────────────────

export default function CustomerReviews({ analysis, onBack }: Props) {
  const [productFilter, setProductFilter] = useState<ProductFilter>('all');
  const [expandedSegment, setExpandedSegment] = useState<string | null>(null);

  // The set of products in scope based on the current filter.
  const productsInScope = useMemo<ProductAnalysis[]>(() => {
    const all = Object.values(analysis.products).filter((p): p is ProductAnalysis => p != null);
    if (productFilter === 'all') return all;
    return all.filter((p) => p.productName === productFilter);
  }, [analysis.products, productFilter]);

  // KPI calculations
  const totalReviewsInScope = productsInScope.reduce((sum, p) => sum + p.totalReviews, 0);
  const avgRating = weightedAvgRating(productsInScope);
  const fiveStarPct = weightedStarPct(productsInScope, 'five');
  const oneStarPct = weightedStarPct(productsInScope, 'one');
  const segmentCount = analysis.segmentBreakdown?.segments.length ?? 0;

  // Per-product breakdown for the bar chart
  const productBreakdown = useMemo(() => {
    const all = Object.values(analysis.products).filter((p): p is ProductAnalysis => p != null);
    return all
      .map((p) => ({
        product: p.productName,
        count: p.totalReviews,
        percentage: analysis.totalReviews > 0 ? Math.round((p.totalReviews / analysis.totalReviews) * 100) : 0,
        avgRating: p.averageRating,
        fiveStarPct: p.fiveStarPercent,
        oneStarPct: p.oneStarPercent,
      }))
      .sort((a, b) => b.count - a.count);
  }, [analysis.products, analysis.totalReviews]);

  // Theme aggregations — recomputed when filter changes
  const topPains = useMemo(() => aggregateCategoryAnalysis(productsInScope, 'pain').slice(0, 10), [productsInScope]);
  const topBenefits = useMemo(() => aggregateCategoryAnalysis(productsInScope, 'benefits').slice(0, 10), [productsInScope]);
  const topTransformations = useMemo(() => aggregateCategoryAnalysis(productsInScope, 'transformation').slice(0, 10), [productsInScope]);

  // Segments — optionally filtered to current product
  const segmentsInScope = useMemo<SegmentProfile[]>(() => {
    const all = analysis.segmentBreakdown?.segments ?? [];
    if (productFilter === 'all') return all;
    // Sort by current product's count within the segment, desc
    return [...all].sort((a, b) => {
      const aCount = a.byProduct[productFilter]?.count ?? 0;
      const bCount = b.byProduct[productFilter]?.count ?? 0;
      return bCount - aCount;
    });
  }, [analysis.segmentBreakdown, productFilter]);

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
          >
            {'←'} Back
          </button>
          <div className="text-xs text-slate-400">
            Live data from your uploaded review set
          </div>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Reviews</h1>
          <p className="text-sm text-slate-500 mt-1">
            Every breakdown the tool consults when generating concepts, scripts, and briefs.
          </p>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
          <KpiTile label="Total reviews" value={formatNumber(totalReviewsInScope)} tone="neutral" />
          <KpiTile label="Avg rating" value={avgRating.toFixed(2)} suffix="★" tone="amber" />
          <KpiTile label="5★ rate" value={`${Math.round(fiveStarPct)}%`} tone="emerald" />
          <KpiTile label="1★ rate" value={`${Math.round(oneStarPct)}%`} tone="rose" />
          <KpiTile label="Products" value={String(productBreakdown.length)} tone="neutral" />
          <KpiTile label="Segments" value={String(segmentCount)} tone="neutral" />
        </div>

        {/* Product filter pills — drives the theme + segment cards below */}
        <div className="mb-6">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Filter the breakdowns below
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterPill
              label="All products"
              active={productFilter === 'all'}
              onClick={() => setProductFilter('all')}
              count={analysis.totalReviews}
            />
            {ALL_PRODUCTS.map((p) => {
              const data = productBreakdown.find((b) => b.product === p);
              if (!data || data.count === 0) return null;
              return (
                <FilterPill
                  key={p}
                  label={p}
                  active={productFilter === p}
                  onClick={() => setProductFilter(p)}
                  count={data.count}
                />
              );
            })}
          </div>
        </div>

        {/* Top row: per-product breakdown + year-over-year */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <Card title="Reviews by product" icon="📦">
            <div className="space-y-2.5">
              {productBreakdown.map((p) => (
                <HorizontalBar
                  key={p.product}
                  label={p.product}
                  value={p.count}
                  percentage={p.percentage}
                  valueLabel={`${formatNumber(p.count)} · ${p.percentage}%`}
                  active={productFilter === p.product}
                  onClick={() =>
                    setProductFilter(productFilter === p.product ? 'all' : (p.product as ProductFilter))
                  }
                  color="blue"
                />
              ))}
            </div>
          </Card>

          <Card title="Per-product satisfaction" icon="⭐">
            <div className="space-y-3">
              {productBreakdown.map((p) => (
                <div
                  key={p.product}
                  className={`rounded-lg border p-3 transition-colors ${
                    productFilter === p.product ? 'border-blue-300 bg-blue-50/50' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-baseline justify-between mb-1.5">
                    <div className="text-sm font-semibold text-slate-800">{p.product}</div>
                    <div className="text-xs text-slate-500">{formatNumber(p.count)} reviews</div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="text-base font-bold text-amber-600">{p.avgRating.toFixed(2)}★</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">Avg</div>
                    </div>
                    <div>
                      <div className="text-base font-bold text-emerald-700">{Math.round(p.fiveStarPct)}%</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">5★</div>
                    </div>
                    <div>
                      <div className="text-base font-bold text-rose-700">{Math.round(p.oneStarPct)}%</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">1★</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Themes row: pains / benefits / transformations side-by-side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <Card title="Top pains" icon="😣" subtitle={topPains.length > 0 ? `${topPains.length} themes` : 'none in scope'}>
            {topPains.length === 0 ? (
              <EmptyHint>No pain themes detected for this filter.</EmptyHint>
            ) : (
              <div className="space-y-1.5">
                {topPains.map((t) => (
                  <HorizontalBar
                    key={t.theme}
                    label={t.theme}
                    value={t.count}
                    percentage={Math.min(100, (t.count / topPains[0].count) * 100)}
                    valueLabel={`${formatNumber(t.count)} · ${t.percentage}%`}
                    color="rose"
                  />
                ))}
              </div>
            )}
          </Card>

          <Card title="Top benefits" icon="✨" subtitle={topBenefits.length > 0 ? `${topBenefits.length} themes` : 'none in scope'}>
            {topBenefits.length === 0 ? (
              <EmptyHint>No benefit themes detected for this filter.</EmptyHint>
            ) : (
              <div className="space-y-1.5">
                {topBenefits.map((t) => (
                  <HorizontalBar
                    key={t.theme}
                    label={t.theme}
                    value={t.count}
                    percentage={Math.min(100, (t.count / topBenefits[0].count) * 100)}
                    valueLabel={`${formatNumber(t.count)} · ${t.percentage}%`}
                    color="emerald"
                  />
                ))}
              </div>
            )}
          </Card>

          <Card title="Top transformations" icon="🔁" subtitle={topTransformations.length > 0 ? `${topTransformations.length} themes` : 'none in scope'}>
            {topTransformations.length === 0 ? (
              <EmptyHint>No transformation themes detected for this filter.</EmptyHint>
            ) : (
              <div className="space-y-1.5">
                {topTransformations.map((t) => (
                  <HorizontalBar
                    key={t.theme}
                    label={t.theme}
                    value={t.count}
                    percentage={Math.min(100, (t.count / topTransformations[0].count) * 100)}
                    valueLabel={`${formatNumber(t.count)} · ${t.percentage}%`}
                    color="blue"
                  />
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Year-over-year — small line of indicators per year if available */}
        {analysis.yearlyTrends && analysis.yearlyTrends.overall.length > 0 && (
          <Card title="Year-over-year" icon="📈" subtitle="Volume and avg rating per year (all products)">
            <div className="overflow-x-auto pb-2">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-slate-500">
                    <th className="text-left py-2 pr-3">Year</th>
                    <th className="text-right py-2 px-3">Reviews</th>
                    <th className="text-right py-2 px-3">Avg rating</th>
                    <th className="text-right py-2 px-3">5★ rate</th>
                    <th className="text-left py-2 pl-3 w-1/3">Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const max = Math.max(...analysis.yearlyTrends!.overall.map((y) => y.totalReviews), 1);
                    return analysis.yearlyTrends!.overall.map((y) => (
                      <tr key={y.year} className="border-t border-slate-100">
                        <td className="py-2 pr-3 font-semibold text-slate-700">{y.year}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{formatNumber(y.totalReviews)}</td>
                        <td className="py-2 px-3 text-right tabular-nums text-amber-600">{y.avgRating.toFixed(2)}★</td>
                        <td className="py-2 px-3 text-right tabular-nums text-emerald-700">{Math.round(y.fiveStarPct)}%</td>
                        <td className="py-2 pl-3">
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${(y.totalReviews / max) * 100}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Segments — grid of cards, click to expand */}
        {segmentsInScope.length > 0 && (
          <div className="mt-6">
            <div className="flex items-baseline justify-between mb-3">
              <div>
                <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                  <span>🧩</span>
                  Discovered segments
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  How the tool clusters reviewers. {segmentsInScope.length} segments, each with their own pain/benefit/transformation profile.
                </p>
              </div>
              <div className="text-xs text-slate-400">Click a card to expand</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {segmentsInScope.map((seg) => (
                <SegmentCard
                  key={seg.segmentName}
                  segment={seg}
                  productFilter={productFilter}
                  expanded={expandedSegment === seg.segmentName}
                  onToggle={() =>
                    setExpandedSegment(expandedSegment === seg.segmentName ? null : seg.segmentName)
                  }
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Subcomponents ─────────────────────────────────────────────────────

function KpiTile({
  label,
  value,
  suffix,
  tone,
}: {
  label: string;
  value: string;
  suffix?: string;
  tone: 'neutral' | 'emerald' | 'rose' | 'amber';
}) {
  const valueColor = {
    neutral: 'text-slate-800',
    emerald: 'text-emerald-700',
    rose: 'text-rose-700',
    amber: 'text-amber-600',
  }[tone];
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3.5 py-3">
      <div className={`text-xl font-bold ${valueColor} tabular-nums`}>
        {value}
        {suffix && <span className="text-base ml-0.5">{suffix}</span>}
      </div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mt-0.5">
        {label}
      </div>
    </div>
  );
}

function FilterPill({
  label,
  active,
  onClick,
  count,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
        active
          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
      }`}
    >
      <span>{label}</span>
      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
        active ? 'bg-blue-700/40 text-white' : 'bg-slate-100 text-slate-600'
      }`}>
        {formatNumber(count)}
      </span>
    </button>
  );
}

function Card({
  title,
  icon,
  subtitle,
  children,
}: {
  title: string;
  icon: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <span className="text-base">{icon}</span>
          {title}
        </h3>
        {subtitle && <span className="text-[11px] text-slate-400">{subtitle}</span>}
      </div>
      {children}
    </div>
  );
}

function HorizontalBar({
  label,
  percentage,
  valueLabel,
  color,
  active,
  onClick,
}: {
  label: string;
  value: number;
  percentage: number;
  valueLabel: string;
  color: 'blue' | 'rose' | 'emerald';
  active?: boolean;
  onClick?: () => void;
}) {
  const barColor = {
    blue: 'bg-blue-500',
    rose: 'bg-rose-400',
    emerald: 'bg-emerald-500',
  }[color];
  const trackColor = active ? 'bg-blue-50' : 'bg-slate-100';
  const Wrapper: React.ElementType = onClick ? 'button' : 'div';
  return (
    <Wrapper
      onClick={onClick}
      className={`w-full ${onClick ? 'text-left cursor-pointer hover:bg-slate-50 rounded-md -mx-1 px-1 py-0.5 transition-colors' : ''}`}
    >
      <div className="flex items-baseline justify-between text-xs mb-0.5">
        <span className={`truncate font-medium ${active ? 'text-blue-700' : 'text-slate-700'}`}>{label}</span>
        <span className={`shrink-0 ml-2 tabular-nums text-[11px] ${active ? 'text-blue-600' : 'text-slate-500'}`}>{valueLabel}</span>
      </div>
      <div className={`h-2 ${trackColor} rounded-full overflow-hidden`}>
        <div
          className={`h-full ${barColor} rounded-full transition-all`}
          style={{ width: `${Math.max(2, percentage)}%` }}
        />
      </div>
    </Wrapper>
  );
}

function SegmentCard({
  segment,
  productFilter,
  expanded,
  onToggle,
}: {
  segment: SegmentProfile;
  productFilter: ProductFilter;
  expanded: boolean;
  onToggle: () => void;
}) {
  const sizeForFilter = productFilter === 'all'
    ? { count: segment.totalReviews, percentage: segment.percentage }
    : (segment.byProduct[productFilter] ?? { count: 0, percentage: 0 });

  const topBenefit = segment.topBenefits[0];
  const topPain = segment.topPains[0];

  return (
    <div className={`rounded-xl border transition-all ${expanded ? 'border-blue-300 shadow-sm' : 'border-slate-200'} bg-white`}>
      <button
        onClick={onToggle}
        className="w-full text-left p-3.5 flex items-start justify-between gap-3"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2 mb-1">
            <span className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
              segment.layer === 'identity' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {segment.layer}
            </span>
            <span className="text-[10px] text-slate-400 tabular-nums">
              {formatNumber(sizeForFilter.count)} reviews · {sizeForFilter.percentage.toFixed(1)}%
            </span>
          </div>
          <div className="text-sm font-semibold text-slate-800 leading-tight truncate" title={segment.segmentName}>
            {segment.segmentName}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <div className="text-emerald-700 truncate" title={topBenefit?.name}>
                <span className="opacity-60">+</span> {topBenefit?.name ?? '—'}
              </div>
            </div>
            <div>
              <div className="text-rose-700 truncate" title={topPain?.name}>
                <span className="opacity-60">−</span> {topPain?.name ?? '—'}
              </div>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-3 text-[10px] text-slate-500">
            <span>★ {segment.averageRating.toFixed(2)}</span>
            <span className="text-emerald-700">5★ {Math.round(segment.fiveStarPercent)}%</span>
          </div>
        </div>
        <span className={`text-slate-400 mt-1 transition-transform ${expanded ? 'rotate-90' : ''}`}>
          ▶
        </span>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 p-3.5 space-y-3">
          <SegmentThemeList title="Benefits" items={segment.topBenefits} color="emerald" />
          <SegmentThemeList title="Pains" items={segment.topPains} color="rose" />
          <SegmentThemeList title="Transformations" items={segment.topTransformations} color="blue" />
          {segment.representativeQuotes.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Representative quotes
              </div>
              <div className="space-y-1.5">
                {segment.representativeQuotes.slice(0, 3).map((q, i) => (
                  <div key={i} className="text-[11px] text-slate-600 italic border-l-2 border-slate-200 pl-2 leading-snug">
                    "{q.slice(0, 220)}{q.length > 220 ? '…' : ''}"
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SegmentThemeList({
  title,
  items,
  color,
}: {
  title: string;
  items: Array<{ name: string; count: number; percentage: number }>;
  color: 'rose' | 'emerald' | 'blue';
}) {
  if (items.length === 0) return null;
  const top5 = items.slice(0, 5);
  const max = top5[0].count;
  const barColor = { rose: 'bg-rose-400', emerald: 'bg-emerald-500', blue: 'bg-blue-500' }[color];
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">{title}</div>
      <div className="space-y-1">
        {top5.map((it) => (
          <div key={it.name}>
            <div className="flex items-baseline justify-between text-[11px]">
              <span className="text-slate-700 truncate">{it.name}</span>
              <span className="text-slate-400 tabular-nums shrink-0 ml-2">{it.percentage.toFixed(0)}%</span>
            </div>
            <div className="h-1 bg-slate-100 rounded-full overflow-hidden mt-0.5">
              <div className={`h-full ${barColor} rounded-full`} style={{ width: `${Math.max(2, (it.count / max) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return <div className="text-xs text-slate-400 italic py-4 text-center">{children}</div>;
}
