import { useState, useRef, useCallback } from 'react';
import type { FullAnalysis } from '../../engine/types';
import type { AutopilotTask, AutopilotState, BatchPhase, CreativeDirection, StrategySession as StrategySessionType } from '../../engine/autopilotTypes';
import { parseAsanaScreenshot, fileToBase64 } from '../../autopilot/screenshotParser';
import { mapAsanaTask } from '../../autopilot/asanaMapper';
import {
  runStrategySession,
  synthesizeStrategy,
  runConceptPhase,
  runScriptPhase,
  redoSingleTask,
  loadPinnedInspirationForTask,
  buildPinnedVisionContent,
} from '../../autopilot/pipelineEngine';
import { loadMemory } from '../../autopilot/memoryStore';
import { runMemoryCurator } from '../../autopilot/memoryCurator';
import { buildAnglesPrompt } from '../../prompts/anglesPrompt';
import { buildResourceContext } from '../../prompts/systemBase';
import { sendMessage, sendVisionMessage } from '../../api/claude';
import { buildConceptEvaluatorPrompt, parseConceptEvaluations } from '../../prompts/conceptEvaluatorPrompt';
import PlannerView from '../autopilot/PlannerView';
import PipelineProgress from '../autopilot/PipelineProgress';
import BatchResultsView from '../autopilot/BatchResultsView';
import StrategySessionUI from '../autopilot/StrategySession';
import ConceptReview from '../autopilot/ConceptReview';

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
  const [redoingIndex, setRedoingIndex] = useState<number | null>(null);

  // Strategy session state
  const [strategySession, setStrategySession] = useState<StrategySessionType | null>(null);
  const [strategySynthesizing, setStrategySynthesizing] = useState(false);
  const [strategyBrief, setStrategyBrief] = useState<string | undefined>();
  const [regenConceptIdx, setRegenConceptIdx] = useState<number | null>(null);

  // Refs for persistence across phases
  const abortRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const directionRef = useRef<CreativeDirection>({ instructions: '', pinnedInspirations: {} });
  const memoryBriefingRef = useRef('');

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

  // ── Strategy Session Launch ─────────────────────────────────────────────

  const handleRunBatch = useCallback(async (selectedTasks: AutopilotTask[], direction: CreativeDirection) => {
    setPhase('strategy-session');
    setError(null);
    setTasks(selectedTasks);
    directionRef.current = direction;

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // Run memory curator
      const memory = loadMemory();
      if (memory.batches.length > 0) {
        try {
          const briefing = await runMemoryCurator(apiKey, controller.signal);
          if (briefing) memoryBriefingRef.current = briefing.briefingText;
        } catch { /* non-fatal */ }
      }

      // Run strategy session
      const session = await runStrategySession(
        selectedTasks,
        analysis,
        apiKey,
        memoryBriefingRef.current || undefined,
        controller.signal,
      );

      setStrategySession(session);
    } catch (err) {
      if ((err as Error).message === 'Pipeline cancelled') {
        setPhase('confirming');
      } else {
        setError(err instanceof Error ? err.message : String(err));
        setPhase('error');
      }
    }
  }, [analysis, apiKey]);

  // ── Strategy Answers → Synthesis → Concept Generation ──────────────────

  const handleStrategyAnswers = useCallback(async (answers: Record<string, string>) => {
    if (!strategySession) return;

    const updatedSession = { ...strategySession, answers };
    setStrategySession(updatedSession);
    setStrategySynthesizing(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // Synthesize strategy brief
      const brief = await synthesizeStrategy(
        updatedSession,
        tasks,
        apiKey,
        memoryBriefingRef.current || undefined,
        controller.signal,
      );
      setStrategyBrief(brief);

      // Move to concept generation
      setPhase('generating-concepts');
      setStrategySynthesizing(false);

      // Run concept phase
      const conceptState = await runConceptPhase(
        tasks,
        analysis,
        apiKey,
        resourceContext,
        directionRef.current,
        brief,
        memoryBriefingRef.current || undefined,
        (state) => setPipelineState({ ...state }),
        controller.signal,
      );

      // Store strategy in state
      conceptState.strategySession = { ...updatedSession, strategyBrief: brief };
      conceptState.memoryBriefing = memoryBriefingRef.current || undefined;
      setPipelineState(conceptState);
      setPhase('concept-review');
    } catch (err) {
      setStrategySynthesizing(false);
      if ((err as Error).message === 'Pipeline cancelled') {
        setPhase('confirming');
      } else {
        setError(err instanceof Error ? err.message : String(err));
        setPhase('error');
      }
    }
  }, [strategySession, tasks, analysis, apiKey, resourceContext]);

  // ── Concept Approval → Script Generation ───────────────────────────────

  const handleConceptApproval = useCallback(async (
    selections: Array<{ taskIndex: number; conceptIndex: number }>,
  ) => {
    if (!pipelineState) return;

    setPhase('running');
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const result = await runScriptPhase(
        pipelineState,
        selections,
        analysis,
        apiKey,
        resourceContext,
        directionRef.current,
        strategyBrief,
        memoryBriefingRef.current || undefined,
        (state) => setPipelineState({ ...state }),
        controller.signal,
      );

      setPipelineState(result);
      setPhase('complete');
    } catch (err) {
      if ((err as Error).message === 'Pipeline cancelled') {
        setPhase('concept-review');
      } else {
        setError(err instanceof Error ? err.message : String(err));
        setPhase('error');
      }
    }
  }, [pipelineState, analysis, apiKey, resourceContext, strategyBrief]);

  // ── Concept Regeneration ───────────────────────────────────────────────

  const handleRegenerateConcepts = useCallback(async (taskIndex: number, feedback: string) => {
    if (!pipelineState) return;
    setRegenConceptIdx(taskIndex);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // Re-run concept phase for just this task
      const state = { ...pipelineState, tasks: pipelineState.tasks.map((t) => ({ ...t })) };
      const ts = state.tasks[taskIndex];
      if (!ts) return;

      const directionBlock = `\n\n## CONCEPT REGENERATION — PREVIOUS CONCEPTS WERE REJECTED

The creative director rejected the previous concepts for this task with the following feedback:

<regeneration_feedback>
${feedback}
</regeneration_feedback>

Generate COMPLETELY DIFFERENT concepts. Do NOT repeat themes, hooks, or angles from the rejected set.`;

      // Use static imports (already available at module level via pipelineEngine deps)

      const resourceCtx = buildResourceContext(resourceContext);

      ts.step = 'generating-concepts';
      ts.conceptOptions = undefined;
      setPipelineState({ ...state });

      // Honor any pinned inspiration on this task — load frames + rich context
      // and switch to vision call when frames are present.
      const pinned = await loadPinnedInspirationForTask(
        ts.task.parsed.name,
        directionRef.current.pinnedInspirations,
      );

      const anglesPrompt = buildAnglesPrompt(
        ts.task.anglesParams,
        analysis,
        memoryBriefingRef.current || undefined,
        pinned ? pinned.richContext : undefined,
      );
      const fullSystem =
        anglesPrompt.system +
        resourceCtx +
        directionBlock +
        (strategyBrief ? `\n\nSTRATEGY BRIEF:\n${strategyBrief}` : '');

      let conceptsRaw: string;
      if (pinned && pinned.frames.length > 0) {
        const visionContent = buildPinnedVisionContent(pinned, anglesPrompt.user);
        conceptsRaw = await sendVisionMessage(
          fullSystem,
          visionContent,
          apiKey,
          24000,
          'claude-opus-4-6',
          controller.signal,
        );
      } else {
        conceptsRaw = await sendMessage(
          fullSystem,
          anglesPrompt.user,
          apiKey,
          22000,
          'claude-opus-4-6',
          controller.signal,
        );
      }
      ts.conceptsRaw = conceptsRaw;

      ts.step = 'selecting-concept';
      setPipelineState({ ...state });

      const evalPrompt = buildConceptEvaluatorPrompt(
        conceptsRaw,
        ts.task.parsed.name,
        ts.task.parsed.angle,
        ts.task.parsed.product,
        ts.task.parsed.medium,
        ts.task.duration,
        strategyBrief,
        [],
        pinned ? (pinned.richContext) : undefined,
        pinned?.framework ?? null,
        pinned?.hookStyle ?? null,
      );

      const evalResponse = await sendMessage(
        evalPrompt.system,
        evalPrompt.user,
        apiKey,
        9000,
        'claude-opus-4-6',
        controller.signal,
      );

      const options = parseConceptEvaluations(evalResponse, conceptsRaw);
      // Force the pin's framework onto every option so the locked framework flows
      // into the script phase regardless of which concept the user picks.
      if (pinned?.framework) {
        for (const opt of options) {
          opt.recommendedFramework = pinned.framework;
        }
      }
      ts.conceptOptions = options;
      ts.step = 'awaiting-concept-approval';
      setPipelineState({ ...state });
    } catch (err) {
      if ((err as Error).message !== 'Pipeline cancelled') {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      setRegenConceptIdx(null);
    }
  }, [pipelineState, analysis, apiKey, resourceContext, strategyBrief]);

  // ── Single Task Redo (post-script) ─────────────────────────────────────

  const handleRedoTask = useCallback(async (taskIndex: number, feedback: string) => {
    if (!pipelineState) return;
    setRedoingIndex(taskIndex);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const result = await redoSingleTask(
        taskIndex,
        feedback,
        pipelineState,
        analysis,
        apiKey,
        resourceContext,
        directionRef.current,
        (state) => setPipelineState({ ...state }),
        controller.signal,
      );
      setPipelineState(result);
    } catch (err) {
      if ((err as Error).message !== 'Redo cancelled') {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      setRedoingIndex(null);
    }
  }, [pipelineState, analysis, apiKey, resourceContext]);

  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handleReset = useCallback(() => {
    setPhase('idle');
    setTasks([]);
    setPipelineState(null);
    setError(null);
    setStrategySession(null);
    setStrategyBrief(undefined);
    setStrategySynthesizing(false);
    memoryBriefingRef.current = '';
    directionRef.current = { instructions: '', pinnedInspirations: {} };
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
            Upload your Asana board, strategize with your AI creative team, review concepts, then generate full briefs.
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

        {/* Phase: Strategy Session */}
        {phase === 'strategy-session' && strategySession && (
          <StrategySessionUI
            session={strategySession}
            onSubmitAnswers={handleStrategyAnswers}
            isSynthesizing={strategySynthesizing}
          />
        )}

        {/* Phase: Strategy Session Loading */}
        {phase === 'strategy-session' && !strategySession && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <div className="flex items-center justify-center gap-3 text-blue-600 mb-3">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium">Strategist is analyzing your batch...</span>
            </div>
            <p className="text-xs text-slate-500">
              Your senior creative strategist is studying the tasks, cross-referencing with brand data and past performance, and preparing strategic questions.
            </p>
          </div>
        )}

        {/* Phase: Generating Concepts */}
        {phase === 'generating-concepts' && pipelineState && (
          <PipelineProgress
            state={pipelineState}
            onCancel={handleCancel}
          />
        )}

        {/* Phase: Concept Review */}
        {phase === 'concept-review' && pipelineState && (
          <ConceptReview
            tasks={pipelineState.tasks}
            onApprove={handleConceptApproval}
            onRegenerateConcepts={handleRegenerateConcepts}
            isRegenerating={regenConceptIdx}
          />
        )}

        {/* Phase: Running Scripts / Reviewing */}
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
            onRedoTask={handleRedoTask}
            redoingIndex={redoingIndex}
          />
        )}

        {/* Phase: Error */}
        {phase === 'error' && (
          <div className="bg-white rounded-xl border border-red-200 p-8 text-center">
            <div className="text-3xl mb-3">{'\u26A0\uFE0F'}</div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Pipeline Error</h3>
            <p className="text-sm text-red-600 mb-4">{error}</p>
            <button
              onClick={handleReset}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Start Over
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
