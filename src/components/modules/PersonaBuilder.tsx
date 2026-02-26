import { useState, useMemo } from 'react';
import type { FullAnalysis, ProductCategory, PersonaChannel, MarketRegion, ProductAffinityEntry } from '../../engine/types';
import { useClaudeApi } from '../../hooks/useClaudeApi';
import { buildPersonaPrompt } from '../../prompts/personaPrompt';
import { buildResourceContext } from '../../prompts/systemBase';
import PersonaResultsView from '../PersonaResultsView';
import { IDENTITY_SEGMENTS, MOTIVATION_SEGMENTS, DISPLAY_NAME_MAP } from '../../utils/segmentNames';
import { getEnrichedSegment, hasSalesEnrichment, salesEnrichment } from '../../data/salesEnrichmentLoader';
import CrossPurchasePanel from '../persona/CrossPurchasePanel';

type SortOption = 'reviews' | 'revenue' | 'ltv' | 'repeat';

const SORT_OPTIONS: { key: SortOption; label: string }[] = [
  { key: 'reviews', label: 'Reviews' },
  { key: 'revenue', label: 'Revenue' },
  { key: 'ltv', label: 'LTV' },
  { key: 'repeat', label: 'Repeat Rate' },
];

interface Props {
  analysis: FullAnalysis;
  apiKey: string;
  resourceContext: string;
  onBack: () => void;
}

const PRODUCTS: ProductCategory[] = ['EasyStretch', 'Compression', 'Ankle Compression'];
const CHANNELS: { value: PersonaChannel; label: string; description: string }[] = [
  {
    value: 'DTC',
    label: 'DTC (Direct-to-Consumer)',
    description: 'Personas for the end buyer. Pain stories, emotional hooks, ad creative direction, awareness-level targeting.',
  },
  {
    value: 'Retail',
    label: 'Retail',
    description: 'Consumer personas reframed as sell-through proof for retail buyers. Category gaps, demand metrics, planogram positioning.',
  },
  {
    value: 'Wholesale',
    label: 'Wholesale / B2B',
    description: 'Consumer data translated into institutional outcomes. Staff time savings, compliance rates, ROI narratives, procurement psychology.',
  },
];

/* Segment name constants and DISPLAY_NAME_MAP imported from '../../utils/segmentNames' */

/**
 * Derive available persona segments from the analysis data.
 *
 * Uses TWO data sources and merges them:
 * 1. segmentBreakdown (from segmentEngine) — has richer SegmentProfile data with
 *    per-product breakdowns, ratings, quotes, layer info. Keys are already
 *    title-cased with spaces (e.g., "Healthcare Worker").
 * 2. per-product pa.segments (from analyzeReviews) — CategoryAnalysis with
 *    snake_case keys (e.g., "healthcare_worker"). Used as fallback.
 *
 * For the PersonaBuilder, we want per-product counts when a product is selected,
 * so we extract the product-specific slice from segmentBreakdown.byProduct.
 */
function sortPersonas(
  personas: { name: string; count: number; percentage: number }[],
  sortBy: SortOption,
): void {
  if (sortBy === 'reviews') {
    personas.sort((a, b) => b.count - a.count);
    return;
  }
  personas.sort((a, b) => {
    const aSales = getEnrichedSegment(a.name)?.sales;
    const bSales = getEnrichedSegment(b.name)?.sales;
    const aVal = sortBy === 'revenue' ? (aSales?.totalRevenue ?? 0)
      : sortBy === 'ltv' ? (aSales?.avgLifetimeValue ?? 0)
      : (aSales?.repeatPurchaseRate ?? 0);
    const bVal = sortBy === 'revenue' ? (bSales?.totalRevenue ?? 0)
      : sortBy === 'ltv' ? (bSales?.avgLifetimeValue ?? 0)
      : (bSales?.repeatPurchaseRate ?? 0);
    return bVal - aVal || b.count - a.count;
  });
}

function derivePersonas(analysis: FullAnalysis, product: ProductCategory, sortBy: SortOption) {
  const identityPersonas: { name: string; count: number; percentage: number }[] = [];
  const motivationPersonas: { name: string; count: number; percentage: number }[] = [];

  // --- Strategy 1: Use segmentBreakdown (preferred — richer data, per-product stats) ---
  if (analysis.segmentBreakdown && analysis.segmentBreakdown.segments.length > 0) {
    const pa = analysis.products[product];
    const productTotal = pa?.totalReviews ?? 0;

    for (const seg of analysis.segmentBreakdown.segments) {
      // Get count for this specific product from the per-product breakdown
      const productData = seg.byProduct[product];
      const count = productData?.count ?? 0;
      if (count === 0) continue;

      // Recalculate percentage relative to THIS product's total
      const percentage = productTotal > 0
        ? Math.round((count / productTotal) * 1000) / 10
        : seg.percentage;

      // Map the segment name to its canonical display name (title case)
      const displayName = DISPLAY_NAME_MAP.get(seg.segmentName.toLowerCase())
        ?? DISPLAY_NAME_MAP.get(seg.segmentName.toLowerCase().replace(/[/& ]+/g, '_'))
        ?? seg.segmentName; // Fallback to raw name if no mapping found

      const entry = { name: displayName, count, percentage };

      if (seg.layer === 'identity') {
        identityPersonas.push(entry);
      } else {
        motivationPersonas.push(entry);
      }
    }

    sortPersonas(identityPersonas, sortBy);
    sortPersonas(motivationPersonas, sortBy);
    return { identityPersonas, motivationPersonas };
  }

  // --- Strategy 2: Fallback to per-product pa.segments (CategoryAnalysis) ---
  const pa = analysis.products[product];
  if (!pa) return { identityPersonas, motivationPersonas };

  // Build a case-insensitive lookup: normalize both the stored key and the target name
  const segmentMap = new Map<string, { count: number; percentage: number }>();
  for (const [key, data] of Object.entries(pa.segments)) {
    // Normalize: "healthcare_worker" → "healthcare worker" (lowercase)
    segmentMap.set(key.replace(/_/g, ' ').toLowerCase(), data);
  }

  for (const name of IDENTITY_SEGMENTS) {
    const data = segmentMap.get(name.toLowerCase());
    if (data && data.count > 0) {
      identityPersonas.push({ name, count: data.count, percentage: data.percentage });
    }
  }

  for (const name of MOTIVATION_SEGMENTS) {
    const data = segmentMap.get(name.toLowerCase());
    if (data && data.count > 0) {
      motivationPersonas.push({ name, count: data.count, percentage: data.percentage });
    }
  }

  sortPersonas(identityPersonas, sortBy);
  sortPersonas(motivationPersonas, sortBy);
  return { identityPersonas, motivationPersonas };
}

/** Badge color based on frequency */
function frequencyColor(pct: number): string {
  if (pct >= 5) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (pct >= 2) return 'bg-blue-100 text-blue-700 border-blue-200';
  return 'bg-slate-100 text-slate-600 border-slate-200';
}

function frequencyLabel(pct: number): string {
  if (pct >= 5) return 'Core';
  if (pct >= 2) return 'Strong';
  return 'Niche';
}

/** Get concentration index for a segment in a specific product */
function getConcentrationIndex(
  analysis: FullAnalysis,
  product: ProductCategory,
  segmentName: string,
): ProductAffinityEntry | undefined {
  const affinity = analysis.segmentBreakdown?.productAffinity?.[product];
  if (!affinity) return undefined;
  return affinity.find((a) =>
    a.segmentName.toLowerCase() === segmentName.toLowerCase()
    || DISPLAY_NAME_MAP.get(a.segmentName.toLowerCase()) === segmentName
  );
}

/** Concentration index badge (fallback when no sales affinity data) */
function ciLabel(ci: number): { text: string; color: string } {
  if (ci >= 1.3) return { text: `${ci}x \u2191`, color: 'text-emerald-600' };
  if (ci >= 1.1) return { text: `${ci}x`, color: 'text-emerald-500' };
  if (ci <= 0.7) return { text: `${ci}x \u2193`, color: 'text-amber-500' };
  if (ci <= 0.9) return { text: `${ci}x`, color: 'text-slate-400' };
  return { text: `${ci}x`, color: 'text-slate-400' };
}

/** Get sales-enriched product affinity for a segment (has revenue + revenueShare) */
function getSalesAffinity(product: ProductCategory, segmentName: string) {
  if (!hasSalesEnrichment()) return undefined;
  const entries = salesEnrichment.productAffinity[product];
  if (!entries) return undefined;
  return entries.find((e) =>
    e.segmentName.toLowerCase() === segmentName.toLowerCase()
    || DISPLAY_NAME_MAP.get(e.segmentName.toLowerCase()) === segmentName
  );
}

/** Format revenue as $1.6M or $352K */
function fmtRev(v: number): string {
  return v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${(v / 1_000).toFixed(0)}K`;
}

export default function PersonaBuilder({ analysis, apiKey, resourceContext, onBack }: Props) {
  const [product, setProduct] = useState<ProductCategory>('EasyStretch');
  const [channel, setChannel] = useState<PersonaChannel>('DTC');
  const [selectedPersonas, setSelectedPersonas] = useState<Set<string>>(new Set());
  const [includeMarket, setIncludeMarket] = useState(false);
  const [markets, setMarkets] = useState<Set<MarketRegion>>(new Set(['US', 'CA']));
  const [sortBy, setSortBy] = useState<SortOption>('reviews');
  const { result, loading, error, generate, reset } = useClaudeApi(apiKey);

  const { identityPersonas, motivationPersonas } = useMemo(
    () => derivePersonas(analysis, product, sortBy),
    [analysis, product, sortBy],
  );

  const allPersonas = useMemo(
    () => [...identityPersonas, ...motivationPersonas],
    [identityPersonas, motivationPersonas],
  );

  // Top cross-segment overlaps for current product
  const topOverlaps = useMemo(() => {
    const overlaps = analysis.segmentBreakdown?.crossSegmentOverlap;
    if (!overlaps) return [];
    // Filter to overlaps that appear in the selected product
    return overlaps
      .filter((ov) => ov.byProduct[product] && ov.byProduct[product].count > 0)
      .slice(0, 5);
  }, [analysis, product]);

  const togglePersona = (name: string) => {
    setSelectedPersonas((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedPersonas.size === allPersonas.length) {
      setSelectedPersonas(new Set());
    } else {
      setSelectedPersonas(new Set(allPersonas.map((p) => p.name)));
    }
  };

  const toggleMarket = (m: MarketRegion) => {
    setMarkets((prev) => {
      const next = new Set(prev);
      if (next.has(m)) {
        // Don't allow deselecting both
        if (next.size > 1) next.delete(m);
      } else {
        next.add(m);
      }
      return next;
    });
  };

  const handleGenerate = () => {
    const selected = Array.from(selectedPersonas);
    if (selected.length === 0) return;

    const { system, user } = buildPersonaPrompt(
      {
        product,
        channel,
        selectedPersonas: selected,
        includeMarketAnalysis: includeMarket,
        markets: Array.from(markets),
      },
      analysis,
    );
    // Scale tokens: ~2500 per persona for DTC (9 sections), ~2000 for retail/wholesale (8 sections)
    // Market analysis adds ~2500 tokens per persona (depth + US/CA comparison + citations + cross-segment)
    // Claude Sonnet 4 supports up to 64K output tokens — cap at 32K for reasonable generation time
    const baseTokens = channel === 'DTC' ? 2500 : 2000;
    const marketTokens = includeMarket ? 2500 : 0;
    const maxTokens = Math.min(selected.length * (baseTokens + marketTokens), 32000);
    generate(system + buildResourceContext(resourceContext), user, Math.max(maxTokens, 6000), 'claude-opus-4-6');
  };

  if (result || loading || error) {
    return (
      <PersonaResultsView
        content={result ?? ''}
        title="Customer Personas"
        analysis={analysis}
        product={product}
        channel={channel}
        selectedPersonas={Array.from(selectedPersonas)}
        includeMarket={includeMarket}
        markets={Array.from(markets)}
        apiKey={apiKey}
        onBack={() => { reset(); onBack(); }}
        onBackToBuilder={reset}
        onRegenerate={handleGenerate}
        loading={loading}
        error={error}
      />
    );
  }

  const channelInfo = CHANNELS.find((c) => c.value === channel)!;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-3xl mx-auto">
        <button onClick={onBack} className="text-sm text-slate-500 hover:text-slate-700 mb-6 flex items-center gap-1">
          {'\u2190'} Back to Dashboard
        </button>

        {/* ── Header Card ── */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-6">
          <h2 className="text-xl font-bold text-slate-800 mb-1">Customer Persona Builder</h2>
          <p className="text-slate-500 text-sm">
            Build data-driven personas from your review segments. Select the personas to generate and the channel context.
          </p>

          {/* Sales data enrichment banner */}
          {hasSalesEnrichment() && (
            <div className="mt-4 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg p-4 border border-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-emerald-800">Sales Intelligence Active</span>
                <span className="text-[10px] font-medium bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                  {salesEnrichment.meta.linkRate}% linked
                </span>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-600">
                <span><strong className="text-emerald-700">${(salesEnrichment.meta.totalRevenue / 1000000).toFixed(1)}M</strong> total revenue</span>
                <span><strong className="text-blue-700">{salesEnrichment.meta.totalCustomersInOrders.toLocaleString()}</strong> customers</span>
                <span><strong className="text-violet-700">{salesEnrichment.meta.totalOrderLines.toLocaleString()}</strong> order lines</span>
                <span><strong className="text-slate-700">{salesEnrichment.meta.reviewersLinkedToOrders.toLocaleString()}</strong> reviewers matched</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1.5">
                Revenue, LTV, repeat rates, and cross-purchase data are linked to each segment below and fed into persona generation.
              </p>
            </div>
          )}
        </div>

        {/* ── Product & Channel Selection ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Product */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <label className="block text-sm font-semibold text-slate-700 mb-3">Product Line</label>
            <select
              value={product}
              onChange={(e) => { setProduct(e.target.value as ProductCategory); setSelectedPersonas(new Set()); setSortBy('reviews'); }}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              {PRODUCTS.map((p) => (
                <option key={p} value={p} disabled={!analysis.products[p]}>
                  {p} ({analysis.breakdown[p]?.toLocaleString() ?? 0} reviews)
                </option>
              ))}
            </select>
          </div>

          {/* Channel */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <label className="block text-sm font-semibold text-slate-700 mb-3">Channel</label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as PersonaChannel)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              {CHANNELS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">{channelInfo.description}</p>
          </div>
        </div>

        {/* ── Persona Selection Grid ── */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">
                Available Personas from Your Data
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {allPersonas.length} persona segments found · {selectedPersonas.size} selected
              </p>
            </div>
            <button
              onClick={selectAll}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium px-3 py-1.5 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
            >
              {selectedPersonas.size === allPersonas.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          {/* Sort Toggle */}
          {hasSalesEnrichment() && allPersonas.length > 0 && (
            <div className="flex items-center gap-1.5 mb-4">
              <span className="text-[10px] text-slate-400 mr-1">Sort by:</span>
              {SORT_OPTIONS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setSortBy(key)}
                  className={`text-[10px] font-medium px-2.5 py-1 rounded-full border transition-colors ${
                    sortBy === key
                      ? 'bg-blue-100 text-blue-700 border-blue-200'
                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Identity Segments */}
          {identityPersonas.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Who They Are</span>
                <span className="text-xs text-slate-300">Identity Segments</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {identityPersonas.map((p) => {
                  const isSelected = selectedPersonas.has(p.name);
                  const affinityData = getConcentrationIndex(analysis, product, p.name);
                  const ci = affinityData?.concentrationIndex;
                  const salesAff = getSalesAffinity(product, p.name);
                  const enriched = getEnrichedSegment(p.name);
                  const sales = enriched?.sales;
                  return (
                    <button
                      key={p.name}
                      onClick={() => togglePersona(p.name)}
                      className={`flex flex-col p-3.5 rounded-lg border-2 transition-all text-left ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/60 shadow-sm'
                          : 'border-slate-100 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                            isSelected ? 'border-blue-500 bg-blue-500' : 'border-slate-300'
                          }`}>
                            {isSelected && <span className="text-white text-xs font-bold">{'\u2713'}</span>}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-sm text-slate-800 truncate">{p.name}</div>
                            <div className="text-xs text-slate-400">
                              {p.count.toLocaleString()} reviews
                              {salesAff ? (
                                <span className="ml-1.5" title={`CI: ${ci?.toFixed(2) ?? '\u2014'}x | ${salesAff.revenueShare}% of ${product} revenue`}>
                                  <span className="font-medium text-emerald-600">{fmtRev(salesAff.revenue)}</span>
                                  <span className="text-slate-400 font-normal"> · {salesAff.revenueShare}%</span>
                                </span>
                              ) : ci != null ? (
                                <span className={`ml-1.5 font-medium ${ciLabel(ci).color}`} title="Concentration Index">{ciLabel(ci).text}</span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${frequencyColor(p.percentage)}`}>
                          {p.percentage}% · {frequencyLabel(p.percentage)}
                        </span>
                      </div>
                      {sales && (
                        <div className="flex items-center gap-2 mt-2 ml-8 flex-wrap">
                          <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded" title="Total revenue from linked reviewer-customers">
                            ${sales.totalRevenue >= 1000000 ? `${(sales.totalRevenue / 1000000).toFixed(1)}M` : `${(sales.totalRevenue / 1000).toFixed(0)}K`}
                          </span>
                          <span className="text-[10px] font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded" title="Average lifetime value per customer">
                            ${sales.avgLifetimeValue} LTV
                          </span>
                          <span className="text-[10px] font-medium text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded" title="Percentage of customers who ordered more than once">
                            {sales.repeatPurchaseRate}% repeat
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Motivation Segments */}
          {motivationPersonas.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Why They Buy</span>
                <span className="text-xs text-slate-300">Motivation Segments</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {motivationPersonas.map((p) => {
                  const isSelected = selectedPersonas.has(p.name);
                  const affinityData = getConcentrationIndex(analysis, product, p.name);
                  const ci = affinityData?.concentrationIndex;
                  const salesAff = getSalesAffinity(product, p.name);
                  const enriched = getEnrichedSegment(p.name);
                  const sales = enriched?.sales;
                  return (
                    <button
                      key={p.name}
                      onClick={() => togglePersona(p.name)}
                      className={`flex flex-col p-3.5 rounded-lg border-2 transition-all text-left ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50/60 shadow-sm'
                          : 'border-slate-100 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                            isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300'
                          }`}>
                            {isSelected && <span className="text-white text-xs font-bold">{'\u2713'}</span>}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-sm text-slate-800 truncate">{p.name}</div>
                            <div className="text-xs text-slate-400">
                              {p.count.toLocaleString()} reviews
                              {salesAff ? (
                                <span className="ml-1.5" title={`CI: ${ci?.toFixed(2) ?? '\u2014'}x | ${salesAff.revenueShare}% of ${product} revenue`}>
                                  <span className="font-medium text-emerald-600">{fmtRev(salesAff.revenue)}</span>
                                  <span className="text-slate-400 font-normal"> · {salesAff.revenueShare}%</span>
                                </span>
                              ) : ci != null ? (
                                <span className={`ml-1.5 font-medium ${ciLabel(ci).color}`} title="Concentration Index">{ciLabel(ci).text}</span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${frequencyColor(p.percentage)}`}>
                          {p.percentage}% · {frequencyLabel(p.percentage)}
                        </span>
                      </div>
                      {sales && (
                        <div className="flex items-center gap-2 mt-2 ml-8 flex-wrap">
                          <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded" title="Total revenue from linked reviewer-customers">
                            ${sales.totalRevenue >= 1000000 ? `${(sales.totalRevenue / 1000000).toFixed(1)}M` : `${(sales.totalRevenue / 1000).toFixed(0)}K`}
                          </span>
                          <span className="text-[10px] font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded" title="Average lifetime value per customer">
                            ${sales.avgLifetimeValue} LTV
                          </span>
                          <span className="text-[10px] font-medium text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded" title="Percentage of customers who ordered more than once">
                            {sales.repeatPurchaseRate}% repeat
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {allPersonas.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <p className="text-sm">No segment data available for this product.</p>
              <p className="text-xs mt-1">Upload reviews and run analysis to see available personas.</p>
            </div>
          )}

          {/* Affinity Legend */}
          {allPersonas.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <p className="text-[10px] text-slate-400 leading-relaxed">
                {hasSalesEnrichment() ? (
                  <>
                    <span className="font-semibold text-emerald-600">$Revenue</span> = total revenue from linked reviewer-customers in this segment for {product}.{' '}
                    <span className="font-semibold text-slate-500">%</span> = share of {product} revenue this segment represents.{' '}
                    Hover for concentration index.
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-emerald-600">{'\u2191'} Over-indexed</span> = this segment is more concentrated in {product} than across all products.{' '}
                    <span className="font-semibold text-amber-500">{'\u2193'} Under-indexed</span> = less concentrated.{' '}
                    <span className="font-semibold">1.0x</span> = balanced.
                  </>
                )}
              </p>
            </div>
          )}
        </div>

        {/* ── Cross-Purchase Breakdown ── */}
        {hasSalesEnrichment() && selectedPersonas.size > 0 && (
          <CrossPurchasePanel
            selectedSegments={[...selectedPersonas]}
            product={product}
          />
        )}

        {/* ── Segment Cross-Over Insights ── */}
        {topOverlaps.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-1">
              Top Persona Intersections for {product}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Which identity {'\u00D7'} motivation pairs co-occur most — these are your highest-value targeting combinations.
            </p>
            <div className="space-y-2">
              {topOverlaps.map((ov, i) => {
                const identityDisplay = DISPLAY_NAME_MAP.get(ov.identity.toLowerCase()) ?? ov.identity;
                const motivationDisplay = DISPLAY_NAME_MAP.get(ov.motivation.toLowerCase()) ?? ov.motivation;
                const productCount = ov.byProduct[product]?.count ?? 0;
                // Look up enriched overlap sales data
                const enrichedOv = hasSalesEnrichment()
                  ? salesEnrichment.crossSegmentOverlaps.find(
                      e => e.identity === ov.identity && e.motivation === ov.motivation
                    )
                  : undefined;
                return (
                  <div key={i} className="py-2 px-3 rounded-lg bg-slate-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full shrink-0">{identityDisplay}</span>
                        <span className="text-slate-300 text-xs">{'\u00D7'}</span>
                        <span className="text-xs font-medium text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full shrink-0">{motivationDisplay}</span>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <span className="text-xs font-semibold text-slate-700">{productCount.toLocaleString()}</span>
                        <span className="text-[10px] text-slate-400 ml-1">reviews</span>
                        <span className="text-[10px] text-slate-400 ml-2">{ov.percentOfIdentity}% of {identityDisplay}</span>
                        <span className="text-[10px] text-slate-400 ml-2">{ov.avgRating}/5 {'\u2605'}</span>
                      </div>
                    </div>
                    {enrichedOv?.sales && enrichedOv.sales.totalRevenue > 0 && (
                      <div className="flex items-center gap-3 mt-1.5 ml-0">
                        <span className="text-[10px] font-medium text-emerald-600">
                          ${enrichedOv.sales.totalRevenue >= 1000000 ? `${(enrichedOv.sales.totalRevenue / 1000000).toFixed(1)}M` : `${(enrichedOv.sales.totalRevenue / 1000).toFixed(0)}K`} revenue
                        </span>
                        <span className="text-[10px] text-slate-400">|</span>
                        <span className="text-[10px] font-medium text-blue-600">
                          ${enrichedOv.sales.avgLifetimeValue} LTV
                        </span>
                        <span className="text-[10px] text-slate-400">|</span>
                        <span className="text-[10px] font-medium text-violet-600">
                          {enrichedOv.sales.repeatPurchaseRate}% repeat
                        </span>
                        <span className="text-[10px] text-slate-400">|</span>
                        <span className="text-[10px] font-medium text-amber-600">
                          {enrichedOv.sales.crossPurchaseRate}% cross-purchase
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400 mt-3">
              Review counts, percentages, and sales data (revenue, LTV, repeat & cross-purchase rates) are fed into persona generation.
            </p>
          </div>
        )}

        {/* ── Market Analysis Section ── */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIncludeMarket(!includeMarket)}
                  className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                    includeMarket ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                    includeMarket ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">
                    Market Positioning & Opportunity Analysis
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Viasox vs. market segment comparison, TAM analysis, growth signals, {channel === 'Retail' ? 'retailer fit scoring, and strategic shelf positioning' : channel === 'Wholesale' ? 'institutional channel opportunity, and procurement pathway insights' : 'DTC channel strategy, and look-alike audience recommendations'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {includeMarket && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <label className="block text-xs font-medium text-slate-600 mb-2.5">Markets to Analyze</label>
              <div className="flex gap-3">
                {([['US', 'United States'], ['CA', 'Canada']] as const).map(([code, label]) => {
                  const active = markets.has(code);
                  return (
                    <button
                      key={code}
                      onClick={() => toggleMarket(code)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all text-sm font-medium ${
                        active
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-base">{code === 'US' ? '\uD83C\uDDFA\uD83C\uDDF8' : '\uD83C\uDDE8\uD83C\uDDE6'}</span>
                      {label}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 space-y-2">
                <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
                  {'\uD83D\uDCCA'} <strong>Included:</strong> Viasox segment weight vs. market benchmarks, opportunity index (over/under-indexed), growth alignment, emerging segment identification, competitive whitespace analysis
                </p>
                {channel === 'Retail' && (
                  <p className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
                    {'\uD83C\uDFAF'} Retail mode adds: retailer fit scoring (6 dimensions), strategic overlap analysis, planogram recommendations.
                    {markets.has('CA') ? ' Includes Shoppers Drug Mart flyer strategy analysis.' : ''}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Generate Button ── */}
        <button
          onClick={handleGenerate}
          disabled={selectedPersonas.size === 0}
          className={`w-full py-3.5 rounded-xl font-medium text-white transition-all shadow-sm ${
            selectedPersonas.size > 0
              ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
              : 'bg-slate-300 cursor-not-allowed'
          }`}
        >
          {selectedPersonas.size === 0
            ? 'Select personas to generate'
            : `Generate ${selectedPersonas.size} Persona${selectedPersonas.size > 1 ? 's' : ''} for ${channelInfo.label}${includeMarket ? ' + Market Analysis' : ''}`
          }
        </button>

        {selectedPersonas.size > 3 && (
          <p className="text-xs text-center text-amber-500 mt-2">
            Generating {selectedPersonas.size} personas at once — this may take a moment. Consider generating 1-3 at a time for the most detailed output.
          </p>
        )}
      </div>
    </div>
  );
}
