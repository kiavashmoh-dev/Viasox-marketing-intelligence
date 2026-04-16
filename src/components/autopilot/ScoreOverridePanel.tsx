import { useState } from 'react';
import type { ScoringRecord, CriterionName } from '../../autopilot/memoryTypes';
import { SCORING_CRITERIA, CRITERION_LABELS, WEIGHTED_CRITERIA } from '../../autopilot/memoryTypes';

interface Props {
  briefId: string;
  scoring: ScoringRecord | null;
  /** Legacy score for briefs without scoring breakdown. */
  legacyScore: number;
  onOverride: (score: number, notes: string) => void;
}

function scoreColor(score: number): string {
  if (score <= 4) return 'text-red-600 bg-red-50';
  if (score <= 6) return 'text-amber-600 bg-amber-50';
  return 'text-emerald-600 bg-emerald-50';
}

function resultBadge(result: 'PASS' | 'FLAG' | 'FAIL'): string {
  if (result === 'FAIL') return 'bg-red-100 text-red-700';
  if (result === 'FLAG') return 'bg-amber-100 text-amber-700';
  return 'bg-emerald-100 text-emerald-700';
}

export default function ScoreOverridePanel({ scoring, legacyScore, onOverride }: Props) {
  const [overrideMode, setOverrideMode] = useState(false);
  const [overrideScore, setOverrideScore] = useState('');
  const [overrideNotes, setOverrideNotes] = useState('');
  // Local override state — survives parent re-renders and avoids
  // reliance on the stale parsedReview cache in BatchResultsView.
  const [localOverride, setLocalOverride] = useState<{ score: number; notes: string } | null>(null);

  // Priority: local override (just set) > prop scoring > legacy
  const effectiveScore = localOverride?.score ?? scoring?.finalScore ?? legacyScore;
  const hasScore = localOverride != null || scoring != null || legacyScore > 0;
  const isOverridden = localOverride != null || scoring?.userOverrideScore != null;

  const handleSubmit = () => {
    const parsed = parseFloat(overrideScore);
    if (isNaN(parsed) || parsed < 1 || parsed > 10) return;
    onOverride(parsed, overrideNotes);
    // Immediately reflect the override in the UI without waiting
    // for the parent's stale parsedReview to re-derive.
    setLocalOverride({ score: parsed, notes: overrideNotes });
    setOverrideMode(false);
  };

  return (
    <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
      {/* Header with composite score */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className={`text-lg font-bold px-2.5 py-1 rounded-lg ${hasScore ? scoreColor(effectiveScore) : 'text-slate-400 bg-slate-100'}`}>
            {hasScore ? `${effectiveScore.toFixed(1)}/10` : 'Not scored'}
          </span>
          {isOverridden && (
            <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              Overridden by user
            </span>
          )}
          {!hasScore && (
            <span className="text-[10px] text-slate-400">
              QC review didn't return a score — use override to set one
            </span>
          )}
          {hasScore && scoring && !isOverridden && !localOverride && (
            <span className="text-[10px] text-slate-400">
              Reviewer score (weighted)
            </span>
          )}
        </div>
        {!overrideMode && (
          <button
            onClick={() => setOverrideMode(true)}
            className="text-[10px] text-blue-600 hover:text-blue-800 underline"
          >
            {isOverridden ? 'Change override' : 'Override score'}
          </button>
        )}
      </div>

      {/* Per-criterion breakdown */}
      {scoring?.reviewerBreakdown && (
        <div className="space-y-1.5 mb-3">
          {SCORING_CRITERIA.map((key: CriterionName) => {
            const entry = scoring.reviewerBreakdown[key];
            if (!entry) return null;
            const isWeighted = WEIGHTED_CRITERIA.includes(key);
            return (
              <div key={key} className="flex items-start gap-2 text-[11px]">
                <span className={`shrink-0 w-8 text-center font-mono font-semibold py-0.5 rounded ${scoreColor(entry.score)}`}>
                  {entry.score}
                </span>
                <span className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-medium ${resultBadge(entry.result)}`}>
                  {entry.result}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-slate-700">
                    {CRITERION_LABELS[key]}
                    {isWeighted && <span className="text-blue-500 ml-1">(1.5x)</span>}
                  </span>
                  {entry.notes && (
                    <p className="text-slate-400 mt-0.5 leading-snug">{entry.notes}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Override form */}
      {overrideMode && (
        <div className="border-t border-slate-200 pt-3 mt-3 space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-medium text-slate-600">Your score:</label>
            <input
              type="number"
              min={1}
              max={10}
              step={0.5}
              value={overrideScore}
              onChange={(e) => setOverrideScore(e.target.value)}
              placeholder="1-10"
              className="w-16 border border-slate-300 rounded px-2 py-1 text-xs text-center focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-[10px] text-slate-400">/10</span>
          </div>
          <textarea
            value={overrideNotes}
            onChange={(e) => setOverrideNotes(e.target.value)}
            placeholder="Why are you overriding? (e.g., 'Hooks are weaker than the reviewer thinks — too generic for this angle')"
            className="w-full border border-slate-200 rounded-lg p-2 text-[11px] text-slate-700 resize-none focus:ring-2 focus:ring-blue-500"
            rows={2}
          />
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={!overrideScore || parseFloat(overrideScore) < 1 || parseFloat(overrideScore) > 10}
              className="text-[11px] bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Save Override
            </button>
            <button
              onClick={() => setOverrideMode(false)}
              className="text-[11px] text-slate-500 hover:text-slate-700 px-3 py-1.5"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Show previous override notes */}
      {isOverridden && !overrideMode && (localOverride?.notes || scoring?.userOverrideNotes) && (
        <div className="text-[10px] text-slate-400 mt-2 italic">
          Override notes: "{localOverride?.notes || scoring?.userOverrideNotes}"
        </div>
      )}
    </div>
  );
}
