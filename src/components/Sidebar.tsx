/**
 * Sidebar — persistent left navigation across the home page and all modules.
 *
 * Sits to the left of the main content area at all times once the user is
 * past the upload/processing phases. Replaces the previous card-grid
 * dashboard's role as the module picker.
 *
 * Active state is driven by the `activeModule` prop (null = Home). Clicking
 * any item fires `onNavigate` — the App component decides what to do with
 * the click (Home → reset activeModule + dashboard view, module → set
 * activeModule + module view).
 *
 * Three-level structure:
 *   - SECTION   — static uppercase label (e.g. "CREATIVE", "INSIGHTS").
 *                 Pure container, no toggle, no destination. Contains
 *                 either flat items or expandable groups.
 *   - GROUP     — clickable expandable header within a section (e.g.
 *                 "Briefing", "Context Hub"). Has an icon + chevron.
 *                 The group itself is not a destination — its only purpose
 *                 is to house the items inside.
 *   - ITEM      — the actual destination (a module or Home). Items can be
 *                 marked `isSubsection` to render with reduced visual weight
 *                 (smaller, more indented, lighter color) — used inside
 *                 groups to indicate a primary item with its supporting
 *                 tools nested under it.
 *
 * Visual identity stays Viasox-native: brand blue for the active item,
 * slate grays for everything else.
 */
import { useEffect, useState } from 'react';
import type { ModuleId } from '../engine/types';

interface SidebarItem {
  id: ModuleId | 'home';
  label: string;
  icon: string;
  /** When true, this item is rendered as a subsection (smaller, deeper
   *  indent, lighter color) — used inside groups to denote that the
   *  item is a tool used by the group's primary item, not a peer. */
  isSubsection?: boolean;
}

interface SidebarGroup {
  /** Label shown inside the clickable expand/collapse header. */
  label: string;
  /** Icon shown to the left of the group label. */
  icon: string;
  /** Initial open state. Defaults to true. */
  defaultOpen?: boolean;
  /** Items revealed when the group is open. */
  items: SidebarItem[];
}

interface SidebarSection {
  /** Static uppercase label (e.g. "CREATIVE"). Empty string for the
   *  unlabeled Home row at the top of the sidebar. */
  label: string;
  /** Direct items — used when the section contains a flat list of
   *  destinations (e.g. Insights). Mutually exclusive with `groups`. */
  items?: SidebarItem[];
  /** Nested expandable groups — used when the section's children are
   *  collapsible groups instead of flat items (e.g. Creative containing
   *  Briefing + Context Hub). Mutually exclusive with `items`. */
  groups?: SidebarGroup[];
}

/** The module list — order matters, this is the order they appear in
 *  the sidebar. Edit here to reorder / rename / add / regroup. */
const SECTIONS: SidebarSection[] = [
  {
    label: '',
    items: [
      { id: 'home', label: 'Home', icon: '🏠' },
    ],
  },
  {
    label: 'Creative',
    groups: [
      {
        // Briefing houses The Factory and the supporting standalone tools
        // its pipeline uses internally (concepts → script → hooks). The
        // Factory is the primary; the others are subsections nested under
        // it so it's visually obvious they're its tools, not peers.
        label: 'Briefing',
        icon: '📋',
        defaultOpen: true,
        items: [
          { id: 'autopilot', label: 'The Factory', icon: '🏭' },
          { id: 'angles', label: 'Concepts & Angles', icon: '💡', isSubsection: true },
          { id: 'script', label: 'Script Writer', icon: '🎬', isSubsection: true },
          { id: 'hooks', label: 'Hooks', icon: '🎤', isSubsection: true },
          // Peer to The Factory but visually separate — it's a guided
          // explainer, not a tool the Factory uses.
          { id: 'factory-tour', label: 'Factory Anatomy', icon: '🔍' },
        ],
      },
      {
        // Context Hub houses the reference / knowledge-source modules
        // the brain pulls from: customer voice (Ad Comments), past work
        // (Memory Vault), reference ads (Inspiration). All three are
        // peers — no primary, no subsections.
        label: 'Context Hub',
        icon: '🗂️',
        defaultOpen: true,
        items: [
          { id: 'customer-reviews', label: 'Customer Reviews', icon: '⭐' },
          { id: 'comments', label: 'Ad Comments', icon: '💬' },
          { id: 'memory-vault', label: 'Memory Vault', icon: '🗃️' },
          { id: 'inspiration', label: 'Inspiration', icon: '📚' },
        ],
      },
    ],
  },
  {
    label: 'Insights',
    items: [
      { id: 'segments', label: 'Segments', icon: '🧩' },
      { id: 'persona', label: 'Personas', icon: '👤' },
      { id: 'product-intelligence', label: 'Product Intel', icon: '💰' },
    ],
  },
];

interface Props {
  /** Currently-active module. `null` means we're on the Home page. */
  activeModule: ModuleId | null;
  /** Fired whenever a sidebar item is clicked. `'home'` for the Home item;
   *  otherwise the ModuleId of the chosen module. */
  onNavigate: (target: ModuleId | 'home') => void;
  /** Resets the analysis back to the upload screen. Exposed at the bottom
   *  of the sidebar as a small "Upload new data" link so it stays
   *  available but doesn't compete with module navigation visually. */
  onResetData: () => void;
}

export default function Sidebar({ activeModule, onNavigate, onResetData }: Props) {
  const isActive = (id: ModuleId | 'home') => {
    if (id === 'home') return activeModule === null;
    return activeModule === id;
  };

  // Open/closed state for expandable groups, keyed by group label.
  // Initialized from each group's defaultOpen (defaults to true).
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const s of SECTIONS) {
      if (!s.groups) continue;
      for (const g of s.groups) init[g.label] = g.defaultOpen ?? true;
    }
    return init;
  });

  // If the active module lives inside a currently-collapsed group, auto-
  // expand it so the highlighted item is visible. Prevents the "I'm on
  // The Factory but the sidebar doesn't show I'm there" confusion when
  // the user collapsed Briefing earlier.
  useEffect(() => {
    if (!activeModule) return;
    for (const s of SECTIONS) {
      if (!s.groups) continue;
      for (const g of s.groups) {
        const hit = g.items.some((it) => it.id === activeModule);
        if (hit && !openGroups[g.label]) {
          setOpenGroups((prev) => ({ ...prev, [g.label]: true }));
        }
      }
    }
  }, [activeModule, openGroups]);

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  // Item renderer — shared between flat-section items and group items.
  const renderItem = (item: SidebarItem) => {
    const active = isActive(item.id);
    if (item.isSubsection) {
      // Subsection styling: tighter padding, lighter text, smaller icon —
      // visually subordinate to the primary item in the same group.
      return (
        <li key={item.id}>
          <button
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg text-[13px] transition-colors text-left ${
              active
                ? 'bg-navy text-cream shadow-sm font-medium'
                : 'text-slate-500 hover:bg-cream/70 hover:text-navy'
            }`}
          >
            <span className="text-xs leading-none shrink-0 opacity-80">{item.icon}</span>
            <span className="truncate">{item.label}</span>
          </button>
        </li>
      );
    }
    return (
      <li key={item.id}>
        <button
          onClick={() => onNavigate(item.id)}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
            active
              ? 'bg-navy text-cream shadow-sm'
              : 'text-slate-700 hover:bg-cream/70'
          }`}
        >
          <span className="text-base leading-none shrink-0">{item.icon}</span>
          <span className="truncate">{item.label}</span>
        </button>
      </li>
    );
  };

  return (
    <aside className="w-60 bg-cream-deep border-r border-cream-border flex flex-col shrink-0 h-screen sticky top-0">
      {/* Brand mark / logo area — uses the display serif for "Viasox" to
          set the tone for the rest of the surface. */}
      <div className="px-5 py-5 border-b border-cream-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center text-cream font-bold text-sm shrink-0 font-display">
            V
          </div>
          <div className="font-display font-semibold text-navy text-xl leading-none tracking-tight">
            Viasox
          </div>
        </div>
      </div>

      {/* Scrollable nav area */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {SECTIONS.map((section, idx) => (
          <div key={idx} className={idx > 0 ? 'mt-5' : ''}>
            {/* Section header — small uppercase static label (e.g. CREATIVE) */}
            {section.label && (
              <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {section.label}
              </div>
            )}

            {/* Flat items — sections like Insights that go straight to
                destinations without an intermediate group layer. */}
            {section.items && (
              <ul className="space-y-0.5">
                {section.items.map(renderItem)}
              </ul>
            )}

            {/* Nested groups — sections like Creative that contain
                expandable groups (Briefing, Context Hub). Each group is
                a clickable header with chevron + its own items list. */}
            {section.groups && (
              <div className="space-y-2.5">
                {section.groups.map((group) => {
                  const isOpen = openGroups[group.label];
                  return (
                    <div key={group.label}>
                      <button
                        onClick={() => toggleGroup(group.label)}
                        className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-cream/70 hover:text-navy transition-colors text-left"
                        aria-expanded={isOpen}
                        aria-controls={`group-${group.label}`}
                      >
                        <span className="text-base leading-none shrink-0">{group.icon}</span>
                        <span className="flex-1 truncate">{group.label}</span>
                        <span className={`text-[10px] text-slate-400 transition-transform ${isOpen ? 'rotate-90' : ''}`}>
                          ▶
                        </span>
                      </button>
                      {isOpen && (
                        <ul
                          id={`group-${group.label}`}
                          className="space-y-0.5 mt-1"
                        >
                          {group.items.map(renderItem)}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Bottom: brand info + reset link */}
      <div className="border-t border-cream-border px-3 py-3 space-y-2">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="w-7 h-7 rounded-md bg-warm-amber/15 flex items-center justify-center text-warm-amber font-bold text-xs shrink-0">
            V
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 leading-none">Brand</div>
            <div className="text-sm font-semibold text-navy truncate leading-tight mt-0.5">Viasox</div>
          </div>
        </div>
        <button
          onClick={onResetData}
          className="w-full text-[11px] text-slate-500 hover:text-navy text-left px-2 py-1 hover:bg-cream/70 rounded-md transition-colors"
        >
          ↑ Upload new data
        </button>
      </div>
    </aside>
  );
}
