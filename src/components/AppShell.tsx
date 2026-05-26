/**
 * AppShell — layout wrapper that places the persistent Sidebar on the left
 * and renders the active module (or the Home page) in the right pane.
 *
 * Wraps both the 'dashboard' (Home) and 'module' phases of the app, so the
 * sidebar stays visible while moving between modules.
 *
 * This wrapper is INTENTIONALLY DUMB. It does not manage navigation state —
 * it just receives `activeModule` + handlers from App.tsx and the children
 * (Home or a module component) from the parent. Module internals are
 * untouched; they render in the main pane exactly as they do today.
 */
import type { ReactNode } from 'react';
import type { ModuleId } from '../engine/types';
import Sidebar from './Sidebar';

interface Props {
  /** Currently-active module. `null` means Home is showing in the main pane. */
  activeModule: ModuleId | null;
  /** Called when a sidebar item is clicked. */
  onNavigate: (target: ModuleId | 'home') => void;
  /** Called when the "Upload new data" link is clicked. */
  onResetData: () => void;
  /** The main-pane content — Home or a module component. */
  children: ReactNode;
}

export default function AppShell({ activeModule, onNavigate, onResetData, children }: Props) {
  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar
        activeModule={activeModule}
        onNavigate={onNavigate}
        onResetData={onResetData}
      />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
