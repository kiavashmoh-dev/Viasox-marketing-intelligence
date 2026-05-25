/**
 * Brain — addendum renderer.
 *
 * Pure-TS markdown rendering of (a) the selected VoC slices and (b) the
 * optional deep-reasoning output into a single string ready to be appended
 * to a system prompt. The output is delimited with explicit `---` separators
 * and labeled section headers so a human reading the prompt can see exactly
 * what the brain added.
 */
import type { SelectedSlices, VoCIndex, VoCItem } from './brainTypes';

/** Format a millisecond epoch as a short date string. */
function formatDate(ms: number | null): string {
  if (!ms) return 'unknown';
  return new Date(ms).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Render one VoCItem as a markdown bullet — theme + frequency + quotes. */
function renderItem(item: VoCItem): string {
  const lines: string[] = [];
  lines.push(`**${item.theme}** — ${item.frequency} mention${item.frequency === 1 ? '' : 's'}`);
  for (const q of item.sampleQuotes) {
    // Escape embedded quotes minimally — keep the markdown clean.
    lines.push(`   • "${q.replace(/"/g, '\\"')}"`);
  }
  return lines.join('\n');
}

/** Render a list of VoCItems as a numbered list under a section header. */
function renderSection(title: string, items: VoCItem[] | undefined): string {
  if (!items || items.length === 0) return '';
  const body = items.map((it, i) => `${i + 1}. ${renderItem(it)}`).join('\n\n');
  return `### ${title}\n${body}`;
}

/**
 * Render the VoC slices block. Always at the END of the system prompt,
 * never interleaved with existing content.
 */
export function renderVoCBlock(
  index: VoCIndex,
  slices: SelectedSlices,
): string {
  const header = [
    `## VOICE OF AUDIENCE — RECENT DATA (last index: ${formatDate(index.builtAt)})`,
    `Drawn from ${index.sources.reviewCount.toLocaleString()} reviews + ${index.sources.commentCount.toLocaleString()} comments across ${index.sources.commentAnalysisIds.length} analyses.`,
  ].join('\n');

  // Render every included slice, in a stable order, skipping empties.
  const sections: string[] = [];
  const pushSection = (title: string, items: VoCItem[] | undefined) => {
    const rendered = renderSection(title, items);
    if (rendered) sections.push(rendered);
  };
  pushSection('Top Unaddressed Objections (likely to need rebuttal)', slices.topObjections);
  pushSection('Strongest Testimonials Available For Repurposing', slices.topTestimonials);
  pushSection('Recurring Questions (potential content gaps)', slices.recurringQuestions);
  pushSection('Top Pain Points Being Expressed', slices.painPoints);
  pushSection('Customer Desires & Wishes', slices.desires);
  pushSection('Complaints / Service Issues', slices.complaints);
  pushSection('Persona Voice — Targeted Persona', slices.personaSignals);
  pushSection('Product-Specific Signals', slices.productSignals);
  pushSection('Emerging Themes', slices.emergingThemes);

  if (sections.length === 0) {
    return ''; // Nothing useful to render — return empty so addendum stays empty.
  }
  return `${header}\n\n${sections.join('\n\n')}`;
}

/**
 * Render the deep-reasoning block. Appended AFTER the VoC block (when both
 * are present) so the model sees data first, then reasoning over data.
 */
export function renderDeepReasoningBlock(reasoningOutput: string): string {
  if (!reasoningOutput.trim()) return '';
  return `## DEEP REASONING — GAP ANALYSIS FOR THIS TASK\n${reasoningOutput.trim()}`;
}

/**
 * Combine the VoC block and optional deep-reasoning block into a single
 * addendum string. Caller appends this directly to the existing system
 * prompt. Begins with a `\n\n---\n\n` separator so the brain content is
 * clearly delimited from whatever came before.
 */
export function renderAddendum(parts: {
  vocBlock: string;
  deepReasoningBlock: string;
}): string {
  const blocks: string[] = [];
  if (parts.vocBlock) blocks.push(parts.vocBlock);
  if (parts.deepReasoningBlock) blocks.push(parts.deepReasoningBlock);
  if (blocks.length === 0) return '';
  return `\n\n---\n\n${blocks.join('\n\n---\n\n')}`;
}
