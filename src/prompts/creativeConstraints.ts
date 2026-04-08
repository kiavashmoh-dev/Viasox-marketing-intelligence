/**
 * Shared creative constraints that apply across ALL modules producing
 * creative output (autopilot, angles generator, script writer, hooks
 * generator, batch reviewer, concept evaluator, concept selector).
 *
 * Two rules currently enforced:
 *
 * 1. VO-BY-LENGTH RULE
 *    Only short-form (≤15s) ads may be text-only / no-VO. Medium (30s, 60s)
 *    and expanded (90s+) ads MUST have a spoken voiceover or on-camera
 *    dialogue. A 30s ad with text-only silent b-roll is a creative failure.
 *
 * 2. LENGTH CALIBRATION
 *    The tool has a measured tendency to overshoot target duration by
 *    20-30%, especially for ≤15s briefs. Every module gets an explicit
 *    "you tend to write long — cut before adding" warning and a strict
 *    target word count per duration (based on 150 WPM VO pace industry
 *    standard, minus 10% safety margin for natural pauses and breathing).
 *
 * These constraints are injected:
 * - Globally via buildSystemBase() → general version (no duration)
 * - Per-brief in scriptPrompt / anglesPrompt / conceptEvaluator /
 *   conceptSelector / batchReviewer via duration-specific version
 */

/**
 * Target word counts per duration.
 *
 * Based on 150 words-per-minute VO pace (industry baseline for conversational
 * ad reads) with a 10% safety margin for natural pauses, breathing, and
 * on-screen beats.
 *
 * 15s → 30-35 words (HARD ceiling: 38)
 * 30s → 65-75 words (HARD ceiling: 80)
 * 60s → 135-150 words (HARD ceiling: 160)
 * 90s → 200-225 words (HARD ceiling: 240)
 */
export interface DurationTarget {
  duration: string;
  sweetSpot: string;      // e.g. "30-35 words"
  hardCeiling: number;    // absolute max word count
  description: string;    // human-readable guidance
  voRequired: boolean;    // whether VO is mandatory for this length
  voRule: string;         // explicit VO rule text
}

export const DURATION_TARGETS: Record<string, DurationTarget> = {
  '10s': {
    duration: '10s',
    sweetSpot: '18-25 words',
    hardCeiling: 28,
    description:
      'ULTRA-TIGHT. One single beat. No hook + body + CTA — pick ONE and nail it. Every word has to fight for its place.',
    voRequired: false,
    voRule:
      'Text-only / no-VO is ALLOWED for short-form. If you use VO, keep it to one tight line.',
  },
  '15s': {
    duration: '15s',
    sweetSpot: '30-35 words',
    hardCeiling: 38,
    description:
      'Very tight. Hook must land in the first 1.5 seconds. One problem, one solution, one CTA. No story arcs, no setups.',
    voRequired: false,
    voRule:
      'Text-only / no-VO is ALLOWED for short-form. You may choose text + b-roll with no voiceover, OR you may include a VO. Both are valid for 15s.',
  },
  '30s': {
    duration: '30s',
    sweetSpot: '65-75 words',
    hardCeiling: 80,
    description:
      'Standard social ad. Hook in first 3 seconds. Problem → agitation → solution → proof → CTA. Every beat earns its seconds.',
    voRequired: true,
    voRule:
      'VOICEOVER OR SPOKEN DIALOGUE IS MANDATORY. 30s ads MUST have a spoken track (VO, UGC creator talking, founder on camera, or spokesperson). Text-only silent b-roll is FORBIDDEN at this length.',
  },
  '60s': {
    duration: '60s',
    sweetSpot: '135-150 words',
    hardCeiling: 160,
    description:
      'Room for a full arc. Hook + problem + agitation + solution + proof + CTA. Can include a mini-story or testimonial. Still lean — if you can cut a line, cut it.',
    voRequired: true,
    voRule:
      'VOICEOVER OR SPOKEN DIALOGUE IS MANDATORY. 60s ads MUST have a spoken track. Text-only silent b-roll is FORBIDDEN at this length.',
  },
  '90s': {
    duration: '90s',
    sweetSpot: '200-225 words',
    hardCeiling: 240,
    description:
      'Expanded format. Room for story, multiple proof points, or a documentary-style arc. Still requires discipline — length is NOT a license to ramble.',
    voRequired: true,
    voRule:
      'VOICEOVER OR SPOKEN DIALOGUE IS MANDATORY. 90s ads MUST have a spoken track. Text-only silent b-roll is FORBIDDEN at this length.',
  },
};

/**
 * Map a duration string (possibly non-standard) to the closest target.
 * Handles '15s', '15 sec', '15 seconds', 'Short-form', 'Midform', 'Expanded', etc.
 */
export function normalizeDuration(duration?: string): string {
  if (!duration) return '30s';
  const lower = duration.toLowerCase().trim();
  if (lower.includes('10')) return '10s';
  if (lower.includes('15') || lower.includes('short')) return '15s';
  if (lower.includes('30') || lower.includes('mid')) return '30s';
  if (lower.includes('60') || lower.includes('expanded') || lower === '1m' || lower === '1 min') return '60s';
  if (lower.includes('90')) return '90s';
  // Direct key match
  if (DURATION_TARGETS[lower]) return lower;
  return '30s';
}

export function getDurationTarget(duration?: string): DurationTarget {
  const key = normalizeDuration(duration);
  return DURATION_TARGETS[key] ?? DURATION_TARGETS['30s'];
}

/**
 * Classifies a duration as "short-form" (eligible for text-only / no-VO)
 * or "spoken-required" (VO or dialogue mandatory).
 */
export function isShortFormDuration(duration?: string): boolean {
  const key = normalizeDuration(duration);
  return key === '10s' || key === '15s';
}

// ─── BLOCK BUILDERS ──────────────────────────────────────────────────────────

/**
 * General (no-duration) VO-by-length rule block.
 * Injected into the global system prompt so every agent across the app
 * knows the rule even when they don't know the specific brief length.
 */
export function buildVoByLengthRuleBlock(): string {
  return `## VO-BY-LENGTH RULE — NON-NEGOTIABLE

Voiceover (or spoken dialogue from a UGC creator, founder, spokesperson, or podcast host) is MANDATORY for any ad that is 30 seconds or longer. This is an absolute production rule with no exceptions.

- **Short-form (≤15s):** MAY be text-only / no-VO, OR may include a VO. Both are valid. A silent 15s ad with text overlays and b-roll is an acceptable creative choice.
- **Medium-form (30s, 60s):** MUST have VO or spoken dialogue. Text-only silent b-roll at these lengths is FORBIDDEN.
- **Expanded (90s+):** MUST have VO or spoken dialogue. Text-only silent b-roll at these lengths is FORBIDDEN.

**Why this rule exists:** Audiences will not watch 30+ seconds of silent text-over-b-roll. The attention economy at that length requires a human voice to anchor the story. Short 15s ads can survive as pure visual grammar; longer ones cannot.

**When writing for 30s+:** Every brief MUST have a populated Voiceover field in Editing Instructions AND actual spoken lines in the Script (Body) rows. A brief that specifies "no voiceover" or leaves the VO field blank for a 30s+ ad is a creative failure and will be flagged.`;
}

/**
 * General (no-duration) length calibration block.
 * Warns every agent that the tool has historically overshot length targets.
 */
export function buildLengthCalibrationBlock(): string {
  return `## LENGTH CALIBRATION — YOU TEND TO WRITE LONG

**Measured tendency:** The tool has historically produced scripts that are 20-30% LONGER than their target duration, especially for ≤15s briefs. A brief written for 15 seconds has routinely come back reading at 18-20 seconds when voiced.

**This is a known failure mode. Counteract it explicitly.**

Target word counts (based on 150 WPM VO pace, the industry baseline for conversational ad reads, with a 10% safety margin for pauses and breathing):

| Duration | Sweet Spot     | Hard Ceiling |
|----------|---------------|--------------|
| 10s      | 18-25 words   | 28 words     |
| 15s      | 30-35 words   | 38 words     |
| 30s      | 65-75 words   | 80 words     |
| 60s      | 135-150 words | 160 words    |
| 90s      | 200-225 words | 240 words    |

**Rules for hitting length:**
1. **Count your words.** Before finalizing a script, count the total spoken word count across all script rows. If it exceeds the hard ceiling, cut until it fits.
2. **Cut, don't add.** When you're unsure whether a line earns its place, CUT IT. The default assumption is "this script is too long." Err on the side of trimming, never on the side of padding.
3. **Shorter beats clearer.** For ≤15s ads, choose 4-word sentences over 8-word sentences. Prefer "Morning. Marks. Again." over "Every morning I wake up with marks."
4. **One idea per beat.** Don't cram two thoughts into one line. If a beat has two ideas, either split it into two beats or cut one idea.
5. **CTAs are short.** "Tap the link." is enough. "Click the link below to learn more about our collection." is not.

**When reviewing your own work:** Before you output, mentally read the script out loud at a natural pace and time it. If it feels rushed to fit the target, it's too long — cut.`;
}

/**
 * Combined general constraints block injected into buildSystemBase().
 * Pass no arguments for the global (always-inject) version.
 */
export function buildCreativeConstraintsBlock(): string {
  return `${buildVoByLengthRuleBlock()}

${buildLengthCalibrationBlock()}`;
}

// ─── DURATION-SPECIFIC BLOCKS (injected per brief) ───────────────────────────

/**
 * Duration-specific VO rule for a specific brief.
 * Called with the task's target duration to enforce the rule directly.
 */
export function buildDurationSpecificVoRule(duration?: string): string {
  const target = getDurationTarget(duration);
  if (target.voRequired) {
    return `## VO REQUIREMENT FOR THIS BRIEF (${target.duration})

**VOICEOVER OR SPOKEN DIALOGUE IS MANDATORY FOR THIS BRIEF.**

This is a ${target.duration} ad. Per the VO-by-length rule, every ad 30 seconds or longer MUST have a spoken track (VO, UGC creator talking to camera, founder on camera, spokesperson, or podcast host). Text-only silent b-roll at ${target.duration} is FORBIDDEN.

Every script row in the Body section MUST contain spoken words. The Voiceover field in Editing Instructions MUST be populated with tone guidance (e.g., "Warm female, 50+, reassuring pace" or "Confident female voice, conversational, slightly urgent"). Do NOT output "No VO", "Silent", "Text only", "No voiceover", or similar for this brief — those answers will be rejected as a creative failure.`;
  }
  return `## VO OPTIONAL FOR THIS BRIEF (${target.duration})

This is a ${target.duration} short-form ad. You MAY choose text-only / no-VO (pure visual grammar with text overlays over b-roll) OR you may include a VO. Both are valid creative choices for this length. Pick whichever best serves the concept and angle.

If you choose no-VO: the Voiceover field in Editing Instructions should say "No VO — text overlays and b-roll only" and script rows should describe on-screen text lines rather than spoken lines.
If you choose VO: every script row must contain spoken words and the Voiceover field must include tone guidance.`;
}

/**
 * Duration-specific length target for a specific brief.
 * Called with the task's target duration to enforce word counts directly.
 */
export function buildDurationSpecificLengthTarget(duration?: string): string {
  const target = getDurationTarget(duration);
  return `## LENGTH TARGET FOR THIS BRIEF (${target.duration})

**Sweet spot:** ${target.sweetSpot}
**Hard ceiling:** ${target.hardCeiling} words (absolute max — do not exceed)

${target.description}

**⚠️ KNOWN FAILURE MODE:** The tool has historically overshot ${target.duration} targets by 20-30%. Counteract this by writing SHORT and tight. Before finalizing, count every spoken word across all script rows. If you are above the sweet spot, cut. If you are above the hard ceiling, cut aggressively — you are over budget.

**Rule of thumb:** When in doubt, CUT a line rather than ADD one. The default assumption for this brief is "your first draft is too long."`;
}

/**
 * Combined per-brief constraints block. Use this in module-specific prompts
 * (scriptPrompt, anglesPrompt, conceptEvaluator, etc.) to inject both the
 * VO rule and the length target for a specific duration.
 */
export function buildBriefConstraintsBlock(duration?: string): string {
  return `${buildDurationSpecificVoRule(duration)}

${buildDurationSpecificLengthTarget(duration)}`;
}
