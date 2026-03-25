import type { AutopilotState } from '../../engine/autopilotTypes';

interface Props {
  state: AutopilotState;
  onCancel: () => void;
}

const STEP_LABELS: Record<string, string> = {
  pending: 'Waiting',
  'generating-concepts': 'Generating 5 concepts (Opus)...',
  'selecting-concept': 'Expert strategist selecting best concept (Opus)...',
  'generating-script': 'Writing full Ecom brief (Opus)...',
  complete: 'Done',
  error: 'Failed',
};

const STEP_ORDER = ['generating-concepts', 'selecting-concept', 'generating-script', 'complete'];

function StepDots({ currentStep }: { currentStep: string }) {
  const currentIdx = STEP_ORDER.indexOf(currentStep);

  return (
    <div className="flex items-center gap-1">
      {STEP_ORDER.map((step, i) => {
        const isDone = currentIdx > i || currentStep === 'complete';
        const isCurrent = currentIdx === i && currentStep !== 'complete' && currentStep !== 'error';
        const isError = currentStep === 'error' && i === currentIdx;

        return (
          <div key={step} className="flex items-center gap-1">
            <div
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                isDone ? 'bg-emerald-500' :
                isCurrent ? 'bg-blue-500 animate-pulse' :
                isError ? 'bg-red-500' :
                'bg-slate-200'
              }`}
            />
            {i < STEP_ORDER.length - 1 && (
              <div className={`w-4 h-0.5 ${isDone ? 'bg-emerald-300' : 'bg-slate-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function PipelineProgress({ state, onCancel }: Props) {
  const completed = state.tasks.filter((t) => t.step === 'complete').length;
  const failed = state.tasks.filter((t) => t.step === 'error').length;
  const total = state.tasks.length;
  const pct = Math.round(((completed + failed) / total) * 100);

  const isReviewing = state.phase === 'reviewing';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800">
            {isReviewing ? 'Reviewing Batch...' : 'Generating Briefs'}
          </h3>
          <p className="text-sm text-slate-500">
            {isReviewing
              ? 'Running quality checks on all briefs'
              : `${completed} of ${total} complete${failed > 0 ? ` (${failed} failed)` : ''}`
            }
          </p>
        </div>
        <button
          onClick={onCancel}
          className="text-sm text-red-500 hover:text-red-700 font-medium"
        >
          Cancel
        </button>
      </div>

      {/* Overall progress bar */}
      {!isReviewing && (
        <div className="w-full bg-slate-100 rounded-full h-3 mb-5 overflow-hidden">
          <div
            className="bg-blue-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {isReviewing && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3 text-blue-600">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">Reviewing {completed} briefs for quality...</span>
          </div>
        </div>
      )}

      {/* Per-task rows */}
      {!isReviewing && (
        <div className="space-y-2">
          {state.tasks.map((ts, i) => {
            const isCurrent = i === state.currentTaskIndex && ts.step !== 'complete' && ts.step !== 'error';
            return (
              <div
                key={i}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  isCurrent ? 'bg-blue-50 border border-blue-200' :
                  ts.step === 'complete' ? 'bg-emerald-50' :
                  ts.step === 'error' ? 'bg-red-50' :
                  'bg-slate-50'
                }`}
              >
                <div className="w-32 shrink-0">
                  <div className="text-sm font-medium text-slate-800">{ts.task.parsed.name}</div>
                  <div className="text-[10px] text-slate-400">
                    {ts.task.parsed.product} / {ts.task.parsed.angle}
                  </div>
                </div>

                <StepDots currentStep={ts.step} />

                <div className="flex-1 text-right">
                  {isCurrent && (
                    <span className="text-xs text-blue-600 font-medium">
                      {STEP_LABELS[ts.step]}
                    </span>
                  )}
                  {ts.step === 'complete' && ts.selectedConceptIndex && (
                    <span className="text-xs text-emerald-600">
                      Concept {ts.selectedConceptIndex} selected
                    </span>
                  )}
                  {ts.step === 'error' && (
                    <span className="text-xs text-red-600" title={ts.error}>
                      {ts.error?.slice(0, 40)}...
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
