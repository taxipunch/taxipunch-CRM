import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { deleteProvider } from '../lib/queries';

interface ProvidersListProps {
    navigate: (screen: string, context?: any) => void;
}

const STAGES = ['prospect', 'contacted', 'negotiating', 'active', 'bench'] as const;

const stageColor: Record<string, string> = {
    prospect: 'text-text-muted',
    contacted: 'text-accent-yellow',
    negotiating: 'text-accent-orange',
    active: 'text-accent-green',
    bench: 'text-text-secondary',
};

export const ProvidersList: React.FC<ProvidersListProps> = ({ navigate }) => {
    const [providers, setProviders] = useState<any[]>([]);
    const [territories, setTerritories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [filterTerritory, setFilterTerritory] = useState('all');
    const [filterNiche, setFilterNiche] = useState('all');
    const [filterStage, setFilterStage] = useState('all');

    // Per-card state
    const [savedId, setSavedId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [{ data: p, error: pe }, { data: t, error: te }] = await Promise.all([
                supabase.from('providers').select('*'),
                supabase.from('territories').select('id, name'),
            ]);
            if (pe) throw pe;
            if (te) throw te;
            setProviders(p || []);
            setTerritories(t || []);
        } catch {
            setError("Couldn't load providers.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    // Territory lookup
    const territoryName = (id: string) => territories.find(t => t.id === id)?.name || '—';

    // Unique niches for filter
    const niches = [...new Set(providers.map(p => p.niche).filter(Boolean))].sort();

    // Filtered list
    const filtered = providers.filter(p => {
        if (filterTerritory !== 'all' && p.territory_id !== filterTerritory) return false;
        if (filterNiche !== 'all' && p.niche !== filterNiche) return false;
        if (filterStage !== 'all' && p.stage !== filterStage) return false;
        return true;
    });

    // Stage change handler
    const handleStageChange = async (id: string, newStage: string) => {
        setProviders(prev => prev.map(p => p.id === id ? { ...p, stage: newStage } : p));
        try {
            const { error: err } = await supabase.from('providers').update({ stage: newStage }).eq('id', id);
            if (err) throw err;
            setSavedId(id);
            setTimeout(() => setSavedId(null), 2000);
        } catch {
            load(); // revert on error
        }
    };

    // Delete handler
    const handleDelete = async (id: string) => {
        try {
            await deleteProvider(id);
            setProviders(prev => prev.filter(p => p.id !== id));
            setDeletingId(null);
        } catch {
            setError('Delete failed.');
        }
    };

    const selectClass = 'bg-bg-card border border-border-subtle rounded-lg px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-text-primary min-h-[44px]';

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto pb-20 md:pb-0">
            {/* Header */}
            <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl md:text-5xl mb-2">Providers</h2>
                    <p className="font-mono text-xs text-text-secondary uppercase tracking-widest">
                        {filtered.length} records · {filterTerritory !== 'all' ? territoryName(filterTerritory) : 'all territories'}
                    </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <button
                        onClick={() => navigate('ADD_BUYER')}
                        className="px-6 py-2.5 bg-bg-surface border border-border-subtle text-text-primary font-mono text-[10px] uppercase font-bold rounded-full tracking-widest hover:border-border-active transition-colors"
                    >
                        + Buyer
                    </button>
                    <button
                        onClick={() => navigate('ADD_PROVIDER')}
                        className="px-6 py-2.5 bg-accent-green text-bg-base font-mono text-[10px] uppercase font-bold rounded-full tracking-widest hover:bg-accent-green/90 transition-colors"
                    >
                        + Provider
                    </button>
                </div>
            </header>

            {/* Filter bar */}
            <div className="overflow-x-auto scrollbar-none flex gap-2 mb-6">
                <select value={filterTerritory} onChange={e => setFilterTerritory(e.target.value)} className={selectClass}>
                    <option value="all">All Territories</option>
                    {territories.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <select value={filterNiche} onChange={e => setFilterNiche(e.target.value)} className={selectClass}>
                    <option value="all">All Niches</option>
                    {niches.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <select value={filterStage} onChange={e => setFilterStage(e.target.value)} className={selectClass}>
                    <option value="all">All Stages</option>
                    {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            {/* Loading */}
            {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-bg-card border border-border-subtle rounded-xl p-4 animate-pulse">
                            <div className="h-5 w-2/3 bg-border-subtle rounded mb-3" />
                            <div className="h-3 w-1/3 bg-border-subtle rounded mb-3" />
                            <div className="h-8 w-1/2 bg-border-subtle rounded" />
                        </div>
                    ))}
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="flex items-center justify-between p-4 bg-accent-red/5 border border-accent-red/20 rounded-xl mb-6">
                    <p className="text-sm text-accent-red">{error}</p>
                    <button onClick={load} className="flex items-center gap-2 px-4 py-1.5 bg-accent-red/10 text-accent-red font-mono text-[10px] uppercase tracking-wider rounded-full hover:bg-accent-red/20 transition-colors min-h-[44px]">
                        <RefreshCw size={12} /> Retry
                    </button>
                </div>
            )}

            {/* Card grid */}
            {!loading && !error && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filtered.length === 0 && (
                        <div className="col-span-2 text-center py-16">
                            <p className="font-mono text-[10px] uppercase text-text-muted tracking-widest">no records match these filters</p>
                        </div>
                    )}

                    {filtered.map(p => (
                        <div
                            key={p.id}
                            onClick={() => navigate('PROVIDER_DETAIL', { providerId: p.id })}
                            className="bg-bg-card border border-border-subtle rounded-xl p-4 cursor-pointer hover:border-border-active transition-colors"
                        >
                            {/* Top: business name + niche */}
                            <div className="flex items-start justify-between gap-2 mb-1">
                                <span className="text-base font-semibold text-text-primary">{p.business_name || p.name}</span>
                                {p.niche && (
                                    <span className="font-mono text-[9px] uppercase tracking-widest bg-bg-base border border-border-subtle rounded-full px-2 py-0.5 text-text-secondary shrink-0">
                                        {p.niche}
                                    </span>
                                )}
                            </div>

                            {/* Territory */}
                            <p className="font-mono text-[10px] text-text-muted uppercase tracking-widest mb-3">
                                {territoryName(p.territory_id)}
                            </p>

                            {/* Stage dropdown */}
                            <div className="flex items-center gap-2 mb-3">
                                <select
                                    value={p.stage}
                                    onClick={e => e.stopPropagation()}
                                    onChange={e => handleStageChange(p.id, e.target.value)}
                                    className={`${selectClass} ${stageColor[p.stage] || 'text-text-primary'}`}
                                >
                                    {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <AnimatePresence>
                                    {savedId === p.id && (
                                        <motion.span
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="font-mono text-[10px] text-accent-green uppercase tracking-widest"
                                        >
                                            ● saved
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                                <button
                                    onClick={() => navigate('PROVIDER_DETAIL', { providerId: p.id })}
                                    className="text-text-secondary hover:text-text-primary font-mono text-[10px] uppercase tracking-wider transition-colors min-h-[44px]"
                                >
                                    → view
                                </button>

                                {deletingId === p.id ? (
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-[10px] text-accent-red uppercase tracking-widest">delete?</span>
                                        <button
                                            onClick={() => handleDelete(p.id)}
                                            className="text-accent-red hover:text-accent-red/80 font-mono text-[10px] uppercase tracking-wider transition-colors min-h-[44px]"
                                        >
                                            confirm
                                        </button>
                                        <button
                                            onClick={() => setDeletingId(null)}
                                            className="text-text-secondary hover:text-text-primary font-mono text-[10px] uppercase tracking-wider transition-colors min-h-[44px]"
                                        >
                                            cancel
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setDeletingId(p.id)}
                                        className="text-text-secondary hover:text-accent-red font-mono text-[10px] uppercase tracking-wider transition-colors min-h-[44px]"
                                    >
                                        ● delete
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
