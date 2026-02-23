/**
 * Shared segment display name mappings.
 * Maps snake_case pattern keys and lowercased names to canonical Title Case display names.
 * Used by both PersonaBuilder (for segment selection) and PersonaResultsView (for data lookups).
 */

/** Identity segments — canonical display names */
export const IDENTITY_SEGMENTS = [
  'Healthcare Worker', 'Caregiver/Gift Buyer', 'Diabetic/Neuropathy',
  'Standing Worker', 'Accessibility/Mobility', 'Traveler',
  'Senior', 'Pregnant/Postpartum', 'Medical/Therapeutic',
];

/** Motivation segments — canonical display names */
export const MOTIVATION_SEGMENTS = [
  'Comfort Seeker', 'Pain & Symptom Relief', 'Style Conscious',
  'Quality & Value', 'Daily Wear Convert', 'Skeptic Converted',
  'Emotional Transformer', 'Repeat Loyalist',
];

/**
 * Maps a snake_case or space-separated segment name to its canonical display name.
 * e.g., "healthcare_worker" or "healthcare worker" → "Healthcare Worker"
 * e.g., "pain_symptom_relief" or "pain symptom relief" → "Pain & Symptom Relief"
 */
export const DISPLAY_NAME_MAP = new Map<string, string>();

// Build mappings from display names
for (const name of [...IDENTITY_SEGMENTS, ...MOTIVATION_SEGMENTS]) {
  DISPLAY_NAME_MAP.set(name.toLowerCase(), name);
  DISPLAY_NAME_MAP.set(name.toLowerCase().replace(/[/& ]+/g, '_'), name);
}

// Handle specific edge cases where pattern keys don't match display names cleanly
DISPLAY_NAME_MAP.set('pain_symptom_relief', 'Pain & Symptom Relief');
DISPLAY_NAME_MAP.set('caregiver_gift_buyer', 'Caregiver/Gift Buyer');
DISPLAY_NAME_MAP.set('diabetic_neuropathy', 'Diabetic/Neuropathy');
DISPLAY_NAME_MAP.set('accessibility_mobility', 'Accessibility/Mobility');
DISPLAY_NAME_MAP.set('pregnant_postpartum', 'Pregnant/Postpartum');
DISPLAY_NAME_MAP.set('medical_therapeutic', 'Medical/Therapeutic');
DISPLAY_NAME_MAP.set('quality_value', 'Quality & Value');
// Handle space-separated versions
DISPLAY_NAME_MAP.set('pain symptom relief', 'Pain & Symptom Relief');
DISPLAY_NAME_MAP.set('caregiver gift buyer', 'Caregiver/Gift Buyer');
DISPLAY_NAME_MAP.set('diabetic neuropathy', 'Diabetic/Neuropathy');
DISPLAY_NAME_MAP.set('accessibility mobility', 'Accessibility/Mobility');
DISPLAY_NAME_MAP.set('pregnant postpartum', 'Pregnant/Postpartum');
DISPLAY_NAME_MAP.set('medical therapeutic', 'Medical/Therapeutic');
DISPLAY_NAME_MAP.set('quality value', 'Quality & Value');
