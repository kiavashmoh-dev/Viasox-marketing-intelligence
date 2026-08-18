/**
 * Ecom footage library — the VISUAL claim boundary for Factory V2 ecom briefs.
 *
 * Ecom ads are built ENTIRELY from existing footage (13,000+ clips) — nothing
 * gets filmed. So a visual that doesn't exist in the library is exactly as
 * fatal as a claim outside the claim boundary: the editor hits a wall. This
 * block is V1's battle-tested taxonomy (adTypeGuides.ts, kept verbatim per
 * Kia's decision to run on the V1 library until an updated one arrives),
 * promoted to a hard constraint in the V2 ecom context pack.
 *
 * The tag arrays themselves live in v2Types.ts (ECOM_SHOT_TAGS) so the row
 * type and this prompt block share one source of truth.
 */

import { ECOM_SHOT_TAGS } from '../factory2/v2Types';

const list = (tags: readonly string[]) => tags.join(', ');

export function getEcomFootageLibraryBlock(): string {
  return `## THE FOOTAGE LIBRARY — THE VISUAL CLAIM BOUNDARY (binding on every visual you write)

Ecom briefs are built ENTIRELY from existing Viasox footage (13,000+ clips) plus AI voiceover —
nothing gets filmed. Every visual you write must be buildable from this library. A visual that
implies footage we do not have is a FAILED visual, exactly as a claim outside the claim boundary
is a failed claim.

**AVAILABLE FOOTAGE (use these as the row's Shot Type tag):**
- Core: ${list(ECOM_SHOT_TAGS.core)}
- Supplementary: ${list(ECOM_SHOT_TAGS.supplementary)}
- Limited availability: ${list(ECOM_SHOT_TAGS.limited)} (Yoga / Wellness B-Roll exists for Ankle Compression only)

**FOOTAGE WE DO NOT HAVE — never write a visual implying these:**
Indoor gym/fitness · medical offices or clinical settings · sports activities · travel/airports ·
restaurants/dining · outdoor activities (hiking, running, cycling) · children/family scenes ·
pet scenes.

**THE VISUAL DESCRIPTION RULES (every row):**
The row's visual is TWO things together: the Shot Type TAG (from the lists above — tells the
editor which library bucket to pull from) and a SHORT, CONVERSATIONAL description of what the
viewer sees — "telling the editor what you're picturing." The description is never a label and
never technical direction.
- GOOD: "Close-up of her pulling the compression socks up over her calves on the couch"
- GOOD: "Her bare legs with visible sock marks and redness around the ankles"
- GOOD: "Product flat lay — five colorful pairs fanned out on a white surface"
- BAD: "Talking Head" (that's the tag, not a description)
- BAD: "Bare Legs – Condition" (taxonomy label — tells the editor nothing)
- BAD: "B-roll of feet" (too vague to pull)
Graphics count as footage you CAN write freely: Animation / Motion Graphics and Text/Title Card
tags cover diagrams, gauges, charts, chapter cards, and overlay-driven scenes — the editor builds
those in post.

**HONESTY RULE:** when the ideal shot doesn't exist in the library, say so in the row's editor
notes and name the replacement — never write around a missing shot silently. (The winning briefs
did exactly this: "We most likely don't have the footage, has to be replaced with…")

**VARIETY RULE:** vary the visual modality across consecutive rows — footage → graphic → demo →
product. Never three Talking Head visuals in a row.`;
}
