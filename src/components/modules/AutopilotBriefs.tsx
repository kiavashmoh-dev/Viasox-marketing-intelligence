import { useState, useRef, useCallback } from 'react';
import type { FullAnalysis } from '../../engine/types';
import type { AutopilotTask, AutopilotState, BatchPhase, CreativeDirection } from '../../engine/autopilotTypes';
import { parseAsanaScreenshot, fileToBase64 } from '../../autopilot/screenshotParser';
import { mapAsanaTask } from '../../autopilot/asanaMapper';
import { runAutopilotPipeline } from '../../autopilot/pipelineEngine';
import PlannerView from '../autopilot/PlannerView';
import PipelineProgress from '../autopilot/PipelineProgress';
import BatchResultsView from '../autopilot/BatchResultsView';

interface Props {
  analysis: FullAnalysis;
  apiKey: string;
  resourceContext: string;
  onBack: () => void;
}

export default function AutopilotBriefs({ analysis, apiKey, resourceContext, onBack }: Props) {
  const [phase, setPhase] = useState<BatchPhase>('idle');
  const [tasks, setTasks] = useState<AutopilotTask[]>([]);
  const [pipelineState, setPipelineState] = useState<AutopilotState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Screenshot Upload ──────────────────────────────────────────────────

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG, etc.)');
      return;
    }

    setPhase('parsing');
    setError(null);

    try {
      const { base64, mediaType } = await fileToBase64(file);
      const parsed = await parseAsanaScreenshot(base64, mediaType, apiKey);

      if (parsed.length === 0) {
        setError('No tasks found in the screenshot. Make sure the Asana board shows task rows with Product, Angle, and Medium columns.');
        setPhase('idle');
        return;
      }

      const mapped = parsed.map(mapAsanaTask);
      setTasks(mapped);
      setPhase('confirming');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setPhase('idle');
    }
  }, [apiKey]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  // ── Pipeline Execution ─────────────────────────────────────────────────

  const handleRunBatch = useCallback(async (selectedTasks: AutopilotTask[], direction: CreativeDirection) => {
    setPhase('running');
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const result = await runAutopilotPipeline(
        selectedTasks,
        analysis,
        apiKey,
        resourceContext,
        direction,
        (state) => setPipelineState({ ...state }),
        controller.signal,
      );

      setPipelineState(result);
      setPhase('complete');
    } catch (err) {
      if ((err as Error).message === 'Pipeline cancelled') {
        setPhase('confirming');
      } else {
        setError(err instanceof Error ? err.message : String(err));
        setPhase('error');
      }
    }
  }, [analysis, apiKey, resourceContext]);

  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handleReset = useCallback(() => {
    setPhase('idle');
    setTasks([]);
    setPipelineState(null);
    setError(null);
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="text-sm text-slate-500 hover:text-slate-700 mb-6 flex items-center gap-1"
        >
          {'\u2190'} Back to Dashboard
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-800 mb-1">
            Autopilot Brief Generator
          </h2>
          <p className="text-slate-500 text-sm">
            Upload your Asana board screenshot. The system will generate concepts, select the best one per task, write full Ecom briefs, and run a quality review.
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-5">
            <div className="text-sm font-semibold text-red-800 mb-1">Error</div>
            <p className="text-xs text-red-700 whitespace-pre-wrap">{error}</p>
          </div>
        )}

        {/* Phase: Idle — Screenshot upload */}
        {phase === 'idle' && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
              dragOver ? 'border-blue-400 bg-blue-50' : 'border-slate-300 bg-white hover:border-blue-300'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              className="hidden"
            />
            <div className="text-4xl mb-3">{'\uD83D\uDCF7'}</div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              Upload Asana Board Screenshot
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Drop a screenshot of your Asana board here, or click to browse.
              <br />
              Make sure the board shows columns: Task Name, Product, Angle, Medium.
            </p>
            <div className="inline-block px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium">
              Choose Screenshot
            </div>
          </div>
        )}

        {/* Phase: Parsing */}
        {phase === 'parsing' && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <div className="flex items-center justify-center gap-3 text-blue-600 mb-3">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium">Analyzing screenshot...</span>
            </div>
            <p className="text-xs text-slate-500">
              Extracting task data from your Asana board using AI vision.
            </p>
          </div>
        )}

        {/* Phase: Confirming — PlannerView */}
        {phase === 'confirming' && (
          <PlannerView
            tasks={tasks}
            onConfirm={handleRunBatch}
            onCancel={handleReset}
          />
        )}

        {/* Phase: Running / Reviewing — PipelineProgress */}
        {(phase === 'running' || phase === 'reviewing') && pipelineState && (
          <PipelineProgress
            state={pipelineState}
            onCancel={handleCancel}
          />
        )}

        {/* Phase: Complete — BatchResultsView */}
        {phase === 'complete' && pipelineState && (
          <BatchResultsView
            state={pipelineState}
            onReset={handleReset}
          />
        )}

        {/* Phase: Error */}
        {phase === 'error' && (
          <div className="bg-white rounded-xl border border-red-200 p-8 text-center">
            <div className="text-3xl mb-3">{'\u26A0\uFE0F'}</div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Pipeline Error</h3>
            <p className="text-sm text-slate-500 mb-4">{error}</p>
            <button
              onClick={handleReset}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        )}

        {/* How it works */}
        {phase === 'idle' && (
          <div className="mt-8 bg-slate-50 rounded-xl p-5">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">How It Works</h4>
            <div className="grid grid-cols-5 gap-3 text-center">
              {[
                { step: '1', label: 'Upload', desc: 'Asana screenshot' },
                { step: '2', label: 'Concepts', desc: '5 per task via AI' },
                { step: '3', label: 'Select', desc: 'Best concept picked' },
                { step: '4', label: 'Brief', desc: 'Full Ecom script' },
                { step: '5', label: 'Review', desc: 'QC all briefs' },
              ].map((s) => (
                <div key={s.step}>
                  <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold mx-auto mb-1.5">
                    {s.step}
                  </div>
                  <div className="text-xs font-semibold text-slate-700">{s.label}</div>
                  <div className="text-[10px] text-slate-400">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
