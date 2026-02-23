/**
 * PersonaNavTabs — Tab bar to navigate between generated personas.
 * Horizontal tabs on desktop, dropdown on mobile.
 */

import type { ParsedPersona } from './personaParser';
import type { PersonaChannel } from '../../engine/types';

const CHANNEL_COLORS: Record<PersonaChannel, { active: string; ring: string }> = {
  DTC: { active: 'border-blue-500 text-blue-700 bg-blue-50', ring: 'ring-blue-200' },
  Retail: { active: 'border-emerald-500 text-emerald-700 bg-emerald-50', ring: 'ring-emerald-200' },
  Wholesale: { active: 'border-violet-500 text-violet-700 bg-violet-50', ring: 'ring-violet-200' },
};

interface Props {
  personas: ParsedPersona[];
  activeIndex: number;
  onSelect: (index: number) => void;
  channel: PersonaChannel;
}

export default function PersonaNavTabs({ personas, activeIndex, onSelect, channel }: Props) {
  if (personas.length <= 1) return null;

  const colors = CHANNEL_COLORS[channel];

  return (
    <div className="mb-6">
      {/* Desktop: horizontal scrollable tabs */}
      <div className="hidden md:block overflow-x-auto">
        <div className="flex gap-1 border-b border-slate-200 pb-0">
          {personas.map((persona, i) => {
            const isActive = i === activeIndex;
            const truncatedName = persona.personaName.length > 30
              ? persona.personaName.slice(0, 28) + '...'
              : persona.personaName;
            return (
              <button
                key={i}
                onClick={() => onSelect(i)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? `${colors.active} border-b-2`
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                  isActive
                    ? 'bg-white shadow-sm border border-slate-200'
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {i + 1}
                </span>
                {truncatedName}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile: dropdown select */}
      <div className="md:hidden">
        <select
          value={activeIndex}
          onChange={(e) => onSelect(parseInt(e.target.value, 10))}
          className={`w-full px-4 py-2.5 border-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 ${colors.ring} ${
            colors.active.replace('bg-', 'bg-white border-').split(' ').slice(0, 2).join(' ')
          }`}
        >
          {personas.map((persona, i) => (
            <option key={i} value={i}>
              {i + 1}. {persona.personaName}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
