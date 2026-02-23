/**
 * SegmentResultsView — Hybrid C-Suite Visual Dashboard
 *
 * ARCHITECTURE:
 * - Visual elements (charts, KPI cards, bars) come from DETERMINISTIC engine data
 *   (SegmentBreakdown). These never fail — they're pure math.
 * - Strategic narrative comes from Claude as MARKDOWN text.
 *   Markdown is 100% reliable to render — no JSON parsing required.
 *
 * This hybrid approach means the visual dashboard always works,
 * regardless of what Claude returns.
 */

import { useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { SegmentBreakdown, SegmentProfile } from '../engine/types';
import { downloadAsDoc, downloadAsPdf } from '../utils/downloadUtils';

/* ── Sub-Components ───────────────────────────────────────────────────────── */

/** Horizontal bar for percentage values */
function Bar({ value, max, color = 'blue' }: { value: number; max: number; color?: string }) {
  const w = max > 0 ? Math.max((value / max) * 100, 3) : 3;
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500', emerald: 'bg-emerald-500', amber: 'bg-amber-500',
    rose: 'bg-rose-500', violet: 'bg-violet-500', cyan: 'bg-cyan-500',
  };
  return (
    <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${colorMap[color] ?? 'bg-blue-500'}`}
        style={{ width: `${w}%` }}
      />
    </div>
  );
}

/** Star rating display */
function Stars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.25;
  const stars: string[] = [];
  for (let i = 0; i < 5; i++) {
    if (i < full) stars.push('\u2605');
    else if (i === full && hasHalf) stars.push('\u00BD');
    else stars.push('\u2606');
  }
  return (
    <span className="text-amber-400 text-sm tracking-wider" title={`${rating}/5`}>
      {stars.join('')}
    </span>
  );
}

/** Segment size bar chart (horizontal stacked overview) */
function SegmentSizeChart({ segments, layer }: { segments: SegmentProfile[]; layer: 'motivation' | 'identity' }) {
  const colors = layer === 'motivation'
    ? ['bg-blue-500', 'bg-emerald-500', 'bg-cyan-500', 'bg-amber-500', 'bg-indigo-500', 'bg-teal-500', 'bg-sky-500', 'bg-lime-500']
    : ['bg-violet-500', 'bg-rose-400', 'bg-fuchsia-500', 'bg-purple-500', 'bg-pink-500', 'bg-red-400', 'bg-orange-400', 'bg-amber-600', 'bg-violet-400'];
  const total = segments.reduce((sum, s) => sum + s.totalReviews, 0);

  return (
    <div>
      <div className="flex h-8 rounded-lg overflow-hidden mb-3">
        {segments.map((seg, i) => {
          const w = total > 0 ? Math.max((seg.totalReviews / total) * 100, 2) : 2;
          return (
            <div
              key={seg.segmentName}
              className={`${colors[i % colors.length]} transition-all duration-700 relative group`}
              style={{ width: `${w}%` }}
              title={`${seg.segmentName}: ${seg.percentage}%`}
            >
              {w > 8 && (
                <span className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-semibold">
                  {seg.percentage}%
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {segments.map((seg, i) => (
          <div key={seg.segmentName} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-sm ${colors[i % colors.length]}`} />
            <span className="text-[11px] text-slate-600 capitalize">{seg.segmentName}</span>
            <span className="text-[10px] text-slate-400">({seg.percentage}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Expandable segment card built from engine data */
function SegmentCard({ seg, rank }: { seg: SegmentProfile; rank: number }) {
  const [expanded, setExpanded] = useState(false);
  const isMotivation = seg.layer === 'motivation';
  const quoteBorderClass = isMotivation ? 'border-blue-400' : 'border-violet-400';
  const maxBenefit = Math.max(...seg.topBenefits.map((b) => b.percentage), 1);
  const maxPain = Math.max(...seg.topPains.map((p) => p.percentage), 1);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-5 flex items-center gap-4 text-left hover:bg-slate-50/50 transition-colors"
      >
        <div className={`w-10 h-10 rounded-full ${isMotivation ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'} flex items-center justify-center font-bold text-sm shrink-0`}>
          {rank}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-slate-800 text-base capitalize">{seg.segmentName}</h3>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
              isMotivation ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-violet-50 text-violet-600 border-violet-200'
            }`}>
              {isMotivation ? 'Motivation' : 'Identity'}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-sm text-slate-500">
            <span>{seg.totalReviews.toLocaleString()} reviews ({seg.percentage}%)</span>
            <Stars rating={seg.averageRating} />
            <span className="text-xs">{seg.averageRating}/5</span>
            <span className="text-xs text-emerald-600">{seg.fiveStarPercent}% {'\u2605'}5</span>
          </div>
        </div>
        <span className={`text-slate-400 transition-transform text-lg ${expanded ? 'rotate-180' : ''}`}>
          {'\u25BC'}
        </span>
      </button>

      {expanded && (
        <div className="px-6 pb-6 border-t border-slate-100">
          {/* Product split */}
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(seg.byProduct).map(([product, data]) => (
              <div key={product} className="bg-slate-50 rounded-lg px-3 py-1.5 text-xs">
                <span className="font-medium text-slate-700">{product}</span>
                <span className="text-slate-500 ml-1">{data.count.toLocaleString()} ({data.percentage}%)</span>
              </div>
            ))}
          </div>

          {/* Benefits + Pains side by side */}
          <div className="grid md:grid-cols-2 gap-5 mt-5">
            {seg.topBenefits.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2">{'\u2705'} Top Benefits</h4>
                <div className="space-y-2">
                  {seg.topBenefits.map((b) => (
                    <div key={b.name} className="flex items-center gap-2">
                      <span className="text-xs text-slate-600 w-24 shrink-0 truncate capitalize" title={b.name}>{b.name}</span>
                      <Bar value={b.percentage} max={maxBenefit} color="emerald" />
                      <span className="text-xs font-semibold text-slate-500 w-10 text-right">{b.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {seg.topPains.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-rose-600 uppercase tracking-wider mb-2">{'\u{1F534}'} Top Pain Points</h4>
                <div className="space-y-2">
                  {seg.topPains.map((p) => (
                    <div key={p.name} className="flex items-center gap-2">
                      <span className="text-xs text-slate-600 w-24 shrink-0 truncate capitalize" title={p.name}>{p.name}</span>
                      <Bar value={p.percentage} max={maxPain} color="rose" />
                      <span className="text-xs font-semibold text-slate-500 w-10 text-right">{p.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Transformations */}
          {seg.topTransformations.length > 0 && (
            <div className="mt-5">
              <h4 className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2">{'\u{1F4AB}'} Transformation Language</h4>
              <div className="flex flex-wrap gap-2">
                {seg.topTransformations.map((t) => (
                  <span key={t.name} className="inline-block bg-amber-50 text-amber-800 border border-amber-200 text-xs px-2.5 py-1 rounded-full capitalize">
                    {t.name} ({t.percentage}%)
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Representative Quotes */}
          {seg.representativeQuotes.length > 0 && (
            <div className="mt-5">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Customer Voice</h4>
              <div className="space-y-2">
                {seg.representativeQuotes.slice(0, 3).map((q, i) => (
                  <div key={i} className={`bg-slate-50 rounded-xl p-3 border-l-4 ${quoteBorderClass}`}>
                    <p className="text-xs text-slate-600 italic leading-relaxed">
                      "{q.length > 200 ? q.slice(0, 200) + '...' : q}"
                    </p>
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

/* ── Markdown styling classes ─────────────────────────────────────────────── */

const markdownComponents = {
  h1: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className="text-xl font-bold text-slate-800 mt-6 mb-3" {...props}>{children}</h1>
  ),
  h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="text-lg font-bold text-slate-700 mt-5 mb-2 pb-1 border-b border-slate-200" {...props}>{children}</h2>
  ),
  h3: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="text-base font-semibold text-slate-700 mt-4 mb-1.5" {...props}>{children}</h3>
  ),
  p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="text-sm text-slate-700 leading-relaxed mb-3" {...props}>{children}</p>
  ),
  ul: ({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="text-sm text-slate-700 space-y-1 mb-3 ml-4 list-disc" {...props}>{children}</ul>
  ),
  ol: ({ children, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="text-sm text-slate-700 space-y-1 mb-3 ml-4 list-decimal" {...props}>{children}</ol>
  ),
  li: ({ children, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="leading-relaxed" {...props}>{children}</li>
  ),
  blockquote: ({ children, ...props }: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote className="border-l-4 border-blue-400 bg-blue-50/50 rounded-r-lg px-4 py-2 my-3 text-sm text-slate-700 italic" {...props}>{children}</blockquote>
  ),
  strong: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-semibold text-slate-800" {...props}>{children}</strong>
  ),
  table: ({ children, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="overflow-x-auto my-3">
      <table className="min-w-full text-sm border border-slate-200 rounded-lg overflow-hidden" {...props}>{children}</table>
    </div>
  ),
  thead: ({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead className="bg-slate-50" {...props}>{children}</thead>
  ),
  th: ({ children, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200" {...props}>{children}</th>
  ),
  td: ({ children, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <td className="px-3 py-2 text-slate-700 border-b border-slate-100" {...props}>{children}</td>
  ),
  hr: (props: React.HTMLAttributes<HTMLHRElement>) => (
    <hr className="my-4 border-slate-200" {...props} />
  ),
};

/* ── Main Component ───────────────────────────────────────────────────────── */

interface Props {
  content: string;           // Claude's markdown narrative
  title: string;
  breakdown: SegmentBreakdown | null;  // Deterministic engine data
  onBack: () => void;
  onRegenerate: () => void;
  loading?: boolean;
  error?: string | null;
  isDeepDive?: boolean;
  onBackToBuilder?: () => void;
}

export default function SegmentResultsView({
  content,
  title,
  breakdown,
  onBack,
  onRegenerate,
  loading,
  error,
  isDeepDive = false,
  onBackToBuilder,
}: Props) {
  // ── Loading state ───────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
          <div className="text-5xl mb-6 animate-pulse">{'\u{1F4CA}'}</div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Building Segment Dashboard...</h2>
          <p className="text-slate-500">Enriching your segments with strategic intelligence</p>
        </div>
      </div>
    );
  }

  // ── Error state ─────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
          <div className="text-5xl mb-6">{'\u274C'}</div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Error</h2>
          <p className="text-red-500 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            {onBackToBuilder && (
              <button onClick={onBackToBuilder} className="px-4 py-2 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Edit Selections</button>
            )}
            <button onClick={onBack} className="px-4 py-2 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Dashboard</button>
            <button onClick={onRegenerate} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Try Again</button>
          </div>
        </div>
      </div>
    );
  }

  const motivationSegs = breakdown?.segments.filter((s) => s.layer === 'motivation') ?? [];
  const identitySegs = breakdown?.segments.filter((s) => s.layer === 'identity') ?? [];
  const totalSegmented = breakdown
    ? breakdown.totalReviews - breakdown.unsegmented.count
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">

        {/* ── Header Bar ──────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            {onBackToBuilder && (
              <>
                <button onClick={onBackToBuilder} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">{'\u2190'} Edit Selections</button>
                <span className="text-slate-300">|</span>
              </>
            )}
            <button onClick={onBack} className={`text-sm ${onBackToBuilder ? 'text-slate-400 hover:text-slate-600' : 'text-slate-500 hover:text-slate-700 flex items-center gap-1'}`}>
              {onBackToBuilder ? 'Dashboard' : '\u2190 Back to Dashboard'}
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => navigator.clipboard.writeText(content)} className="px-3 py-1.5 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Copy</button>
            <button onClick={() => { const blob = new Blob([content], { type: 'text/markdown' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'segment-analysis.md'; a.click(); URL.revokeObjectURL(url); }} className="px-3 py-1.5 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">.md</button>
            <button onClick={() => downloadAsDoc(content, title)} className="px-3 py-1.5 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">.doc</button>
            <button onClick={() => downloadAsPdf(content, title)} className="px-3 py-1.5 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">.pdf</button>
            <button onClick={onRegenerate} className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Regenerate</button>
          </div>
        </div>

        {/* ── KPI Strip (from engine data) ────────────────────────── */}
        {breakdown && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 mb-6">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-lg shrink-0">{'\u{1F3AF}'}</div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-tight">{title}</h1>
                <p className="text-slate-500 text-sm mt-1">
                  {breakdown.totalReviews.toLocaleString()} reviews analyzed &bull;{' '}
                  {totalSegmented.toLocaleString()} segmented ({(100 - breakdown.unsegmented.percentage).toFixed(1)}%)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-blue-700">{motivationSegs.length + identitySegs.length}</div>
                <div className="text-[11px] text-blue-600 uppercase tracking-wider mt-1">Segments</div>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-emerald-700">{motivationSegs.length}</div>
                <div className="text-[11px] text-emerald-600 uppercase tracking-wider mt-1">Motivation</div>
              </div>
              <div className="bg-violet-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-violet-700">{identitySegs.length}</div>
                <div className="text-[11px] text-violet-600 uppercase tracking-wider mt-1">Identity</div>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-amber-700">{breakdown.multiSegment.percentage}%</div>
                <div className="text-[11px] text-amber-600 uppercase tracking-wider mt-1">Multi-Segment</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-slate-700">{breakdown.unsegmented.percentage}%</div>
                <div className="text-[11px] text-slate-500 uppercase tracking-wider mt-1">Unsegmented</div>
              </div>
            </div>
          </div>
        )}

        {/* ── Segment Distribution Charts (from engine data) ───────── */}
        {motivationSegs.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-4">
            <h2 className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-4">Motivation Segments (Why They Buy)</h2>
            <SegmentSizeChart segments={motivationSegs} layer="motivation" />
          </div>
        )}

        {identitySegs.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
            <h2 className="text-sm font-semibold text-violet-600 uppercase tracking-wider mb-4">Identity Segments (Who They Are)</h2>
            <SegmentSizeChart segments={identitySegs} layer="identity" />
          </div>
        )}

        {/* ── Expandable Segment Cards (from engine data) ──────────── */}
        {breakdown && breakdown.segments.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3 px-1">
              Segment Details — click to expand
            </h2>
            <div className="space-y-3">
              {breakdown.segments.map((seg, idx) => (
                <SegmentCard key={seg.segmentName} seg={seg} rank={idx + 1} />
              ))}
            </div>
          </div>
        )}

        {/* ── AI Strategic Narrative (Claude markdown) ─────────────── */}
        {content && content.trim().length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 mb-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-sm text-white">{'\u{1F4A1}'}</div>
              <h2 className="text-base font-bold text-slate-800">
                {isDeepDive ? 'Deep Strategic Analysis' : 'Strategic Overview'}
              </h2>
              <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">AI-Generated</span>
            </div>
            <div className="prose-sm max-w-none">
              <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {content}
              </Markdown>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
