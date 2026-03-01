import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Plus } from 'lucide-react';
import { getActionItems, markActionDone } from '../lib/queries';
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
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getActionItems();
      setActions(data);
    } catch (err) {
      console.error(err);
      setError("Couldn't load actions. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleComplete = async (id: string) => {
    await markActionDone(id);
    setActions(prev => prev.filter(a => a.id !== id));
  };

  const getFilteredCount = (filterId: string) => {
    if (filterId === 'ALL') return actions.length;
    return actions.filter(a => a.type.toUpperCase().includes(filterId)).length;
  };

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
    <div className="p-4 md:p-8 max-w-3xl mx-auto overflow-x-hidden w-full">
      <header className="mb-12">
        <h2 className="text-3xl md:text-5xl mb-2">Next Actions</h2>
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs text-text-secondary uppercase tracking-widest">
            Daily Inbox · {actions.length} Pending
          </span>
          {actions.filter(a => a.priority === 'high').length > 0 && (
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-accent-red" />
              <span className="font-mono text-[10px] text-accent-red uppercase">{actions.filter(a => a.priority === 'high').length} High Priority</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 mt-3">
          <button onClick={() => navigate('ADD_PROVIDER')} className="flex items-center gap-1 px-3 py-1.5 bg-bg-card border border-border-subtle rounded-full font-mono text-[10px] text-text-muted uppercase tracking-wider hover:text-accent-green hover:border-accent-green/30 transition-colors"><Plus size={10} /> Provider</button>
          <button onClick={() => navigate('ADD_BUYER')} className="flex items-center gap-1 px-3 py-1.5 bg-bg-card border border-border-subtle rounded-full font-mono text-[10px] text-text-muted uppercase tracking-wider hover:text-accent-green hover:border-accent-green/30 transition-colors"><Plus size={10} /> Buyer</button>
        </div>
      </header>

      {/* Error State */}
      {error && (
        <div className="flex items-center justify-between p-4 mb-8 bg-accent-red/5 border border-accent-red/20 rounded-xl">
          <p className="text-sm text-accent-red">{error}</p>
          <button
            onClick={load}
            className="flex items-center gap-2 px-4 py-1.5 bg-accent-red/10 text-accent-red font-mono text-[10px] uppercase tracking-wider rounded-full hover:bg-accent-red/20 transition-colors"
          >
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      )}

      {/* Filters with counts */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide flex-nowrap">
        {filters.map(f => {
          const count = getFilteredCount(f.id);
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "px-4 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5 min-h-[44px] shrink-0",
                filter === f.id
                  ? "bg-text-primary text-bg-base font-bold"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-card"
              )}
            >
              {f.label}
              <span className={cn(
                "text-[9px] px-1 rounded",
                filter === f.id ? "text-bg-base/70" : "text-text-muted"
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-bg-card border border-border-subtle rounded-xl animate-pulse" />
          ))
        ) : filteredActions.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-border-subtle rounded-xl">
            <p className="font-mono text-xs text-text-muted uppercase tracking-widest">No actions match this filter</p>
          </div>
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
                  onComplete={handleComplete}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
