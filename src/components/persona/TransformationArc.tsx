/**
 * TransformationArc — Visual BEFORE → TURNING POINT → AFTER timeline.
 * Shows the customer journey in 3 connected cards (DTC only).
 */

import type { TransformationArcData } from './personaParser';

const PHASES: {
  key: keyof TransformationArcData;
  label: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
  icon: string;
}[] = [
  {
    key: 'before',
    label: 'BEFORE',
    borderColor: 'border-t-rose-400',
    bgColor: 'bg-rose-50',
    textColor: 'text-rose-700',
    icon: '\uD83D\uDE1E',
  },
  {
    key: 'turningPoint',
    label: 'TURNING POINT',
    borderColor: 'border-t-amber-400',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    icon: '\uD83D\uDCA1',
  },
  {
    key: 'after',
    label: 'AFTER',
    borderColor: 'border-t-emerald-400',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    icon: '\u2728',
  },
];

export default function TransformationArc({ arc }: { arc: TransformationArcData }) {
  return (
    <div>
      {/* Desktop: horizontal row */}
      <div className="hidden md:flex items-stretch gap-0">
        {PHASES.map((phase, i) => {
          const text = arc[phase.key];
          const trimmed = text.length > 250 ? text.slice(0, 250) + '...' : text;
          return (
            <div key={phase.key} className="flex items-stretch flex-1 min-w-0">
              <div className={`flex-1 border-t-4 ${phase.borderColor} ${phase.bgColor} rounded-lg p-4`}>
                <div className={`text-[10px] font-bold uppercase tracking-widest ${phase.textColor} mb-2`}>
                  {phase.icon} {phase.label}
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {trimmed || <span className="text-slate-400 italic">Not specified</span>}
                </p>
              </div>
              {/* Arrow connector between cards */}
              {i < PHASES.length - 1 && (
                <div className="flex items-center px-2 text-slate-300 shrink-0">
                  <svg width="20" height="16" viewBox="0 0 20 16" fill="none" className="text-slate-300">
                    <path d="M0 8H16M16 8L10 2M16 8L10 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: vertical stack */}
      <div className="md:hidden space-y-2">
        {PHASES.map((phase, i) => {
          const text = arc[phase.key];
          const trimmed = text.length > 250 ? text.slice(0, 250) + '...' : text;
          return (
            <div key={phase.key}>
              <div className={`border-l-4 ${phase.borderColor.replace('border-t-', 'border-l-')} ${phase.bgColor} rounded-r-lg p-3`}>
                <div className={`text-[10px] font-bold uppercase tracking-widest ${phase.textColor} mb-1`}>
                  {phase.icon} {phase.label}
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {trimmed || <span className="text-slate-400 italic">Not specified</span>}
                </p>
              </div>
              {i < PHASES.length - 1 && (
                <div className="flex justify-center py-1 text-slate-300">
                  <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
                    <path d="M8 0V16M8 16L2 10M8 16L14 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
