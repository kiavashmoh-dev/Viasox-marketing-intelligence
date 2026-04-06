/**
 * Inspiration Bank — context block builder.
 *
 * Converts a list of scored inspiration picks into a compact text-only block
 * that gets injected into prompts (angles / scripts / concept selector).
 *
 * IMPORTANT: We never inject frames or full text content into generation
 * prompts — only the analyzer agent sees those. Generation prompts get the
 * distilled summary, learnings, and style notes.
 */

import type { ScoredInspiration } from './inspirationSelector';
import { selectInspiration, type SelectionOptions } from './inspirationSelector';
import { getEffectiveTags } from '../engine/inspirationTypes';

/** Build the markdown context block from already-scored picks. */
export function buildInspirationContext(picks: ScoredInspiration[]): string {
  if (picks.length === 0) return '';

  const lines: string[] = [];
  lines.push('');
  lines.push('# INSPIRATION BANK — REFERENCE EXAMPLES');
  lines.push('');
  lines.push(
    `The following ${picks.length} reference example${picks.length === 1 ? '' : 's'} from the Viasox Inspiration Bank ${picks.length === 1 ? 'is' : 'are'} highly relevant to this task. ${picks.length === 1 ? 'It was' : 'They were'} hand-picked because ${picks.length === 1 ? 'it' : 'they'} match the ad type, angle, and product context. STUDY ${picks.length === 1 ? 'IT' : 'THEM'}. The goal is not to copy ${picks.length === 1 ? 'it' : 'them'} verbatim, but to absorb the patterns, hooks, structure, and tone — then synthesize something that draws on what makes ${picks.length === 1 ? 'this example' : 'these examples'} work.`
  );
  lines.push('');

  picks.forEach((pick, idx) => {
    const item = pick.item;
    const tags = getEffectiveTags(item);
    const tagPills: string[] = [];
    if (tags.adType && tags.adType !== 'unknown') tagPills.push(tags.adType);
    if (tags.angleType && tags.angleType !== 'unknown') tagPills.push(tags.angleType);
    if (tags.framework && tags.framework !== 'unknown') tagPills.push(tags.framework);
    if (tags.duration && tags.duration !== 'unknown') tagPills.push(tags.duration);
    if (tags.productCategory && tags.productCategory !== 'unknown')
      tagPills.push(tags.productCategory);
    if (tags.isFullAi) tagPills.push('Full AI');
    if (tags.hookStyle && tags.hookStyle !== 'unknown') tagPills.push(`hook: ${tags.hookStyle}`);
    if (tags.emotionalEntry) tagPills.push(`emotion: ${tags.emotionalEntry}`);
    for (const ct of tags.customTags) tagPills.push(ct);

    lines.push(`## Reference ${idx + 1}: ${item.title}`);
    lines.push(`Kind: ${item.kind}${item.starred ? '  ★ STARRED' : ''}`);
    lines.push(`Tags: ${tagPills.join(' · ')}`);
    if (pick.matchReasons.length) {
      lines.push(`Why selected: ${pick.matchReasons.join(', ')}`);
    }
    lines.push('');

    if (item.summary) {
      lines.push(`**Why this works:** ${item.summary.trim()}`);
      lines.push('');
    }

    if (item.learnings.length) {
      lines.push('**What to apply:**');
      for (const l of item.learnings) {
        lines.push(`- ${l}`);
      }
      lines.push('');
    }

    if (item.styleNotes) {
      lines.push(`**Style notes:** ${item.styleNotes.trim()}`);
      lines.push('');
    }

    if (item.hookBreakdown) {
      lines.push(`**Hook breakdown:** ${item.hookBreakdown.trim()}`);
      lines.push('');
    }

    if (item.narrativeArc) {
      lines.push(`**Narrative arc:** ${item.narrativeArc.trim()}`);
      lines.push('');
    }

    if (item.userNotes) {
      lines.push(`**User notes:** ${item.userNotes.trim()}`);
      lines.push('');
    }
  });

  lines.push('# END INSPIRATION BANK');
  lines.push('');
  lines.push(
    'Synthesis instructions: Use these references as a stylistic and structural compass. If multiple references are shown, you may blend their patterns. Do not name the references in your output. Do not copy taglines or claims verbatim. Apply their craft to the task below.'
  );
  lines.push('');

  return lines.join('\n');
}

/** One-shot helper: select + build context block in a single call. */
export async function getInspirationContextBlock(
  opts: SelectionOptions
): Promise<{ block: string; picks: ScoredInspiration[] }> {
  const picks = await selectInspiration(opts);
  return { block: buildInspirationContext(picks), picks };
}
