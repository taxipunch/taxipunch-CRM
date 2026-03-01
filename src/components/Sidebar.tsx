import React from 'react';
import { LayoutDashboard, Map, Inbox, Milestone, LogOut, TrendingUp, FileText } from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
  pendingActions: number;
  pendingTranscripts: number;
  mrr: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentScreen, onNavigate, pendingActions, pendingTranscripts, mrr }) => {
  const navItems = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'TERRITORY_HEALTH', label: 'Territories', icon: Map },
    { id: 'NEXT_ACTIONS', label: 'Actions', icon: Inbox, badge: pendingActions },
    { id: 'TRANSCRIPTS', label: 'Transcripts', icon: FileText, badge: pendingTranscripts },
    { id: 'ROADMAP', label: 'Roadmap', icon: Milestone },
  ];

  return (
    <div
      className="w-full h-16 md:w-[220px] md:h-screen border-t md:border-t-0 md:border-r border-border-subtle flex flex-row md:flex-col bg-bg-surface fixed bottom-0 md:top-0 md:left-0 z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="hidden md:block px-5 py-6">
        <h1 className="text-lg leading-tight font-display text-text-secondary">
          Taxipunch<br />
          <span className="text-text-muted">/ Network</span>
        </h1>
      </div>

      <nav className="flex-1 flex flex-row md:flex-col items-center md:items-stretch justify-around md:justify-start px-2 md:pt-2 md:space-y-0.5">
        {navItems.map((item) => {
          const isActive = currentScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "flex md:w-full items-center justify-center md:justify-start gap-3 px-3 py-2.5 rounded-lg transition-colors group relative",
                isActive
                  ? "text-text-primary"
                  : "text-text-muted hover:text-text-secondary hover:bg-bg-card/50"
              )}
            >
              {/* Active indicator — subtle left bar */}
              {isActive && (
                <div className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-accent-green rounded-r-full" />
              )}
              <item.icon size={18} className={cn(
                "transition-colors shrink-0",
                isActive ? "text-accent-green" : "opacity-50 group-hover:opacity-70"
              )} />
              <span className={cn(
                "hidden md:block font-mono text-[10px] uppercase tracking-wider whitespace-nowrap",
                isActive ? "font-medium" : ""
              )}>{item.label}</span>
              {item.badge > 0 && (
                <span className={cn(
                  "text-[9px] font-mono px-1.5 py-0.5 rounded-full font-bold",
                  "absolute -top-1 -right-1 md:static md:ml-auto",
                  isActive
                    ? "bg-accent-green text-bg-base"
                    : "bg-border-active text-text-secondary"
                )}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="hidden md:block px-4 py-5 border-t border-border-subtle">
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
  );
};

