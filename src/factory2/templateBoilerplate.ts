/**
 * Factory V2 — evergreen template boilerplate.
 *
 * The parts of the standardized UGC brief that NEVER change per brief
 * (per the Media Engineered template analysis): the collaborative intro
 * callout, production guidelines, phone settings, submission rules, and
 * the audio/shot type glossaries. Strategic fields (tonality, attire,
 * per-brief instructions, awareness) are generated per brief and live on
 * the UgcBriefV2 object instead.
 *
 * Structured as data so the in-app renderer and the .doc export share one
 * source of truth. Fixes applied vs the source template: the night-filming
 * rule now cross-references dusk exceptions; typos removed.
 */

export interface BoilerplateRow {
  label: string;
  bullets: string[];
}

export const INTRO_CALLOUT =
  'The goal of this brief is to give you a framework to follow. Please follow the instructions ' +
  'and script to the best of your ability — and use your own voice and your own style to make ' +
  "this video authentic. You shouldn't sound scripted; feel free to project your own voice! " +
  'If you think slight changes would make the video flow better, let us know — we are open to ' +
  'your suggestions. We want to produce the best video possible together 🤝';

export const GUIDELINES: BoilerplateRow[] = [
  {
    label: 'Attire',
    bullets: ['Avoid showing logos from other brands, including on the clothes worn.'],
  },
  {
    label: 'Lighting',
    bullets: [
      'Always try to use natural lighting.',
      'Film near a large window, or use a ring light.',
      'Avoid filming in direct sunlight — it can overexpose the video.',
      'Do not film at night (unless a specific shot description asks for a dusk/evening shot — those will say so explicitly).',
    ],
  },
  {
    label: 'Environment',
    bullets: ['Keep the background clean.', 'Aesthetically pleasing and presentable.'],
  },
  {
    label: 'Recording',
    bullets: [
      'Avoid background noise.',
      'Turn off ACs, fans and other loud devices when filming.',
      'Make sure you can be heard clearly.',
    ],
  },
  {
    label: 'Filming',
    bullets: [
      'Use a smartphone with a clear camera or any high-quality camera.',
      'Film all content vertically — 9:16 aspect ratio.',
      'Add an additional 1-3 seconds to the beginning and end of all RAW clips.',
      'Do not add any filters or color grading.',
      'Be organic and be yourself — don\'t sound like a robot or too scripted.',
      "Film as if you're talking to a friend.",
      'Make sure the product and its details are clearly visible when shown.',
      'Shoot each clip a few times with slightly different tonalities so the editor has options.',
    ],
  },
  {
    label: 'Phone Settings',
    bullets: [
      'Adjust in your phone\'s Settings → Camera → Record Video: set to 1080 HD & 60 FPS with HDR turned OFF.',
      'HDR (High Dynamic Range) can make your video look overexposed and washed out — turning it off keeps the footage crisp with true colors.',
    ],
  },
  {
    label: 'Submitting Video',
    bullets: [
      'All videos should be submitted RAW (no editing).',
      'No transitions, captions or music.',
      'Name the clips with the corresponding clip number in the brief. Example: Spoken #1 = S1  |  Action #1 = A1.',
    ],
  },
  {
    label: 'Payment',
    bullets: ['After delivery of the RAW footage.'],
  },
];

export const AUDIO_TYPES: BoilerplateRow[] = [
  {
    label: 'Voiceover (VO)',
    bullets: [
      'Record this as a separate audio recording (use a headphone mic with your phone\'s voice recorder if you don\'t have better equipment).',
    ],
  },
  {
    label: 'Talk to Camera (F2C)',
    bullets: ['Submit as one clip including you talking and the visual combined.'],
  },
];

export const SHOT_TYPES: BoilerplateRow[] = [
  { label: 'Visual Hook', bullets: ['Scroll-stopping visual needed.'] },
  { label: 'B-Roll', bullets: ['Footage of you or the product with no audio.'] },
  { label: 'Talk to Camera', bullets: ['Say the lines talking to camera.'] },
  { label: 'End Card', bullets: ['No need to record video for this part.'] },
];
