import React from 'react';
import { LayoutDashboard, Map, Inbox, Milestone, LogOut, FileText, ListChecks } from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
  pendingActions: number;
  pendingTranscripts: number;
  mrr: number;
}

// Mobile bottom nav — 4 items only
const MOBILE_NAV = [
  { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'TERRITORY_HEALTH', label: 'Territories', icon: Map },
  { id: 'NEXT_ACTIONS', label: 'Actions', icon: ListChecks },
  { id: 'TRANSCRIPTS', label: 'Transcripts', icon: FileText },
];

// Desktop sidebar — full nav
const DESKTOP_NAV = [
  { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'TERRITORY_HEALTH', label: 'Territories', icon: Map },
  { id: 'NEXT_ACTIONS', label: 'Actions', icon: Inbox, badgeKey: 'actions' as const },
  { id: 'TRANSCRIPTS', label: 'Transcripts', icon: FileText, badgeKey: 'transcripts' as const },
  { id: 'ROADMAP', label: 'Roadmap', icon: Milestone },
];

export const Sidebar: React.FC<SidebarProps> = ({ currentScreen, onNavigate, pendingActions, pendingTranscripts, mrr }) => {
  const badges: Record<string, number> = {
    actions: pendingActions,
    transcripts: pendingTranscripts,
  };

  return (
    <>
      {/* ── Mobile bottom nav bar ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-bg-base border-t border-border-subtle"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-stretch justify-around">
          {MOBILE_NAV.map((item) => {
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 min-w-[44px] min-h-[56px] py-2 px-1 flex-1 transition-colors",
                  isActive ? "text-accent-green" : "text-text-muted"
                )}
              >
                <item.icon size={20} />
                <span className="font-mono text-[9px] uppercase tracking-widest leading-none">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── Desktop sidebar ── */}
      <div className="hidden md:flex w-[220px] h-screen border-r border-border-subtle flex-col bg-bg-surface fixed top-0 left-0 z-50">
        <div className="px-5 py-6">
          <h1 className="text-lg leading-tight font-display text-text-secondary">
            Taxipunch<br />
            <span className="text-text-muted">/ Network</span>
          </h1>
        </div>

        <nav className="flex-1 flex flex-col pt-2 space-y-0.5">
          {DESKTOP_NAV.map((item) => {
            const isActive = currentScreen === item.id;
            const badge = item.badgeKey ? badges[item.badgeKey] : 0;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group relative",
                  isActive
                    ? "text-text-primary"
                    : "text-text-muted hover:text-text-secondary hover:bg-bg-card/50"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-accent-green rounded-r-full" />
                )}
                <item.icon size={18} className={cn(
                  "transition-colors shrink-0",
                  isActive ? "text-accent-green" : "opacity-50 group-hover:opacity-70"
                )} />
                <span className={cn(
                  "font-mono text-[10px] uppercase tracking-wider whitespace-nowrap",
                  isActive ? "font-medium" : ""
                )}>{item.label}</span>
                {badge > 0 && (
                  <span className={cn(
                    "text-[9px] font-mono px-1.5 py-0.5 rounded-full font-bold ml-auto",
                    isActive
                      ? "bg-accent-green text-bg-base"
                      : "bg-border-active text-text-secondary"
                  )}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="px-4 py-5 border-t border-border-subtle">
          <div className="mb-4">
            <div className="flex justify-between items-end mb-1.5">
              <span className="font-mono text-[9px] text-text-muted uppercase tracking-wider">MRR</span>
              <span className="font-mono text-[10px] text-accent-green">${mrr.toLocaleString()}</span>
            </div>
            <div className="h-1 bg-border-subtle rounded-full overflow-hidden">
              <div
                className="h-full bg-accent-green/60"
                style={{ width: `${(mrr / 10000) * 100}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="font-mono text-[8px] text-text-muted uppercase">Goal $10k</span>
            </div>
          </div>

          <button className="w-full flex items-center gap-3 px-3 py-2 text-text-muted hover:text-text-secondary transition-colors rounded-lg">
            <LogOut size={14} />
            <span className="font-mono text-[9px] uppercase tracking-wider">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};
