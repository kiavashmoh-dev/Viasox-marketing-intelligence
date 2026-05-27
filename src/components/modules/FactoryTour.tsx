/**
 * FactoryTour — visual walkthrough of how a brief actually gets made.
 *
 * Designed for someone seeing the tool for the first time. Goal: convey
 * the depth + sophistication of the pipeline without making them read
 * documentation. Every stage is shown as a node; every input is shown as
 * a feeder; every decision is shown as a fork; every learning signal is
 * shown as a loop.
 *
 * Pure presentation — reads zero data, renders zero engine output. It's
 * an explainer page, not a functional surface. Lives in the sidebar's
 * Briefing group as a peer to The Factory itself.
 *
 * Visual identity is the Direction B warm-premium palette: cream
 * background, navy primary, Newsreader serif for chapter titles, warm
 * accents (amber/terracotta/sage) used semantically per node type.
 */
import { useState } from 'react';

interface Props {
  onBack: () => void;
  /** Optional — wire from the parent to give the closing CTA somewhere to go. */
  onOpenFactory?: () => void;
}

// ─── Node color tokens — semantic per node type ────────────────────────
const NODE_TONES = {
  input: 'bg-white border-cream-border text-navy',
  knowledge: 'bg-warm-sage/8 border-warm-sage/30 text-warm-sage',
  memory: 'bg-warm-terracotta/8 border-warm-terracotta/30 text-warm-terracotta',
  pipeline: 'bg-navy/5 border-navy/25 text-navy',
  output: 'bg-warm-amber/10 border-warm-amber/40 text-warm-amber',
  loop: 'bg-warm-terracotta/10 border-warm-terracotta/40 text-warm-terracotta',
} as const;

type NodeTone = keyof typeof NODE_TONES;

export default function FactoryTour({ onBack, onOpenFactory }: Props) {
  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-5xl mx-auto px-8 py-10">
        {/* Top nav */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="text-sm text-slate-500 hover:text-navy flex items-center gap-1 transition-colors"
          >
            {'←'} Back
          </button>
          <div className="text-xs text-slate-400 italic font-display">
            A guided tour
          </div>
        </div>

        {/* Hero */}
        <header className="mb-14 animate-slide-up">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-warm-amber mb-3">
            The Factory · Anatomy
          </div>
          <h1 className="font-display text-6xl font-medium text-navy tracking-tight leading-[1.05]">
            How a brief
            <br />
            <span className="italic font-display text-warm-terracotta">actually</span> gets made.
          </h1>
          <p className="font-display text-xl text-slate-600 mt-6 leading-relaxed max-w-3xl italic">
            Every brief that leaves this tool is the product of {' '}
            <span className="text-navy not-italic font-medium">six AI stages</span>, {' '}
            <span className="text-navy not-italic font-medium">five knowledge sources</span>, and a {' '}
            <span className="text-navy not-italic font-medium">closed-loop memory</span> that learns
            from every batch you ship.
          </p>
        </header>

        {/* Section 01 — Inputs */}
        <Chapter number="01" title="The Inputs" subtitle="Three streams feed every batch">
          <p className="text-sm text-slate-600 max-w-2xl mb-8 leading-relaxed">
            The Factory doesn&apos;t generate from a blank page. Before it writes a single line, it gathers
            context from three independent streams — what you asked for, what it knows about your brand
            and your customers, and what it remembers from every batch before this one.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Stream 1: User Input */}
            <ColumnHeader title="From you" subtitle="Per batch" tone="input" />
            {/* Stream 2: Knowledge */}
            <ColumnHeader title="Knowledge sources" subtitle="Always-on context" tone="knowledge" />
            {/* Stream 3: Memory */}
            <ColumnHeader title="Memory" subtitle="From past batches" tone="memory" />

            {/* Stream 1 items */}
            <NodeStack>
              <Node tone="input" icon="📋" title="Batch of tasks" detail="Asana screenshot or manual table — name, product, angle, medium, ad type per row." />
              <Node tone="input" icon="📌" title="Pinned inspirations" detail="Optional: a specific reference ad to anchor a brief. Bypasses auto-selection." />
              <Node tone="input" icon="🎯" title="Strategy answers" detail="You answer 3–5 strategic questions per batch — direction the Factory takes from there." />
            </NodeStack>

            {/* Stream 2 items */}
            <NodeStack>
              <Node tone="knowledge" icon="⭐" title="Customer Reviews" detail="107,000+ analyzed reviews. Top pains, benefits, themes, discovered segments. Lives in the brain." />
              <Node tone="knowledge" icon="💬" title="Ad Comments" detail="Comments pulled from Meta. Objections, questions, language patterns. Merged with reviews in the VoC index." />
              <Node tone="knowledge" icon="📚" title="Brand Manifesto" detail="Product specs, prices, personas, voice, the offer — always-on, baked into every prompt." />
              <Node tone="knowledge" icon="📖" title="DTC Books" detail="Hopkins, Schwartz, Bly, Neumeier — copywriting + positioning principles embedded in prompt scaffolding." />
              <Node tone="knowledge" icon="🎨" title="Inspiration Bank" detail="Reference ads + briefs you've uploaded. Tagged, scored, surfaced when relevant." />
            </NodeStack>

            {/* Stream 3 items */}
            <NodeStack>
              <Node tone="memory" icon="🗃️" title="Past briefs" detail="Every shipped brief, its concept, framework, hook style, and QC score — for pattern recognition." />
              <Node tone="memory" icon="📊" title="Performance scores" detail="QC reviewer scores tied to each brief. Feeds back into inspiration ranking + angle history." />
              <Node tone="memory" icon="🧭" title="Angle patterns" detail="Per-angle behavior: which frameworks worked, which hooks landed, what to avoid repeating." />
            </NodeStack>
          </div>

          {/* Flow-down indicator */}
          <ConvergenceIndicator />
        </Chapter>

        {/* Section 02 — Pipeline */}
        <Chapter number="02" title="The Pipeline" subtitle="One strategy pass · six per-brief stages">
          <p className="text-sm text-slate-600 max-w-2xl mb-8 leading-relaxed">
            The Factory runs the strategy session <span className="italic">once per batch</span> to set
            direction — then loops through six stages for <span className="italic">every brief</span>,
            each consuming earlier outputs and the always-on context.
          </p>

          {/* Strategy session block */}
          <div className="mb-12">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-warm-amber mb-3">
              Once per batch
            </div>
            <BigStageCard
              icon="🎙️"
              title="Strategy Session"
              role="Sets the strategic direction for the entire batch"
              consumes={['All tasks at once', 'Reviews + comments (via brain)', 'Manifesto', 'Memory']}
              produces="Q&A for you to approve + a synthesized creative direction"
              note="The brain fires deep reasoning ONCE here — that single analysis gets cached and reused by every per-brief stage that follows, saving N-1 Claude calls per batch."
            />
          </div>

          {/* Per-brief loop */}
          <div className="relative">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-warm-terracotta mb-3">
              For each brief in the batch
            </div>

            {/* Vertical timeline of stages */}
            <div className="relative pl-8 border-l-2 border-dashed border-navy/15 space-y-5">
              <StageStep
                num={1}
                icon="💡"
                title="Creative Strategist"
                role="Produces the per-brief thesis"
                consumes="Strategy direction · brain VoC context · book wisdom"
                produces="A 1-page strategic thesis the next stages must execute"
              />
              <StageStep
                num={2}
                icon="🎨"
                title="Concept Generator"
                role="Writes 5 distinct concepts off the thesis"
                consumes="Thesis · inspirations (selected or pinned) · angle history"
                produces="5 raw concepts varying in approach, framework, emotional entry"
              />
              <StageStep
                num={3}
                icon="🔍"
                title="Differentiation Critic"
                role="Judges each concept against its inspirations"
                consumes="The 5 concepts · the inspiration context"
                produces="KEEP / REJECT verdict per concept + an overall call. Triggers one regen if too many rejects."
              />
              <StageStep
                num={4}
                icon="🏆"
                title="Concept Evaluator"
                role="Scores the survivors and recommends the best"
                consumes="Surviving concepts · brain VoC (cached) · angle history"
                produces="Ranked concept options with strength scores"
              />
              <StageStep
                num={5}
                icon="👀"
                title="Your Review"
                role="You see the concepts and approve or redo"
                consumes="The ranked options"
                produces="Selected concept (yours or auto-pick)"
                isYou
              />
              <StageStep
                num={6}
                icon="📝"
                title="Script Writer"
                role="Writes the actual brief"
                consumes="Selected concept · deep inspiration context (incl. frames via vision API for pinned items) · brain VoC · book wisdom · memory failure patterns"
                produces="The final brief in the right template for the ad type"
              />
            </div>
          </div>

          <ConvergenceIndicator />
        </Chapter>

        {/* Section 03 — Output */}
        <Chapter number="03" title="The Output" subtitle="Briefs, ready to ship">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <OutputCard
              icon="📄"
              format="DOC"
              title="Editing brief"
              for="Ecom Style · Full AI · AI Podcast · Static · UGC"
              detail="Navy-headered Word doc. Sent to the editor who assembles the final ad from existing footage or AI generation."
            />
            <OutputCard
              icon="📊"
              format="CSV"
              title="Production brief"
              for="AGC · Founder · Spokesperson · Fake Podcast · Packaging/Employee"
              detail="10-column shot table with the 9-hook 3×3 matrix. Sent to Nora's production team for a film shoot."
            />
          </div>

          <p className="text-xs text-slate-500 italic mt-6 font-display text-center max-w-2xl mx-auto leading-relaxed">
            The output formats themselves never change with the tool's UI updates — they match the
            templates your editing + production teams already know how to read.
          </p>
        </Chapter>

        {/* Section 04 — Learning Loop */}
        <Chapter number="04" title="The Learning Loop" subtitle="Every batch makes the next one smarter">
          <p className="text-sm text-slate-600 max-w-2xl mb-8 leading-relaxed">
            After briefs ship, the QC reviewer's scores feed back into two systems — and the next
            batch you run starts with a smarter pool of references and a sharper sense of what works.
          </p>

          <div className="relative bg-warm-terracotta/5 border border-warm-terracotta/20 rounded-2xl p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
              <LoopStep
                num="1"
                title="Score arrives"
                detail="QC reviewer rates each brief 1–10 with structured notes on what worked / didn't."
              />
              <LoopArrow />
              <LoopStep
                num="2"
                title="Two stores update"
                detail="Inspiration scoring: items used in winning briefs get a derivedScore boost. After 4+ uses, auto-stars. Memory: angle-level success patterns get logged."
              />
            </div>

            <div className="my-6 flex justify-center">
              <div className="text-2xl text-warm-terracotta">↓</div>
            </div>

            <LoopStep
              num="3"
              title="Next batch starts smarter"
              detail="Selector pulls higher-scoring inspirations first. Concept evaluator avoids angle patterns that scored poorly. The Factory you opened today is sharper than the one you opened last week — without anyone configuring anything."
              full
            />

            {/* Circular indicator */}
            <div className="mt-8 flex items-center justify-center gap-2 text-xs text-warm-terracotta font-display italic">
              <span className="text-base">↻</span>
              <span>the loop closes — and tightens — with every shipped batch</span>
              <span className="text-base">↻</span>
            </div>
          </div>
        </Chapter>

        {/* Closing CTA */}
        <footer className="mt-20 mb-8 text-center">
          <div className="font-display text-3xl text-navy font-medium mb-3">
            Now you&apos;ve seen the inside.
          </div>
          <p className="text-slate-500 max-w-xl mx-auto mb-8 text-sm">
            Every shortcut, every selector, every score is there to give the next brief a better
            shot than the last one. The Factory floor is open.
          </p>
          {onOpenFactory && (
            <button
              onClick={onOpenFactory}
              className="inline-flex items-center gap-2 px-6 py-3 bg-navy text-cream rounded-lg font-medium text-sm hover:bg-navy-deep transition-colors shadow-sm hover-lift"
            >
              <span className="text-base">🏭</span>
              Open The Factory
              <span aria-hidden>→</span>
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}

// ─── Building blocks ────────────────────────────────────────────────────

function Chapter({
  number,
  title,
  subtitle,
  children,
}: {
  number: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-20 animate-slide-up">
      {/* Decorative ornate divider above each chapter */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex-1 h-px bg-cream-border" />
        <span className="font-display text-warm-amber italic text-xs">·</span>
        <div className="flex-1 h-px bg-cream-border" />
      </div>

      <div className="flex items-baseline gap-4 mb-2">
        <span className="font-display text-3xl text-warm-amber italic tabular-nums">{number}</span>
        <h2 className="font-display text-4xl font-medium text-navy tracking-tight">{title}</h2>
      </div>
      <p className="font-display italic text-slate-500 mb-10 ml-14">{subtitle}</p>

      {children}
    </section>
  );
}

function ColumnHeader({
  title,
  subtitle,
  tone,
}: {
  title: string;
  subtitle: string;
  tone: NodeTone;
}) {
  const accent = {
    input: 'text-navy',
    knowledge: 'text-warm-sage',
    memory: 'text-warm-terracotta',
    pipeline: 'text-navy',
    output: 'text-warm-amber',
    loop: 'text-warm-terracotta',
  }[tone];
  return (
    <div className="mb-1">
      <div className={`text-[10px] font-bold uppercase tracking-[0.2em] ${accent}`}>{title}</div>
      <div className="text-[11px] text-slate-400 italic font-display">{subtitle}</div>
    </div>
  );
}

function NodeStack({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-2.5">{children}</div>;
}

function Node({
  tone,
  icon,
  title,
  detail,
}: {
  tone: NodeTone;
  icon: string;
  title: string;
  detail: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className={`relative border rounded-xl px-3.5 py-3 transition-all duration-300 cursor-default ${NODE_TONES[tone]} hover-lift`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-center gap-2.5">
        <span className="text-base shrink-0">{icon}</span>
        <span className="text-sm font-semibold">{title}</span>
      </div>
      {hovered && (
        <div className="text-[11px] text-slate-600 mt-2 leading-relaxed animate-fade-in">
          {detail}
        </div>
      )}
    </div>
  );
}

function ConvergenceIndicator() {
  return (
    <div className="flex flex-col items-center mt-10 mb-2 gap-2">
      {/* Three lines converging into one */}
      <svg width="180" height="40" viewBox="0 0 180 40" className="text-navy/30">
        <path d="M 20 0 Q 20 25, 90 30" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M 90 0 L 90 30" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M 160 0 Q 160 25, 90 30" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M 90 30 L 90 40" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
        <circle cx="90" cy="40" r="3" fill="currentColor" />
      </svg>
      <div className="font-display italic text-xs text-slate-400">…all flow into the pipeline</div>
    </div>
  );
}

function BigStageCard({
  icon,
  title,
  role,
  consumes,
  produces,
  note,
}: {
  icon: string;
  title: string;
  role: string;
  consumes: string[];
  produces: string;
  note?: string;
}) {
  return (
    <div className="bg-navy text-cream rounded-2xl p-6 shadow-md">
      <div className="flex items-start gap-4">
        <span className="text-3xl shrink-0">{icon}</span>
        <div className="flex-1">
          <h3 className="font-display text-2xl font-medium leading-tight mb-1">{title}</h3>
          <p className="text-cream/80 text-sm italic font-display">{role}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-[12px]">
        <div>
          <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-cream/50 mb-1.5">Consumes</div>
          <ul className="space-y-1">
            {consumes.map((c) => (
              <li key={c} className="text-cream/90 flex gap-2 leading-snug">
                <span className="text-warm-amber">·</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-cream/50 mb-1.5">Produces</div>
          <p className="text-cream/90 leading-snug">{produces}</p>
        </div>
      </div>

      {note && (
        <div className="mt-5 pt-4 border-t border-cream/15">
          <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-warm-amber mb-1.5">
            Quiet detail
          </div>
          <p className="text-cream/80 text-[12px] italic font-display leading-relaxed">{note}</p>
        </div>
      )}
    </div>
  );
}

function StageStep({
  num,
  icon,
  title,
  role,
  consumes,
  produces,
  isYou,
}: {
  num: number;
  icon: string;
  title: string;
  role: string;
  consumes: string;
  produces: string;
  isYou?: boolean;
}) {
  return (
    <div className="relative">
      {/* Number badge — sits ON the timeline line */}
      <div className={`absolute -left-[44px] top-0 w-8 h-8 rounded-full flex items-center justify-center font-display text-sm font-medium ring-4 ring-cream ${
        isYou ? 'bg-warm-amber text-navy' : 'bg-navy text-cream'
      }`}>
        {num}
      </div>

      <div className={`border rounded-xl p-4 transition-all hover-lift bg-white ${
        isYou ? 'border-warm-amber/40' : 'border-cream-border'
      }`}>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-base shrink-0">{icon}</span>
          <h4 className={`font-display text-lg font-medium ${isYou ? 'text-warm-amber' : 'text-navy'}`}>
            {title}
          </h4>
          {isYou && (
            <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-warm-amber bg-warm-amber/10 px-1.5 py-0.5 rounded">
              You
            </span>
          )}
        </div>
        <p className="text-sm text-slate-600 italic font-display mb-3 ml-7">{role}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] ml-7">
          <div>
            <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400 mb-1">Feeds in</div>
            <p className="text-slate-600 leading-snug">{consumes}</p>
          </div>
          <div>
            <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400 mb-1">Flows out</div>
            <p className="text-slate-600 leading-snug">{produces}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function OutputCard({
  icon,
  format,
  title,
  for: forText,
  detail,
}: {
  icon: string;
  format: string;
  title: string;
  for: string;
  detail: string;
}) {
  return (
    <div className="bg-white border border-warm-amber/30 rounded-2xl p-6 hover-lift">
      <div className="flex items-baseline justify-between mb-3">
        <span className="text-3xl">{icon}</span>
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-warm-amber bg-warm-amber/10 px-2 py-1 rounded">
          {format}
        </span>
      </div>
      <h3 className="font-display text-2xl font-medium text-navy mb-1.5">{title}</h3>
      <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-3">{forText}</div>
      <p className="text-sm text-slate-600 leading-relaxed">{detail}</p>
    </div>
  );
}

function LoopStep({
  num,
  title,
  detail,
  full,
}: {
  num: string;
  title: string;
  detail: string;
  full?: boolean;
}) {
  return (
    <div className={`bg-white border border-warm-terracotta/25 rounded-xl p-4 ${full ? 'md:col-span-3' : ''}`}>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="font-display text-xl text-warm-terracotta italic font-medium">{num}</span>
        <h4 className="font-display text-lg font-medium text-navy">{title}</h4>
      </div>
      <p className="text-xs text-slate-600 leading-relaxed">{detail}</p>
    </div>
  );
}

function LoopArrow() {
  return (
    <div className="flex items-center justify-center text-warm-terracotta/60">
      <span className="text-2xl">→</span>
    </div>
  );
}
