/**
 * PersonaCard — Individual persona card with collapsible sections.
 * Channel-aware: renders DTC-specific components (FourFearsGauge,
 * TransformationArc) only for DTC channel.
 * All sections fall through to styled markdown if custom rendering fails.
 */

import { useState, useCallback } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { PersonaChannel, ProductCategory, FullAnalysis } from '../../engine/types';
import type { ParsedPersona } from './personaParser';
import { getSectionStyle, extractMarketComparison, styleCitationMarkers } from './personaParser';
import FourFearsGauge from './FourFearsGauge';
import TransformationArc from './TransformationArc';
import MarketComparisonBar from './MarketComparisonBar';

/* ── Markdown Custom Components ─────────────────────────────────────────── */

const markdownComponents = {
  h1: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className="text-lg font-bold text-slate-800 mt-4 mb-2" {...props}>{children}</h1>
  ),
  h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="text-base font-bold text-slate-700 mt-3 mb-1.5" {...props}>{children}</h2>
  ),
  h3: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="text-sm font-semibold text-slate-700 mt-3 mb-1" {...props}>{children}</h3>
  ),
  h4: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h4 className="text-sm font-semibold text-slate-600 mt-2 mb-1" {...props}>{children}</h4>
  ),
  p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="text-sm text-slate-700 leading-relaxed mb-2.5" {...props}>{children}</p>
  ),
  ul: ({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="text-sm text-slate-700 space-y-1 mb-2.5 ml-4 list-disc" {...props}>{children}</ul>
  ),
  ol: ({ children, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="text-sm text-slate-700 space-y-1 mb-2.5 ml-4 list-decimal" {...props}>{children}</ol>
  ),
  li: ({ children, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="leading-relaxed" {...props}>{children}</li>
  ),
  blockquote: ({ children, ...props }: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote className="border-l-4 border-blue-300 bg-blue-50/50 rounded-r-lg px-4 py-2 my-2.5 text-sm text-slate-700 italic" {...props}>{children}</blockquote>
  ),
  strong: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-semibold text-slate-800" {...props}>{children}</strong>
  ),
  table: ({ children, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="overflow-x-auto my-2.5">
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
    <hr className="my-3 border-slate-200" {...props} />
  ),
};

/* ── Channel Color Map ──────────────────────────────────────────────────── */

const CHANNEL_HEADER_COLORS: Record<PersonaChannel, { gradient: string; badge: string }> = {
  DTC: { gradient: 'from-blue-600 to-blue-700', badge: 'bg-blue-500' },
  Retail: { gradient: 'from-emerald-600 to-emerald-700', badge: 'bg-emerald-500' },
  Wholesale: { gradient: 'from-violet-600 to-violet-700', badge: 'bg-violet-500' },
};

const SECTION_ACCENT_MAP: Record<string, string> = {
  blue: 'border-l-blue-400',
  violet: 'border-l-violet-400',
  amber: 'border-l-amber-400',
  rose: 'border-l-rose-400',
  emerald: 'border-l-emerald-400',
  cyan: 'border-l-cyan-400',
  indigo: 'border-l-indigo-400',
  teal: 'border-l-teal-400',
  slate: 'border-l-slate-400',
};

/* ── Quote Block ────────────────────────────────────────────────────────── */

function QuoteBlock({ quote, accentClass }: { quote: string; accentClass: string }) {
  const trimmed = quote.length > 250 ? quote.slice(0, 250) + '...' : quote;
  return (
    <div className={`bg-slate-50 rounded-r-xl p-3.5 border-l-4 ${accentClass}`}>
      <p className="text-xs text-slate-600 italic leading-relaxed">
        &ldquo;{trimmed}&rdquo;
      </p>
    </div>
  );
}

/* ── Main PersonaCard ───────────────────────────────────────────────────── */

interface Props {
  persona: ParsedPersona;
  index: number;
  channel: PersonaChannel;
  product: ProductCategory;
  analysis: FullAnalysis;
  includeMarket: boolean;
}

export default function PersonaCard({ persona, index, channel, product: _product, analysis: _analysis, includeMarket: _includeMarket }: Props) {
  // Start with the first section (snapshot) expanded
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (persona.sections.length > 0) {
      // Auto-expand first 2 sections (usually name/archetype + snapshot)
      initial.add(persona.sections[0].sectionKey + '_0');
      if (persona.sections.length > 1) initial.add(persona.sections[1].sectionKey + '_1');
    }
    return initial;
  });

  const toggleSection = useCallback((uniqueKey: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(uniqueKey)) next.delete(uniqueKey);
      else next.add(uniqueKey);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpandedSections(new Set(persona.sections.map((s, i) => s.sectionKey + '_' + i)));
  }, [persona.sections]);

  const collapseAll = useCallback(() => {
    setExpandedSections(new Set());
  }, []);

  const allExpanded = expandedSections.size === persona.sections.length;

  const headerColors = CHANNEL_HEADER_COLORS[channel];
  const quoteAccent = channel === 'DTC' ? 'border-l-blue-400'
    : channel === 'Retail' ? 'border-l-emerald-400'
    : 'border-l-violet-400';

  // If parsing failed, render raw markdown
  if (persona.sections.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className={`bg-gradient-to-r ${headerColors.gradient} px-6 py-5`}>
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
              {index + 1}
            </span>
            <h2 className="text-lg font-bold text-white">{persona.personaName}</h2>
          </div>
        </div>
        <div className="p-6">
          <div className="prose prose-sm prose-slate max-w-none">
            <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {persona.rawMarkdown}
            </Markdown>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* ── Card Header ── */}
      <div className={`bg-gradient-to-r ${headerColors.gradient} px-6 py-5`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
              {index + 1}
            </span>
            <div>
              <h2 className="text-lg font-bold text-white">{persona.personaName}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${headerColors.badge} text-white/90`}>
                  {channel}
                </span>
                <span className="text-xs text-white/70">
                  {persona.sections.length} sections
                </span>
              </div>
            </div>
          </div>
          {/* Expand/Collapse toggle */}
          <button
            onClick={allExpanded ? collapseAll : expandAll}
            className="text-xs text-white/80 hover:text-white bg-white/10 px-3 py-1.5 rounded-lg transition-colors"
          >
            {allExpanded ? 'Collapse All' : 'Expand All'}
          </button>
        </div>
      </div>

      {/* ── Sections ── */}
      <div className="divide-y divide-slate-100">
        {persona.sections.map((section, sIdx) => {
          const uniqueKey = section.sectionKey + '_' + sIdx;
          const isExpanded = expandedSections.has(uniqueKey);
          const style = getSectionStyle(section.sectionKey);
          const accentBorder = SECTION_ACCENT_MAP[style.color] ?? 'border-l-slate-400';

          return (
            <div key={uniqueKey}>
              {/* Section Header — clickable */}
              <button
                onClick={() => toggleSection(uniqueKey)}
                className="w-full px-6 py-4 flex items-center gap-3 text-left hover:bg-slate-50/50 transition-colors"
              >
                <span className="text-base shrink-0">{style.icon}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-slate-800">
                    {section.heading}
                  </span>
                </div>
                <span className={`text-slate-400 transition-transform text-xs ${isExpanded ? 'rotate-180' : ''}`}>
                  {'\u25BC'}
                </span>
              </button>

              {/* Section Content */}
              {isExpanded && (
                <div className={`px-6 pb-5 border-l-4 ml-4 mr-4 mb-2 rounded-bl-lg ${accentBorder}`}>
                  {/* DTC: Four Fears Gauge */}
                  {section.sectionKey === 'four_fears' && channel === 'DTC' && persona.fourFears ? (
                    <div>
                      <FourFearsGauge fears={persona.fourFears} />
                      {/* Also show the original narrative below */}
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                          {section.content}
                        </Markdown>
                      </div>
                    </div>
                  ) : /* DTC: Transformation Arc */
                  section.sectionKey === 'transformation_arc' && channel === 'DTC' && persona.transformationArc ? (
                    <div>
                      <TransformationArc arc={persona.transformationArc} />
                      {/* Narrative below */}
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                          {section.content}
                        </Markdown>
                      </div>
                    </div>
                  ) : /* Quotes Section */
                  section.isQuoteSection && persona.quotes.length > 0 ? (
                    <div className="space-y-2.5">
                      {persona.quotes.map((q, qi) => (
                        <QuoteBlock key={qi} quote={q} accentClass={quoteAccent} />
                      ))}
                      {/* Any remaining content */}
                      {section.content.length > 50 && (
                        <div className="mt-3">
                          <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                            {section.content}
                          </Markdown>
                        </div>
                      )}
                    </div>
                  ) : /* Market Opportunity — with citation styling */
                  section.sectionKey === 'market_opportunity' ? (
                    <div>
                      {(() => {
                        const comparison = extractMarketComparison(section.content);
                        return comparison ? <MarketComparisonBar data={comparison} /> : null;
                      })()}
                      <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                        {styleCitationMarkers(section.content)}
                      </Markdown>
                    </div>
                  ) : /* US vs CA Comparison — with flag badges and citation styling */
                  section.sectionKey === 'us_vs_ca_comparison' ? (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">{'\uD83C\uDDFA\uD83C\uDDF8'} US</span>
                        <span className="text-xs text-slate-400">vs</span>
                        <span className="text-sm bg-red-50 text-red-700 px-2 py-0.5 rounded-full font-medium">{'\uD83C\uDDE8\uD83C\uDDE6'} CA</span>
                      </div>
                      <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                        {styleCitationMarkers(section.content)}
                      </Markdown>
                    </div>
                  ) : (
                    /* Default: Styled Markdown */
                    <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                      {section.content}
                    </Markdown>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
