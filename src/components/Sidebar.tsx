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
 * Visual identity stays Viasox-native: brand blue for the active item,
 * slate grays for everything else. Subtle section labels group the modules
 * by Creative vs Insights (the existing mental model from OutputSelector).
 */
import type { ModuleId } from '../engine/types';

interface SidebarItem {
  id: ModuleId | 'home';
  label: string;
  icon: string;
}

interface SidebarSection {
  /** Section label (e.g., "Creative"). Empty string = no label (used for
   *  the Home item which sits alone at the top). */
  label: string;
  items: SidebarItem[];
}

/** The module list — order matters, this is the order they appear in
 *  the sidebar. Edit here to reorder / rename / add. */
const SECTIONS: SidebarSection[] = [
  {
    label: '',
    items: [
      { id: 'home', label: 'Home', icon: '🏠' },
    ],
  },
  {
    label: 'Creative',
    items: [
      { id: 'angles', label: 'Concepts & Angles', icon: '💡' },
      { id: 'script', label: 'Script Writer', icon: '🎬' },
      { id: 'hooks', label: 'Hooks', icon: '🎤' },
      { id: 'autopilot', label: 'Autopilot Briefs', icon: '🤖' },
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
        {SECTIONS.map((section, idx) => (
          <div key={idx} className={idx > 0 ? 'mt-5' : ''}>
            {section.label && (
              <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {section.label}
              </div>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.id);
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
          </div>
        ))}
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
