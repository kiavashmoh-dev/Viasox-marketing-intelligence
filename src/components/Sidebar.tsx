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
 * Section model:
 *   - Plain sections have a static label header (e.g. "CREATIVE") and a
 *     flat list of clickable items.
 *   - Group sections have a CLICKABLE header that toggles expand/collapse
 *     of the items below. Used for "Briefing" — its only purpose is to
 *     house The Factory and its supporting tools, so the user doesn't
 *     see them mixed in with the other top-level modules.
 *
 * Within an expandable group, items can be tagged `isSubsection`. Those
 * render with reduced visual weight (smaller, indented further, lighter
 * color) so it's visually obvious they're tools used by the primary
 * item in the group (The Factory) rather than peers of it.
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
   *  indent, lighter color) — used inside expandable groups to show
   *  hierarchy. The primary item in a group does NOT set this flag. */
  isSubsection?: boolean;
}

interface SidebarSection {
  /** Section label. For plain sections, shown as a small uppercase
   *  static header. For expandable groups, shown inside a clickable
   *  button that toggles the items open/closed. */
  label: string;
  /** When true, the label is rendered as a clickable expandable header
   *  (with a chevron) instead of a static section title. */
  isExpandable?: boolean;
  /** Optional icon for expandable group headers. Ignored for plain
   *  sections (which don't render an icon next to their label). */
  icon?: string;
  /** Initial open state for expandable sections. Defaults to true. */
  defaultOpen?: boolean;
  items: SidebarItem[];
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
    label: 'Briefing',
    isExpandable: true,
    defaultOpen: true,
    icon: '📋',
    // Order matters here: The Factory is the primary, the other three
    // are nested subsections that the Factory's pipeline uses internally.
    // They stay accessible for ad-hoc use but visually deprioritized.
    items: [
      { id: 'autopilot', label: 'The Factory', icon: '🏭' },
      { id: 'angles', label: 'Concepts & Angles', icon: '💡', isSubsection: true },
      { id: 'script', label: 'Script Writer', icon: '🎬', isSubsection: true },
      { id: 'hooks', label: 'Hooks', icon: '🎤', isSubsection: true },
    ],
  },
  {
    label: 'Creative',
    items: [
      { id: 'comments', label: 'Ad Comments', icon: '💬' },
      { id: 'inspiration', label: 'Inspiration', icon: '📚' },
      { id: 'memory-vault', label: 'Memory Vault', icon: '🗃️' },
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

  // Open/closed state for expandable sections, keyed by section label.
  // Initialized from each section's defaultOpen (defaults to true).
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const s of SECTIONS) {
      if (s.isExpandable) init[s.label] = s.defaultOpen ?? true;
    }
    return init;
  });

  // If the active module lives inside an expandable group that's currently
  // collapsed, auto-expand it so the user can see the highlighted item.
  // (Prevents the "I'm on The Factory but the sidebar doesn't show I'm there"
  // confusion when the user collapsed Briefing earlier.)
  useEffect(() => {
    if (!activeModule) return;
    for (const s of SECTIONS) {
      if (!s.isExpandable) continue;
      const hit = s.items.some((it) => it.id === activeModule);
      if (hit && !openSections[s.label]) {
        setOpenSections((prev) => ({ ...prev, [s.label]: true }));
      }
    }
  }, [activeModule, openSections]);

  const toggleSection = (label: string) => {
    setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <aside className="w-60 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0 h-screen sticky top-0">
      {/* Brand mark / logo area */}
      <div className="px-5 py-5 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
            V
          </div>
          <div className="font-bold text-slate-800 text-lg leading-none tracking-tight">
            Viasox
          </div>
        </div>
      </div>

      {/* Scrollable nav area */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {SECTIONS.map((section, idx) => {
          const sectionOpen = section.isExpandable ? openSections[section.label] : true;
          return (
            <div key={idx} className={idx > 0 ? 'mt-5' : ''}>
              {/* Section header — static label OR clickable expandable header */}
              {section.label && section.isExpandable ? (
                <button
                  onClick={() => toggleSection(section.label)}
                  className="w-full flex items-center gap-2 px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-700 transition-colors"
                  aria-expanded={sectionOpen}
                  aria-controls={`section-${section.label}`}
                >
                  {section.icon && <span className="text-sm leading-none">{section.icon}</span>}
                  <span className="flex-1 text-left">{section.label}</span>
                  <span className={`text-slate-400 transition-transform ${sectionOpen ? 'rotate-90' : ''}`}>
                    ▶
                  </span>
                </button>
              ) : section.label ? (
                <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {section.label}
                </div>
              ) : null}

              {/* Items list — hidden when an expandable section is collapsed */}
              {sectionOpen && (
                <ul id={`section-${section.label}`} className="space-y-0.5">
                  {section.items.map((item) => {
                    const active = isActive(item.id);
                    // Subsection styling: tighter padding, lighter text,
                    // smaller icon — visually subordinate to the primary
                    // item in the same expandable group.
                    if (item.isSubsection) {
                      return (
                        <li key={item.id}>
                          <button
                            onClick={() => onNavigate(item.id)}
                            className={`w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg text-[13px] transition-colors text-left ${
                              active
                                ? 'bg-blue-600 text-white shadow-sm font-medium'
                                : 'text-slate-500 hover:bg-slate-200/60 hover:text-slate-700'
                            }`}
                          >
                            <span className="text-xs leading-none shrink-0 opacity-80">{item.icon}</span>
                            <span className="truncate">{item.label}</span>
                          </button>
                        </li>
                      );
                    }
                    // Regular / primary item styling
                    return (
                      <li key={item.id}>
                        <button
                          onClick={() => onNavigate(item.id)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                            active
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'text-slate-700 hover:bg-slate-200/60'
                          }`}
                        >
                          <span className="text-base leading-none shrink-0">{item.icon}</span>
                          <span className="truncate">{item.label}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom: brand info + reset link */}
      <div className="border-t border-slate-200 px-3 py-3 space-y-2">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="w-7 h-7 rounded-md bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs shrink-0">
            V
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 leading-none">Brand</div>
            <div className="text-sm font-semibold text-slate-800 truncate leading-tight mt-0.5">Viasox</div>
          </div>
        </div>
        <button
          onClick={onResetData}
          className="w-full text-[11px] text-slate-500 hover:text-slate-700 text-left px-2 py-1 hover:bg-slate-200/60 rounded-md transition-colors"
        >
          ↑ Upload new data
        </button>
      </div>
    </aside>
  );
}
