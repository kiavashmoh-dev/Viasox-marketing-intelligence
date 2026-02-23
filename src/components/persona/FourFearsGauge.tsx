/**
 * FourFearsGauge — Visual bar gauge for the Four Fears (DTC personas only).
 * Each fear is rated 1-5. Bars fill with severity-appropriate colors.
 */

import type { FourFearsData } from './personaParser';

const FEAR_LABELS: { key: keyof FourFearsData; label: string; short: string }[] = [
  { key: 'lossOfIndependence', label: 'Loss of Independence', short: 'Independence' },
  { key: 'becomingBurden', label: 'Becoming a Burden', short: 'Burden' },
  { key: 'physicalDecline', label: 'Physical Decline', short: 'Decline' },
  { key: 'medicalDeviceStigma', label: 'Medical Device Stigma', short: 'Stigma' },
];

function segmentColor(level: number, value: number): string {
  if (level > value) return 'bg-slate-100';
  if (value >= 4) return 'bg-rose-400';
  if (value >= 3) return 'bg-amber-400';
  return 'bg-emerald-400';
}

function severityLabel(value: number): { text: string; color: string } {
  if (value === 0) return { text: 'N/A', color: 'text-slate-400' };
  if (value >= 4) return { text: 'High', color: 'text-rose-600' };
  if (value >= 3) return { text: 'Medium', color: 'text-amber-600' };
  return { text: 'Low', color: 'text-emerald-600' };
}

export default function FourFearsGauge({ fears }: { fears: FourFearsData }) {
  return (
    <div className="space-y-3.5">
      {FEAR_LABELS.map(({ key, label, short }) => {
        const value = fears[key];
        const severity = severityLabel(value);
        return (
          <div key={key}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-slate-700">
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{short}</span>
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-semibold ${severity.color}`}>
                  {severity.text}
                </span>
                <span className="text-xs font-bold text-slate-800 w-6 text-right">
                  {value > 0 ? `${value}/5` : '--'}
                </span>
              </div>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(level => (
                <div
                  key={level}
                  className={`h-3 flex-1 rounded-sm transition-all duration-500 ${segmentColor(level, value)}`}
                />
              ))}
            </div>
          </div>
        );
      })}
      <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
        Fear intensity rated 1-5. Higher = stronger barrier to purchase. Use these to craft ad hooks that directly address each fear.
      </p>
    </div>
  );
}
