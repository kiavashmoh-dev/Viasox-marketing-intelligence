/**
 * FeedbackPanel — Inline feedback input for directed regeneration.
 *
 * Renders below the regenerate button area. Lets the user describe exactly
 * what they want different before re-generating. Used by ResultsView and
 * AnglesResultsView.
 */

import { useState, useRef, useEffect } from 'react';

interface Props {
  /** Module-specific placeholder hint */
  placeholder?: string;
  /** Called when user submits feedback text */
  onRegenerateWithFeedback: (feedback: string) => void;
  /** Called when user wants a clean re-roll with no feedback */
  onRegenerateFresh: () => void;
  /** Called when user cancels — collapses the panel */
  onCancel: () => void;
}

export default function FeedbackPanel({
  placeholder = 'e.g., Make it more emotional, focus on the nurse persona, shorter hooks, less clinical tone...',
  onRegenerateWithFeedback,
  onRegenerateFresh,
  onCancel,
}: Props) {
  const [feedback, setFeedback] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus the textarea when the panel mounts
  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, []);

  const handleSubmitFeedback = () => {
    if (!feedback.trim()) return;
    onRegenerateWithFeedback(feedback.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Cmd/Ctrl+Enter submits
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && feedback.trim()) {
      e.preventDefault();
      handleSubmitFeedback();
    }
  };

  return (
    <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 mt-3 animate-fade-in">
      <div className="flex items-center justify-between mb-2.5">
        <label className="text-sm font-semibold text-slate-700">
          What would you like different?
        </label>
        <button
          onClick={onCancel}
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          Cancel
        </button>
      </div>

      <textarea
        ref={textareaRef}
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        maxLength={2000}
        rows={3}
        className="w-full px-4 py-2.5 border border-amber-200 rounded-lg bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-y transition-all"
        style={{ minHeight: '76px', maxHeight: '160px' }}
        onInput={(e) => {
          const el = e.target as HTMLTextAreaElement;
          el.style.height = 'auto';
          el.style.height = Math.min(el.scrollHeight, 160) + 'px';
        }}
      />

      <div className="flex items-center justify-between mt-3">
        <button
          onClick={onRegenerateFresh}
          className="px-4 py-2 text-sm text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-700 transition-colors"
        >
          Regenerate Fresh
        </button>

        <div className="flex items-center gap-2">
          {feedback.trim() && (
            <span className="text-[10px] text-slate-400">
              {'\u2318'}+Enter
            </span>
          )}
          <button
            onClick={handleSubmitFeedback}
            disabled={!feedback.trim()}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              feedback.trim()
                ? 'bg-amber-600 text-white hover:bg-amber-700 shadow-sm'
                : 'bg-slate-100 text-slate-300 cursor-not-allowed'
            }`}
          >
            Regenerate with Feedback
          </button>
        </div>
      </div>

      <p className="text-[10px] text-amber-600/70 mt-2 leading-relaxed">
        Your feedback is treated as the highest-priority instruction. Be specific about what to change, what to keep, and what to focus on.
      </p>
    </div>
  );
}
