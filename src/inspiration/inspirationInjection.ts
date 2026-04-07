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

/**
 * Build a DEEP inspiration context block that matches the pinned-reference depth:
 *   - Marks the top pick as PRIMARY REFERENCE — to be followed most closely
 *   - Includes the reference script / VO text from each pick (the most actionable
 *     ingredient, omitted from the lighter `buildInspirationContext`)
 *   - Lists every pick's hook breakdown, narrative arc, style notes, and learnings
 *   - Surfaces a framework distribution across the picks so the generator knows
 *     which frameworks the proven references actually use
 *   - Closes with a "HOW TO USE THIS BANK — IN-DEPTH MIRRORING (NOT LIGHT
 *     INSPIRATION)" 9-point directive matching the tone of the pinned path
 *
 * Use this when the goal is for generated concepts and scripts to genuinely
 * mirror reference DNA, not just take a vague stylistic cue.
 */
export function buildDeepInspirationContext(picks: ScoredInspiration[]): string {
  if (picks.length === 0) return '';

  const lines: string[] = [];
  lines.push('');
  lines.push('# INSPIRATION BANK — REFERENCE EXAMPLES (DEEP MIRRORING MODE)');
  lines.push('');
  lines.push(
    `The following ${picks.length} reference example${picks.length === 1 ? '' : 's'} from the Viasox Inspiration Bank ${picks.length === 1 ? 'was' : 'were'} hand-picked because ${picks.length === 1 ? 'it matches' : 'they match'} the ad type, angle, product, and format of THIS specific brief. ${picks.length === 1 ? 'It is' : 'These are'} the proven creative patterns we know already work for this exact context. **You must follow ONE of them closely OR blend a coherent mix of them.** Do not generate concepts that ignore these references — they are the locked baseline of what good looks like for this task.`
  );
  lines.push('');

  // Framework distribution — tell the generator what proven patterns are in play
  const frameworkCounts = new Map<string, number>();
  const hookCounts = new Map<string, number>();
  for (const pick of picks) {
    const tags = getEffectiveTags(pick.item);
    if (tags.framework && tags.framework !== 'unknown') {
      frameworkCounts.set(tags.framework, (frameworkCounts.get(tags.framework) ?? 0) + 1);
    }
    if (tags.hookStyle && tags.hookStyle !== 'unknown') {
      hookCounts.set(tags.hookStyle, (hookCounts.get(tags.hookStyle) ?? 0) + 1);
    }
  }
  if (frameworkCounts.size > 0) {
    const list = Array.from(frameworkCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([f, c]) => `${f} (×${c})`)
      .join(', ');
    lines.push(`**Frameworks present in this reference set:** ${list} — favor these proven frameworks when recommending one for the chosen concept.`);
  }
  if (hookCounts.size > 0) {
    const list = Array.from(hookCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([h, c]) => `${h} (×${c})`)
      .join(', ');
    lines.push(`**Hook styles present:** ${list} — these are the hook archetypes that have worked for this exact context.`);
  }
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

    const isPrimary = idx === 0;
    const heading = isPrimary
      ? `## ⭐ PRIMARY REFERENCE — Reference 1: ${item.title}`
      : `## Reference ${idx + 1}: ${item.title}`;
    lines.push(heading);
    if (isPrimary) {
      lines.push(
        '*This is the highest-scoring match. If you decide to follow ONE reference, follow this one. Visual frames from this reference may be attached as images — study them carefully.*'
      );
    }
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
      lines.push('**Key learnings to replicate:**');
      item.learnings.forEach((l, i) => lines.push(`${i + 1}. ${l}`));
      lines.push('');
    }

    if (item.styleNotes) {
      lines.push(`**Style notes:** ${item.styleNotes.trim()}`);
      lines.push('');
    }

    if (item.hookBreakdown) {
      lines.push(`**Hook breakdown (first 3 seconds — REPLICATE THIS APPROACH):** ${item.hookBreakdown.trim()}`);
      lines.push('');
    }

    if (item.narrativeArc) {
      lines.push(`**Narrative arc — MATCH THIS STRUCTURE BEAT FOR BEAT:** ${item.narrativeArc.trim()}`);
      lines.push('');
    }

    // The single biggest content gap vs the pinned path: include the
    // reference script / VO text so the generator can study the rhythm
    // and beat structure (without copying lines verbatim).
    const refScript = item.attachedScriptText || item.textContent || '';
    if (refScript.trim()) {
      lines.push('**Reference script / VO (study the rhythm, pacing, and beat structure — do NOT copy lines):**');
      lines.push('```');
      lines.push(refScript.trim());
      lines.push('```');
      lines.push('');
    }

    if (item.userNotes) {
      lines.push(`**User notes:** ${item.userNotes.trim()}`);
      lines.push('');
    }
  });

  lines.push('# END INSPIRATION BANK');
  lines.push('');
  lines.push('## HOW TO USE THIS BANK — IN-DEPTH MIRRORING (NOT LIGHT INSPIRATION)');
  lines.push('');
  lines.push('1. **Pick a path:** either FOLLOW the PRIMARY reference closely, or BLEND a coherent mix of 2-3 references that share compatible structures. Do NOT ignore the bank.');
  lines.push("2. **Concept level:** every concept you generate must structurally mirror the chosen reference(s) — same hook archetype, same emotional entry, same narrative shape.");
  lines.push('3. **Visual level:** the visual treatment, framing, color palette, and pacing must match what the references show. If frames are attached for the PRIMARY reference, use them as the literal visual blueprint.');
  lines.push('4. **Script level:** the script body must walk the same beats as the chosen reference(s). Use the reference scripts above to study rhythm, sentence length, and pacing — do NOT copy lines.');
  lines.push('5. **Hook level:** the first 3 seconds must use one of the hook archetypes shown above. Do not invent a new hook style for this brief.');
  lines.push('6. **Tone:** voice, register, sentence length, and rhythm must echo the reference scripts.');
  lines.push("7. **Framework recommendation:** when recommending a framework, prefer the frameworks present in the reference set above. They are the proven patterns for this exact context.");
  lines.push("8. Apply every listed learning as a creative principle that shapes your decisions.");
  lines.push("9. The references' product/angle may differ from THIS brief's — translate the STYLE, STRUCTURE, FRAMEWORK, and PACING, not the literal content. Do NOT name the references in your output. Do NOT copy taglines or claims verbatim.");
  lines.push('');

  return lines.join('\n');
}

/** One-shot helper: select + build the DEEP context block in a single call. */
export async function getDeepInspirationContextBlock(
  opts: SelectionOptions
): Promise<{ block: string; picks: ScoredInspiration[] }> {
  const picks = await selectInspiration(opts);
  return { block: buildDeepInspirationContext(picks), picks };
}
