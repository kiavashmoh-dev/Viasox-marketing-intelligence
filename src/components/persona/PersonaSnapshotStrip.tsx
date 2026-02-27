/**
 * PersonaSnapshotStrip — Compact card grid showing each generated persona's
 * key stats at a glance. Replaces the old KPI summary strip.
 *
 * Data: parsedPersonas for names/sections, getEnrichedSegment() for sales
 * metrics, segmentBreakdown for review counts.
 */

import type { ParsedPersona } from './personaParser';
import type { PersonaChannel, ProductCategory, FullAnalysis } from '../../engine/types';
import { getEnrichedSegment, hasSalesEnrichment } from '../../data/salesEnrichmentLoader';
import { DISPLAY_NAME_MAP } from '../../utils/segmentNames';

interface Props {
  personas: ParsedPersona[];
  selectedPersonas: string[];
  product: ProductCategory;
  channel: PersonaChannel;
  analysis: FullAnalysis;
  includeMarket: boolean;
}

const CHANNEL_COLORS: Record<PersonaChannel, { bg: string; text: string; badge: string }> = {
  DTC: { bg: 'bg-blue-50', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700' },
  Retail: { bg: 'bg-emerald-50', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' },
  Wholesale: { bg: 'bg-violet-50', text: 'text-violet-700', badge: 'bg-violet-100 text-violet-700' },
};

function fmtRev(v: number): string {
  return v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${(v / 1_000).toFixed(0)}K`;
}

function getSegmentLayer(name: string, analysis: FullAnalysis): 'identity' | 'motivation' | null {
  const sb = analysis.segmentBreakdown;
  if (!sb) return null;
  for (const seg of sb.segments) {
    const display = DISPLAY_NAME_MAP.get(seg.segmentName.toLowerCase()) ?? seg.segmentName;
    if (display.toLowerCase() === name.toLowerCase() || seg.segmentName.toLowerCase() === name.toLowerCase()) {
      return seg.layer;
    }
  }
  return null;
}

function scrollToPersona(index: number) {
  const el = document.getElementById(`persona-${index}`);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function PersonaSnapshotStrip({ personas, selectedPersonas, product, channel, analysis, includeMarket }: Props) {
  const colors = CHANNEL_COLORS[channel];
  const hasSales = hasSalesEnrichment();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
      {/* Title */}
      <div className="flex items-start gap-3 mb-5">
        <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center text-lg shrink-0`}>
          {'\uD83C\uDFAD'}
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-tight">Persona Analysis</h1>
          <p className="text-slate-500 text-sm mt-1">
            {personas.length} analysis section{personas.length !== 1 ? 's' : ''} generated for{' '}
            <span className="font-medium text-slate-700">{product}</span>
            {' via '}
            <span className={`font-medium ${colors.text}`}>{channel}</span>
            {includeMarket ? ' with market analysis' : ''}
          </p>
        </div>
      </div>

      {/* Persona Cards Grid */}
      <div className={`grid gap-3 ${
        personas.length <= 2 ? 'grid-cols-1 sm:grid-cols-2'
          : personas.length <= 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
      }`}>
        {personas.map((persona, i) => {
          // Try to match persona name to a known segment for sales lookup
          const matchedSegment = selectedPersonas.find(sp =>
            persona.personaName.toLowerCase().includes(sp.toLowerCase())
            || sp.toLowerCase().includes(persona.personaName.toLowerCase().replace(/^the\s+/i, ''))
          );
          const enriched = matchedSegment ? getEnrichedSegment(matchedSegment) : undefined;
          const sales = enriched?.sales;
          const layer = matchedSegment ? getSegmentLayer(matchedSegment, analysis) : null;

          return (
            <button
              key={i}
              onClick={() => scrollToPersona(i)}
              className="text-left p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all bg-slate-50/50 group"
            >
              {/* Header: number + name */}
              <div className="flex items-center gap-2.5 mb-2">
                <span className={`w-7 h-7 rounded-full ${colors.bg} flex items-center justify-center text-xs font-bold ${colors.text} shrink-0`}>
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm text-slate-800 truncate">{persona.personaName}</div>
                </div>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
                <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${colors.badge}`}>{channel}</span>
                {layer && (
                  <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                    layer === 'identity' ? 'bg-violet-100 text-violet-700' : 'bg-indigo-100 text-indigo-700'
                  }`}>
                    {layer === 'identity' ? 'Who' : 'Why'}
                  </span>
                )}
                <span className="text-[9px] text-slate-400">{persona.sections.length} sections</span>
              </div>

              {/* Sales metrics */}
              {hasSales && sales ? (
                <div className="grid grid-cols-3 gap-1.5">
                  <div className="bg-emerald-50 rounded-lg px-2 py-1.5 text-center">
                    <div className="text-xs font-bold text-emerald-700">{fmtRev(sales.totalRevenue)}</div>
                    <div className="text-[8px] text-emerald-600 uppercase">Revenue</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg px-2 py-1.5 text-center">
                    <div className="text-xs font-bold text-blue-700">${sales.avgLifetimeValue}</div>
                    <div className="text-[8px] text-blue-600 uppercase">LTV</div>
                  </div>
                  <div className="bg-violet-50 rounded-lg px-2 py-1.5 text-center">
                    <div className="text-xs font-bold text-violet-700">{sales.repeatPurchaseRate}%</div>
                    <div className="text-[8px] text-violet-600 uppercase">Repeat</div>
                  </div>
                </div>
              ) : (
                <div className="text-[10px] text-slate-400 italic">No sales data linked</div>
              )}

              {/* Jump indicator */}
              <div className="mt-2 text-[10px] text-slate-400 group-hover:text-blue-500 transition-colors flex items-center gap-1">
                <span>{'\u2193'}</span> Jump to persona
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
