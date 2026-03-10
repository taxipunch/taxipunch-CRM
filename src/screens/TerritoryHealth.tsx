import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Plus, X } from 'lucide-react';
import { getTerritories, getProviders, getBuyers, addTerritory } from '../lib/queries';
import { computeTerritorySignals } from '../lib/signals';
import { TerritoryCard } from '../components/TerritoryCard';
import { Territory } from '../types';

interface TerritoryHealthProps {
  navigate: (screen: string, context?: any) => void;
}

export const TerritoryHealth: React.FC<TerritoryHealthProps> = ({ navigate }) => {
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add Territory Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTerritoryName, setNewTerritoryName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tData, pData, bData] = await Promise.all([
        getTerritories(),
        getProviders(),
        getBuyers()
      ]);

      const enriched = tData.map(t => computeTerritorySignals(t, pData, bData));
      setTerritories(enriched);
    } catch (err) {
      console.error(err);
      setError("Couldn't load territories. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAddTerritory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTerritoryName.trim()) return;

    setIsAdding(true);
    setError(null);
    try {
      await addTerritory(newTerritoryName.trim());
      setNewTerritoryName('');
      setShowAddModal(false);
      await load(); // Refresh the grid
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to add territory.');
    } finally {
      setIsAdding(false);
    }
  };

  const filteredTerritories = territories.filter(t =>
    filter === 'ALL' || t.signal === filter
  ).sort((a, b) => {
    const priority: Record<string, number> = { BUILD: 0, GROW: 1, WATCH: 2, COLD: 3 };
    return priority[a.signal] - priority[b.signal];
  });

  const filters = ['ALL', 'BUILD', 'GROW', 'WATCH', 'COLD'];

  const getFilterCount = (f: string) => {
    if (f === 'ALL') return territories.length;
    return territories.filter(t => t.signal === f).length;
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <header className="mb-12 flex items-start justify-between">
        <div>
          <h2 className="text-3xl md:text-5xl mb-2">Territory Health</h2>
          <p className="text-text-secondary font-mono text-xs uppercase tracking-widest">
            Strategic Overview · Flywheel Status
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-2.5 bg-accent-green hover:bg-accent-green/90 text-bg-base font-mono text-[10px] uppercase tracking-widest font-bold rounded-full transition-all hover:scale-105 active:scale-95 shadow-lg shadow-accent-green/20"
        >
          <Plus size={14} className="stroke-[3]" />
          Territory
        </button>
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

      <div className="flex gap-2 mb-8 border-b border-border-subtle pb-4 overflow-x-auto scrollbar-hide flex-nowrap">
        {filters.map(f => {
          const count = getFilterCount(f);
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap min-h-[44px] shrink-0 ${filter === f
                ? "bg-accent-green text-bg-base font-bold"
                : "text-text-secondary hover:text-text-primary hover:bg-bg-card"
                }`}
            >
              {f}
              <span className={`text-[9px] ${filter === f ? "text-bg-base/70" : "text-text-muted"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-[240px] bg-bg-card border border-border-subtle rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredTerritories.map((t) => (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <TerritoryCard
                  territory={t}
                  onClick={() => navigate('TERRITORY_DETAIL', { territoryId: t.id })}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {!loading && filteredTerritories.length === 0 && (
        <div className="py-20 text-center border border-dashed border-border-subtle rounded-xl">
          <p className="font-mono text-xs text-text-muted uppercase tracking-widest">No territories match this filter</p>
        </div>
      )}

      {/* Add Territory Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-bg-base/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-bg-surface border border-border-subtle rounded-2xl p-6 shadow-2xl"
            >
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute top-4 right-4 p-2 text-text-muted hover:text-text-primary rounded-full hover:bg-bg-card transition-colors"
              >
                <X size={16} />
              </button>

              <h3 className="text-2xl mb-2">New Territory</h3>
              <p className="font-mono text-[10px] text-text-muted uppercase tracking-widest mb-6">
                Create a new geographic zone
              </p>

              <form onSubmit={handleAddTerritory} className="space-y-4">
                <div>
                  <label className="font-mono text-[10px] uppercase text-text-muted mb-1 block">
                    Territory Name *
                  </label>
                  <input
                    type="text"
                    value={newTerritoryName}
                    onChange={(e) => setNewTerritoryName(e.target.value)}
                    placeholder="e.g. Greater Williamsport"
                    required
                    autoFocus
                    className="w-full bg-bg-card border border-border-subtle rounded-lg px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-border-active transition-colors"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isAdding || !newTerritoryName.trim()}
                    className="w-full flex items-center justify-center gap-2 bg-text-primary text-bg-base font-mono text-[10px] uppercase font-bold rounded-full py-3 tracking-widest hover:bg-text-secondary transition-colors disabled:opacity-50"
                  >
                    {isAdding ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      'Save Territory'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
