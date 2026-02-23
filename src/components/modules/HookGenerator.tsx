import { useState, useRef } from 'react';
import type { FullAnalysis, ProductCategory, AwarenessLevel, HookStyle } from '../../engine/types';
import { useClaudeApi } from '../../hooks/useClaudeApi';
import { buildHooksPrompt } from '../../prompts/hooksPrompt';
import { buildResourceContext } from '../../prompts/systemBase';
import { buildRegenerationPrompt } from '../../prompts/regenerationPrompt';
import ResultsView from '../ResultsView';

interface Props {
  analysis: FullAnalysis;
  apiKey: string;
  resourceContext: string;
  onBack: () => void;
}

const PRODUCTS: ProductCategory[] = ['EasyStretch', 'Compression', 'Ankle Compression'];
const AWARENESS: AwarenessLevel[] = ['Unaware', 'Problem Aware', 'Solution Aware', 'Product Aware', 'Most Aware'];
const FORMATS = ['Video', 'Static', 'Text'] as const;
const COUNTS = [10, 20, 30] as const;

const ALL_HOOK_STYLES: { value: HookStyle; description: string }[] = [
  { value: 'Question Hook', description: 'Opens with a question the viewer mentally answers' },
  { value: 'Bold Claim', description: 'Surprising, data-backed statement' },
  { value: 'Pattern Interrupt', description: 'Unexpected break from scroll pattern' },
  { value: 'Story Opening', description: 'Drops the viewer mid-story' },
  { value: 'Curiosity Gap', description: 'Creates an information gap' },
  { value: 'Social Proof', description: 'Leads with numbers, ratings, crowd behavior' },
  { value: 'Contrarian / Myth Buster', description: 'Challenges a common belief' },
  { value: 'Identity Callout', description: 'Names the viewer by who they are' },
  { value: 'Pain Agitation', description: 'Names and intensifies a specific pain' },
  { value: 'Transformation Reveal', description: 'Shows before/after immediately' },
  { value: 'Permission Hook', description: 'Gives permission to stop accepting a problem' },
  { value: 'Insider / Secret', description: 'Privileged knowledge from an expert' },
  { value: 'Comparison / Versus', description: 'Old way vs. new way contrast' },
  { value: 'Warning / Urgency', description: 'Creates genuine urgency or concern' },
  { value: 'Emotional Trigger', description: 'Leads with pure emotion' },
  { value: 'Direct Address', description: 'Speaks directly to the viewer — "You"' },
  { value: 'Shock Value', description: 'Surprising visual or statement' },
  { value: 'Relatable Moment', description: 'Hyper-specific moment they\'ve experienced' },
  { value: 'Enemy Callout', description: 'Names the enemy — old way, bad product' },
  { value: 'Aspirational Vision', description: 'Paints the future state vividly' },
];

export default function HookGenerator({ analysis, apiKey, resourceContext, onBack }: Props) {
  const [product, setProduct] = useState<ProductCategory>('EasyStretch');
  const [awareness, setAwareness] = useState<AwarenessLevel>('Problem Aware');
  const [format, setFormat] = useState<(typeof FORMATS)[number]>('Video');
  const [count, setCount] = useState<(typeof COUNTS)[number]>(10);
  const [selectedStyles, setSelectedStyles] = useState<HookStyle[]>([]);
  const [scriptContext, setScriptContext] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { result, loading, error, generate, reset } = useClaudeApi(apiKey);

  const hasScript = scriptContext.trim().length > 0;

  const toggleStyle = (style: HookStyle) => {
    setSelectedStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style],
    );
  };

  const selectAllStyles = () => {
    if (selectedStyles.length === ALL_HOOK_STYLES.length) {
      setSelectedStyles([]);
    } else {
      setSelectedStyles(ALL_HOOK_STYLES.map((s) => s.value));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === 'string') {
        setScriptContext(text);
      }
    };
    reader.readAsText(file);
    // Reset file input so the same file can be re-uploaded
    e.target.value = '';
  };

  const handleGenerate = (feedback?: string) => {
    const { system, user } = buildHooksPrompt(
      {
        product,
        awarenessLevel: awareness,
        format,
        count,
        hookStyles: selectedStyles,
        scriptContext: scriptContext.trim() || undefined,
      },
      analysis,
    );
    // Scale tokens based on hook count: ~250 tokens per hook for script-mode, ~200 for standalone
    const tokensPerHook = scriptContext.trim() ? 250 : 200;
    const feedbackBonus = feedback ? 1000 : 0;
    const hookTokens = Math.max(count * tokensPerHook + feedbackBonus, 6000);
    const finalUser = feedback && result
      ? buildRegenerationPrompt(user, result, feedback)
      : user;
    generate(system + buildResourceContext(resourceContext), finalUser, Math.min(hookTokens, 16000));
  };

  if (result || loading || error) {
    return (
      <ResultsView
        content={result ?? ''}
        title="Hooks"
        onBack={() => { reset(); onBack(); }}
        onBackToBuilder={reset}
        onRegenerate={handleGenerate}
        loading={loading}
        error={error}
        feedbackPlaceholder="e.g., Make hooks 3 and 7 shorter, add more question-style hooks, match a warmer tone, focus on the nurse persona..."
      />
    );
  }

  const selectClass = 'w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-2xl mx-auto">
        <button onClick={onBack} className="text-sm text-slate-500 hover:text-slate-700 mb-6 flex items-center gap-1">
          {'\u2190'} Back to Dashboard
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-1">Hook Generator</h2>
          <p className="text-slate-500 text-sm mb-6">Generate hooks tailored to your script, grounded in review data and marketing frameworks</p>

          <div className="space-y-5">

            {/* ── SCRIPT INPUT — PRIMARY SECTION ── */}
            <div className={`rounded-xl border-2 p-5 transition-colors ${hasScript ? 'border-blue-500 bg-blue-50/30' : 'border-dashed border-slate-300 bg-slate-50/50'}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-800">
                    {'\uD83C\uDFAC'} Script to Write Hooks For
                  </label>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-md">
                    Paste or upload your script. Every hook will be written to plug directly before the first line — matching the tone, persona, angle, and concept of your script.
                  </p>
                </div>
                {hasScript && (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-100 px-2.5 py-1 rounded-full shrink-0">
                    {'\u2713'} Script loaded · {scriptContext.trim().split(/\s+/).length} words
                  </span>
                )}
              </div>
              <textarea
                value={scriptContext}
                onChange={(e) => setScriptContext(e.target.value)}
                placeholder={"Paste your script here...\n\nEvery hook generated will be designed to seamlessly plug in before the first line of this script. The hooks will match the tone, voice, persona, and angle throughout."}
                rows={7}
                className="w-full mt-2 px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono resize-y bg-white"
              />
              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  {'\uD83D\uDCC1'} Upload Script File
                </button>
                {hasScript && (
                  <button
                    onClick={() => setScriptContext('')}
                    className="text-xs text-red-500 hover:text-red-700 font-medium"
                  >
                    Clear Script
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.doc,.docx,.rtf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
              {!hasScript && (
                <p className="text-xs text-slate-400 mt-3 italic">
                  No script? Hooks will be generated as standalone — not tailored to a specific script.
                </p>
              )}
            </div>

            {/* ── CONFIGURATION OPTIONS ── */}
            <div className="grid grid-cols-2 gap-4">
              {/* Product */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Product Line</label>
                <select value={product} onChange={(e) => setProduct(e.target.value as ProductCategory)} className={selectClass}>
                  {PRODUCTS.map((p) => (
                    <option key={p} value={p}>{p} ({analysis.breakdown[p]?.toLocaleString() ?? 0} reviews)</option>
                  ))}
                </select>
              </div>

              {/* Awareness Level */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Awareness Level</label>
                <select value={awareness} onChange={(e) => setAwareness(e.target.value as AwarenessLevel)} className={selectClass}>
                  {AWARENESS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>

              {/* Format */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Format</label>
                <select value={format} onChange={(e) => setFormat(e.target.value as typeof format)} className={selectClass}>
                  {FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              {/* Count */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Number of Hooks</label>
                <select value={count} onChange={(e) => setCount(Number(e.target.value) as typeof count)} className={selectClass}>
                  {COUNTS.map((c) => <option key={c} value={c}>{c} hooks</option>)}
                </select>
              </div>
            </div>

            {/* Hook Styles — Multi-select */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-700">
                  Hook Styles to Include
                  <span className="text-slate-400 font-normal ml-1">
                    ({selectedStyles.length === 0 ? 'all styles' : `${selectedStyles.length} selected`})
                  </span>
                </label>
                <button
                  onClick={selectAllStyles}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  {selectedStyles.length === ALL_HOOK_STYLES.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto border border-slate-200 rounded-lg p-3">
                {ALL_HOOK_STYLES.map((style) => {
                  const isSelected = selectedStyles.includes(style.value);
                  return (
                    <button
                      key={style.value}
                      onClick={() => toggleStyle(style.value)}
                      className={`text-left p-2.5 rounded-lg border transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                          : 'border-slate-100 hover:border-slate-300 bg-slate-50'
                      }`}
                    >
                      <div className="font-medium text-xs text-slate-800 leading-tight">{style.value}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{style.description}</div>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Leave empty to generate across all styles. Select specific styles to focus the output.
              </p>
            </div>
          </div>

          <button onClick={() => handleGenerate()}
            className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
            {hasScript ? '\uD83C\uDFAF Generate Hooks for Script' : 'Generate Hooks'}
          </button>

          {hasScript && (
            <p className="text-xs text-center text-slate-400 mt-2">
              Each hook will be tailored to your script's angle, persona, tone, and concept — designed to plug in seamlessly before the first line.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
