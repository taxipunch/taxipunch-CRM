import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getActionItems } from '../lib/queries';
import { ActionItem } from '../types';
import { cn } from '../lib/utils';
import { ActionCard } from '../components/ActionCard';

interface NextActionsProps {
  navigate: (screen: string, context?: any) => void;
  filterType?: string;
}

export const NextActions: React.FC<NextActionsProps> = ({ navigate, filterType }) => {
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [filter, setFilter] = useState(filterType || 'ALL');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getActionItems();
        setActions(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredActions = actions.filter(a => 
    filter === 'ALL' || a.type.toUpperCase().includes(filter)
  );

  const filters = [
    { id: 'ALL', label: 'All' },
    { id: 'TRANSCRIPT', label: 'Transcripts' },
    { id: 'MATCH', label: 'Matches' },
    { id: 'FOLLOWUP', label: 'Follow-ups' },
    { id: 'SIGNAL', label: 'Signals' },
    { id: 'INTRO', label: 'Intros' },
  ];

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <header className="mb-12">
        <h2 className="text-3xl md:text-5xl mb-2">Next Actions</h2>
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs text-text-secondary uppercase tracking-widest">
            Daily Inbox · {actions.length} Pending
          </span>
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-red" />
            <span className="font-mono text-[10px] text-accent-red uppercase">{actions.filter(a => a.priority === 'high').length} High Priority</span>
          </div>
        </div>
      </header>

      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "px-4 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-wider transition-all whitespace-nowrap",
              filter === f.id 
                ? "bg-text-primary text-bg-base font-bold" 
                : "text-text-secondary hover:text-text-primary hover:bg-bg-card"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-bg-card border border-border-subtle rounded-xl animate-pulse" />
          ))
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredActions.map((action) => (
              <motion.div
                key={action.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <ActionCard 
                  action={action}
                  isExpanded={expandedId === action.id}
                  onToggle={() => setExpandedId(expandedId === action.id ? null : action.id)}
                  onNavigate={navigate}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

const TrendingUp = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);
