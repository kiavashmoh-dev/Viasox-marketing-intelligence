/**
 * Custom Options Registry
 *
 * Stores user-defined options (angle types, ad types, frameworks, etc.)
 * in localStorage. All modules read from this registry to get the full
 * list of options (built-in + custom).
 *
 * This allows the autopilot module and users to add new creative options
 * that propagate across every module in the tool.
 */

const STORAGE_KEY = 'viasox_custom_options';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CustomOption {
  value: string;
  /** Optional description shown in tooltips or guides */
  description?: string;
  /** When this option was added */
  addedAt: string;
  /** Where it came from (user input, autopilot feedback, etc.) */
  source: string;
}

export interface CustomOptionsStore {
  angleTypes: CustomOption[];
  adTypes: CustomOption[];
  frameworks: CustomOption[];
  hookStyles: CustomOption[];
  products: CustomOption[];
  /** Custom angle-to-product combinations or directives */
  angleDirectives: Array<{
    angle: string;
    product: string;
    directive: string;
    addedAt: string;
  }>;
}

// ─── Default built-in options ────────────────────────────────────────────────

export const BASE_ANGLE_TYPES = [
  'Problem-Based',
  'Emotion-Based',
  'Solution-Based',
  'Identity-Based',
  'Comparison-Based',
  'Testimonial-Based',
  'Seasonal/Situational',
  'Fear-Based',
  'Aspiration-Based',
  'Education-Based',
  '3 Reasons/Signs Why',
  'Negative Marketing',
] as const;

export const BASE_AD_TYPES = [
  'AGC (Actor Generated Content)',
  'UGC (User Generated Content)',
  'Ecom Style',
  'Static',
  'Founder Style',
  'Fake Podcast Ads',
  'Spokesperson',
  'Packaging/Employee',
] as const;

export const BASE_FRAMEWORKS = [
  'PAS (Problem-Agitate-Solution)',
  'AIDA-R (Attention-Interest-Desire-Action-Retention)',
  'Before-After-Bridge',
  'Star-Story-Solution',
  'Feel-Felt-Found',
  'Problem-Promise-Proof-Push',
  'Hook-Story-Offer',
  'Empathy-Education-Evidence',
  'The Contrast Framework',
  'The Skeptic Converter',
  'The Day-in-Life',
  'The Myth Buster',
  'The Enemy Framework',
  'The Discovery Narrative',
  'The Professional Authority',
  'The Demonstration Proof',
  'The Objection Crusher',
  'The Identity Alignment',
  'The Reason-Why (Hopkins)',
  'The Gradualization (Schwartz)',
] as const;

export const BASE_HOOK_STYLES = [
  'Question Hook',
  'Bold Claim',
  'Pattern Interrupt',
  'Story Opening',
  'Curiosity Gap',
  'Social Proof',
  'Contrarian / Myth Buster',
  'Identity Callout',
  'Pain Agitation',
  'Transformation Reveal',
  'Permission Hook',
  'Insider / Secret',
  'Comparison / Versus',
  'Warning / Urgency',
  'Emotional Trigger',
  'Direct Address',
  'Shock Value',
  'Relatable Moment',
  'Enemy Callout',
  'Aspirational Vision',
] as const;

export const BASE_PRODUCTS = [
  'EasyStretch',
  'Compression',
  'Ankle Compression',
] as const;

// ─── Storage helpers ─────────────────────────────────────────────────────────

function getStore(): CustomOptionsStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as CustomOptionsStore;
  } catch { /* ignore parse errors */ }
  return {
    angleTypes: [],
    adTypes: [],
    frameworks: [],
    hookStyles: [],
    products: [],
    angleDirectives: [],
  };
}

function saveStore(store: CustomOptionsStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

// ─── Read: Get all options (built-in + custom) ───────────────────────────────

export function getAllAngleTypes(): string[] {
  const custom = getStore().angleTypes.map((o) => o.value);
  return [...BASE_ANGLE_TYPES, ...custom.filter((v) => !BASE_ANGLE_TYPES.includes(v as typeof BASE_ANGLE_TYPES[number]))];
}

export function getAllAdTypes(): string[] {
  const custom = getStore().adTypes.map((o) => o.value);
  return [...BASE_AD_TYPES, ...custom.filter((v) => !BASE_AD_TYPES.includes(v as typeof BASE_AD_TYPES[number]))];
}

export function getAllFrameworks(): string[] {
  const custom = getStore().frameworks.map((o) => o.value);
  return [...BASE_FRAMEWORKS, ...custom.filter((v) => !BASE_FRAMEWORKS.includes(v as typeof BASE_FRAMEWORKS[number]))];
}

export function getAllHookStyles(): string[] {
  const custom = getStore().hookStyles.map((o) => o.value);
  return [...BASE_HOOK_STYLES, ...custom.filter((v) => !BASE_HOOK_STYLES.includes(v as typeof BASE_HOOK_STYLES[number]))];
}

export function getAllProducts(): string[] {
  const custom = getStore().products.map((o) => o.value);
  return [...BASE_PRODUCTS, ...custom.filter((v) => !BASE_PRODUCTS.includes(v as typeof BASE_PRODUCTS[number]))];
}

export function getAngleDirectives(): CustomOptionsStore['angleDirectives'] {
  return getStore().angleDirectives;
}

/** Get custom options only (not built-in) for display in settings */
export function getCustomOptions(): CustomOptionsStore {
  return getStore();
}

// ─── Write: Add new custom options ───────────────────────────────────────────

export function addCustomAngleType(value: string, description?: string, source = 'manual'): void {
  const store = getStore();
  if (store.angleTypes.some((o) => o.value === value)) return;
  store.angleTypes.push({ value, description, addedAt: new Date().toISOString(), source });
  saveStore(store);
}

export function addCustomAdType(value: string, description?: string, source = 'manual'): void {
  const store = getStore();
  if (store.adTypes.some((o) => o.value === value)) return;
  store.adTypes.push({ value, description, addedAt: new Date().toISOString(), source });
  saveStore(store);
}

export function addCustomFramework(value: string, description?: string, source = 'manual'): void {
  const store = getStore();
  if (store.frameworks.some((o) => o.value === value)) return;
  store.frameworks.push({ value, description, addedAt: new Date().toISOString(), source });
  saveStore(store);
}

export function addCustomHookStyle(value: string, description?: string, source = 'manual'): void {
  const store = getStore();
  if (store.hookStyles.some((o) => o.value === value)) return;
  store.hookStyles.push({ value, description, addedAt: new Date().toISOString(), source });
  saveStore(store);
}

export function addCustomProduct(value: string, description?: string, source = 'manual'): void {
  const store = getStore();
  if (store.products.some((o) => o.value === value)) return;
  store.products.push({ value, description, addedAt: new Date().toISOString(), source });
  saveStore(store);
}

export function addAngleDirective(angle: string, product: string, directive: string): void {
  const store = getStore();
  // Update if exists, otherwise add
  const existing = store.angleDirectives.findIndex(
    (d) => d.angle.toLowerCase() === angle.toLowerCase() && d.product.toLowerCase() === product.toLowerCase(),
  );
  if (existing >= 0) {
    store.angleDirectives[existing].directive = directive;
    store.angleDirectives[existing].addedAt = new Date().toISOString();
  } else {
    store.angleDirectives.push({ angle, product, directive, addedAt: new Date().toISOString() });
  }
  saveStore(store);
}

// ─── Delete ──────────────────────────────────────────────────────────────────

export function removeCustomOption(category: keyof Omit<CustomOptionsStore, 'angleDirectives'>, value: string): void {
  const store = getStore();
  store[category] = store[category].filter((o) => o.value !== value);
  saveStore(store);
}

export function removeAngleDirective(angle: string, product: string): void {
  const store = getStore();
  store.angleDirectives = store.angleDirectives.filter(
    (d) => !(d.angle.toLowerCase() === angle.toLowerCase() && d.product.toLowerCase() === product.toLowerCase()),
  );
  saveStore(store);
}
