import React from 'react';
import { LayoutDashboard, Map, Inbox, Milestone, LogOut, TrendingUp } from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
  pendingActions: number;
  mrr: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentScreen, onNavigate, pendingActions, mrr }) => {
  const navItems = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'TERRITORY_HEALTH', label: 'Territory Health', icon: Map },
    { id: 'NEXT_ACTIONS', label: 'Next Actions', icon: Inbox, badge: pendingActions },
    { id: 'ROADMAP', label: 'Roadmap', icon: Milestone },
  ];

  return (
    <div className="w-full h-16 md:w-[200px] md:h-screen border-t md:border-t-0 md:border-r flex flex-row md:flex-col bg-bg-surface fixed bottom-0 md:top-0 md:left-0 z-50">
      <div className="hidden md:block p-6">
        <h1 className="text-2xl leading-none font-display">
          Taxipunch<br />
          <span className="text-text-secondary">/ Network</span>
        </h1>
      </div>

      <nav className="flex-1 flex flex-row md:flex-col items-center md:items-stretch justify-around md:justify-start px-3 md:space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={cn(
              "flex md:w-full items-center justify-center md:justify-start gap-3 px-3 py-2 rounded-lg transition-colors group relative",
              currentScreen === item.id 
                ? "bg-border-subtle text-text-primary" 
                : "text-text-secondary hover:text-text-primary hover:bg-bg-card"
            )}
          >
            <item.icon size={20} className={cn(
              "transition-colors",
              currentScreen === item.id ? "text-accent-green" : "group-hover:text-text-primary"
            )} />
            <span className="hidden md:block font-mono text-xs uppercase tracking-wider">{item.label}</span>
            {item.badge > 0 && (
              <span className={cn(
                "bg-accent-blue text-bg-base text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold",
                "absolute -top-1 -right-1 md:static md:ml-auto"
              )}>
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="hidden md:block p-6 border-t border-border-subtle">
        <div className="mb-4">
          <div className="flex justify-between items-end mb-1">
            <span className="font-mono text-[10px] text-text-secondary uppercase">MRR Progress</span>
            <span className="font-mono text-[10px] text-accent-green">${mrr}</span>
          </div>
          <div className="h-1 bg-border-subtle rounded-full overflow-hidden">
            <div 
              className="h-full bg-accent-green" 
              style={{ width: `${(mrr / 10000) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="font-mono text-[8px] text-text-muted uppercase">Goal $10k</span>
          </div>
        </div>

        <button className="w-full flex items-center gap-3 px-3 py-2 text-text-muted hover:text-accent-red transition-colors">
          <LogOut size={16} />
          <span className="font-mono text-[10px] uppercase tracking-wider">Logout</span>
        </button>
      </div>
    </div>
  );
};
