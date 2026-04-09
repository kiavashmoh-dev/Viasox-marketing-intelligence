/**
 * Shared creative constraints that apply across ALL modules producing
 * creative output (autopilot, angles generator, script writer, hooks
 * generator, batch reviewer, concept evaluator, concept selector).
 *
 * Two rules currently enforced:
 *
 * 1. VO-BY-LENGTH RULE
 *    Only short-form (1-15 sec) ads may be text-only / no-VO. Medium
 *    (16-59 sec) and expanded (60-90 sec) ads MUST have a spoken
 *    voiceover or on-camera dialogue. A 30s ad with text-only silent
 *    b-roll is a creative failure.
 *
 * 2. LENGTH CALIBRATION
 *    The tool has a measured tendency to overshoot target duration by
 *    20-30%, especially for short briefs. Every module gets an explicit
 *    "you tend to write long — cut before adding" warning and a strict
 *    target word count per duration (based on 150 WPM VO pace industry
 *    standard, with the hard ceiling anchored to the MAX seconds of
 *    each range so the tool cannot go over).
 *
 * These constraints are injected:
 * - Globally via buildSystemBase() → general version (no duration)
 * - Per-brief in scriptPrompt / anglesPrompt / conceptEvaluator /
 *   conceptSelector / batchReviewer via duration-specific version
 *
 * ─── DURATION SYSTEM ───────────────────────────────────────────────
 * The canonical duration values match the Asana "Medium" column:
 *
 *   '1-15 sec'  — Short-form  — VO optional — max 15s
 *   '16-59 sec' — Medium-form — VO MANDATORY — max 59s
 *   '60-90 sec' — Expanded    — VO MANDATORY — max 90s
 *
 * All creative modules use these three values. Legacy '15s' / '30s' /
 * '60s' / '90s' strings are still accepted by normalizeDuration() for
 * backward compatibility (memory records, old state, etc.) and map
 * into the new range buckets.
 */

/**
 * Target word counts per duration range.
 *
 * Based on 150 words-per-minute VO pace (industry baseline for conversational
 * ad reads). The HARD CEILING is anchored to the MAX seconds of each range
 * so the tool literally cannot produce content longer than the top of the
 * bucket. The SWEET SPOT is pulled slightly below to leave buffer for the
 * tool's historical 20-30% overshoot tendency.
 *
 * 1-15 sec   → sweet 30-35 words  (HARD ceiling: 37 — 15s × 2.5 WPS)
 * 16-59 sec  → sweet 115-135 words (HARD ceiling: 145 — ~58s × 2.5 WPS)
 * 60-90 sec  → sweet 190-215 words (HARD ceiling: 225 — 90s × 2.5 WPS)
 */
export interface DurationTarget {
  duration: string;
  sweetSpot: string;      // e.g. "30-35 words"
  hardCeiling: number;    // absolute max word count — pegged to MAX seconds of range
  maxSeconds: number;     // absolute runtime ceiling in seconds
  description: string;    // human-readable guidance
  voRequired: boolean;    // whether VO is mandatory for this length
  voRule: string;         // explicit VO rule text
  recommendedFrameworks: string[]; // frameworks that fit this length
}

export const DURATION_TARGETS: Record<string, DurationTarget> = {
  '1-15 sec': {
    duration: '1-15 sec',
    sweetSpot: '30-35 words',
    hardCeiling: 37,
    maxSeconds: 15,
    description:
      'Short-form social ad. Hook must land in the first 1.5 seconds. One problem, one solution, one CTA — or a single powerful moment. No story arcs, no setups, no multi-beat mini-movies. Everything must happen inside 15 seconds of runtime.',
    voRequired: false,
    voRule:
      'Text-only / no-VO is ALLOWED for short-form. You may choose text + b-roll with no voiceover, OR you may include a VO. Both are valid for 1-15 sec.',
    recommendedFrameworks: [
      'PAS (Problem-Agitate-Solution)',
      'Before-After-Bridge',
      'The Contrast Framework',
      'Hook-Story-Offer',
      'The Myth Buster',
      'The Demonstration Proof',
    ],
  },
  '16-59 sec': {
    duration: '16-59 sec',
    sweetSpot: '115-135 words',
    hardCeiling: 145,
    maxSeconds: 59,
    description:
      'Medium-form social ad. Room for a full arc — hook + problem + agitation + solution + proof + CTA. Can include a mini-story, a testimonial moment, or a before/after. Still lean — if you can cut a line, cut it. Everything must happen inside 59 seconds of runtime.',
    voRequired: true,
    voRule:
      'VOICEOVER OR SPOKEN DIALOGUE IS MANDATORY. 16-59 sec ads MUST have a spoken track (VO, UGC creator talking, founder on camera, or spokesperson). Text-only silent b-roll is FORBIDDEN at this length.',
    recommendedFrameworks: [
      'PAS (Problem-Agitate-Solution)',
      'AIDA-R (Attention-Interest-Desire-Action-Retention)',
      'Before-After-Bridge',
      'Feel-Felt-Found',
      'Problem-Promise-Proof-Push',
      'Hook-Story-Offer',
      'Empathy-Education-Evidence',
      'The Contrast Framework',
      'The Skeptic Converter',
      'The Myth Buster',
      'The Enemy Framework',
      'The Objection Crusher',
      'The Reason-Why (Hopkins)',
    ],
  },
  '60-90 sec': {
    duration: '60-90 sec',
    sweetSpot: '190-215 words',
    hardCeiling: 225,
    maxSeconds: 90,
    description:
      'Expanded-form ad. Room for a full story, multiple proof points, or a documentary-style arc. Suitable for Full AI narrative pieces, founder monologues, podcast-style conversations, or deep transformation stories. Still requires discipline — length is NOT a license to ramble. Everything must happen inside 90 seconds of runtime.',
    voRequired: true,
    voRule:
      'VOICEOVER OR SPOKEN DIALOGUE IS MANDATORY. 60-90 sec ads MUST have a spoken track. Text-only silent b-roll is FORBIDDEN at this length.',
    recommendedFrameworks: [
      'AIDA-R (Attention-Interest-Desire-Action-Retention)',
      'Star-Story-Solution',
      'Feel-Felt-Found',
      'Problem-Promise-Proof-Push',
      'Hook-Story-Offer',
      'Empathy-Education-Evidence',
      'The Contrast Framework',
      'The Skeptic Converter',
      'The Day-in-Life',
      'The Discovery Narrative',
      'The Professional Authority',
      'The Identity Alignment',
      'The Gradualization (Schwartz)',
    ],
  },
};

/**
 * Map a duration string (possibly non-standard) to a canonical range key.
 * Handles:
 *   - New canonical range values: '1-15 sec', '16-59 sec', '60-90 sec'
 *   - Legacy literals: '15s', '30s', '60s', '90s', '10s'
 *   - Asana medium column labels: 'Shortform', 'Midform', 'Expanded'
 *   - Free-form: '15 seconds', '1 min', etc.
 */
export function normalizeDuration(duration?: string): string {
  if (!duration) return '16-59 sec';
  const lower = duration.toLowerCase().trim();

  // Direct match on canonical range keys
  if (lower === '1-15 sec' || lower === '1-15 seconds') return '1-15 sec';
  if (lower === '16-59 sec' || lower === '16-59 seconds') return '16-59 sec';
  if (lower === '60-90 sec' || lower === '60-90 seconds') return '60-90 sec';

  // Legacy literals → range buckets
  if (lower === '10s' || lower === '15s' || lower.includes('short')) return '1-15 sec';
  if (lower === '30s' || lower === '45s' || lower.includes('mid')) return '16-59 sec';
  if (lower === '60s' || lower === '90s' || lower.includes('expand') || lower.includes('long')) return '60-90 sec';

  // Free-form numeric seconds
  const secMatch = lower.match(/(\d+)\s*(s|sec|second)/);
  if (secMatch) {
    const n = parseInt(secMatch[1], 10);
    if (n <= 15) return '1-15 sec';
    if (n <= 59) return '16-59 sec';
    if (n <= 90) return '60-90 sec';
    return '60-90 sec';
  }

  // Minute-based
  if (lower === '1m' || lower === '1 min' || lower.includes('1 minute')) return '60-90 sec';

  // Fallback: if a range-key is embedded
  if (lower.includes('1-15')) return '1-15 sec';
  if (lower.includes('16-59')) return '16-59 sec';
  if (lower.includes('60-90')) return '60-90 sec';

  return '16-59 sec';
}

export function getDurationTarget(duration?: string): DurationTarget {
  const key = normalizeDuration(duration);
  return DURATION_TARGETS[key] ?? DURATION_TARGETS['16-59 sec'];
}

/**
 * Classifies a duration as "short-form" (eligible for text-only / no-VO)
 * or "spoken-required" (VO or dialogue mandatory).
 * Only '1-15 sec' is short-form.
 */
export function isShortFormDuration(duration?: string): boolean {
  const key = normalizeDuration(duration);
  return key === '1-15 sec';
}

// ─── BLOCK BUILDERS ──────────────────────────────────────────────────────────

/**
 * General (no-duration) VO-by-length rule block.
 * Injected into the global system prompt so every agent across the app
 * knows the rule even when they don't know the specific brief length.
 */
export function buildVoByLengthRuleBlock(): string {
  return `## VO-BY-LENGTH RULE — NON-NEGOTIABLE

Voiceover (or spoken dialogue from a UGC creator, founder, spokesperson, or podcast host) is MANDATORY for any ad that is 16 seconds or longer. This is an absolute production rule with no exceptions.

- **Short-form (1-15 sec):** MAY be text-only / no-VO, OR may include a VO. Both are valid. A silent 15s ad with text overlays and b-roll is an acceptable creative choice.
- **Medium-form (16-59 sec):** MUST have VO or spoken dialogue. Text-only silent b-roll at these lengths is FORBIDDEN.
- **Expanded (60-90 sec):** MUST have VO or spoken dialogue. Text-only silent b-roll at these lengths is FORBIDDEN.

**Why this rule exists:** Audiences will not watch 16+ seconds of silent text-over-b-roll. The attention economy at that length requires a human voice to anchor the story. Short 1-15 sec ads can survive as pure visual grammar; longer ones cannot.

**When writing for 16 sec or longer:** Every brief MUST have a populated Voiceover field in Editing Instructions AND actual spoken lines in the Script (Body) rows. A brief that specifies "no voiceover" or leaves the VO field blank for a 16+ sec ad is a creative failure and will be flagged.`;
}

/**
 * General (no-duration) length calibration block.
 * Warns every agent that the tool has historically overshot length targets.
 */
export function buildLengthCalibrationBlock(): string {
  return `## LENGTH CALIBRATION — YOU TEND TO WRITE LONG

**Measured tendency:** The tool has historically produced scripts that are 20-30% LONGER than their target duration, especially for short-form briefs. A brief written for 15 seconds has routinely come back reading at 18-20 seconds when voiced.

**This is a known failure mode. Counteract it explicitly.**

Target word counts (based on 150 WPM VO pace, the industry baseline for conversational ad reads. Hard ceilings are anchored to the MAX seconds of each range — DO NOT EXCEED):

| Duration    | Max Seconds | Sweet Spot       | Hard Ceiling |
|-------------|-------------|------------------|--------------|
| 1-15 sec    | 15s         | 30-35 words      | 37 words     |
| 16-59 sec   | 59s         | 115-135 words    | 145 words    |
| 60-90 sec   | 90s         | 190-215 words    | 225 words    |

**Rules for hitting length:**
1. **Count your words.** Before finalizing a script, count the total spoken word count across all script rows. If it exceeds the hard ceiling, cut until it fits.
2. **Cut, don't add.** When you're unsure whether a line earns its place, CUT IT. The default assumption is "this script is too long." Err on the side of trimming, never on the side of padding.
3. **Shorter beats clearer.** For 1-15 sec ads, choose 4-word sentences over 8-word sentences. Prefer "Morning. Marks. Again." over "Every morning I wake up with marks."
4. **One idea per beat.** Don't cram two thoughts into one line. If a beat has two ideas, either split it into two beats or cut one idea.
5. **CTAs are short.** "Tap the link." is enough. "Click the link below to learn more about our collection." is not.
6. **Do not exceed the max seconds of the range.** A 16-59 sec brief means the final cut must run at 59 seconds or less — not 60, not 61. A 60-90 sec brief must run at 90 seconds or less.

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

This is a ${target.duration} ad (max runtime ${target.maxSeconds} seconds). Per the VO-by-length rule, every ad 16 seconds or longer MUST have a spoken track (VO, UGC creator talking to camera, founder on camera, spokesperson, or podcast host). Text-only silent b-roll at ${target.duration} is FORBIDDEN.

Every script row in the Body section MUST contain spoken words. The Voiceover field in Editing Instructions MUST be populated with tone guidance (e.g., "Warm female, 50+, reassuring pace" or "Confident female voice, conversational, slightly urgent"). Do NOT output "No VO", "Silent", "Text only", "No voiceover", or similar for this brief — those answers will be rejected as a creative failure.`;
  }
  return `## VO OPTIONAL FOR THIS BRIEF (${target.duration})

This is a ${target.duration} short-form ad (max runtime ${target.maxSeconds} seconds). You MAY choose text-only / no-VO (pure visual grammar with text overlays over b-roll) OR you may include a VO. Both are valid creative choices for this length. Pick whichever best serves the concept and angle.

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

**Max runtime:** ${target.maxSeconds} seconds (absolute ceiling — DO NOT go over)
**Sweet spot:** ${target.sweetSpot}
**Hard word ceiling:** ${target.hardCeiling} words (absolute max — do not exceed)

${target.description}

**⚠️ KNOWN FAILURE MODE:** The tool has historically overshot length targets by 20-30%. Counteract this by writing SHORT and tight. Before finalizing, count every spoken word across all script rows. If you are above the sweet spot, cut. If you are above the hard ceiling, cut aggressively — you are over budget.

**Rule of thumb:** When in doubt, CUT a line rather than ADD one. The default assumption for this brief is "your first draft is too long."

**Frameworks that fit ${target.duration}:** ${target.recommendedFrameworks.join(', ')}. If you are working with a different framework, make sure it can compress its full narrative arc into ${target.maxSeconds} seconds of runtime — if it cannot, switch to one of the recommended frameworks.`;
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
