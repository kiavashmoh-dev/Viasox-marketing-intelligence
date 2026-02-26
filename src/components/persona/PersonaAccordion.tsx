/**
 * PersonaAccordion — Vertical list of ALL generated personas with
 * expand/collapse. Replaces the old tab-based navigation that only
 * showed one persona at a time.
 */

import { useState, useCallback } from 'react';
import type { ParsedPersona } from './personaParser';
import type { PersonaChannel, ProductCategory, FullAnalysis } from '../../engine/types';
import PersonaCard from './PersonaCard';

interface Props {
  personas: ParsedPersona[];
  channel: PersonaChannel;
  product: ProductCategory;
  analysis: FullAnalysis;
  includeMarket: boolean;
}

const CHANNEL_HEADER: Record<PersonaChannel, { gradient: string; badge: string }> = {
  DTC: { gradient: 'from-blue-600 to-blue-700', badge: 'bg-blue-500' },
  Retail: { gradient: 'from-emerald-600 to-emerald-700', badge: 'bg-emerald-500' },
  Wholesale: { gradient: 'from-violet-600 to-violet-700', badge: 'bg-violet-500' },
};

export default function PersonaAccordion({ personas, channel, product, analysis, includeMarket }: Props) {
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set([0]));

  const toggle = useCallback((index: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const allExpanded = expanded.size === personas.length;

  const expandAll = useCallback(() => {
    setExpanded(new Set(personas.map((_, i) => i)));
  }, [personas]);

  const collapseAll = useCallback(() => {
    setExpanded(new Set());
  }, []);

  if (personas.length === 0) return null;

  const colors = CHANNEL_HEADER[channel];

  return (
    <div className="space-y-3 mb-6">
      {/* Expand/Collapse All */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">
          {personas.length} Persona{personas.length !== 1 ? 's' : ''}
        </h3>
        <button
          onClick={allExpanded ? collapseAll : expandAll}
          className="text-xs text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
        >
          {allExpanded ? 'Collapse All' : 'Expand All'}
        </button>
      </div>

      {personas.map((persona, i) => {
        const isExpanded = expanded.has(i);
        return (
          <div
            key={i}
            id={`persona-${i}`}
            className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
          >
            {/* Accordion Header — always visible */}
            <button
              onClick={() => toggle(i)}
              className={`w-full bg-gradient-to-r ${colors.gradient} px-6 py-4 flex items-center gap-3 text-left transition-all hover:opacity-95`}
            >
              <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-white truncate">{persona.personaName}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${colors.badge} text-white/90`}>
                    {channel}
                  </span>
                  <span className="text-[10px] text-white/60">
                    {persona.sections.length} sections
                  </span>
                </div>
              </div>
              <span className={`text-white/70 transition-transform duration-200 text-sm ${isExpanded ? 'rotate-180' : ''}`}>
                {'\u25BC'}
              </span>
            </button>

            {/* Accordion Body — conditionally rendered */}
            {isExpanded && (
              <PersonaCard
                persona={persona}
                index={i}
                channel={channel}
                product={product}
                analysis={analysis}
                includeMarket={includeMarket}
                hideHeader
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
