import { useState, useEffect } from 'react';
import type { TaskPipelineState } from '../../engine/autopilotTypes';
import { downloadBriefForAdType, parseKvTable, parseScriptTable } from '../../utils/downloadUtils';
import { getBriefTemplateId } from '../../prompts/briefTemplates';
import { buildBriefMeta } from '../../autopilot/briefMeta';

interface Props {
  taskState: TaskPipelineState;
  index: number;
  onRedo?: (index: number, feedback: string) => void;
  isRedoing?: boolean;
}

// ─── Style constants matching the E319 template ──────────────────────────────

const NAVY = '#1b365d';
const BORDER = '#bfbfbf';

// ─── Regen Stage Tracker ─────────────────────────────────────────────────────
// Visible during redo. Mirrors the per-brief pipeline stages so the user
// knows exactly which Opus call is running and what's left.

const REGEN_STAGES: { id: string; label: string; sublabel: string }[] = [
  { id: 'strategist-thinking', label: 'Creative Strategist', sublabel: 'Writing the per-brief thesis with your feedback' },
  { id: 'generating-concepts', label: 'Generating Concepts', sublabel: '5 concepts from the thesis + your feedback' },
  { id: 'critiquing-concepts', label: 'Differentiation Critic', sublabel: 'Grading each concept for relevance' },
  { id: 'regenerating-concepts', label: 'Regenerating Concepts', sublabel: 'Only fires if the critic rejects the first batch' },
  { id: 'selecting-concept', label: 'Selecting Best Concept', sublabel: 'Senior strategist picks the winner' },
  { id: 'generating-script', label: 'Writing Full Brief', sublabel: 'Longest stage — the final brief is being assembled' },
  { id: 'complete', label: 'Finalizing', sublabel: 'Validating output and saving' },
];

function RegenStageTracker({ step }: { step: string }) {
  // Determine how far along we are. Any step past the current stage is "done."
  // If the step is 'regenerating-concepts' we skip showing the earlier stages
  // as incomplete — they already happened.
  const currentIdx = REGEN_STAGES.findIndex((s) => s.id === step);
  // If step doesn't match any stage yet (e.g., just fired redo, state hasn't
  // propagated), show everything as pending.
  const effectiveIdx = currentIdx < 0 ? -1 : currentIdx;
  // Skip the "Regenerating Concepts" stage in the display unless it's the
  // current step (since it only appears when the critic rejects).
  const visibleStages = REGEN_STAGES.filter(
    (s) => s.id !== 'regenerating-concepts' || step === 'regenerating-concepts',
  );

  return (
    <div className="space-y-1.5">
      {visibleStages.map((stage) => {
        const idx = REGEN_STAGES.findIndex((s) => s.id === stage.id);
        const isDone = effectiveIdx > idx;
        const isCurrent = effectiveIdx === idx;
        const isPending = effectiveIdx < idx;
        return (
          <div
            key={stage.id}
            className={`flex items-start gap-3 p-2.5 rounded-lg border transition-colors ${
              isCurrent
                ? 'bg-blue-50 border-blue-200'
                : isDone
                  ? 'bg-emerald-50 border-emerald-100'
                  : 'bg-slate-50 border-slate-100'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {isDone ? (
                <div className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px] flex items-center justify-center font-bold">
                  ✓
                </div>
              ) : isCurrent ? (
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div
                className={`text-xs font-semibold ${
                  isCurrent ? 'text-blue-700' : isDone ? 'text-emerald-700' : 'text-slate-500'
                }`}
              >
                {stage.label}
              </div>
              <div className={`text-[10px] mt-0.5 ${isPending ? 'text-slate-400' : 'text-slate-500'}`}>
                {stage.sublabel}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="text-xs font-bold text-slate-800 mt-4 mb-1.5 uppercase tracking-wider">
      {title}
    </div>
  );
}

function KvTable({ data, fields }: { data: Record<string, string>; fields: string[] }) {
  const rows = fields.filter((f) => data[f]);
  if (rows.length === 0) return null;
  return (
    <table className="w-full text-xs border-collapse mb-1">
      <tbody>
        {rows.map((field) => (
          <tr key={field} style={{ borderBottom: `1px solid ${BORDER}` }}>
            <td
              className="py-1.5 px-2.5 font-semibold text-white align-top"
              style={{ background: NAVY, width: 140, border: `1px solid ${BORDER}`, fontSize: 11 }}
            >
              {field}
            </td>
            <td
              className="py-1.5 px-2.5 text-slate-800 align-top"
              style={{ border: `1px solid ${BORDER}`, fontSize: 11 }}
            >
              {data[field] || '\u2014'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ScriptTablePreview({ rows, title, lineHeader }: { rows: string[][]; title: string; lineHeader: string }) {
  if (rows.length === 0) return null;
  return (
    <>
      <SectionHeader title={title} />
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse mb-1">
          <thead>
            <tr>
              {['LINE #', 'SHOT TYPE', 'SUGGESTED VISUAL', lineHeader].map((h, i) => (
                <th
                  key={h}
                  className="py-1.5 px-2 text-white font-semibold text-left"
                  style={{
                    background: NAVY,
                    border: `1px solid ${BORDER}`,
                    fontSize: 10,
                    width: i === 0 ? 40 : i === 1 ? 80 : i === 2 ? '30%' : undefined,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri}>
                {[row[0] || '', row[1] || '', row[2] || '', row[3] || ''].map((cell, ci) => (
                  <td
                    key={ci}
                    className="py-1.5 px-2 text-slate-800 align-top"
                    style={{
                      border: `1px solid ${BORDER}`,
                      fontSize: 11,
                      textAlign: ci === 0 ? 'center' : 'left',
                    }}
                  >
                    {cell || '\u2014'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function TaskBriefCard({ taskState, index, onRedo, isRedoing }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const { task, step, selectedConceptIndex, selectionReasoning, recommendedFramework, scriptResult, error } = taskState;

  const isComplete = step === 'complete' && !!scriptResult;
  const isFailed = step === 'error';
  const isProcessing = step === 'generating-concepts' || step === 'selecting-concept' || step === 'generating-script' || step === 'strategist-thinking' || step === 'critiquing-concepts' || step === 'regenerating-concepts';
  // When a redo is in progress, suppress the "Complete" UI treatment entirely
  // (badge + expanded brief preview) until the regen finishes. Otherwise the
  // old brief flashes as "complete" during the redo, which is confusing.
  const showCompleteUi = isComplete && !isRedoing;

  // Auto-expand whenever redo starts. Guarantees the user sees the stage
  // tracker without having to click the header. Only expands once per redo
  // start; if the user manually collapses mid-regen, we don't fight them.
  useEffect(() => {
    if (isRedoing) setExpanded(true);
  }, [isRedoing]);

  // Derived metadata for the header badges (ad type, VO/no VO).
  // Only meaningful once the brief is complete — but still useful to know
  // the configured ad type even mid-pipeline.
  const meta = buildBriefMeta(taskState);

  // Each ad type gets its own template + downloader:
  //   - Production briefs (AGC, Single-Talent for Founder/Spokesperson/UGC,
  //     Filmed Podcast, Packaging/Employee) → CSV per Nora's workflow.
  //   - Editing briefs (Ecom, Full AI Visual, AI Podcast, Static) → Doc.
  // The router in downloadUtils.ts handles picking the right exporter.
  const briefAdType = task.scriptParamsBase.adType;
  const templateId = getBriefTemplateId(briefAdType);
  const isCsvExport =
    templateId === 'agc' ||
    templateId === 'singletalent' ||
    templateId === 'filmedpodcast' ||
    templateId === 'packaging';
  const handleExport = () => {
    if (!scriptResult) return;
    downloadBriefForAdType(briefAdType, scriptResult, task.product, task.parsed.name);
  };

  // Parse brief sections for formatted preview — only when genuinely complete
  // (not mid-regen). During regen, scriptResult still holds the OLD value
  // until the final assignment, so we suppress parsing to avoid showing stale.
  const briefInfo = showCompleteUi ? parseKvTable(scriptResult, 'BRIEF INFO') : {};
  const strategy = showCompleteUi ? parseKvTable(scriptResult, 'STRATEGY') : {};
  const offer = showCompleteUi ? parseKvTable(scriptResult, 'OFFER') : {};
  const editing = showCompleteUi ? parseKvTable(scriptResult, 'EDITING INSTRUCTIONS') : {};
  const hooks = showCompleteUi ? parseScriptTable(scriptResult, 'SCRIPT \\(HOOKS\\)') : [];
  const body = showCompleteUi ? parseScriptTable(scriptResult, 'SCRIPT \\(BODY\\)') : [];

  const handleRedo = () => {
    if (!feedbackText.trim() || !onRedo) return;
    onRedo(index, feedbackText.trim());
    setShowFeedback(false);
  };

  return (
    <div className={`border rounded-xl overflow-hidden ${
      isFailed ? 'border-red-200 bg-red-50'
      : isRedoing ? 'border-blue-300 bg-blue-50'
      : 'border-slate-200 bg-white'
    }`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-400 w-6">#{index + 1}</span>
          <div>
            <div className="text-sm font-semibold text-slate-800">{task.parsed.name}</div>
            <div className="text-xs text-slate-500">
              {task.product} / {task.parsed.angle} / {task.duration}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Length pill — visible at every stage; the configured runtime
              is locked from the parsed Asana task and never changes. */}
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide bg-teal-100 text-teal-700"
            title={`Brief length: ${meta.duration}`}
          >
            {'\u23F1\uFE0F'} {meta.duration}
          </span>
          {/* Ad type pill — visible at every stage so the user can see the
              configured ad type even before the brief is complete. */}
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${
              meta.isFullAi
                ? 'bg-purple-100 text-purple-700'
                : 'bg-slate-100 text-slate-600'
            }`}
            title={meta.adType}
          >
            {meta.adTypeShort}
          </span>
          {/* VO / No VO pill — only meaningful once the brief is truly complete */}
          {showCompleteUi && (
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                meta.hasVoiceover
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
              title={meta.hasVoiceover ? meta.voTone || 'Voiceover present' : 'No voiceover'}
            >
              {meta.hasVoiceover ? '\uD83C\uDFA4 VO' : 'No VO'}
            </span>
          )}
          {showCompleteUi && selectedConceptIndex && (
            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              Concept {selectedConceptIndex} | {recommendedFramework?.split(' ')[0]}
            </span>
          )}
          {showCompleteUi && (
            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
              {'\u2713'} Complete
            </span>
          )}
          {/* Redo-in-progress: single combined pill showing current stage.
              Replaces the old generic "Re-doing..." plus per-step pills that
              fought with the "Complete" badge during the regen cascade. */}
          {isRedoing && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              <span className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              {step === 'strategist-thinking' ? 'Regen — Strategist'
                : step === 'generating-concepts' ? 'Regen — Concepts'
                : step === 'critiquing-concepts' ? 'Regen — Critic'
                : step === 'regenerating-concepts' ? 'Regen — Retry Concepts'
                : step === 'selecting-concept' ? 'Regen — Selecting'
                : step === 'generating-script' ? 'Regen — Writing Brief'
                : step === 'complete' ? 'Regen — Finalizing'
                : 'Regen — Starting'}
            </span>
          )}
          {isProcessing && !isRedoing && (
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              <span className="w-3 h-3 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
              {step === 'strategist-thinking' ? 'Strategist...'
                : step === 'generating-concepts' ? 'Concepts...'
                : step === 'critiquing-concepts' ? 'Critic...'
                : step === 'regenerating-concepts' ? 'Retry...'
                : step === 'selecting-concept' ? 'Selecting...'
                : 'Writing...'}
            </span>
          )}
          {isFailed && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
              Failed
            </span>
          )}
          <span className="text-slate-400 text-xs ml-1">{expanded ? '\u25B2' : '\u25BC'}</span>
        </div>
      </button>

      {/* Redo-in-progress panel — ALWAYS visible during regen, independent
          of the expanded state. The user needs to see the stage tracker
          whether or not they've clicked the header. */}
      {isRedoing && (
        <div className="border-t border-blue-200 bg-blue-50/50 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <div className="text-sm font-semibold text-slate-800">
              Regenerating with your feedback...
            </div>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            The full critical-thinking pipeline is running. Your feedback is the
            #1 directive at every stage. This typically takes 2-4 minutes — the
            previous version is being replaced, not edited.
          </p>
          <RegenStageTracker step={step} />
        </div>
      )}

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-slate-100">
          {/* Selection reasoning */}
          {selectionReasoning && !isRedoing && (
            <div className="bg-blue-50 border-b border-blue-100 p-4">
              <div className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider mb-1">
                Why This Concept Was Selected
              </div>
              <p className="text-xs text-blue-800 leading-relaxed">{selectionReasoning}</p>
            </div>
          )}

          {/* Formatted Brief Preview — only when truly complete AND not
              mid-regen. Prevents the old brief from flashing as "complete"
              during the regen cascade. */}
          {showCompleteUi && scriptResult && (
            <div className="p-4">
              {/* Title */}
              <div className="text-center text-sm font-bold text-slate-800 mb-3">
                Ecom Ad Template
              </div>

              {/* BRIEF INFO */}
              <SectionHeader title="Brief Info" />
              <KvTable data={briefInfo} fields={['Brief ID', 'Date', 'Product', 'Collection', 'Collection Asset', 'Format']} />

              {/* STRATEGY */}
              <SectionHeader title="Strategy" />
              <KvTable data={strategy} fields={['Awareness Level', 'Primary Emotion', 'Avatar', 'Landing Page']} />

              {/* OFFER */}
              <SectionHeader title="Offer" />
              <KvTable data={offer} fields={['Promo', 'Promo Asset', 'Value Callout', 'Urgency Element']} />

              {/* EDITING INSTRUCTIONS */}
              <SectionHeader title="Editing Instructions" />
              <KvTable data={editing} fields={['Pacing', 'Resolution', 'Caption & Graphics', 'Captions', 'Transitions', 'Music', 'Voiceover', 'Asset', 'Notes']} />

              {/* SCRIPT (HOOKS) */}
              <ScriptTablePreview rows={hooks} title="Script (Hooks)" lineHeader="HOOK LINE" />

              {/* SCRIPT (BODY) */}
              <ScriptTablePreview rows={body} title="Script (Body)" lineHeader="SCRIPT LINE" />

              {/* Actions */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={handleExport}
                  className="text-xs bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900 transition-colors"
                >
                  {isCsvExport ? 'Export .csv' : 'Export .doc'}
                </button>
                {onRedo && (
                  <button
                    onClick={() => setShowFeedback(!showFeedback)}
                    disabled={isRedoing}
                    className="text-xs border border-amber-300 text-amber-700 bg-amber-50 px-4 py-2 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-40"
                  >
                    {showFeedback ? 'Cancel' : 'Redo with Feedback'}
                  </button>
                )}
              </div>

              {/* Per-brief feedback / redo */}
              {showFeedback && onRedo && (
                <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="text-xs font-semibold text-amber-800 mb-1.5">
                    Feedback for {task.parsed.name}
                  </div>
                  <p className="text-[10px] text-amber-700 mb-2">
                    Be specific about what to change. This feedback becomes the #1 priority directive for all agents when re-generating this brief.
                    The previous version is shown to the agents as a reference of what NOT to repeat.
                  </p>
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder={'e.g., "The hook is too generic \u2014 make it more emotional and specific to neuropathy pain. The script body is too long for a 15s ad. Use a Before-After-Bridge framework instead. The visual suggestions need to be more grounded in real footage we can actually shoot."'}
                    className="w-full border border-amber-300 rounded-lg p-3 text-xs text-slate-700 resize-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white"
                    rows={4}
                  />
                  <button
                    onClick={handleRedo}
                    disabled={!feedbackText.trim() || isRedoing}
                    className="mt-2 text-xs bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    Re-do This Brief
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {isFailed && error && (
            <div className="p-4">
              <div className="text-xs text-red-600 bg-red-50 rounded p-3 mb-3">
                {error}
              </div>
              {onRedo && (
                <button
                  onClick={() => onRedo(index, 'Retry — previous attempt failed')}
                  disabled={isRedoing}
                  className="text-xs bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-40 transition-colors"
                >
                  Retry This Brief
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
