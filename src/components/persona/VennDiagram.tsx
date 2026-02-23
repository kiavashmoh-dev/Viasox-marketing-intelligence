/**
 * VennDiagram — Pure SVG Venn for identity × motivation segment overlap.
 * Uses deterministic crossSegmentOverlap data (never fails).
 *
 * Shows pairwise diagrams for identity × motivation pairs
 * that are both in the selectedPersonas list.
 */

import type { CrossSegmentOverlap, ProductCategory } from '../../engine/types';

interface VennPair {
  identity: string;
  motivation: string;
  overlapCount: number;
  identityTotal: number;
  motivationTotal: number;
  avgRating: number;
}

interface Props {
  overlaps: CrossSegmentOverlap[];
  selectedPersonas: string[];
  product: ProductCategory;
  /** Segment totals map: segment name → total review count */
  segmentTotals: Map<string, number>;
  /** Maps raw segment names to display names */
  displayNameMap: Map<string, string>;
}

function resolveDisplayName(raw: string, displayNameMap: Map<string, string>): string {
  return displayNameMap.get(raw.toLowerCase()) ?? raw;
}

export default function VennDiagram({ overlaps, selectedPersonas, product, segmentTotals, displayNameMap }: Props) {
  // Build pairs that are relevant to the selected personas
  const selectedLower = new Set(selectedPersonas.map(p => p.toLowerCase()));

  const pairs: VennPair[] = overlaps
    .filter(ov => {
      const idDisplay = resolveDisplayName(ov.identity, displayNameMap);
      const motDisplay = resolveDisplayName(ov.motivation, displayNameMap);
      // OR logic: show pair if EITHER side is in selectedPersonas
      return selectedLower.has(idDisplay.toLowerCase()) || selectedLower.has(motDisplay.toLowerCase());
    })
    .filter(ov => {
      const productData = ov.byProduct[product];
      return productData && productData.count > 0;
    })
    // Prioritize pairs where BOTH sides are selected, then by overlap count
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
    .slice(0, 3) // Max 3 diagrams
    .map(ov => {
      const idDisplay = resolveDisplayName(ov.identity, displayNameMap);
      const motDisplay = resolveDisplayName(ov.motivation, displayNameMap);
      return {
        identity: idDisplay,
        motivation: motDisplay,
        overlapCount: ov.byProduct[product]?.count ?? ov.reviewCount,
        identityTotal: segmentTotals.get(idDisplay.toLowerCase()) ?? segmentTotals.get(ov.identity.toLowerCase()) ?? 0,
        motivationTotal: segmentTotals.get(motDisplay.toLowerCase()) ?? segmentTotals.get(ov.motivation.toLowerCase()) ?? 0,
        avgRating: ov.avgRating,
      };
    });

  if (pairs.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
      <h3 className="text-sm font-semibold text-slate-800 mb-1">
        Segment Overlap — Who {'\u00D7'} Why
      </h3>
      <p className="text-xs text-slate-400 mb-4">
        Where your selected identity and motivation segments intersect in {product} reviews.
      </p>
      <div className={`grid gap-6 ${pairs.length === 1 ? 'grid-cols-1 max-w-md mx-auto' : pairs.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
        {pairs.map((pair, i) => (
          <SingleVenn key={i} pair={pair} />
        ))}
      </div>
    </div>
  );
}

function SingleVenn({ pair }: { pair: VennPair }) {
  // Truncate long names
  const idName = pair.identity.length > 18 ? pair.identity.slice(0, 16) + '...' : pair.identity;
  const motName = pair.motivation.length > 18 ? pair.motivation.slice(0, 16) + '...' : pair.motivation;

  return (
    <div className="text-center">
      <svg viewBox="0 0 360 200" className="w-full max-w-xs mx-auto" aria-label={`Venn diagram: ${pair.identity} overlaps with ${pair.motivation}`}>
        {/* Left circle — Identity (violet) */}
        <circle cx="135" cy="100" r="80" fill="rgba(139, 92, 246, 0.12)" stroke="#8b5cf6" strokeWidth="2" />
        {/* Right circle — Motivation (blue) */}
        <circle cx="225" cy="100" r="80" fill="rgba(59, 130, 246, 0.12)" stroke="#3b82f6" strokeWidth="2" />

        {/* Overlap count in center */}
        <text x="180" y="92" textAnchor="middle" dominantBaseline="central" fontSize="22" fontWeight="bold" fill="#1e293b">
          {pair.overlapCount.toLocaleString()}
        </text>
        <text x="180" y="112" textAnchor="middle" fontSize="9" fill="#64748b">
          overlap
        </text>

        {/* Left label */}
        <text x="90" y="90" textAnchor="middle" fontSize="10" fontWeight="600" fill="#7c3aed">
          {idName}
        </text>
        <text x="90" y="105" textAnchor="middle" fontSize="9" fill="#94a3b8">
          {pair.identityTotal.toLocaleString()} reviews
        </text>

        {/* Right label */}
        <text x="270" y="90" textAnchor="middle" fontSize="10" fontWeight="600" fill="#2563eb">
          {motName}
        </text>
        <text x="270" y="105" textAnchor="middle" fontSize="9" fill="#94a3b8">
          {pair.motivationTotal.toLocaleString()} reviews
        </text>

        {/* Rating in overlap region */}
        <text x="180" y="130" textAnchor="middle" fontSize="9" fill="#64748b">
          {pair.avgRating > 0 ? `${pair.avgRating}/5 \u2605` : ''}
        </text>
      </svg>
      {/* Legend below */}
      <div className="flex items-center justify-center gap-4 mt-1">
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
