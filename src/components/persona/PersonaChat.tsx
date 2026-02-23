/**
 * PersonaChat — Contextual AI assistant for the persona output page.
 *
 * Designed for non-marketing executives (CEO, COO, retail consultants) who need
 * to understand, clarify, and brainstorm from the generated persona output.
 *
 * The assistant is deeply grounded in:
 * 1. The SPECIFIC generated output (full markdown)
 * 2. Viasox brand identity and marketing manifesto
 * 3. Marketing frameworks (Schwartz, Hopkins, Neumeier, Bly)
 * 4. The underlying review data and segment analysis
 *
 * Positioned as a collapsible right-side panel on desktop, bottom drawer on mobile.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { sendChatMessage, type ChatMessage } from '../../api/claude';
import type { FullAnalysis, ProductCategory, PersonaChannel, MarketRegion } from '../../engine/types';
import { getProductAnalysis } from '../../prompts/systemBase';
import { buildMarketContext } from '../../data/marketIntelligence';

/* ── Types ──────────────────────────────────────────────────────────────── */

interface Props {
  /** The full generated persona output (raw markdown from Claude) */
  generatedOutput: string;
  /** API key for Claude calls */
  apiKey: string;
  /** Analysis data for context */
  analysis: FullAnalysis;
  /** Product line context */
  product: ProductCategory;
  /** Channel context */
  channel: PersonaChannel;
  /** Selected persona names */
  selectedPersonas: string[];
  /** Whether market analysis was included */
  includeMarket: boolean;
  /** Markets analyzed */
  markets: MarketRegion[];
}

interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

/* ── Suggested Questions (dynamically generated based on output) ──────── */

function buildSuggestedQuestions(
  generatedOutput: string,
  channel: PersonaChannel,
  includeMarket: boolean,
): string[] {
  // Extract persona names from the output to make questions specific
  const personaNames: string[] = [];
  const nameMatches = generatedOutput.matchAll(/(?:^|\n)#+\s*(?:Persona\s*\d+[:\s]*)?(?:"|")?([^"\n"]+)(?:"|")?/g);
  for (const m of nameMatches) {
    const name = m[1].trim();
    if (name.length > 3 && name.length < 60 && !name.startsWith('Market') && !name.startsWith('Source')) {
      personaNames.push(name);
    }
    if (personaNames.length >= 3) break;
  }

  const questions: string[] = [];

  // Questions that reference specific personas from the output
  if (personaNames.length > 0) {
    questions.push(`Walk me through the "${personaNames[0]}" persona — what are the key takeaways?`);
    if (personaNames.length > 1) {
      questions.push(`Compare "${personaNames[0]}" and "${personaNames[1]}" — which should we prioritize and why?`);
    }
  }

  // Channel-specific questions
  if (channel === 'DTC') {
    questions.push('Based on this report, what would the ideal Facebook ad look like for our top persona?');
    questions.push('Which persona has the strongest transformation arc and how do we use it in ads?');
  } else if (channel === 'Retail') {
    questions.push('How would I pitch these personas to a retail buyer at a line review?');
    questions.push('Which retailer is the best fit based on the persona profiles in this report?');
  } else {
    questions.push('What ROI narrative should I present to an institutional buyer based on this report?');
    questions.push('Which institutional setting has the highest volume opportunity according to these personas?');
  }

  // Data-grounded questions
  questions.push('What are the most surprising insights in this report that we should act on?');
  questions.push('Explain the four fears ratings in this report — what do those numbers mean for us?');

  if (includeMarket) {
    questions.push('Where are the biggest gaps between our review data and the market opportunity?');
  }

  questions.push('What should we do next with these persona insights — give me 3 concrete actions.');

  return questions.slice(0, 8);
}

/* ── Cross-Segment Data Formatter (same as personaPrompt.ts) ─────────── */

function formatCrossSegmentData(analysis: FullAnalysis, product: string): string {
  const sb = analysis.segmentBreakdown;
  if (!sb) return '';

  const sections: string[] = [];

  const affinity = sb.productAffinity?.[product as keyof typeof sb.productAffinity];
  if (affinity && affinity.length > 0) {
    sections.push('### SEGMENT WEIGHT & CONCENTRATION INDEX');
    sections.push(`Segments ranked by share of ${product} reviews:\n`);
    for (const entry of affinity.slice(0, 12)) {
      const ci = entry.concentrationIndex;
      const ciNote = ci > 1.2 ? '(over-indexed — this segment gravitates to this product)' : ci < 0.8 ? '(under-indexed — opportunity gap)' : '(balanced)';
      sections.push(`- **${entry.segmentName}** (${entry.layer}): ${entry.count.toLocaleString()} reviews, ${entry.shareOfProduct}% of product, CI: ${ci}x ${ciNote}`);
    }
    sections.push('');
  }

  if (sb.segments.length > 0) {
    sections.push('### CROSS-PRODUCT SEGMENT DISTRIBUTION');
    for (const seg of sb.segments.slice(0, 10)) {
      const parts = Object.entries(seg.byProduct).map(([p, d]) => `${p}: ${d.count} (${d.percentage}%)`);
      sections.push(`- **${seg.segmentName}** (${seg.layer}): ${parts.join(' | ')}`);
    }
    sections.push('');
  }

  const overlaps = sb.crossSegmentOverlap;
  if (overlaps && overlaps.length > 0) {
    sections.push('### IDENTITY x MOTIVATION OVERLAPS');
    sections.push('Most common persona intersections (who they are x why they buy):\n');
    for (const ov of overlaps.slice(0, 10)) {
      sections.push(`- **${ov.identity} x ${ov.motivation}**: ${ov.reviewCount.toLocaleString()} co-occurrences, ${ov.percentOfIdentity}% of identity segment, ${ov.avgRating}/5 avg rating`);
    }
    sections.push('');
  }

  return sections.join('\n');
}

/* ── System Prompt Builder ──────────────────────────────────────────────── */

function buildChatSystemPrompt(
  generatedOutput: string,
  analysis: FullAnalysis,
  product: ProductCategory,
  channel: PersonaChannel,
  selectedPersonas: string[],
  includeMarket: boolean,
  markets: MarketRegion[],
): string {
  // Build the underlying data that the report was generated from
  const productData = getProductAnalysis(analysis, product);
  const crossSegmentData = formatCrossSegmentData(analysis, product);

  // Build all-product summary for cross-referencing
  const otherProductSummaries: string[] = [];
  for (const [cat, pa] of Object.entries(analysis.products)) {
    if (pa && cat !== product) {
      otherProductSummaries.push(`**${cat}**: ${pa.totalReviews.toLocaleString()} reviews, ${pa.averageRating}/5 avg`);
    }
  }

  const marketContext = includeMarket
    ? buildMarketContext(channel === 'Retail', markets)
    : '';

  return `You are the Viasox Persona Intelligence Assistant. You have COMPLETE knowledge of the persona report currently on the user's screen because YOU generated it. The report below is YOUR output — you know every detail, every data point, every persona, every insight in it.

## YOUR REPORT (this is what the user is looking at right now)

${generatedOutput}

---

## THE DATA YOUR REPORT WAS BUILT FROM

The report above was generated from real Viasox customer review data. Here is the underlying data so you can answer questions about WHY the report says what it says, cite specific numbers, and go deeper than what's on screen.

### Generation Parameters
- **Product Line:** ${product}
- **Channel:** ${channel === 'DTC' ? 'Direct-to-Consumer (end buyers who wear the socks)' : channel === 'Retail' ? 'Retail (persona profiles framed as sell-through evidence for retail buyers)' : 'Wholesale / B2B (persona profiles translated into institutional outcomes evidence)'}
- **Personas Generated:** ${selectedPersonas.join(', ')}
- **Market Analysis:** ${includeMarket ? `Yes — ${markets.join(' & ')}` : 'Not included'}
- **Total Reviews Analyzed:** ${analysis.totalReviews.toLocaleString()}

### ${product} Product Review Data
${productData}

${crossSegmentData}

${otherProductSummaries.length > 0 ? `### Other Product Lines (for cross-reference)\n${otherProductSummaries.join('\n')}\n` : ''}

${marketContext ? `### Market Intelligence Data\n${marketContext}\n` : ''}

## VIASOX BRAND KNOWLEDGE

**Mission:** Viasox makes socks that respect the people who wear them. Comfort should never come at the cost of dignity, and health support should never look like surrender.

**Voice:** Empathetic, confident, specific. Never clinical. Never condescending. We speak to human beings, not conditions.

**Message Hierarchy:** 1. COMFORT > 2. NO MARKS > 3. STYLE > 4. EASY > 5. COMPRESSION/SUPPORT

**Core Insight:** "We're not selling to conditions or symptoms. We're speaking to human beings fighting to remain themselves."

**Four Core Customer Fears:**
1. Loss of Independence — "If I can't put on my own socks, what's next?"
2. Becoming a Burden — Adult children buying for parents, spouses helping daily
3. Physical Decline — The sock struggle symbolizes bigger health fears
4. Medical Device Stigma — "Those ugly beige things" — refusing to look sick

**Segmentation Model:**
- Layer 1 — MOTIVATION (Why They Buy): Comfort Seeker, Pain & Symptom Relief, Style Conscious, Quality & Value, Daily Wear Convert, Skeptic Converted, Emotional Transformer, Repeat Loyalist
- Layer 2 — IDENTITY (Who They Are): Healthcare Worker, Caregiver/Gift Buyer, Diabetic/Neuropathy, Standing Worker, Accessibility/Mobility, Traveler, Senior, Pregnant/Postpartum, Medical/Therapeutic
- A single review can match MULTIPLE segments across BOTH layers. The OVERLAP between motivation + identity segments is where the richest targeting insights live.

**Marketing Frameworks You Know:**
- **Schwartz (Breakthrough Advertising):** Three dimensions of the prospect's mind (Desires, Identifications, Beliefs). Five awareness levels: Unaware → Problem Aware → Solution Aware → Product Aware → Most Aware. Copy cannot create desire — only channel existing desire.
- **Hopkins (Scientific Advertising):** Specificity IS credibility. The best advertising is built on service. Address one person's self-interest.
- **Neumeier (The Brand Gap):** Brand = gut feeling. Trust = Reliability + Delight. Charismatic brands: people believe there's no substitute.
- **Bly (The Copywriter's Handbook):** Write to ONE person. Benefits beat features. The REAL benefit is one level deeper than you think. The best copy mirrors the prospect's own internal dialogue.

## HOW TO ANSWER QUESTIONS

1. **Your report IS your primary source.** When the user asks about anything in the personas, quote or reference specific sections from YOUR report above. Say things like "In the report, the Determined Nurse persona has a fear rating of 4/5 for Loss of Independence — this means..." NOT "Generally speaking, loss of independence..."

2. **Go deeper than the report when asked.** You have the underlying review data (pain points, benefits, segments, transformation stories, real customer quotes). When someone asks "why" or "how do you know that," pull from the data section to show the evidence behind the report's claims.

3. **Use exact numbers.** Never say "a significant portion" — say "47.3% of ${product} reviews mention comfort as a primary benefit." Pull the actual percentages and counts from the data above.

4. **Explain for non-marketers.** The CEO doesn't know what "concentration index" means. Translate: "The 1.4x concentration index for Diabetic/Neuropathy in ${product} means diabetic customers are 40% more likely to buy this specific product line than our average customer. They're not just a segment — they're the core audience for ${product}."

5. **Connect insights to action.** Don't just explain what the report says — tell them what to DO with it. "Based on the transformation arc data, the strongest before/after story is [X]. This should be the lead testimonial angle in our next ad campaign because [Y]."

6. **When brainstorming, be concrete and specific.** Don't say "consider targeting this demographic." Say "Run a Facebook ad with: Hook: 'My nurse friend told me about these socks — I wore them for a 12-hour shift and my legs didn't swell.' Format: UGC-style vertical video. Audience: Female, 28-45, healthcare worker interests. CTA: 'Try one pair risk-free.'"

7. **Reference personas by their actual names from the report.** Not "Persona 1" — use the exact archetype names that appear in the report.

8. **Admit what you don't know.** If the data doesn't support a claim, say so. "The review data doesn't cover price sensitivity directly — we'd need a separate survey or A/B test data for that."`;
}

/* ── Component ──────────────────────────────────────────────────────────── */

export default function PersonaChat({
  generatedOutput,
  apiKey,
  analysis,
  product,
  channel,
  selectedPersonas,
  includeMarket,
  markets,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [apiMessages, setApiMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Build system prompt and suggested questions (memoized by dependencies)
  const systemPrompt = useRef('');
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  useEffect(() => {
    systemPrompt.current = buildChatSystemPrompt(
      generatedOutput,
      analysis,
      product,
      channel,
      selectedPersonas,
      includeMarket,
      markets,
    );
    setSuggestedQuestions(buildSuggestedQuestions(generatedOutput, channel, includeMarket));
  }, [generatedOutput, analysis, product, channel, selectedPersonas, includeMarket, markets]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const sendUserMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: DisplayMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    const newApiMessages: ChatMessage[] = [
      ...apiMessages,
      { role: 'user' as const, content: text.trim() },
    ];

    setMessages(prev => [...prev, userMsg]);
    setApiMessages(newApiMessages);
    setInput('');
    setError(null);
    setIsLoading(true);

    // Cancel any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await sendChatMessage(
        systemPrompt.current,
        newApiMessages,
        apiKey,
        4096,
        'claude-opus-4-6',
        controller.signal,
      );

      if (!controller.signal.aborted) {
        const assistantMsg: DisplayMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, assistantMsg]);
        setApiMessages(prev => [...prev, { role: 'assistant' as const, content: response }]);
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        const msg = err instanceof Error ? err.message : 'Failed to get response';
        setError(msg);
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [apiKey, apiMessages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendUserMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendUserMessage(input);
    }
  };

  const handleSuggestedQuestion = (q: string) => {
    sendUserMessage(q);
  };

  const clearChat = () => {
    abortRef.current?.abort();
    setMessages([]);
    setApiMessages([]);
    setError(null);
    setIsLoading(false);
  };

  // ── Floating Toggle Button (always visible) ──
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105 transition-all duration-200 group"
        title="Ask the Persona Intelligence Assistant"
      >
        <span className="text-xl group-hover:scale-110 transition-transform">{'\uD83E\uDDE0'}</span>
        <span className="font-semibold text-sm">Ask Assistant</span>
        {messages.length > 0 && (
          <span className="w-5 h-5 bg-white/20 rounded-full text-[10px] font-bold flex items-center justify-center">
            {messages.filter(m => m.role === 'assistant').length}
          </span>
        )}
      </button>
    );
  }

  // ── Open Panel ──
  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] md:w-[460px] flex flex-col bg-white border-l border-slate-200 shadow-2xl animate-slide-in-right">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-lg shadow-sm">
            {'\uD83E\uDDE0'}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Persona Intelligence</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {product} &middot; {channel} &middot; {selectedPersonas.length} persona{selectedPersonas.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Clear conversation"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="Close panel"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Messages Area ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-slate-50/50">

        {/* Welcome state */}
        {messages.length === 0 && (
          <div className="space-y-5 py-2">
            {/* Welcome card */}
            <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{'\uD83D\uDC4B'}</span>
                <h4 className="text-sm font-semibold text-slate-800">Welcome</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                I generated the persona report you&apos;re viewing and I know every detail in it — the data points,
                the customer quotes, the segment analysis, and the strategic reasoning behind each insight.
                Ask me to explain anything, dig deeper, or brainstorm how to act on it.
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">Clarify insights</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium">Brainstorm ideas</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">Strategy advice</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">Explain concepts</span>
              </div>
            </div>

            {/* Suggested questions */}
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 px-1">
                Suggested Questions
              </p>
              <div className="space-y-1.5">
                {suggestedQuestions.slice(0, 5).map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSuggestedQuestion(q)}
                    className="w-full text-left px-3.5 py-2.5 text-xs text-slate-600 bg-white rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 hover:text-blue-700 transition-all group"
                  >
                    <span className="text-blue-400 mr-2 group-hover:text-blue-600">{'\u2192'}</span>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Message list */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-md'
                  : 'bg-white border border-slate-100 shadow-sm text-slate-700 rounded-bl-md'
              }`}
            >
              {msg.role === 'user' ? (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              ) : (
                <div className="prose prose-sm prose-slate max-w-none [&>p]:text-sm [&>p]:leading-relaxed [&>ul]:text-sm [&>ol]:text-sm [&>h1]:text-base [&>h2]:text-sm [&>h3]:text-xs [&>h1]:font-bold [&>h2]:font-semibold [&>h3]:font-semibold [&>blockquote]:text-xs [&>blockquote]:border-blue-200 [&>blockquote]:bg-blue-50/50 [&>blockquote]:rounded [&>blockquote]:py-1 [&>pre]:text-xs [&>pre]:bg-slate-50 [&_strong]:text-slate-800 [&_code]:text-xs [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded">
                  <Markdown remarkPlugins={[remarkGfm]}>{msg.content}</Markdown>
                </div>
              )}
              <div className={`text-[9px] mt-1.5 ${msg.role === 'user' ? 'text-blue-200' : 'text-slate-300'}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-100 shadow-sm rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
                <span className="text-xs text-slate-400">Analyzing...</span>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex justify-start">
            <div className="bg-red-50 border border-red-200 rounded-2xl rounded-bl-md px-4 py-3 max-w-[85%]">
              <p className="text-xs text-red-600">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-[10px] text-red-400 hover:text-red-600 mt-1 underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input Area ── */}
      <div className="border-t border-slate-100 bg-white px-4 py-3">
        {/* Quick suggestions after messages */}
        {messages.length > 0 && messages.length < 6 && !isLoading && (
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {suggestedQuestions
              .filter(q => !messages.some(m => m.content === q))
              .slice(0, 3)
              .map(q => (
                <button
                  key={q}
                  onClick={() => handleSuggestedQuestion(q)}
                  className="text-[10px] text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-full transition-colors truncate max-w-[200px]"
                >
                  {q}
                </button>
              ))
            }
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about the personas, strategy, or anything..."
              rows={1}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
              style={{
                minHeight: '40px',
                maxHeight: '120px',
                height: 'auto',
              }}
              onInput={(e) => {
                const el = e.target as HTMLTextAreaElement;
                el.style.height = 'auto';
                el.style.height = Math.min(el.scrollHeight, 120) + 'px';
              }}
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              input.trim() && !isLoading
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                : 'bg-slate-100 text-slate-300 cursor-not-allowed'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
            </svg>
          </button>
        </form>
        <p className="text-[9px] text-slate-300 mt-1.5 text-center">
          Shift+Enter for new line &middot; Grounded in your review data &amp; Viasox manifesto
        </p>
      </div>
    </div>
  );
}
