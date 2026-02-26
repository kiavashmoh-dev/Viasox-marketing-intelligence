/**
 * VennDiagram — Pure SVG Venn for identity x motivation segment overlap.
 * Uses deterministic crossSegmentOverlap data (never fails).
 *
 * Shows pairwise diagrams for identity x motivation pairs
 * that are both in the selectedPersonas list.
 *
 * Features:
 * - Larger SVG for readability
 * - Hover interactivity: highlight zones, show detailed tooltip
 * - Explainer paragraph below diagrams
 */

import { useState } from 'react';
import type { CrossSegmentOverlap, ProductCategory } from '../../engine/types';
import { hasSalesEnrichment, salesEnrichment } from '../../data/salesEnrichmentLoader';

interface VennPair {
  identity: string;
  motivation: string;
  overlapCount: number;
  identityTotal: number;
  motivationTotal: number;
  avgRating: number;
  pctOfIdentity: number;
  pctOfMotivation: number;
  revenue?: number;
  ltv?: number;
  repeatRate?: number;
}

interface Props {
  overlaps: CrossSegmentOverlap[];
  selectedPersonas: string[];
  product: ProductCategory;
  /** Segment totals map: segment name -> total review count */
  segmentTotals: Map<string, number>;
  /** Maps raw segment names to display names */
  displayNameMap: Map<string, string>;
}

type HoveredZone = 'left' | 'right' | 'overlap' | null;

function resolveDisplayName(raw: string, displayNameMap: Map<string, string>): string {
  return displayNameMap.get(raw.toLowerCase()) ?? raw;
}

export default function VennDiagram({ overlaps, selectedPersonas, product, segmentTotals, displayNameMap }: Props) {
  const selectedLower = new Set(selectedPersonas.map(p => p.toLowerCase()));

  const pairs: VennPair[] = overlaps
    .filter(ov => {
      const idDisplay = resolveDisplayName(ov.identity, displayNameMap);
      const motDisplay = resolveDisplayName(ov.motivation, displayNameMap);
      return selectedLower.has(idDisplay.toLowerCase()) || selectedLower.has(motDisplay.toLowerCase());
    })
    .filter(ov => {
      const productData = ov.byProduct[product];
      return productData && productData.count > 0;
    })
    .sort((a, b) => {
      const aId = resolveDisplayName(a.identity, displayNameMap).toLowerCase();
      const aMot = resolveDisplayName(a.motivation, displayNameMap).toLowerCase();
      const bId = resolveDisplayName(b.identity, displayNameMap).toLowerCase();
      const bMot = resolveDisplayName(b.motivation, displayNameMap).toLowerCase();
      const aScore = (selectedLower.has(aId) ? 1 : 0) + (selectedLower.has(aMot) ? 1 : 0);
      const bScore = (selectedLower.has(bId) ? 1 : 0) + (selectedLower.has(bMot) ? 1 : 0);
      if (bScore !== aScore) return bScore - aScore;
      return (b.byProduct[product]?.count ?? b.reviewCount) - (a.byProduct[product]?.count ?? a.reviewCount);
    })
    .slice(0, 3)
    .map(ov => {
      const idDisplay = resolveDisplayName(ov.identity, displayNameMap);
      const motDisplay = resolveDisplayName(ov.motivation, displayNameMap);
      const overlapCount = ov.byProduct[product]?.count ?? ov.reviewCount;
      const identityTotal = segmentTotals.get(idDisplay.toLowerCase()) ?? segmentTotals.get(ov.identity.toLowerCase()) ?? 0;
      const motivationTotal = segmentTotals.get(motDisplay.toLowerCase()) ?? segmentTotals.get(ov.motivation.toLowerCase()) ?? 0;

      const pctOfIdentity = ov.percentOfIdentity > 0
        ? ov.percentOfIdentity
        : identityTotal > 0 ? Math.round((overlapCount / identityTotal) * 1000) / 10 : 0;
      const pctOfMotivation = ov.percentOfMotivation > 0
        ? ov.percentOfMotivation
        : motivationTotal > 0 ? Math.round((overlapCount / motivationTotal) * 1000) / 10 : 0;

      let revenue: number | undefined;
      let ltv: number | undefined;
      let repeatRate: number | undefined;
      if (hasSalesEnrichment()) {
        const enrichedOverlap = salesEnrichment.crossSegmentOverlaps.find(
          eo => eo.identity.toLowerCase() === ov.identity.toLowerCase()
            && eo.motivation.toLowerCase() === ov.motivation.toLowerCase()
        );
        if (enrichedOverlap?.sales) {
          revenue = enrichedOverlap.sales.totalRevenue || undefined;
          ltv = enrichedOverlap.sales.avgLifetimeValue || undefined;
          repeatRate = enrichedOverlap.sales.repeatPurchaseRate || undefined;
        }
      }

      return {
        identity: idDisplay,
        motivation: motDisplay,
        overlapCount,
        identityTotal,
        motivationTotal,
        avgRating: ov.avgRating,
        pctOfIdentity,
        pctOfMotivation,
        revenue,
        ltv,
        repeatRate,
      };
    });

  if (pairs.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
      <h3 className="text-sm font-semibold text-slate-800 mb-1">
        Segment Overlap {'\u2014'} Who {'\u00D7'} Why
      </h3>
      <p className="text-xs text-slate-400 mb-4">
        Where your selected identity and motivation segments intersect in {product} reviews.
      </p>
      <div className={`grid gap-6 ${pairs.length === 1 ? 'grid-cols-1 max-w-lg mx-auto' : 'grid-cols-1 md:grid-cols-2'}`}>
        {pairs.map((pair, i) => (
          <SingleVenn key={i} pair={pair} />
        ))}
      </div>

      {/* Explainer */}
      <div className="mt-5 pt-4 border-t border-slate-100">
        <p className="text-xs text-slate-500 leading-relaxed">
          These diagrams show where <span className="font-medium text-violet-600">identity segments</span> (who the customer is)
          overlap with <span className="font-medium text-blue-600">motivation segments</span> (why they buy).
          The overlap zone reveals how many reviewers belong to both segments simultaneously {'\u2014'}
          these are your highest-signal customers because their identity and purchase motivation are both known.
          Hover over each zone for detailed metrics.
        </p>
      </div>
    </div>
  );
}

function SingleVenn({ pair }: { pair: VennPair }) {
  const [hoveredZone, setHoveredZone] = useState<HoveredZone>(null);

  const idName = pair.identity.length > 20 ? pair.identity.slice(0, 18) + '...' : pair.identity;
  const motName = pair.motivation.length > 20 ? pair.motivation.slice(0, 18) + '...' : pair.motivation;

  const fmtRevenue = (v: number) =>
    v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${(v / 1_000).toFixed(0)}K`;

  const leftStroke = hoveredZone === 'left' ? 3.5 : hoveredZone === 'right' ? 1.5 : 2;
  const rightStroke = hoveredZone === 'right' ? 3.5 : hoveredZone === 'left' ? 1.5 : 2;
  const leftOpacity = hoveredZone === 'right' ? 0.06 : 0.12;
  const rightOpacity = hoveredZone === 'left' ? 0.06 : 0.12;

  return (
    <div className="text-center">
      <svg
        viewBox="0 0 440 280"
        className="w-full mx-auto"
        aria-label={`Venn diagram: ${pair.identity} overlaps with ${pair.motivation}`}
      >
        {/* Left circle — Identity (violet) */}
        <circle cx="170" cy="120" r="100"
          fill={`rgba(139, 92, 246, ${leftOpacity})`}
          stroke="#8b5cf6" strokeWidth={leftStroke}
          className="transition-all duration-200"
        />
        {/* Right circle — Motivation (blue) */}
        <circle cx="270" cy="120" r="100"
          fill={`rgba(59, 130, 246, ${rightOpacity})`}
          stroke="#3b82f6" strokeWidth={rightStroke}
          className="transition-all duration-200"
        />

        {/* Overlap count in center */}
        <text x="220" y="100" textAnchor="middle" dominantBaseline="central"
          fontSize="26" fontWeight="bold" fill="#1e293b"
          className={hoveredZone === 'overlap' ? '' : ''}
        >
          {pair.overlapCount.toLocaleString()}
        </text>
        <text x="220" y="120" textAnchor="middle" fontSize="10" fill="#64748b">
          overlap
        </text>

        {/* Percentage annotations */}
        {pair.pctOfIdentity > 0 && (
          <text x="198" y="140" textAnchor="middle" fontSize="9" fill="#7c3aed">
            {pair.pctOfIdentity.toFixed(1)}% of {idName.length > 14 ? idName.slice(0, 12) + '..' : idName}
          </text>
        )}
        {pair.pctOfMotivation > 0 && (
          <text x="242" y="155" textAnchor="middle" fontSize="9" fill="#2563eb">
            {pair.pctOfMotivation.toFixed(1)}% of {motName.length > 14 ? motName.slice(0, 12) + '..' : motName}
          </text>
        )}

        {/* Left label */}
        <text x="110" y="100" textAnchor="middle" fontSize="11" fontWeight="600" fill="#7c3aed">
          {idName}
        </text>
        <text x="110" y="118" textAnchor="middle" fontSize="10" fill="#94a3b8">
          {pair.identityTotal.toLocaleString()} reviews
        </text>

        {/* Right label */}
        <text x="330" y="100" textAnchor="middle" fontSize="11" fontWeight="600" fill="#2563eb">
          {motName}
        </text>
        <text x="330" y="118" textAnchor="middle" fontSize="10" fill="#94a3b8">
          {pair.motivationTotal.toLocaleString()} reviews
        </text>

        {/* Rating */}
        <text x="220" y="172" textAnchor="middle" fontSize="10" fill="#64748b">
          {pair.avgRating > 0 ? `${pair.avgRating}/5 \u2605` : ''}
        </text>

        {/* Revenue below if available */}
        {pair.revenue != null && pair.revenue > 0 && (
          <text x="220" y="190" textAnchor="middle" fontSize="10" fontWeight="600" fill="#059669">
            {fmtRevenue(pair.revenue)} revenue
          </text>
        )}

        {/* ── Transparent hit areas for hover ── */}
        {/* Left-only zone (crescent) */}
        <circle cx="170" cy="120" r="100"
          fill="transparent" stroke="none"
          style={{ cursor: 'pointer' }}
          onMouseEnter={() => setHoveredZone('left')}
          onMouseLeave={() => setHoveredZone(null)}
        />
        {/* Right-only zone (crescent) */}
        <circle cx="270" cy="120" r="100"
          fill="transparent" stroke="none"
          style={{ cursor: 'pointer' }}
          onMouseEnter={() => setHoveredZone('right')}
          onMouseLeave={() => setHoveredZone(null)}
        />
        {/* Overlap zone — rendered last so it captures events on top */}
        <rect x="170" y="20" width="100" height="200"
          fill="transparent" stroke="none"
          style={{ cursor: 'pointer' }}
          onMouseEnter={() => setHoveredZone('overlap')}
          onMouseLeave={() => setHoveredZone(null)}
        />
      </svg>

      {/* Hover tooltip below SVG */}
      {hoveredZone && (
        <div className="bg-slate-800 text-white rounded-lg px-4 py-3 text-xs text-left mx-auto max-w-sm mt-1 animate-in fade-in duration-150">
          {hoveredZone === 'left' && (
            <>
              <div className="font-semibold text-violet-300 mb-1">{pair.identity} (Identity)</div>
              <div className="text-slate-300 space-y-0.5">
                <div>{pair.identityTotal.toLocaleString()} total reviews</div>
                <div>{pair.pctOfIdentity.toFixed(1)}% overlap with {pair.motivation}</div>
              </div>
            </>
          )}
          {hoveredZone === 'right' && (
            <>
              <div className="font-semibold text-blue-300 mb-1">{pair.motivation} (Motivation)</div>
              <div className="text-slate-300 space-y-0.5">
                <div>{pair.motivationTotal.toLocaleString()} total reviews</div>
                <div>{pair.pctOfMotivation.toFixed(1)}% overlap with {pair.identity}</div>
              </div>
            </>
          )}
          {hoveredZone === 'overlap' && (
            <>
              <div className="font-semibold text-white mb-1">
                {pair.identity} {'\u00D7'} {pair.motivation}
              </div>
              <div className="text-slate-300 space-y-0.5">
                <div>{pair.overlapCount.toLocaleString()} shared reviewers</div>
                <div>{pair.pctOfIdentity.toFixed(1)}% of {pair.identity} &middot; {pair.pctOfMotivation.toFixed(1)}% of {pair.motivation}</div>
                {pair.avgRating > 0 && <div>Avg rating: {pair.avgRating}/5 {'\u2605'}</div>}
                {pair.revenue != null && pair.revenue > 0 && (
                  <div className="text-emerald-300">Revenue: {fmtRevenue(pair.revenue)}</div>
                )}
                {pair.ltv != null && pair.ltv > 0 && (
                  <div className="text-emerald-300">Avg LTV: ${pair.ltv.toFixed(0)}</div>
                )}
                {pair.repeatRate != null && pair.repeatRate > 0 && (
                  <div className="text-emerald-300">Repeat rate: {pair.repeatRate}%</div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />
          <span className="text-[10px] text-slate-500">Identity</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span className="text-[10px] text-slate-500">Motivation</span>
        </div>
      </div>
    </div>
  );
}
