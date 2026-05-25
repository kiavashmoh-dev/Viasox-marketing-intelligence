/**
 * Brain — slice selector.
 *
 * Pure-TS function: given a task descriptor and the current VoC index,
 * decide which slices are relevant for THIS task. Returns a `SelectedSlices`
 * object that the renderer will turn into markdown.
 *
 * The selection is intentionally conservative — we lean toward including
 * fewer slices with stronger relevance signal, not "dump everything." Less
 * focused prompts produce more diffuse outputs.
 */
import type { BrainTaskDescriptor, SelectedSlices, VoCIndex, VoCItem } from './brainTypes';

/** How many items to keep in each included slice. Tunable per-slice. */
const TOP_OBJECTIONS = 5;
const TOP_TESTIMONIALS = 5;
const TOP_QUESTIONS = 5;
const TOP_PAIN = 5;
const TOP_DESIRES = 5;
const TOP_COMPLAINTS = 3;
const TOP_PERSONA = 5;
const TOP_EMERGING = 5;
const TOP_PRODUCT = 5;

/**
 * Decide which slices of the VoC index are relevant for the given task.
 * Returns a focused subset — never includes a slice that isn't useful for
 * the task (avoids prompt bloat).
 */
export function selectSlicesForTask(
  task: BrainTaskDescriptor,
  index: VoCIndex,
): SelectedSlices {
  const out: SelectedSlices = { sliceNames: [] };
  const include = (name: keyof Omit<SelectedSlices, 'sliceNames'>, items: VoCItem[]) => {
    if (items.length === 0) return;
    (out as unknown as Record<string, VoCItem[] | undefined>)[name as string] = items;
    out.sliceNames.push(name as string);
  };

  // ── Universal slices — every brain-enabled task gets these ──
  // Top objections matter for almost every output (scripts, hooks, briefs
  // all benefit from knowing what to rebut). Testimonials are similarly
  // broadly useful as language banks.
  include('topObjections', index.topObjections.slice(0, TOP_OBJECTIONS));
  include('topTestimonials', index.topTestimonials.slice(0, TOP_TESTIMONIALS));

  // ── Module-specific slices ──
  switch (task.module) {
    case 'differentiationCritic':
    case 'conceptEvaluator':
      // Critics benefit from emerging themes (so they can flag "this concept
      // ignores a trending theme") and pain points (so they can validate
      // the concept addresses real customer pain).
      include('emergingThemes', index.emergingThemes.slice(0, TOP_EMERGING));
      include('painPoints', index.painPoints.slice(0, TOP_PAIN));
      break;
    case 'hookGenerator':
      // Hooks live or die by language; emphasize testimonials (already in)
      // and questions (good attention-grabbers).
      include('recurringQuestions', index.recurringQuestions.slice(0, TOP_QUESTIONS));
      break;
    case 'conceptSelector':
      include('emergingThemes', index.emergingThemes.slice(0, TOP_EMERGING));
      include('painPoints', index.painPoints.slice(0, TOP_PAIN));
      break;
    case 'creativeStrategist':
    case 'strategySession':
      // Strategy benefits from the broadest slice — gaps, complaints, desires,
      // emerging themes all inform strategic direction.
      include('emergingThemes', index.emergingThemes.slice(0, TOP_EMERGING));
      include('painPoints', index.painPoints.slice(0, TOP_PAIN));
      include('desires', index.desires.slice(0, TOP_DESIRES));
      include('complaints', index.complaints.slice(0, TOP_COMPLAINTS));
      include('recurringQuestions', index.recurringQuestions.slice(0, TOP_QUESTIONS));
      break;
    case 'personaPrompt':
      // Persona prompts need persona-specific signals more than generic VoC.
      include('emergingThemes', index.emergingThemes.slice(0, TOP_EMERGING));
      break;
    case 'scriptWriter':
    case 'briefGenerator':
      // The actual producers benefit from the most context — they need to
      // know what to address, what to lean into, what to preempt.
      include('emergingThemes', index.emergingThemes.slice(0, TOP_EMERGING));
      include('painPoints', index.painPoints.slice(0, TOP_PAIN));
      include('desires', index.desires.slice(0, TOP_DESIRES));
      include('recurringQuestions', index.recurringQuestions.slice(0, TOP_QUESTIONS));
      break;
  }

  // ── Persona slice — only if task targets a known persona ──
  if (task.persona === 'beth' && index.personaSignals.beth.length > 0) {
    include('personaSignals', index.personaSignals.beth.slice(0, TOP_PERSONA));
  } else if (task.persona === 'linda' && index.personaSignals.linda.length > 0) {
    include('personaSignals', index.personaSignals.linda.slice(0, TOP_PERSONA));
  }

  // ── Product slice — only if task targets a known product ──
  if (task.product === 'compression' && index.productSignals.compression.length > 0) {
    include('productSignals', index.productSignals.compression.slice(0, TOP_PRODUCT));
  } else if (task.product === 'easystretch' && index.productSignals.easystretch.length > 0) {
    include('productSignals', index.productSignals.easystretch.slice(0, TOP_PRODUCT));
  } else if (task.product === 'ankle' && index.productSignals.ankle.length > 0) {
    include('productSignals', index.productSignals.ankle.slice(0, TOP_PRODUCT));
  }

  return out;
}
