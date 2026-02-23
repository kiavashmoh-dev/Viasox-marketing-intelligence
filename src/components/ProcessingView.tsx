import type { ProcessingProgress } from '../engine/types';

interface Props {
  progress: ProcessingProgress;
}

export default function ProcessingView({ progress }: Props) {
  const stageLabels: Record<string, string> = {
    organizing: 'Organizing reviews by product...',
    analyzing: `Analyzing ${progress.currentProduct}...`,
    complete: 'Analysis complete!',
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
        <div className="text-5xl mb-6">
          {progress.stage === 'complete' ? '\u2705' : '\u2699\uFE0F'}
        </div>

        <h2 className="text-xl font-bold text-slate-800 mb-2">
          Processing Reviews
        </h2>

        <p className="text-slate-500 mb-6">
          {stageLabels[progress.stage]}
        </p>

        <div className="w-full bg-slate-200 rounded-full h-3 mb-2">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progress.percent}%` }}
          />
        </div>

        <p className="text-sm text-slate-400">{progress.percent}%</p>
      </div>
    </div>
  );
}
