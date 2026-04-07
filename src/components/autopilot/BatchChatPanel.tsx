import { useState, useRef, useEffect, useMemo } from 'react';
import type { AutopilotState } from '../../engine/autopilotTypes';
import { sendChatMessage, type ChatMessage } from '../../api/claude';
import { buildBriefMeta } from '../../autopilot/briefMeta';

interface Props {
  state: AutopilotState;
  apiKey: string;
}

interface DisplayMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * BatchChatPanel — collapsible chat assistant pinned to the bottom of the
 * batch results page. The assistant has full visibility into:
 *   - Every brief's metadata (product, angle, ad type, VO/no VO, framework)
 *   - The selected concept + selection reasoning + recommended framework
 *   - The full final brief markdown for each completed task
 *   - The batch QC review (if available)
 *   - The memory briefing that was active for this batch (if available)
 *
 * Use cases the user mentioned:
 *   - "How many briefs are non-VO?"
 *   - "What ad types are in this batch?"
 *   - "What are the CTAs?"
 *   - "Recap the angles and scripts for me"
 */
export default function BatchChatPanel({ state, apiKey }: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ── Build the system prompt with the full batch context ────────────────
  // Memoized so we don't rebuild it on every keystroke. Re-derives whenever
  // the underlying tasks change.
  const { systemPrompt, completedCount, voCount, noVoCount, fullAiCount } = useMemo(() => {
    const completed = state.tasks.filter((t) => t.step === 'complete');
    const metas = completed.map((ts) => ({ ts, meta: buildBriefMeta(ts) }));

    const voList = metas.filter((m) => m.meta.hasVoiceover);
    const noVoList = metas.filter((m) => !m.meta.hasVoiceover);
    const fullAiList = metas.filter((m) => m.meta.isFullAi);

    // Build a structured digest the assistant can quickly index into
    const lines: string[] = [];
    lines.push('# BATCH CONTEXT');
    lines.push('');
    lines.push('You are a helpful assistant embedded in the Viasox Autopilot brief generator.');
    lines.push('You have full visibility into the batch of briefs that was just generated.');
    lines.push('Answer the user\'s questions about the briefs concisely and accurately.');
    lines.push('When asked for counts, give exact numbers. When asked for recaps, be tight and well-organized.');
    lines.push('Use the data below as your only source of truth. Do not invent facts or briefs that are not listed.');
    lines.push('Format answers in plain text or simple markdown — short bullet points and tables are fine.');
    lines.push('');
    lines.push('## BATCH SUMMARY');
    lines.push(`- Total tasks in batch: ${state.tasks.length}`);
    lines.push(`- Successfully completed briefs: ${completed.length}`);
    lines.push(`- Failed briefs: ${state.tasks.filter((t) => t.step === 'error').length}`);
    lines.push(`- Briefs with voiceover (VO): ${voList.length}`);
    lines.push(`- Briefs without voiceover (No VO): ${noVoList.length}`);
    lines.push(`- Full AI ad type briefs: ${fullAiList.length}`);
    lines.push(`- Standard / Ecom Style briefs: ${completed.length - fullAiList.length}`);
    lines.push('');

    // Quick lookup table — small enough to scan, useful for "how many X" questions
    lines.push('## QUICK LOOKUP TABLE');
    lines.push('| # | Brief | Product | Angle | Duration | Ad Type | VO? | Framework | Awareness | Funnel |');
    lines.push('|---|---|---|---|---|---|---|---|---|---|');
    metas.forEach(({ meta }, i) => {
      lines.push(
        `| ${i + 1} | ${meta.briefName} | ${meta.product} | ${meta.angle} | ${meta.duration} | ${meta.adTypeShort}${meta.isFullAi && meta.fullAiSpecification ? ' (' + meta.fullAiSpecification + ')' : ''} | ${meta.hasVoiceover ? 'VO' : 'No VO'} | ${meta.framework || '\u2014'} | ${meta.awarenessLevel || '\u2014'} | ${meta.funnelStage || '\u2014'} |`,
      );
    });
    lines.push('');

    // Per-brief detailed dump — concept selection + full brief markdown
    lines.push('## DETAILED BRIEF DUMP');
    lines.push('');
    metas.forEach(({ ts, meta }, i) => {
      lines.push(`### Brief ${i + 1}: ${meta.briefName}`);
      lines.push(`- Product: ${meta.product}`);
      lines.push(`- Angle: ${meta.angle}`);
      lines.push(`- Duration: ${meta.duration}`);
      lines.push(`- Ad type: ${meta.adType}`);
      if (meta.isFullAi) {
        if (meta.fullAiSpecification) lines.push(`- Full AI specification: ${meta.fullAiSpecification}`);
        if (meta.fullAiVisualStyle) lines.push(`- Full AI visual style: ${meta.fullAiVisualStyle}`);
      }
      lines.push(`- Voiceover: ${meta.hasVoiceover ? 'YES' : 'NO'}${meta.voTone ? ' — ' + meta.voTone : ''}`);
      lines.push(`- Framework: ${meta.framework || 'unknown'}`);
      lines.push(`- Awareness level: ${meta.awarenessLevel || 'unknown'}`);
      lines.push(`- Funnel stage: ${meta.funnelStage || 'unknown'}`);
      if (meta.primaryEmotion) lines.push(`- Primary emotion: ${meta.primaryEmotion}`);
      if (meta.avatar) lines.push(`- Avatar: ${meta.avatar}`);
      lines.push(`- Hooks: ${meta.hookCount}`);
      lines.push(`- Body rows: ${meta.bodyRowCount}`);
      if (meta.firstHookLine) lines.push(`- First hook line: "${meta.firstHookLine}"`);
      if (meta.cta) lines.push(`- CTA: "${meta.cta}"`);
      if (ts.selectedConceptIndex) lines.push(`- Selected concept: #${ts.selectedConceptIndex}`);
      if (ts.selectionReasoning) {
        lines.push('- Why this concept was selected:');
        lines.push(`  ${ts.selectionReasoning.replace(/\n+/g, '\n  ')}`);
      }
      if (ts.selectedConceptText) {
        lines.push('');
        lines.push('**Selected concept (full text):**');
        lines.push('```');
        lines.push(ts.selectedConceptText.trim());
        lines.push('```');
      }
      if (ts.scriptResult) {
        lines.push('');
        lines.push('**Final brief markdown:**');
        lines.push('```');
        lines.push(ts.scriptResult.trim());
        lines.push('```');
      }
      lines.push('');
      lines.push('---');
      lines.push('');
    });

    if (state.reviewResult) {
      lines.push('## BATCH QC REVIEW');
      lines.push('');
      lines.push('```');
      lines.push(state.reviewResult.trim());
      lines.push('```');
      lines.push('');
    }

    if (state.memoryBriefing) {
      lines.push('## MEMORY BRIEFING (active for this batch)');
      lines.push('');
      lines.push('```');
      lines.push(state.memoryBriefing.trim());
      lines.push('```');
      lines.push('');
    }

    // Failed tasks — useful for "why did X fail?" questions
    const failed = state.tasks.filter((t) => t.step === 'error');
    if (failed.length > 0) {
      lines.push('## FAILED TASKS');
      failed.forEach((ts) => {
        lines.push(`- ${ts.task.parsed.name} (${ts.task.product} / ${ts.task.parsed.angle}): ${ts.error || 'unknown error'}`);
      });
      lines.push('');
    }

    return {
      systemPrompt: lines.join('\n'),
      completedCount: completed.length,
      voCount: voList.length,
      noVoCount: noVoList.length,
      fullAiCount: fullAiList.length,
    };
  }, [state]);

  // ── Auto-scroll the chat window to the bottom on new messages ──────────
  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open, sending]);

  // ── Cancel any in-flight request when the panel unmounts ───────────────
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    const nextHistory: DisplayMessage[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(nextHistory);
    setInput('');
    setError(null);
    setSending(true);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const apiMessages: ChatMessage[] = nextHistory.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const response = await sendChatMessage(
        systemPrompt,
        apiMessages,
        apiKey,
        4000,
        'claude-sonnet-4-20250514',
        controller.signal,
      );
      if (!controller.signal.aborted) {
        setMessages((prev) => [...prev, { role: 'assistant', content: response }]);
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(err instanceof Error ? err.message : 'Chat failed');
      }
    } finally {
      if (!controller.signal.aborted) {
        setSending(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    setMessages([]);
    setError(null);
  };

  // Suggested starter prompts the user can click
  const suggestions = [
    'How many briefs are non-VO?',
    'What ad types are in this batch?',
    'What are the CTAs for each brief?',
    'Recap the angles and scripts',
    'Which briefs use the same framework?',
    'Summarize the hooks across all briefs',
  ];

  return (
    <>
      {/* Floating launcher button (visible when collapsed) */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-slate-900 text-white pl-4 pr-5 py-3 rounded-full shadow-2xl hover:bg-slate-800 transition-colors group"
          aria-label="Open batch chat assistant"
        >
          <span className="text-lg">{'\uD83D\uDCAC'}</span>
          <span className="text-sm font-semibold">Ask about this batch</span>
          <span className="text-[10px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-full font-bold">
            {completedCount}
          </span>
        </button>
      )}

      {/* Chat panel (visible when open) */}
      {open && (
        <div className="fixed bottom-6 right-6 z-40 w-[420px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-3rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white flex-shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-lg">{'\uD83D\uDCAC'}</span>
              <div className="min-w-0">
                <div className="text-sm font-semibold">Batch Assistant</div>
                <div className="text-[10px] text-slate-300 truncate">
                  {completedCount} brief{completedCount !== 1 ? 's' : ''} · {voCount} VO · {noVoCount} No VO · {fullAiCount} Full AI
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={handleClear}
                  title="Clear conversation"
                  className="text-[10px] text-slate-300 hover:text-white px-2 py-1 rounded hover:bg-slate-800 transition-colors"
                >
                  Clear
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                aria-label="Collapse chat"
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-800 transition-colors text-slate-300 hover:text-white"
              >
                {'\u2715'}
              </button>
            </div>
          </div>

          {/* Message scroll area */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-slate-50"
          >
            {messages.length === 0 && !sending && (
              <div className="space-y-3">
                <div className="text-xs text-slate-600 leading-relaxed bg-blue-50 border border-blue-100 rounded-lg p-3">
                  <span className="font-semibold text-blue-800">Hi! </span>
                  I have full visibility into the {completedCount} brief{completedCount !== 1 ? 's' : ''} you just generated — concepts, scripts, ad types, hooks, CTAs, frameworks, and the QC review. Ask me anything about this batch.
                </div>
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold pt-1">Try asking</div>
                <div className="flex flex-col gap-1.5">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => setInput(s)}
                      className="text-left text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-md'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-3.5 py-2.5 text-xs text-slate-500 flex items-center gap-2">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            {error && (
              <div className="text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-lg p-2.5">
                {error}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-slate-200 p-3 bg-white flex-shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={'Ask about this batch\u2026'}
                rows={1}
                disabled={sending}
                className="flex-1 resize-none border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400 max-h-32"
                style={{ minHeight: 36 }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="bg-blue-600 text-white text-xs font-semibold px-3.5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
              >
                Send
              </button>
            </div>
            <div className="text-[10px] text-slate-400 mt-1.5 text-center">
              Press Enter to send · Shift+Enter for new line
            </div>
          </div>
        </div>
      )}
    </>
  );
}
