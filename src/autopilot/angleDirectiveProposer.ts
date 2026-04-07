/**
 * Angle Directive Proposer
 *
 * Watches the rolling history of user redo events. When 3+ redo events for the
 * same angle share a recurring pattern (extracted by a small Sonnet call), it
 * drafts a candidate angle directive and stores it as a pending proposal.
 *
 * The user reviews proposals in the BatchResultsView, accepts or dismisses
 * them. Accepting writes the directive into customOptionsRegistry so every
 * future brief on that angle inherits it — closing the user-feedback loop.
 */

import { sendMessage } from '../api/claude';
import type { AngleDirectiveProposal, RedoEvent } from './memoryTypes';
import { addDirectiveProposal, getRedoEvents } from './memoryStore';

const SONNET = 'claude-sonnet-4-20250514';
const MIN_EVENTS_FOR_PROPOSAL = 3;
const MAX_EVENTS_TO_ANALYZE = 12;

interface RedoCluster {
  angle: string;
  product: string;
  events: RedoEvent[];
}

/** Group redo events by (angle, product). Only return clusters with enough samples. */
function clusterRedoEvents(events: RedoEvent[]): RedoCluster[] {
  const map = new Map<string, RedoCluster>();
  for (const e of events) {
    if (!e.instructions || !e.instructions.trim()) continue;
    const key = `${e.angle.toLowerCase()}::${e.product.toLowerCase()}`;
    let cluster = map.get(key);
    if (!cluster) {
      cluster = { angle: e.angle, product: e.product, events: [] };
      map.set(key, cluster);
    }
    cluster.events.push(e);
  }
  return Array.from(map.values()).filter((c) => c.events.length >= MIN_EVENTS_FOR_PROPOSAL);
}

const PROPOSER_SYSTEM = `You are a Creative Operations Analyst for the Viasox autopilot pipeline. Your job is to analyze a sequence of user revision instructions for the SAME angle+product and decide whether the user is consistently asking for the same thing.

If yes — extract the recurring pattern and draft a permanent angle directive that future briefs should follow. Otherwise, return NONE.

Output format (strict, no preamble):

PATTERN: [one short sentence describing the recurring user preference, OR "NONE"]
DIRECTIVE: [if a pattern exists, write a concise 1-3 sentence directive in the imperative voice that the concept generator and script writer should follow for this angle+product. Be specific. Otherwise write "NONE".]

Examples of strong patterns to detect:
- The user repeatedly removes "Look," as an opener
- The user repeatedly asks for shorter sentences in the hook
- The user keeps reframing the angle from "fear" to "empowerment"
- The user keeps requesting more medical specificity for clinical angles
- The user keeps asking for less corporate / more conversational tone

Examples of NOT a pattern (return NONE):
- Three completely unrelated revisions
- One-off creative direction shifts
- Requests that are about the specific brief, not the angle in general`;

interface ProposerOutput {
  pattern: string | null;
  directive: string | null;
}

function parseProposerResponse(text: string): ProposerOutput {
  const patternMatch = text.match(/PATTERN:\s*(.+?)(?=\n|DIRECTIVE:|$)/s);
  const directiveMatch = text.match(/DIRECTIVE:\s*(.+?)$/s);
  const pattern = patternMatch?.[1].trim() ?? '';
  const directive = directiveMatch?.[1].trim() ?? '';
  if (!pattern || pattern.toUpperCase() === 'NONE') return { pattern: null, directive: null };
  if (!directive || directive.toUpperCase() === 'NONE') return { pattern: null, directive: null };
  return { pattern, directive };
}

/** Format a cluster's events into the analyst's input. */
function formatClusterForAnalyst(cluster: RedoCluster): string {
  const events = cluster.events.slice(-MAX_EVENTS_TO_ANALYZE);
  const lines: string[] = [];
  lines.push(`Angle: ${cluster.angle}`);
  lines.push(`Product: ${cluster.product}`);
  lines.push(`Number of redos: ${events.length}`);
  lines.push('');
  lines.push('User redo instructions (chronological):');
  events.forEach((e, i) => {
    lines.push(`${i + 1}. [${e.scope}] "${e.instructions.trim()}"`);
  });
  return lines.join('\n');
}

/**
 * Run the proposer agent against the current redo event history.
 * Generates and persists pending proposals for any cluster that yields a
 * coherent recurring pattern.
 *
 * Safe to call after every batch — it dedupes proposals so the same
 * pattern doesn't accumulate.
 */
export async function runAngleDirectiveProposer(
  apiKey: string,
  signal: AbortSignal,
): Promise<AngleDirectiveProposal[]> {
  const events = getRedoEvents();
  if (events.length === 0) return [];

  const clusters = clusterRedoEvents(events);
  if (clusters.length === 0) return [];

  const proposals: AngleDirectiveProposal[] = [];

  for (const cluster of clusters) {
    if (signal.aborted) break;

    try {
      const userText = formatClusterForAnalyst(cluster);
      const response = await sendMessage(
        PROPOSER_SYSTEM,
        userText,
        apiKey,
        500,
        SONNET,
        signal,
      );
      const parsed = parseProposerResponse(response);
      if (!parsed.pattern || !parsed.directive) continue;

      const proposal: AngleDirectiveProposal = {
        id: `prop_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        proposedAt: new Date().toISOString(),
        angle: cluster.angle,
        product: cluster.product,
        directiveText: parsed.directive,
        pattern: parsed.pattern,
        evidence: cluster.events.map((e) => `${e.date}::${e.taskName}`),
      };
      addDirectiveProposal(proposal);
      proposals.push(proposal);
    } catch (err) {
      console.warn('[angle-directive-proposer] cluster failed', err);
    }
  }

  return proposals;
}
