/**
 * Factory V2 — persistence.
 *
 * Completed/in-editor BRIEFS live in localStorage under one key (batch
 * session state is in-memory only for now — briefs are saved the moment
 * they are written, so a refresh mid-batch loses at most the un-written
 * tasks' progress, never a finished brief). Brief objects are small
 * (text + frame REFERENCES — the images stay in the inspiration bank's
 * IndexedDB), so localStorage is sufficient and keeps the store
 * synchronous like V1's memoryStore.
 */

import type { UgcBriefV2 } from './v2Types';

const STORE_KEY = 'viasox_factory2';
const SCHEMA_VERSION = 1;
const MAX_BRIEFS = 100;

interface Factory2Store {
  schemaVersion: number;
  briefs: UgcBriefV2[];
}

function load(): Factory2Store {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return { schemaVersion: SCHEMA_VERSION, briefs: [] };
    const parsed = JSON.parse(raw) as Factory2Store;
    if (!Array.isArray(parsed.briefs)) return { schemaVersion: SCHEMA_VERSION, briefs: [] };
    return parsed;
  } catch {
    return { schemaVersion: SCHEMA_VERSION, briefs: [] };
  }
}

function save(store: Factory2Store): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch (err) {
    console.warn('[factory2] failed to persist store', err);
  }
}

export function saveBrief(brief: UgcBriefV2): void {
  const store = load();
  const idx = store.briefs.findIndex((b) => b.id === brief.id);
  if (idx >= 0) store.briefs[idx] = brief;
  else store.briefs.push(brief);
  // Cap: drop oldest when over the limit.
  if (store.briefs.length > MAX_BRIEFS) {
    store.briefs.sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
    store.briefs = store.briefs.slice(store.briefs.length - MAX_BRIEFS);
  }
  save(store);
}

export function getBrief(id: string): UgcBriefV2 | undefined {
  return load().briefs.find((b) => b.id === id);
}

export function getAllBriefs(): UgcBriefV2[] {
  return [...load().briefs].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function deleteBrief(id: string): void {
  const store = load();
  store.briefs = store.briefs.filter((b) => b.id !== id);
  save(store);
}
