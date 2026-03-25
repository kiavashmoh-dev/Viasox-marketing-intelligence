import { useState } from 'react';
import type { AutopilotState } from '../../engine/autopilotTypes';
import TaskBriefCard from './TaskBriefCard';
import { downloadEcomBriefDoc } from '../../utils/downloadUtils';

interface Props {
  state: AutopilotState;
  onReset: () => void;
}

export default function BatchResultsView({ state, onReset }: Props) {
  const [reviewExpanded, setReviewExpanded] = useState(false);

  const completed = state.tasks.filter((t) => t.step === 'complete');
  const failed = state.tasks.filter((t) => t.step === 'error');

  const handleExportAll = () => {
    // Export each brief individually (browser will handle multiple downloads)
    completed.forEach((ts) => {
      if (ts.scriptResult) {
        downloadEcomBriefDoc(ts.scriptResult);
      }
    });
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

        {completed.length > 1 && (
          <button
            onClick={handleExportAll}
            className="w-full py-2.5 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors"
          >
            Export All Briefs (.doc)
          </button>
        )}
      </div>

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

      {/* Individual Brief Cards */}
      <div className="space-y-3">
        {state.tasks.map((ts, i) => (
          <TaskBriefCard key={i} taskState={ts} index={i} />
        ))}
      </div>
    </div>
  );
}
