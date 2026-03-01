import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ArrowRight, ExternalLink, Phone, Mail, RefreshCw, Star, Trash2, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { deleteProvider, deleteBuyer, logContact } from '../lib/queries';
import { Provider, Buyer } from '../types';
import { ProviderCard } from '../components/ProviderCard';

interface TerritoryDetailProps {
  territoryId: string;
  navigate: (screen: string, context?: any) => void;
}

const OVERDUE_DAYS = 14;
const isOverdue = (lastContact: string | null | undefined): boolean => {
  if (!lastContact) return true;
  const diff = Date.now() - new Date(lastContact).getTime();
  return diff > OVERDUE_DAYS * 24 * 60 * 60 * 1000;
};

// --- Mobile helper components ---
const CollapsedCard: React.FC<{
  name: string;
  subtitle: string;
  isExpanded: boolean;
  overdue?: boolean;
  onTap: () => void;
}> = ({ name, subtitle, isExpanded, overdue, onTap }) => (
  <button
    onClick={onTap}
    className="p-3 rounded-xl bg-bg-card border border-border-subtle text-left w-full transition-colors hover:bg-bg-card-hover"
  >
    <div className="flex items-center gap-1.5">
      {overdue && <span className="w-1.5 h-1.5 rounded-full bg-accent-red flex-shrink-0" />}
      <p className="text-sm truncate">{name}</p>
    </div>
    <div className="flex justify-between items-center mt-1">
      <span className="font-mono text-[10px] uppercase text-text-muted">{subtitle}</span>
      {isExpanded ? <ChevronUp size={12} className="text-text-muted" /> : <ChevronDown size={12} className="text-text-muted" />}
    </div>
  </button>
);

export const TerritoryDetail: React.FC<TerritoryDetailProps> = ({ territoryId, navigate }) => {
  const [territory, setTerritory] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('MATCHES');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [unassignedProviders, setUnassignedProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => setExpandedId(prev => prev === id ? null : id);

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

  const handleDeleteProvider = async (id: string) => {
    await deleteProvider(id);
    setProviders(prev => prev.filter(p => p.id !== id));
    setUnassignedProviders(prev => prev.filter(p => p.id !== id));
  };

  const handleDeleteBuyer = async (id: string) => {
    await deleteBuyer(id);
    setBuyers(prev => prev.filter(b => b.id !== id));
  };

  const handleLogProviderContact = async (id: string) => {
    await logContact(id, 'provider');
    const now = new Date().toISOString();
    setProviders(prev => prev.map(p => p.id === id ? { ...p, last_contact: now } : p));
    setUnassignedProviders(prev => prev.map(p => p.id === id ? { ...p, last_contact: now } : p));
  };

  const handleLogBuyerContact = async (id: string) => {
    await logContact(id, 'buyer');
    const now = new Date().toISOString();
    setBuyers(prev => prev.map(b => b.id === id ? { ...b, last_contact: now } : b));
  };

  if (loading) return <div className="p-4 md:p-8 animate-pulse">Loading...</div>;
  if (error) return (
    <div className="p-4 md:p-8">
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

  const overdueProviders = providers.filter(p => isOverdue(p.last_contact));
  const overdueBuyers = buyers.filter(b => isOverdue(b.last_contact));

  const neededNiches = [...new Set(
    buyers.flatMap(b => (b as any).buyer_needs?.filter((n: any) => !n.filled).map((n: any) => n.niche) || [])
  )];
  const relevantUnassigned = unassignedProviders.filter(p => neededNiches.includes(p.niche));

  const tabs = [
    { id: 'MATCHES', label: 'Matches', count: matches.length, color: 'text-accent-green' },
    { id: 'FOLLOW-UP', label: 'Follow-up', count: overdueProviders.length + overdueBuyers.length, color: 'text-accent-yellow' },
    { id: 'OUTREACH', label: 'Outreach', count: relevantUnassigned.length, color: 'text-accent-blue' },
  ];

  // --- Render helpers for mobile expanded cards ---
  const renderExpandedMatch = (match: any) => (
    <motion.div
      key={`expanded-${match.provider.id}-${match.niche}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="col-span-2"
    >
      <div className="p-5 rounded-xl bg-bg-card border border-border-subtle">
        <div className="flex justify-between items-start mb-2">
          <h4 className="text-lg">{match.provider.business_name || match.provider.name}</h4>
          <button onClick={() => setExpandedId(null)} className="text-text-muted"><ChevronUp size={14} /></button>
        </div>
        <span className="font-mono text-[10px] text-accent-green uppercase border border-accent-green/30 px-2 py-0.5 rounded inline-block mb-3">{match.provider.niche}</span>
        <div className="flex items-center gap-3 text-text-secondary text-xs font-mono mb-3">
          {match.provider.review_score != null && (
            <span className="flex items-center gap-1"><Star size={10} className="text-accent-yellow fill-accent-yellow" /> {match.provider.review_score} ({match.provider.review_count})</span>
          )}
          {match.provider.phone && (
            <span className="flex items-center gap-1"><Phone size={10} /> {match.provider.phone}</span>
          )}
        </div>
        <button
          onClick={() => navigate('INTRODUCE_FLOW', { provider: match.provider, buyer: match.buyer, niche: match.niche })}
          className="w-full bg-accent-green text-bg-base font-mono text-[10px] font-bold py-2 rounded-full uppercase tracking-wider"
        >
          Introduce
        </button>
      </div>
      {/* Linked buyer card */}
      <div className="mt-2 p-5 rounded-xl bg-bg-card border-t-2 border-accent-green">
        <div className="flex justify-between items-start">
          <h4 className="text-lg">{match.buyer.org_name}</h4>
          <span className="font-mono text-[10px] text-accent-blue uppercase">{match.buyer.property_type}</span>
        </div>
        <p className="text-text-secondary text-sm font-mono mt-1">{match.buyer.units} Units · {match.buyer.contact_name}</p>
        <p className="font-mono text-[10px] text-text-muted mt-2">Needs: {match.niche}</p>
      </div>
    </motion.div>
  );

  const renderExpandedProvider = (p: Provider) => (
    <motion.div
      key={`expanded-${p.id}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="col-span-2"
    >
      <ProviderCard provider={p} onClick={() => navigate('PROVIDER_DETAIL', { providerId: p.id })} onDelete={handleDeleteProvider} onLogContact={handleLogProviderContact} />
    </motion.div>
  );

  const renderExpandedBuyer = (b: Buyer) => (
    <motion.div
      key={`expanded-${b.id}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="col-span-2"
    >
      <BuyerCardWithDelete buyer={b} onClick={() => navigate('BUYER_DETAIL', { buyerId: b.id })} onDelete={handleDeleteBuyer} onLogContact={handleLogBuyerContact} />
    </motion.div>
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <button
        onClick={() => navigate('TERRITORY_HEALTH')}
        className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-8 group"
      >
        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        <span className="font-mono text-[10px] uppercase tracking-widest">Back to Health</span>
      </button>

      <header className="mb-8 md:mb-12 flex justify-between items-end">
        <div>
          <h2 className="text-3xl md:text-6xl mb-2">{territory?.name}</h2>
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-text-secondary uppercase tracking-widest">{territory?.zone}</span>
            {territory?.signal && (() => {
              const color = { BUILD: 'bg-accent-green', GROW: 'bg-accent-blue', WATCH: 'bg-accent-yellow', COLD: 'bg-text-muted' }[territory.signal as string] || 'bg-text-muted';
              const textColor = { BUILD: 'text-accent-green', GROW: 'text-accent-blue', WATCH: 'text-accent-yellow', COLD: 'text-text-muted' }[territory.signal as string] || 'text-text-muted';
              return (
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${color}`} />
                  <div className={`w-2 h-2 rounded-full ${color}`} />
                  <span className={`font-mono text-[10px] uppercase ${textColor}`}>{territory.signal}</span>
                </div>
              );
            })()}
          </div>
        </div>
      </header>

      <div className="flex gap-4 md:gap-8 mb-8 md:mb-12 border-b border-border-subtle overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setExpandedId(null); }}
            className={`pb-4 px-2 relative transition-all group whitespace-nowrap`}
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
        {/* ===== MATCHES TAB ===== */}
        {activeTab === 'MATCHES' && (
          <>
            {matches.length > 0 ? (
              <>
                {/* Mobile: collapsed 2-col grid */}
                <div className="md:hidden grid grid-cols-2 gap-2">
                  {matches.map((match: any, i) => {
                    const matchId = `match-${match.provider.id}-${match.niche}`;
                    const isExpanded = expandedId === matchId;
                    return isExpanded ? renderExpandedMatch(match) : (
                      <CollapsedCard
                        key={matchId}
                        name={match.provider.business_name || match.provider.name}
                        subtitle={match.niche}
                        isExpanded={false}
                        onTap={() => toggleExpand(matchId)}
                      />
                    );
                  })}
                </div>

                {/* Desktop: full match cards */}
                <div className="hidden md:block space-y-4">
                  {matches.map((match: any, i) => (
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
                  ))}
                </div>
              </>
            ) : (
              <div className="py-20 text-center border border-dashed border-border-subtle rounded-xl">
                <p className="font-mono text-xs text-text-muted uppercase tracking-widest">No active matches in this territory</p>
              </div>
            )}
          </>
        )}

        {/* ===== FOLLOW-UP TAB ===== */}
        {activeTab === 'FOLLOW-UP' && (
          <>
            {/* Mobile: collapsed 2-col grid mixing providers and buyers */}
            <div className="md:hidden space-y-4">
              <h5 className="font-mono text-[10px] text-text-secondary uppercase tracking-widest">Providers</h5>
              <div className="grid grid-cols-2 gap-2">
                {providers.map(p => {
                  const isExpanded = expandedId === `provider-${p.id}`;
                  return isExpanded ? renderExpandedProvider(p) : (
                    <CollapsedCard
                      key={p.id}
                      name={p.business_name || p.name}
                      subtitle={p.niche || p.stage}
                      isExpanded={false}
                      overdue={isOverdue(p.last_contact)}
                      onTap={() => toggleExpand(`provider-${p.id}`)}
                    />
                  );
                })}
              </div>

              <h5 className="font-mono text-[10px] text-text-secondary uppercase tracking-widest pt-4">Buyers</h5>
              <div className="grid grid-cols-2 gap-2">
                {buyers.map(b => {
                  const isExpanded = expandedId === `buyer-${b.id}`;
                  return isExpanded ? renderExpandedBuyer(b) : (
                    <CollapsedCard
                      key={b.id}
                      name={b.org_name}
                      subtitle={b.property_type || b.stage}
                      isExpanded={false}
                      overdue={isOverdue(b.last_contact)}
                      onTap={() => toggleExpand(`buyer-${b.id}`)}
                    />
                  );
                })}
              </div>
            </div>

            {/* Desktop: existing 2-column layout */}
            <div className="hidden md:grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h5 className="font-mono text-[10px] text-text-secondary uppercase tracking-widest">Providers</h5>
                  <button onClick={() => navigate('ADD_PROVIDER', { territoryId: territory?.id })} className="flex items-center gap-1 font-mono text-[10px] text-accent-green uppercase tracking-wider hover:text-accent-green/80 transition-colors"><Plus size={12} /> Add</button>
                </div>
                {providers.length > 0 ? providers.map(p => (
                  <ProviderCard key={p.id} provider={p} onClick={() => navigate('PROVIDER_DETAIL', { providerId: p.id })} onDelete={handleDeleteProvider} onLogContact={handleLogProviderContact} />
                )) : (
                  <div className="py-12 text-center border border-dashed border-border-subtle rounded-xl">
                    <p className="font-mono text-[10px] text-text-muted uppercase tracking-widest">No providers assigned</p>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h5 className="font-mono text-[10px] text-text-secondary uppercase tracking-widest">Buyers</h5>
                  <button onClick={() => navigate('ADD_BUYER', { territoryId: territory?.id })} className="flex items-center gap-1 font-mono text-[10px] text-accent-green uppercase tracking-wider hover:text-accent-green/80 transition-colors"><Plus size={12} /> Add</button>
                </div>
                {buyers.map(b => (
                  <BuyerCardWithDelete key={b.id} buyer={b} onClick={() => navigate('BUYER_DETAIL', { buyerId: b.id })} onDelete={handleDeleteBuyer} onLogContact={handleLogBuyerContact} />
                ))}
              </div>
            </div>
          </>
        )}

        {/* ===== OUTREACH TAB ===== */}
        {activeTab === 'OUTREACH' && (
          <>
            <p className="font-mono text-[10px] text-text-muted uppercase tracking-widest mb-6">
              {relevantUnassigned.length} unassigned providers match open needs in this territory
            </p>

            {relevantUnassigned.length > 0 ? (
              <>
                {/* Mobile: collapsed 2-col grid */}
                <div className="md:hidden grid grid-cols-2 gap-2">
                  {relevantUnassigned.map(p => {
                    const isExpanded = expandedId === `outreach-${p.id}`;
                    return isExpanded ? (
                      <motion.div key={`expanded-${p.id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-2">
                        <ProviderCard provider={p} onClick={() => navigate('PROVIDER_DETAIL', { providerId: p.id })} onDelete={handleDeleteProvider} onLogContact={handleLogProviderContact} />
                      </motion.div>
                    ) : (
                      <CollapsedCard
                        key={p.id}
                        name={p.business_name || p.name}
                        subtitle={p.niche || 'unknown'}
                        isExpanded={false}
                        onTap={() => toggleExpand(`outreach-${p.id}`)}
                      />
                    );
                  })}
                </div>

                {/* Desktop */}
                <div className="hidden md:grid grid-cols-2 gap-4">
                  {relevantUnassigned.map(p => (
                    <ProviderCard key={p.id} provider={p} onClick={() => navigate('PROVIDER_DETAIL', { providerId: p.id })} onDelete={handleDeleteProvider} onLogContact={handleLogProviderContact} />
                  ))}
                </div>
              </>
            ) : (
              <div className="py-20 text-center border border-dashed border-border-subtle rounded-xl">
                <p className="font-mono text-xs text-text-muted uppercase tracking-widest">No unassigned providers match this territory's needs</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Inline buyer card with delete confirmation
const BuyerCardWithDelete: React.FC<{ buyer: Buyer; onDelete: (id: string) => void; onLogContact: (id: string) => void; onClick?: () => void }> = ({ buyer, onDelete, onLogContact, onClick }) => {
  const [confirming, setConfirming] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  return (
    <div onClick={onClick} className="bg-bg-card border border-border-subtle p-4 rounded-lg group hover:bg-bg-card-hover hover:border-border-hover transition-all cursor-pointer">
      <div className="flex justify-between items-start mb-2">
        <h6 className="text-xl">{buyer.org_name}</h6>
        <div className="flex items-center gap-2">
          {isOverdue(buyer.last_contact) && (
            <span className="font-mono text-[10px] text-accent-red uppercase">Overdue</span>
          )}
          <span className="font-mono text-[10px] text-accent-blue uppercase">{buyer.stage}</span>
          {!confirming && (
            <button
              onClick={(e) => { e.stopPropagation(); setConfirming(true); }}
              className="text-text-muted hover:text-accent-red transition-colors p-1 opacity-0 group-hover:opacity-100"
              title="Delete buyer"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
      {confirming && (
        <div className="flex items-center gap-3 mb-2 p-2 bg-accent-red/5 border border-accent-red/20 rounded-lg">
          <span className="font-mono text-[10px] text-accent-red uppercase tracking-wider">Delete?</span>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(buyer.id); }}
            className="px-3 py-1 bg-accent-red text-white font-mono text-[10px] uppercase tracking-wider rounded-full hover:bg-accent-red/80 transition-colors"
          >
            Confirm
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setConfirming(false); }}
            className="font-mono text-[10px] text-text-muted uppercase tracking-wider hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
      <div className="flex justify-between items-end">
        <span className="font-mono text-[10px] text-text-muted uppercase">Last: {buyer.last_contact ? new Date(buyer.last_contact).toLocaleDateString() : 'Never'}</span>
        <button
          onClick={async (e) => {
            e.stopPropagation();
            try {
              setContactError(null);
              await onLogContact(buyer.id);
            } catch {
              setContactError('Failed to log');
            }
          }}
          className="text-accent-blue hover:underline font-mono text-[10px] uppercase"
        >Log Contact</button>
      </div>
      {contactError && (
        <div className="mt-1">
          <span className="font-mono text-[10px] text-accent-red">{contactError}</span>
        </div>
      )}
    </div>
  );
};
