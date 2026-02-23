/**
 * SegmentRadarChart — Pure SVG radar/spider chart showing segment strength
 * across the three product lines (EasyStretch, Compression, Ankle Compression).
 *
 * Deterministic: Uses engine data only (segmentBreakdown.segments.byProduct).
 * Identity segments rendered in violet, motivation segments in blue.
 * Max 4 segments displayed (top 4 by total reviews among selected).
 */

import { useMemo } from 'react';
import type { FullAnalysis, ProductCategory } from '../../engine/types';
import { DISPLAY_NAME_MAP } from '../../utils/segmentNames';

interface Props {
  analysis: FullAnalysis;
  selectedPersonas: string[];
  product: ProductCategory;
}

interface RadarSegment {
  name: string;
  layer: 'identity' | 'motivation';
  /** Percentages for each axis (0–100 scale) */
  easyStretch: number;
  compression: number;
  ankleCompression: number;
}

const AXES: { key: string; label: string; angle: number }[] = [
  { key: 'easyStretch', label: 'EasyStretch', angle: -90 },
  { key: 'compression', label: 'Compression', angle: 30 },
  { key: 'ankleCompression', label: 'Ankle', angle: 150 },
];

const COLORS = {
  identity: [
    { fill: 'rgba(139, 92, 246, 0.12)', stroke: '#8b5cf6' },
    { fill: 'rgba(167, 139, 250, 0.10)', stroke: '#a78bfa' },
  ],
  motivation: [
    { fill: 'rgba(59, 130, 246, 0.12)', stroke: '#3b82f6' },
    { fill: 'rgba(96, 165, 250, 0.10)', stroke: '#60a5fa' },
  ],
};

const CX = 160;
const CY = 130;
const RADIUS = 90;

function polarToCart(angleDeg: number, r: number): [number, number] {
  const rad = (angleDeg * Math.PI) / 180;
  return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)];
}

export default function SegmentRadarChart({ analysis, selectedPersonas, product: _product }: Props) {
  const segments: RadarSegment[] = useMemo(() => {
    const sb = analysis.segmentBreakdown;
    if (!sb) return [];

    const selectedLower = new Set(selectedPersonas.map(p => p.toLowerCase()));

    // Find matching segment profiles
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

    // Sort by total reviews, take top 4
    matched.sort((a, b) => b.totalCount - a.totalCount);
    const top = matched.slice(0, 4);

    // Find max count across all products for normalization
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
    }));
  }, [analysis, selectedPersonas, _product]);

  // Pre-compute color assignments deterministically (avoids mutable counters in render)
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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
      <h3 className="text-sm font-semibold text-slate-800 mb-1">
        Segment Product Affinity
      </h3>
      <p className="text-xs text-slate-400 mb-4">
        How your selected segments distribute across the three product lines. Larger areas = stronger presence.
      </p>

      <svg viewBox="0 0 320 260" className="w-full max-w-md mx-auto" aria-label="Radar chart showing segment distribution across products">
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

          const values = [seg.easyStretch, seg.compression, seg.ankleCompression];
          const points = AXES.map((axis, i) => {
            const r = (values[i] / 100) * RADIUS;
            return polarToCart(axis.angle, Math.max(r, 4));
          });
          const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ') + ' Z';

          return (
            <g key={seg.name}>
              <path d={d} fill={colorSet.fill} stroke={colorSet.stroke} strokeWidth="2" opacity="0.85" />
              {/* Dots at vertices */}
              {points.map((p, i) => (
                <circle key={i} cx={p[0]} cy={p[1]} r="3" fill={colorSet.stroke} />
              ))}
            </g>
          );
        })}

        {/* Axis labels */}
        {AXES.map(axis => {
          const [x, y] = polarToCart(axis.angle, RADIUS + 18);
          return (
            <text
              key={axis.key}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="10"
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
            <text key={pct} x={x + 12} y={y} fontSize="8" fill="#94a3b8" textAnchor="start" dominantBaseline="central">
              {pct}%
            </text>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
        {segments.map(seg => (
          <div key={seg.name} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${seg.layer === 'identity' ? 'bg-violet-500' : 'bg-blue-500'}`} />
            <span className="text-[10px] text-slate-600">{seg.name.length > 20 ? seg.name.slice(0, 18) + '...' : seg.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
