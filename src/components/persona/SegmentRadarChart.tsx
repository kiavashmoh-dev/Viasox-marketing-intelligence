/**
 * SegmentRadarChart — Pure SVG radar/spider chart showing segment strength
 * across the three product lines (EasyStretch, Compression, Ankle Compression).
 *
 * Deterministic: Uses engine data only (segmentBreakdown.segments.byProduct).
 * Identity segments rendered in violet, motivation segments in blue.
 * Max 4 segments displayed (top 4 by total reviews among selected).
 *
 * Features:
 * - Larger SVG for readability
 * - Hover interactivity: highlight active segment polygon, show tooltip
 * - Explainer paragraph below chart
 */

import { useState, useMemo } from 'react';
import type { FullAnalysis, ProductCategory } from '../../engine/types';
import { DISPLAY_NAME_MAP } from '../../utils/segmentNames';
import { getEnrichedSegment, hasSalesEnrichment } from '../../data/salesEnrichmentLoader';

interface Props {
  analysis: FullAnalysis;
  selectedPersonas: string[];
  product: ProductCategory;
}

interface RadarSegment {
  name: string;
  layer: 'identity' | 'motivation';
  /** Percentages for each axis (0-100 scale) */
  easyStretch: number;
  compression: number;
  ankleCompression: number;
  /** Raw counts for tooltip */
  rawCounts: Record<string, number>;
  totalCount: number;
}

const AXES: { key: string; label: string; angle: number }[] = [
  { key: 'easyStretch', label: 'EasyStretch', angle: -90 },
  { key: 'compression', label: 'Compression', angle: 30 },
  { key: 'ankleCompression', label: 'Ankle', angle: 150 },
];

const COLORS = {
  identity: [
    { fill: 'rgba(139, 92, 246, 0.15)', stroke: '#8b5cf6', dimFill: 'rgba(139, 92, 246, 0.04)' },
    { fill: 'rgba(167, 139, 250, 0.12)', stroke: '#a78bfa', dimFill: 'rgba(167, 139, 250, 0.03)' },
  ],
  motivation: [
    { fill: 'rgba(59, 130, 246, 0.15)', stroke: '#3b82f6', dimFill: 'rgba(59, 130, 246, 0.04)' },
    { fill: 'rgba(96, 165, 250, 0.12)', stroke: '#60a5fa', dimFill: 'rgba(96, 165, 250, 0.03)' },
  ],
};

const CX = 200;
const CY = 155;
const RADIUS = 110;

function polarToCart(angleDeg: number, r: number): [number, number] {
  const rad = (angleDeg * Math.PI) / 180;
  return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)];
}

function fmtRev(v: number): string {
  return v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${(v / 1_000).toFixed(0)}K`;
}

export default function SegmentRadarChart({ analysis, selectedPersonas, product: _product }: Props) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const segments: RadarSegment[] = useMemo(() => {
    const sb = analysis.segmentBreakdown;
    if (!sb) return [];

    const selectedLower = new Set(selectedPersonas.map(p => p.toLowerCase()));

    const matched: { name: string; layer: 'identity' | 'motivation'; totalCount: number; byProduct: Record<string, { count: number; percentage: number }> }[] = [];

    for (const seg of sb.segments) {
      const displayName = DISPLAY_NAME_MAP.get(seg.segmentName.toLowerCase()) ?? seg.segmentName;
      if (!selectedLower.has(displayName.toLowerCase()) && !selectedLower.has(seg.segmentName.toLowerCase())) continue;

      matched.push({
        name: displayName,
        layer: seg.layer,
        totalCount: seg.totalReviews,
        byProduct: seg.byProduct,
      });
    }

    matched.sort((a, b) => b.totalCount - a.totalCount);
    const top = matched.slice(0, 4);

    let maxCount = 1;
    for (const seg of top) {
      for (const key of ['EasyStretch', 'Compression', 'Ankle Compression']) {
        const count = seg.byProduct[key]?.count ?? 0;
        if (count > maxCount) maxCount = count;
      }
    }

    return top.map(seg => ({
      name: seg.name,
      layer: seg.layer,
      easyStretch: Math.round(((seg.byProduct['EasyStretch']?.count ?? 0) / maxCount) * 100),
      compression: Math.round(((seg.byProduct['Compression']?.count ?? 0) / maxCount) * 100),
      ankleCompression: Math.round(((seg.byProduct['Ankle Compression']?.count ?? 0) / maxCount) * 100),
      rawCounts: {
        EasyStretch: seg.byProduct['EasyStretch']?.count ?? 0,
        Compression: seg.byProduct['Compression']?.count ?? 0,
        'Ankle Compression': seg.byProduct['Ankle Compression']?.count ?? 0,
      },
      totalCount: seg.totalCount,
    }));
  }, [analysis, selectedPersonas, _product]);

  const colorAssignments = useMemo(() => {
    let iIdx = 0;
    let mIdx = 0;
    return segments.map(seg => {
      if (seg.layer === 'identity') {
        return COLORS.identity[iIdx++ % 2];
      }
      return COLORS.motivation[mIdx++ % 2];
    });
  }, [segments]);

  if (segments.length === 0) return null;

  const hasSales = hasSalesEnrichment();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
      <h3 className="text-sm font-semibold text-slate-800 mb-1">
        Segment Product Affinity
      </h3>
      <p className="text-xs text-slate-400 mb-4">
        How your selected segments distribute across the three product lines. Larger areas = stronger presence. Hover a segment for details.
      </p>

      <svg viewBox="0 0 400 320" className="w-full max-w-lg mx-auto" aria-label="Radar chart showing segment distribution across products">
        {/* Concentric grid lines */}
        {[0.25, 0.5, 0.75, 1.0].map(scale => {
          const points = AXES.map(axis => polarToCart(axis.angle, RADIUS * scale));
          const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ') + ' Z';
          return (
            <path key={scale} d={d} fill="none" stroke="#e2e8f0" strokeWidth="1" strokeDasharray={scale < 1 ? '3,3' : 'none'} />
          );
        })}

        {/* Axis lines */}
        {AXES.map(axis => {
          const [x, y] = polarToCart(axis.angle, RADIUS);
          return <line key={axis.key} x1={CX} y1={CY} x2={x} y2={y} stroke="#cbd5e1" strokeWidth="1" />;
        })}

        {/* Segment polygons */}
        {segments.map((seg, segIdx) => {
          const colorSet = colorAssignments[segIdx];
          const isHovered = hoveredIndex === segIdx;
          const isDimmed = hoveredIndex !== null && hoveredIndex !== segIdx;

          const values = [seg.easyStretch, seg.compression, seg.ankleCompression];
          const points = AXES.map((axis, i) => {
            const r = (values[i] / 100) * RADIUS;
            return polarToCart(axis.angle, Math.max(r, 4));
          });
          const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ') + ' Z';

          return (
            <g
              key={seg.name}
              onMouseEnter={() => setHoveredIndex(segIdx)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ cursor: 'pointer' }}
            >
              <path
                d={d}
                fill={isDimmed ? colorSet.dimFill : colorSet.fill}
                stroke={colorSet.stroke}
                strokeWidth={isHovered ? 3 : 2}
                opacity={isDimmed ? 0.4 : isHovered ? 1 : 0.85}
                className="transition-all duration-200"
              />
              {/* Dots at vertices */}
              {points.map((p, i) => (
                <circle
                  key={i}
                  cx={p[0]} cy={p[1]}
                  r={isHovered ? 4.5 : 3}
                  fill={colorSet.stroke}
                  opacity={isDimmed ? 0.3 : 1}
                  className="transition-all duration-200"
                />
              ))}
            </g>
          );
        })}

        {/* Axis labels */}
        {AXES.map(axis => {
          const [x, y] = polarToCart(axis.angle, RADIUS + 22);
          return (
            <text
              key={axis.key}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="11"
              fontWeight="600"
              fill="#475569"
            >
              {axis.label}
            </text>
          );
        })}

        {/* Scale labels */}
        {[25, 50, 75, 100].map(pct => {
          const [x, y] = polarToCart(-90, (pct / 100) * RADIUS);
          return (
            <text key={pct} x={x + 14} y={y} fontSize="8" fill="#94a3b8" textAnchor="start" dominantBaseline="central">
              {pct}%
            </text>
          );
        })}
      </svg>

      {/* Hover tooltip panel */}
      {hoveredIndex !== null && segments[hoveredIndex] && (() => {
        const seg = segments[hoveredIndex];
        const enriched = hasSales ? getEnrichedSegment(seg.name) : undefined;
        const sales = enriched?.sales;

        return (
          <div className="bg-slate-800 text-white rounded-lg px-4 py-3 text-xs mx-auto max-w-sm mt-1 animate-in fade-in duration-150">
            <div className={`font-semibold mb-1.5 ${seg.layer === 'identity' ? 'text-violet-300' : 'text-blue-300'}`}>
              {seg.name}
              <span className="text-slate-400 font-normal ml-1.5">({seg.layer})</span>
            </div>
            <div className="text-slate-300 space-y-0.5">
              <div className="grid grid-cols-3 gap-2 mb-1">
                <div>EasyStretch: <span className="text-white font-medium">{seg.rawCounts['EasyStretch'].toLocaleString()}</span></div>
                <div>Compression: <span className="text-white font-medium">{seg.rawCounts['Compression'].toLocaleString()}</span></div>
                <div>Ankle: <span className="text-white font-medium">{seg.rawCounts['Ankle Compression'].toLocaleString()}</span></div>
              </div>
              {sales && (
                <div className="pt-1 border-t border-slate-600 grid grid-cols-3 gap-2">
                  <div className="text-emerald-300">Rev: {fmtRev(sales.totalRevenue)}</div>
                  <div className="text-emerald-300">LTV: ${sales.avgLifetimeValue}</div>
                  <div className="text-emerald-300">Repeat: {sales.repeatPurchaseRate}%</div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-3">
        {segments.map((seg, i) => (
          <button
            key={seg.name}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all ${
              hoveredIndex === i ? 'bg-slate-100 ring-1 ring-slate-300' : 'hover:bg-slate-50'
            }`}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div className={`w-2.5 h-2.5 rounded-full ${seg.layer === 'identity' ? 'bg-violet-500' : 'bg-blue-500'}`} />
            <span className="text-[10px] text-slate-600">{seg.name.length > 20 ? seg.name.slice(0, 18) + '...' : seg.name}</span>
          </button>
        ))}
      </div>

      {/* Explainer */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <p className="text-xs text-slate-500 leading-relaxed">
          This radar chart maps each selected segment's review concentration across product lines.
          A segment with a large area has strong presence across all three products, while a narrow spike
          indicates dominance in one line. Use this to identify which segments are product-specific
          versus product-agnostic {'\u2014'} this drives cross-sell strategy and product-specific messaging.
        </p>
      </div>
    </div>
  );
}
