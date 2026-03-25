import { useState, useMemo } from 'react';
import type { FullAnalysis, ProductCategory } from '../../engine/types';
import {
  salesEnrichment,
  hasSalesEnrichment,
} from '../../data/salesEnrichmentLoader';
import type {
  ProductAffinityEntry,
} from '../../data/salesEnrichmentLoader';

interface Props {
  analysis: FullAnalysis;
  apiKey: string;
  resourceContext: string;
  onBack: () => void;
}

const PRODUCTS: ProductCategory[] = ['EasyStretch', 'Compression', 'Ankle Compression'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtRev(v: number): string {
  return v >= 1_000_000
    ? `$${(v / 1_000_000).toFixed(1)}M`
    : v >= 1_000
      ? `$${(v / 1_000).toFixed(0)}K`
      : `$${v.toFixed(0)}`;
}

function pctBar(pct: number, color: string) {
  return (
    <div className="flex-1 bg-slate-100 rounded-full h-5 relative overflow-hidden">
      <div
        className={`${color} h-full rounded-full`}
        style={{ width: `${Math.max(pct, 2)}%` }}
      />
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-slate-700">
        {pct.toFixed(1)}%
      </span>
    </div>
  );
}

// ─── Product Revenue Dashboard ───────────────────────────────────────────────

function ProductRevenueDashboard() {
  const se = salesEnrichment;
  if (!hasSalesEnrichment()) return null;

  // Aggregate revenue per product from segment byProduct data
  const productRevenue = useMemo(() => {
    const rev: Record<string, number> = {};
    for (const product of PRODUCTS) {
      const affinity = se.productAffinity[product];
      if (!affinity) continue;
      // Sum revenue from all segments for this product
      rev[product] = affinity.reduce((sum, entry) => sum + (entry.revenue || 0), 0);
    }
    return rev;
  }, []);

  const totalRev = Object.values(productRevenue).reduce((a, b) => a + b, 0);
  const maxRev = Math.max(...Object.values(productRevenue), 1);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 mb-5">
      <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-1">
        Revenue by Product Line
      </h3>
      <p className="text-xs text-slate-400 mb-4">
        Total tracked revenue: {fmtRev(se.meta.totalRevenue)} from {se.meta.totalCustomersInOrders.toLocaleString()} customers.
        Revenue is attributed via reviewer-to-order email matching ({se.meta.linkRate}% link rate).
      </p>

      <div className="space-y-3 mb-5">
        {PRODUCTS.map((product) => {
          const rev = productRevenue[product] ?? 0;
          const share = totalRev > 0 ? Math.round((rev / totalRev) * 1000) / 10 : 0;
          const ownership = se.crossPurchaseMatrix.productOwnership[product];

          return (
            <div key={product}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-slate-800">{product}</span>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>{share}% of revenue</span>
                  {ownership && (
                    <span>{ownership.customers.toLocaleString()} customers</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-slate-100 rounded-full h-7 relative overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all"
                    style={{ width: `${Math.max((rev / maxRev) * 100, 4)}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-700">
                    {fmtRev(rev)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cross-purchase summary */}
      <div className="border-t border-slate-100 pt-4">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Cross-Purchase Behavior
        </div>
        <div className="grid grid-cols-2 gap-2">
          {se.crossPurchaseMatrix.combos.map((combo) => (
            <div key={combo.combo} className="bg-slate-50 rounded-lg p-2.5">
              <div className="text-xs font-semibold text-slate-700">
                {combo.combo.replace(/\+/g, ' + ')}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-emerald-600 font-medium">
                  {combo.customers.toLocaleString()} ({combo.pctOfTotal}%)
                </span>
                <span className="text-[10px] text-slate-400">
                  avg {fmtRev(combo.avgCombinedSpend)} combined
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Segment Revenue Contribution per Product ────────────────────────────────

function SegmentRevenueByProduct() {
  const [selectedProduct, setSelectedProduct] = useState<ProductCategory>('EasyStretch');
  const se = salesEnrichment;
  if (!hasSalesEnrichment()) return null;

  const affinity: ProductAffinityEntry[] = se.productAffinity[selectedProduct] ?? [];
  // Split by layer
  const motivation = affinity.filter((a) => a.layer === 'motivation').slice(0, 8);
  const identity = affinity.filter((a) => a.layer === 'identity').slice(0, 8);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 mb-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
          Segment Revenue Contribution
        </h3>
        <select
          value={selectedProduct}
          onChange={(e) => setSelectedProduct(e.target.value as ProductCategory)}
          className="text-xs border border-slate-200 rounded px-2 py-1 text-slate-600"
        >
          {PRODUCTS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>
      <p className="text-xs text-slate-400 mb-4">
        Which segments contribute the most revenue to {selectedProduct}?
      </p>

      {motivation.length > 0 && (
        <div className="mb-4">
          <div className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider mb-2">
            By Motivation (Why They Buy)
          </div>
          <div className="space-y-1.5">
            {motivation.map((entry) => (
              <div key={entry.segmentName} className="flex items-center gap-2">
                <div className="w-36 text-xs text-slate-700 capitalize truncate shrink-0">
                  {entry.segmentName}
                </div>
                {pctBar(entry.revenueShare, 'bg-blue-400')}
                <div className="w-16 text-right text-[10px] text-emerald-600 font-medium shrink-0">
                  {fmtRev(entry.revenue)}
                </div>
                <div className={`w-10 text-right text-[10px] font-medium shrink-0 ${
                  entry.concentrationIndex >= 1.2 ? 'text-emerald-600' : entry.concentrationIndex <= 0.8 ? 'text-amber-500' : 'text-slate-400'
                }`}>
                  {entry.concentrationIndex.toFixed(1)}x
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {identity.length > 0 && (
        <div>
          <div className="text-[10px] font-semibold text-violet-600 uppercase tracking-wider mb-2">
            By Identity (Who They Are)
          </div>
          <div className="space-y-1.5">
            {identity.map((entry) => (
              <div key={entry.segmentName} className="flex items-center gap-2">
                <div className="w-36 text-xs text-slate-700 capitalize truncate shrink-0">
                  {entry.segmentName}
                </div>
                {pctBar(entry.revenueShare, 'bg-violet-400')}
                <div className="w-16 text-right text-[10px] text-emerald-600 font-medium shrink-0">
                  {fmtRev(entry.revenue)}
                </div>
                <div className={`w-10 text-right text-[10px] font-medium shrink-0 ${
                  entry.concentrationIndex >= 1.2 ? 'text-emerald-600' : entry.concentrationIndex <= 0.8 ? 'text-amber-500' : 'text-slate-400'
                }`}>
                  {entry.concentrationIndex.toFixed(1)}x
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-[10px] text-slate-400 mt-3">
        Revenue share = % of {selectedProduct}'s total revenue from this segment.
        Concentration index: {'>'}1.0 = over-indexed (this segment buys {selectedProduct} disproportionately).
      </p>
    </div>
  );
}

// ─── New vs Repeat Customer Breakdown ────────────────────────────────────────

function NewVsRepeatBreakdown() {
  const se = salesEnrichment;
  if (!hasSalesEnrichment()) return null;

  // Per-product new vs repeat from segment data
  const productStats = useMemo(() => {
    const stats: Array<{
      product: string;
      totalCustomers: number;
      repeatRate: number;
      repeatCustomers: number;
      newCustomers: number;
      avgLTV: number;
      avgOrderValue: number;
    }> = [];

    for (const product of PRODUCTS) {
      const affinity = se.productAffinity[product];
      if (!affinity) continue;
      const ownership = se.crossPurchaseMatrix.productOwnership[product];
      if (!ownership) continue;

      // Get the best segment-level stats for this product (weighted average)
      const totalReviewers = affinity.reduce((s, a) => s + a.reviewCount, 0);
      let weightedRepeat = 0;
      let weightedLTV = 0;
      let weightedAOV = 0;
      let totalWeight = 0;

      for (const entry of affinity) {
        const seg = se.segments[entry.segmentName.toLowerCase()];
        if (!seg?.sales) continue;
        const w = entry.reviewCount / Math.max(totalReviewers, 1);
        weightedRepeat += seg.sales.repeatPurchaseRate * w;
        weightedLTV += seg.sales.avgLifetimeValue * w;
        weightedAOV += seg.sales.avgOrderValue * w;
        totalWeight += w;
      }

      if (totalWeight === 0) continue;
      const avgRepeatRate = weightedRepeat / totalWeight;
      const avgLTV = weightedLTV / totalWeight;
      const avgAOV = weightedAOV / totalWeight;

      stats.push({
        product,
        totalCustomers: ownership.customers,
        repeatRate: Math.round(avgRepeatRate * 10) / 10,
        repeatCustomers: Math.round(ownership.customers * avgRepeatRate / 100),
        newCustomers: Math.round(ownership.customers * (1 - avgRepeatRate / 100)),
        avgLTV: Math.round(avgLTV),
        avgOrderValue: Math.round(avgAOV),
      });
    }

    return stats;
  }, []);

  // Per-segment new vs repeat (top segments by new customer attraction)
  const segmentAcquisition = useMemo(() => {
    const entries: Array<{
      name: string;
      layer: string;
      totalCustomers: number;
      repeatRate: number;
      newRate: number;
      newCustomers: number;
      ltv: number;
    }> = [];

    for (const [name, seg] of Object.entries(se.segments)) {
      if (!seg.sales || seg.sales.uniqueCustomers < 50) continue;
      const newRate = 100 - seg.sales.repeatPurchaseRate;
      entries.push({
        name,
        layer: seg.layer,
        totalCustomers: seg.sales.uniqueCustomers,
        repeatRate: seg.sales.repeatPurchaseRate,
        newRate,
        newCustomers: Math.round(seg.sales.uniqueCustomers * newRate / 100),
        ltv: seg.sales.avgLifetimeValue,
      });
    }

    return entries.sort((a, b) => b.newCustomers - a.newCustomers);
  }, []);

  if (productStats.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 mb-5">
      <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-1">
        New vs Repeat Customers
      </h3>
      <p className="text-xs text-slate-400 mb-4">
        Which products attract new buyers vs. retain existing ones? Higher new-customer % = stronger acquisition engine.
      </p>

      {/* Per-product breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        {productStats.map((ps) => {
          const newPct = 100 - ps.repeatRate;
          return (
            <div key={ps.product} className="border border-slate-200 rounded-lg p-4">
              <div className="text-sm font-semibold text-slate-800 mb-2">{ps.product}</div>
              {/* Stacked bar */}
              <div className="relative w-full h-8 rounded-lg overflow-hidden bg-slate-100 mb-2">
                <div
                  className="absolute inset-y-0 left-0 bg-blue-500"
                  style={{ width: `${newPct}%` }}
                />
                <div
                  className="absolute inset-y-0 right-0 bg-emerald-500"
                  style={{ width: `${ps.repeatRate}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white drop-shadow-sm">
                    {newPct.toFixed(0)}% new | {ps.repeatRate.toFixed(0)}% repeat
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-blue-50 rounded p-1.5">
                  <div className="text-sm font-bold text-blue-700">{ps.newCustomers.toLocaleString()}</div>
                  <div className="text-[10px] text-blue-600">New buyers</div>
                </div>
                <div className="bg-emerald-50 rounded p-1.5">
                  <div className="text-sm font-bold text-emerald-700">{ps.repeatCustomers.toLocaleString()}</div>
                  <div className="text-[10px] text-emerald-600">Repeat buyers</div>
                </div>
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-slate-400">
                <span>${ps.avgLTV} avg LTV</span>
                <span>${ps.avgOrderValue} avg order</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Segment-level acquisition power */}
      <div className="border-t border-slate-100 pt-4">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Top Segments by New Customer Acquisition
        </div>
        <p className="text-xs text-slate-400 mb-3">
          Which segments are attracting the most first-time buyers? High new-customer volume = strong acquisition signal for media targeting.
        </p>
        <div className="space-y-1.5">
          {segmentAcquisition.slice(0, 10).map((seg) => (
            <div key={seg.name} className="flex items-center gap-2">
              <div className="w-36 text-xs text-slate-700 capitalize truncate shrink-0 flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  seg.layer === 'motivation' ? 'bg-blue-400' : 'bg-violet-400'
                }`} />
                {seg.name}
              </div>
              {/* Stacked mini bar */}
              <div className="flex-1 bg-slate-100 rounded-full h-5 relative overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-blue-400"
                  style={{ width: `${seg.newRate}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-slate-700">
                  {seg.newCustomers.toLocaleString()} new ({seg.newRate.toFixed(0)}%)
                </span>
              </div>
              <div className="w-14 text-right text-[10px] text-emerald-600 font-medium shrink-0">
                ${seg.ltv} LTV
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[10px] text-slate-400 mt-3">
        New vs repeat is estimated from order frequency per reviewer-customer. A customer with only 1 order = &ldquo;new.&rdquo;
        Segments with low repeat rates but high volume are prime acquisition targets.
      </p>
    </div>
  );
}

// ─── Comfort Seeker Deep-Dive ────────────────────────────────────────────────

/**
 * Sub-classifies Comfort Seeker reviews by WHY they seek comfort.
 * Uses the cross-segment overlap data to show which identities compose
 * the Comfort Seeker segment, plus mines the benefits/pains data
 * for lifestyle clues.
 */
function ComfortSeekerDeepDive() {
  const se = salesEnrichment;
  if (!hasSalesEnrichment()) return null;

  const comfortData = se.segments['comfort seeker'];
  if (!comfortData) return null;

  // Find all identity overlaps with comfort seeker
  const comfortOverlaps = se.crossSegmentOverlaps
    .filter((o) => o.motivation === 'comfort seeker')
    .sort((a, b) => b.reviewCount - a.reviewCount);

  // Get comfort seeker's top pains — these reveal WHY they seek comfort
  const topPains = comfortData.topPains.slice(0, 8);
  const topBenefits = comfortData.topBenefits.slice(0, 8);

  // Product breakdown
  const productBreakdown = Object.entries(comfortData.byProduct)
    .sort((a, b) => (b[1].revenue ?? 0) - (a[1].revenue ?? 0));

  // Geography
  const topGeo = comfortData.sales.geography.slice(0, 5);
  const topRegions = comfortData.sales.topRegions?.slice(0, 8) ?? [];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 mb-5">
      <div className="flex items-center gap-3 mb-1">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
          Comfort Seeker Deep-Dive
        </h3>
        <span className="text-[10px] font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
          {comfortData.reviewCount.toLocaleString()} reviews
        </span>
      </div>
      <p className="text-xs text-slate-400 mb-5">
        Comfort Seeking is the #1 motivation across all product lines. Here's who they are, why they need comfort, and where the revenue concentrates.
      </p>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="bg-emerald-50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-emerald-700">{fmtRev(comfortData.sales.totalRevenue)}</div>
          <div className="text-[10px] text-emerald-600">Total Revenue</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-blue-700">${comfortData.sales.avgLifetimeValue}</div>
          <div className="text-[10px] text-blue-600">Avg LTV</div>
        </div>
        <div className="bg-violet-50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-violet-700">{comfortData.sales.repeatPurchaseRate}%</div>
          <div className="text-[10px] text-violet-600">Repeat Rate</div>
        </div>
        <div className="bg-amber-50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-amber-700">{comfortData.avgRating}/5</div>
          <div className="text-[10px] text-amber-600">{comfortData.fiveStarPct}% five-star</div>
        </div>
      </div>

      {/* WHO are the Comfort Seekers — Identity breakdown */}
      <div className="mb-5">
        <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
          Who Are the Comfort Seekers?
        </div>
        <p className="text-xs text-slate-400 mb-3">
          Identity segments that overlap with Comfort Seeker motivation — showing who these people are and their revenue contribution.
        </p>
        <div className="space-y-1.5">
          {comfortOverlaps.map((ov) => (
            <div key={ov.identity} className="flex items-center gap-2">
              <div className="w-40 text-xs text-slate-700 capitalize truncate shrink-0">
                {ov.identity}
              </div>
              <div className="flex-1 bg-slate-100 rounded-full h-5 relative overflow-hidden">
                <div
                  className="bg-violet-400 h-full rounded-full"
                  style={{ width: `${Math.max(ov.percentOfMotivation, 2)}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-slate-700">
                  {ov.reviewCount.toLocaleString()} ({ov.percentOfMotivation}%)
                </span>
              </div>
              <div className="w-16 text-right text-[10px] text-emerald-600 font-medium shrink-0">
                {fmtRev(ov.sales.totalRevenue)}
              </div>
              <div className="w-14 text-right text-[10px] text-blue-600 font-medium shrink-0">
                ${ov.sales.avgLifetimeValue} LTV
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* WHY they seek comfort — Pain drivers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div>
          <div className="text-xs font-semibold text-rose-600 uppercase tracking-wider mb-2">
            Why They Need Comfort (Pain Drivers)
          </div>
          <div className="space-y-1">
            {topPains.map((p) => (
              <div key={p.name} className="flex items-center gap-2">
                <div className="w-28 text-xs text-slate-700 capitalize truncate shrink-0">{p.name}</div>
                {pctBar(p.pct, 'bg-rose-400')}
                <div className="w-10 text-right text-[10px] text-slate-500 shrink-0">{p.count.toLocaleString()}</div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            These are the conditions and pain points mentioned by Comfort Seekers.
            Pain, swelling, and tightness indicate medical/health motivations.
            Hard-to-put-on and falling-down indicate functional frustrations.
          </p>
        </div>

        <div>
          <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2">
            What They Love (Benefit Signals)
          </div>
          <div className="space-y-1">
            {topBenefits.map((b) => (
              <div key={b.name} className="flex items-center gap-2">
                <div className="w-28 text-xs text-slate-700 capitalize truncate shrink-0">{b.name}</div>
                {pctBar(b.pct, 'bg-emerald-400')}
                <div className="w-10 text-right text-[10px] text-slate-500 shrink-0">{b.count.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Product breakdown for Comfort Seekers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div>
          <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
            Revenue by Product Line
          </div>
          <div className="space-y-1.5">
            {productBreakdown.map(([product, data]) => (
              <div key={product} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                <span className="text-xs font-medium text-slate-700">{product}</span>
                <div className="flex items-center gap-3 text-[10px]">
                  <span className="text-slate-500">{data.reviewCount.toLocaleString()} reviews ({data.reviewPct}%)</span>
                  {data.revenue != null && (
                    <span className="font-semibold text-emerald-600">{fmtRev(data.revenue)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
            Geographic Concentration
          </div>
          <div className="space-y-1">
            {topGeo.map((g) => (
              <div key={g.country} className="flex items-center justify-between text-xs text-slate-600 py-0.5">
                <span>{g.country}</span>
                <span className="text-slate-400">{g.pct}% ({g.customers.toLocaleString()} customers, {fmtRev(g.revenue)})</span>
              </div>
            ))}
          </div>
          {topRegions.length > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-100">
              <div className="text-[10px] text-slate-500 mb-1">Top regions:</div>
              {topRegions.slice(0, 5).map((r) => (
                <div key={r.region} className="flex items-center justify-between text-[10px] text-slate-500 py-0.5">
                  <span className="truncate mr-2">{r.region}</span>
                  <span className="shrink-0">{r.pct}% ({fmtRev(r.revenue)})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Data gap callout */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="text-xs font-semibold text-amber-800 mb-1">
          What We Don't Know (Recommended: Post-Purchase Survey)
        </div>
        <p className="text-xs text-amber-700 leading-relaxed">
          Review data reveals <strong>what</strong> Comfort Seekers value but not the full <strong>why</strong>.
          We can see that pain, swelling, and tightness are top complaints, but we can't determine
          the specific activities causing discomfort (exercise? work? medical condition? daily life?).
          A 3-5 question post-purchase survey via Klaviyo targeting this segment would unlock:
        </p>
        <ul className="text-xs text-amber-700 mt-2 ml-4 list-disc space-y-1">
          <li>Primary reason for seeking comfortable socks (occupation, health, lifestyle)</li>
          <li>Activities that cause foot discomfort (standing, walking, exercise, sitting)</li>
          <li>Age range and gender (currently inferred, not confirmed)</li>
          <li>Where they previously shopped for socks (competitor intelligence)</li>
          <li>What triggered their first Viasox purchase (ad, referral, search, retailer)</li>
        </ul>
      </div>
    </div>
  );
}

// ─── Review Volume Trends (from yearlyTrends) ───────────────────────────────

function ReviewTrendsByProduct({ analysis }: { analysis: FullAnalysis }) {
  if (!analysis.yearlyTrends?.byProduct) return null;

  const products = PRODUCTS.filter((p) => analysis.yearlyTrends!.byProduct[p]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 mb-5">
      <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-1">
        Product Growth Over Time (Review Volume)
      </h3>
      <p className="text-xs text-slate-400 mb-4">
        Year-over-year review volume as a proxy for product growth. 2026 is partial (YTD).
        Revenue time-series is not available — this shows demand trajectory via review volume.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-2 px-2 text-slate-500 font-semibold">Year</th>
              {products.map((p) => (
                <th key={p} className="text-right py-2 px-2 text-slate-500 font-semibold">{p}</th>
              ))}
              <th className="text-right py-2 px-2 text-slate-500 font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {(analysis.yearlyTrends!.years ?? []).map((year, yi) => {
              const overall = analysis.yearlyTrends!.overall.find((d) => d.year === year);
              const isPartial = year === '2026';
              return (
                <tr key={year} className={`border-b border-slate-100 ${isPartial ? 'opacity-60' : ''}`}>
                  <td className="py-2 px-2 font-medium text-slate-700">
                    {year}{isPartial ? '*' : ''}
                  </td>
                  {products.map((p) => {
                    const data = analysis.yearlyTrends!.byProduct[p]?.find((d) => d.year === year);
                    const prev = yi > 0
                      ? analysis.yearlyTrends!.byProduct[p]?.find((d) => d.year === analysis.yearlyTrends!.years[yi - 1])
                      : null;
                    const growth = prev && data && prev.totalReviews > 0 && !isPartial
                      ? Math.round(((data.totalReviews - prev.totalReviews) / prev.totalReviews) * 100)
                      : null;
                    return (
                      <td key={p} className="py-2 px-2 text-right text-slate-600">
                        {data?.totalReviews.toLocaleString() ?? '-'}
                        {growth !== null && (
                          <span className={`ml-1 text-[10px] font-medium ${growth > 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {growth > 0 ? '+' : ''}{growth}%
                          </span>
                        )}
                      </td>
                    );
                  })}
                  <td className="py-2 px-2 text-right font-semibold text-slate-700">
                    {overall?.totalReviews.toLocaleString() ?? '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-[10px] text-slate-400 mt-3">
        * 2026 is year-to-date. Review volume correlates with sales but is not a direct revenue proxy.
        To overlay media investment data, a CSV upload of ad spend by product by month would be needed.
      </p>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ProductIntelligence({ analysis, onBack }: Props) {
  const hasSales = hasSalesEnrichment();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="text-sm text-slate-500 hover:text-slate-700 mb-6 flex items-center gap-1"
        >
          {'\u2190'} Back to Dashboard
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-800 mb-1">
            Product & Customer Intelligence
          </h2>
          <p className="text-slate-500 text-sm">
            Revenue attribution, customer acquisition patterns, and segment deep-dives.
            {!hasSales && ' Sales enrichment data is required for revenue panels.'}
          </p>
        </div>

        {/* Data source note */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-5">
          <div className="flex items-start gap-2">
            <span className="text-blue-500 text-sm mt-0.5">{'\u2139\uFE0F'}</span>
            <div>
              <div className="text-sm font-semibold text-blue-800">Data Sources</div>
              <p className="text-xs text-blue-700 mt-1">
                Revenue data comes from DTC order records linked to reviewers via email matching
                ({hasSales ? `${salesEnrichment.meta.linkRate}% link rate` : 'not loaded'}).
                Review volume trends come from review timestamps.
                No media spend or retail POS data is included.
                To add media investment overlay, upload a CSV of ad spend by product by month.
              </p>
            </div>
          </div>
        </div>

        {/* Product Revenue Dashboard */}
        <ProductRevenueDashboard />

        {/* Review Volume Trends by Product */}
        <ReviewTrendsByProduct analysis={analysis} />

        {/* Segment Revenue Contribution */}
        <SegmentRevenueByProduct />

        {/* New vs Repeat Customer Breakdown */}
        <NewVsRepeatBreakdown />

        {/* Comfort Seeker Deep-Dive */}
        <ComfortSeekerDeepDive />
      </div>
    </div>
  );
}
