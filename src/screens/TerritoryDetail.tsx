import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ArrowRight, ExternalLink, Phone, Mail, RefreshCw, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Provider, Buyer } from '../types';
import { ProviderCard } from '../components/ProviderCard';

interface TerritoryDetailProps {
  territoryId: string;
  navigate: (screen: string, context?: any) => void;
}

export const TerritoryDetail: React.FC<TerritoryDetailProps> = ({ territoryId, navigate }) => {
  const [territory, setTerritory] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('MATCHES');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [unassignedProviders, setUnassignedProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tRes, pRes, bRes, uRes] = await Promise.all([
        supabase.from('territories').select('*').eq('id', territoryId).single(),
        supabase.from('providers').select('*').eq('territory_id', territoryId),
        supabase.from('buyers').select('*, buyer_needs(*)').eq('territory_id', territoryId),
        supabase.from('providers').select('*').is('territory_id', null).eq('is_disqualified', false)
      ]);

      setTerritory(tRes.data);
      setProviders(pRes.data || []);
      setBuyers(bRes.data || []);
      setUnassignedProviders(uRes.data || []);
    } catch (err) {
      console.error(err);
      setError("Couldn't load territory details. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [territoryId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="p-8 animate-pulse">Loading...</div>;
  if (error) return (
    <div className="p-8">
      <div className="flex items-center justify-between p-4 bg-accent-red/5 border border-accent-red/20 rounded-xl">
        <p className="text-sm text-accent-red">{error}</p>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-1.5 bg-accent-red/10 text-accent-red font-mono text-[10px] uppercase tracking-wider rounded-full hover:bg-accent-red/20 transition-colors"
        >
          <RefreshCw size={12} /> Retry
        </button>
      </div>
    </div>
  );

  const matches = buyers.flatMap(b =>
    (b as any).buyer_needs
      ?.filter((n: any) => !n.filled)
      .map((n: any) => {
        const provider = providers.find(p => p.niche === n.niche);
        if (provider) return { buyer: b, provider, niche: n.niche };
        return null;
      })
      .filter(Boolean)
  );

  const tabs = [
    { id: 'MATCHES', label: 'Matches', count: matches.length, color: 'text-accent-green' },
    { id: 'FOLLOW-UP', label: 'Follow-up', count: providers.length + buyers.length, color: 'text-accent-yellow' },
    { id: 'OUTREACH', label: 'Outreach', count: unassignedProviders.length, color: 'text-accent-blue' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <button
        onClick={() => navigate('TERRITORY_HEALTH')}
        className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-8 group"
      >
        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        <span className="font-mono text-[10px] uppercase tracking-widest">Back to Health</span>
      </button>

      <header className="mb-12 flex justify-between items-end">
        <div>
          <h2 className="text-6xl mb-2">{territory?.name}</h2>
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-text-secondary uppercase tracking-widest">{territory?.zone}</span>
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-accent-green" />
              <div className="w-2 h-2 rounded-full bg-accent-green" />
            </div>
          </div>
        </div>
      </header>

      <div className="flex gap-8 mb-12 border-b border-border-subtle">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-4 px-2 relative transition-all group`}
          >
            <div className="flex items-center gap-2">
              <span className={`font-mono text-[10px] uppercase tracking-widest ${activeTab === tab.id ? 'text-text-primary font-medium' : 'text-text-muted'}`}>
                {tab.label}
              </span>
              <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-bg-card border border-border-subtle ${tab.color}`}>
                {tab.count}
              </span>
            </div>
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-green"
              />
            )}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {activeTab === 'MATCHES' && (
          <>
            {matches.length > 0 ? (
              matches.map((match: any, i) => (
                <div key={i} className="grid grid-cols-[1fr,auto,1fr] gap-8 items-center bg-bg-card border border-border-subtle p-6 rounded-xl hover:bg-bg-card-hover transition-all">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="text-2xl">{match.provider.business_name || match.provider.name}</h4>
                      <span className="font-mono text-[10px] text-accent-green uppercase border border-accent-green/30 px-2 py-0.5 rounded">
                        {match.provider.niche}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-text-secondary text-xs font-mono">
                      {match.provider.review_score != null && (
                        <span className="flex items-center gap-1"><Star size={10} className="text-accent-yellow fill-accent-yellow" /> {match.provider.review_score} ({match.provider.review_count})</span>
                      )}
                      {match.provider.phone && (
                        <span className="flex items-center gap-1"><Phone size={10} /> {match.provider.phone}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full border border-accent-green flex items-center justify-center text-accent-green">
                      <ArrowRight size={20} />
                    </div>
                    <button
                      onClick={() => navigate('INTRODUCE_FLOW', { provider: match.provider, buyer: match.buyer, niche: match.niche })}
                      className="bg-accent-green text-bg-base font-mono text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-wider hover:scale-105 transition-transform"
                    >
                      Introduce
                    </button>
                  </div>

                  <div className="space-y-2 text-right">
                    <div className="flex justify-between items-start flex-row-reverse">
                      <h4 className="text-2xl">{match.buyer.org_name}</h4>
                      <span className="font-mono text-[10px] text-accent-blue uppercase border border-accent-blue/30 px-2 py-0.5 rounded">
                        {match.buyer.property_type}
                      </span>
                    </div>
                    <p className="text-text-secondary text-sm font-mono">{match.buyer.units} Units · {match.buyer.contact_name}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center border border-dashed border-border-subtle rounded-xl">
                <p className="font-mono text-xs text-text-muted uppercase tracking-widest">No active matches in this territory</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'FOLLOW-UP' && (
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <h5 className="font-mono text-[10px] text-text-secondary uppercase tracking-widest mb-4">Providers</h5>
              {providers.length > 0 ? providers.map(p => (
                <ProviderCard key={p.id} provider={p} />
              )) : (
                <div className="py-12 text-center border border-dashed border-border-subtle rounded-xl">
                  <p className="font-mono text-[10px] text-text-muted uppercase tracking-widest">No providers assigned</p>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <h5 className="font-mono text-[10px] text-text-secondary uppercase tracking-widest mb-4">Buyers</h5>
              {buyers.map(b => (
                <div key={b.id} className="bg-bg-card border border-border-subtle p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h6 className="text-xl">{b.org_name}</h6>
                    <span className="font-mono text-[10px] text-accent-blue uppercase">{b.stage}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="font-mono text-[10px] text-text-muted uppercase">Last: {b.last_contact ? new Date(b.last_contact).toLocaleDateString() : 'Never'}</span>
                    <button className="text-accent-blue hover:underline font-mono text-[10px] uppercase">Log Contact</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'OUTREACH' && (
          <>
            <p className="font-mono text-[10px] text-text-muted uppercase tracking-widest mb-6">
              {unassignedProviders.length} providers not yet assigned to a territory
            </p>
            {unassignedProviders.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {unassignedProviders.map(p => (
                  <ProviderCard key={p.id} provider={p} />
                ))}
              </div>
            ) : (
              <div className="py-20 text-center border border-dashed border-border-subtle rounded-xl">
                <p className="font-mono text-xs text-text-muted uppercase tracking-widest">All providers are assigned to territories</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
