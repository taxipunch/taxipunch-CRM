import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw } from 'lucide-react';
import { getTerritories, getProviders, getBuyers } from '../lib/queries';
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
      <header className="mb-12">
        <h2 className="text-3xl md:text-5xl mb-2">Territory Health</h2>
        <p className="text-text-secondary font-mono text-xs uppercase tracking-widest">
          Strategic Overview · Flywheel Status
        </p>
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
    </div>
  );
};
