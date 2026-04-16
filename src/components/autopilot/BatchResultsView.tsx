import { useState, useMemo, useCallback } from 'react';
import type { AutopilotState } from '../../engine/autopilotTypes';
import type { AngleDirectiveProposal } from '../../autopilot/memoryTypes';
import TaskBriefCard from './TaskBriefCard';
import BatchChatPanel from './BatchChatPanel';
import ScoreOverridePanel from './ScoreOverridePanel';
import { downloadEcomBriefDoc, downloadProductionBriefCsv } from '../../utils/downloadUtils';
import {
  addFeedback,
  getPendingDirectiveProposals,
  dismissDirectiveProposal,
  updateBriefScore,
} from '../../autopilot/memoryStore';
import { parseReviewResult } from '../../autopilot/reviewParser';
import { recomputeAndSaveAnglePatterns } from '../../autopilot/anglePatternMiner';
import { recomputeAndSaveCalibration } from '../../autopilot/scoreCalibration';
import { addAngleDirective } from '../../utils/customOptionsRegistry';

interface Props {
  state: AutopilotState;
  apiKey: string;
  onReset: () => void;
  onRedoTask?: (taskIndex: number, feedback: string) => void;
  redoingIndex?: number | null;
}

export default function BatchResultsView({ state, apiKey, onReset, onRedoTask, redoingIndex }: Props) {
  const [reviewExpanded, setReviewExpanded] = useState(false);
  const [briefingExpanded, setBriefingExpanded] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSaved, setFeedbackSaved] = useState(false);

  // Pending angle-directive proposals from the proposer agent.
  // Re-read from the memory store whenever the batch phase changes (so a
  // freshly-completed batch picks up newly-generated proposals) and also
  // after any accept / dismiss action via the bumpable refreshTick.
  // state.phase + refreshTick are intentional cache-invalidation keys —
  // they don't appear in the body but they MUST trigger a re-read.
  const [editedDirectives, setEditedDirectives] = useState<Record<string, string>>({});
  const [refreshTick, setRefreshTick] = useState(0);
  const proposals = useMemo<AngleDirectiveProposal[]>(
    () => getPendingDirectiveProposals(),
    [state.phase, refreshTick], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const completed = state.tasks.filter((t) => t.step === 'complete');
  const failed = state.tasks.filter((t) => t.step === 'error');

  // Parse reviewer output for structured scoring data
  const parsedReview = useMemo(
    () => (state.reviewResult ? parseReviewResult(state.reviewResult) : null),
    [state.reviewResult],
  );

  // Bump to trigger parent re-render after score override (value unused — setter only)
  const [, setScoreTick] = useState(0);

  const handleScoreOverride = useCallback(
    (taskName: string, batchId: string, score: number, notes: string) => {
      updateBriefScore(batchId, taskName, score, notes);
      try { recomputeAndSaveAnglePatterns(); } catch { /* non-fatal */ }
      try { recomputeAndSaveCalibration(); } catch { /* non-fatal */ }
      setScoreTick((t) => t + 1);
    },
    [],
  );

  const handleAcceptProposal = (proposal: AngleDirectiveProposal) => {
    const directive = editedDirectives[proposal.id] ?? proposal.directiveText;
    if (!directive.trim()) return;
    addAngleDirective(proposal.angle, proposal.product, directive.trim());
    dismissDirectiveProposal(proposal.id);
    setRefreshTick((t) => t + 1);
  };

  const handleDismissProposal = (proposal: AngleDirectiveProposal) => {
    dismissDirectiveProposal(proposal.id);
    setRefreshTick((t) => t + 1);
  };

  // AGC briefs export as a production CSV (the editor pipeline depends
  // on that shape). Every other ad type exports as the standard Ecom
  // DOC template because the autopilot forces that output for all of
  // them. Split the "Download All" into two actions so the user gets a
  // single button per file kind when the batch is mixed.
  const agcCompleted = completed.filter(
    (ts) => ts.task.scriptParamsBase.adType === 'AGC (Actor Generated Content)',
  );
  const docCompleted = completed.filter(
    (ts) => ts.task.scriptParamsBase.adType !== 'AGC (Actor Generated Content)',
  );

  const handleExportAllDocs = () => {
    docCompleted.forEach((ts) => {
      if (ts.scriptResult) {
        downloadEcomBriefDoc(ts.scriptResult, ts.task.parsed.name);
      }
    });
  };
  const handleExportAllAgcCsvs = () => {
    agcCompleted.forEach((ts) => {
      if (ts.scriptResult) {
        downloadProductionBriefCsv(
          ts.scriptResult,
          ts.task.product,
          ts.task.scriptParamsBase.adType,
        );
      }
    });
  };

  const handleSaveFeedback = () => {
    if (!feedbackText.trim()) return;
    addFeedback({
      date: new Date().toISOString().split('T')[0],
      batchId: new Date().toISOString(),
      source: 'manual_feedback',
      content: feedbackText.trim(),
      context: `Batch with ${state.tasks.length} tasks: ${state.tasks.map((t) => t.task.parsed.name).join(', ')}`,
    });
    setFeedbackSaved(true);
  };

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-slate-800">Batch Complete</h3>
          <button
            onClick={onReset}
            className="text-sm text-slate-500 hover:text-slate-700 underline"
          >
            Start New Batch
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-emerald-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-emerald-700">{completed.length}</div>
            <div className="text-xs text-emerald-600">Briefs Generated</div>
          </div>
          <div className="bg-red-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-red-700">{failed.length}</div>
            <div className="text-xs text-red-600">Failed</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-700">{state.tasks.length}</div>
            <div className="text-xs text-blue-600">Total Tasks</div>
          </div>
        </div>

        {completed.length > 0 && (
          <div className="space-y-2">
            {docCompleted.length > 0 && (
              <button
                onClick={handleExportAllDocs}
                className="w-full py-2.5 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors"
              >
                Download All Ecom Briefs (.doc) — {docCompleted.length} file{docCompleted.length !== 1 ? 's' : ''}
              </button>
            )}
            {agcCompleted.length > 0 && (
              <button
                onClick={handleExportAllAgcCsvs}
                className="w-full py-2.5 bg-indigo-700 text-white rounded-lg text-sm font-medium hover:bg-indigo-800 transition-colors"
              >
                Download All AGC Briefs (.csv) — {agcCompleted.length} file{agcCompleted.length !== 1 ? 's' : ''}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Angle Directive Proposals — surfaced from the angle-directive proposer
          when the system has detected a repeating user revision pattern.
          Accepting writes the directive into customOptionsRegistry, so every
          future brief on that angle inherits it permanently. */}
      {proposals.length > 0 && (
        <div className="bg-white rounded-xl border border-amber-200 overflow-hidden">
          <div className="bg-amber-50 px-5 py-3 border-b border-amber-200 flex items-center gap-2">
            <span className="text-lg">{'\u2728'}</span>
            <div className="flex-1">
              <div className="text-sm font-semibold text-amber-900">
                Pattern Detected — {proposals.length} Angle Directive Proposal{proposals.length !== 1 ? 's' : ''}
              </div>
              <div className="text-[11px] text-amber-700">
                The system noticed you keep asking for the same change. Lock it in as a permanent rule for the angle so you never have to ask again.
              </div>
            </div>
          </div>
          <div className="divide-y divide-amber-100">
            {proposals.map((p) => {
              const value = editedDirectives[p.id] ?? p.directiveText;
              return (
                <div key={p.id} className="p-5 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-semibold uppercase tracking-wide bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                      {p.angle}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wide bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {p.product}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      from {p.evidence.length} redo event{p.evidence.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-600">Detected pattern:</span> {p.pattern}
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Permanent directive (edit before accepting)
                    </label>
                    <textarea
                      value={value}
                      onChange={(e) =>
                        setEditedDirectives((prev) => ({ ...prev, [p.id]: e.target.value }))
                      }
                      className="w-full border border-slate-200 rounded-lg p-3 text-xs text-slate-700 resize-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAcceptProposal(p)}
                      disabled={!value.trim()}
                      className="text-xs bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Accept &amp; Lock In
                    </button>
                    <button
                      onClick={() => handleDismissProposal(p)}
                      className="text-xs text-slate-500 hover:text-slate-700 px-3 py-2"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Creative Intelligence Used */}
      {state.memoryBriefing && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <button
            onClick={() => setBriefingExpanded(!briefingExpanded)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{'\uD83E\uDDE0'}</span>
              <span className="text-sm font-semibold text-slate-700">Creative Intelligence Used</span>
              <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Memory Active</span>
            </div>
            <span className="text-xs text-slate-400">{briefingExpanded ? 'Collapse' : 'Expand'}</span>
          </button>
          {briefingExpanded && (
            <div className="border-t border-slate-100 p-5">
              <p className="text-[10px] text-slate-400 mb-2">
                This briefing was generated by the Memory Curator and injected into all agents (concept generator, selector, script writer, and reviewer) for this batch.
              </p>
              <pre className="whitespace-pre-wrap text-xs leading-relaxed text-slate-700 font-sans bg-blue-50 rounded-lg p-4">
                {state.memoryBriefing}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Batch Review */}
      {state.reviewResult && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <button
            onClick={() => setReviewExpanded(!reviewExpanded)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{'\uD83D\uDD0D'}</span>
              <span className="text-sm font-semibold text-slate-700">QC Review Report</span>
            </div>
            <span className="text-xs text-slate-400">{reviewExpanded ? 'Collapse' : 'Expand'}</span>
          </button>
          {reviewExpanded && (
            <div className="border-t border-slate-100 p-5">
              <pre className="whitespace-pre-wrap text-xs leading-relaxed text-slate-700 font-sans">
                {state.reviewResult}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Individual Brief Cards with Score Panels */}
      <div className="space-y-3">
        {state.tasks.map((ts, i) => {
          const reviewMatch = parsedReview?.briefs.find(
            (b) => b.taskName.toLowerCase().includes(ts.task.parsed.name.toLowerCase()),
          );
          return (
            <div key={i}>
              <TaskBriefCard
                taskState={ts}
                index={i}
                onRedo={onRedoTask}
                isRedoing={redoingIndex === i}
              />
              {ts.step === 'complete' && (
                <div className="mt-2 ml-4">
                  <ScoreOverridePanel
                    briefId={ts.task.parsed.name}
                    scoring={reviewMatch?.scoring ?? null}
                    legacyScore={reviewMatch?.score ?? 0}
                    onOverride={(score, notes) =>
                      handleScoreOverride(
                        ts.task.parsed.name,
                        new Date().toISOString(),
                        score,
                        notes,
                      )
                    }
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Download All (bottom) */}
      {completed.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2">
          {docCompleted.length > 0 && (
            <button
              onClick={handleExportAllDocs}
              className="w-full py-3 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors flex items-center justify-center gap-2"
            >
              <span>{'\uD83D\uDCE5'}</span>
              Download All Ecom Briefs (.doc) — {docCompleted.length} file{docCompleted.length !== 1 ? 's' : ''}
            </button>
          )}
          {agcCompleted.length > 0 && (
            <button
              onClick={handleExportAllAgcCsvs}
              className="w-full py-3 bg-indigo-700 text-white rounded-lg text-sm font-medium hover:bg-indigo-800 transition-colors flex items-center justify-center gap-2"
            >
              <span>{'\uD83D\uDCE5'}</span>
              Download All AGC Briefs (.csv) — {agcCompleted.length} file{agcCompleted.length !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      )}

      {/* Floating chat assistant — has full visibility into the batch
          (briefs, concepts, scripts, QC review, memory briefing) and can
          answer ad-hoc questions like "how many are non-VO?", "what are
          the CTAs?", "recap the angles for me", etc. */}
      <BatchChatPanel state={state} apiKey={apiKey} />

      {/* Post-Batch Feedback */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h4 className="text-sm font-semibold text-slate-700 mb-2">
          Post-Batch Feedback <span className="text-slate-400 font-normal">(optional)</span>
        </h4>
        <p className="text-xs text-slate-400 mb-3">
          What worked? What didn't? What should change next time? This feedback is saved to the creative memory and will influence future batches.
        </p>
        {feedbackSaved ? (
          <div className="bg-emerald-50 rounded-lg p-3 text-xs text-emerald-700 flex items-center gap-2">
            <span>{'\u2713'}</span> Feedback saved to creative memory. It will influence future batches.
          </div>
        ) : (
          <>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="e.g., 'The neuropathy briefs were strong but swelling briefs felt too generic. Lean more into storytelling next time. Hooks were too similar — need more variety between question and statement hooks.'"
              className="w-full border border-slate-200 rounded-lg p-3 text-xs text-slate-700 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
            <button
              onClick={handleSaveFeedback}
              disabled={!feedbackText.trim()}
              className="mt-2 text-xs bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Save Feedback to Memory
            </button>
          </>
        )}
      </div>
    </div>
  );
}
