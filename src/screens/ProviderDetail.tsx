import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, Phone, Globe, MapPin, ExternalLink, Star, Trash2, RefreshCw } from 'lucide-react';
import { logContact, deleteProvider } from '../lib/queries';
import { supabase } from '../lib/supabase';

interface ProviderDetailProps {
    providerId: string;
    navigate: (screen: string, context?: any) => void;
}

function isOverdue(lastContact: string | null | undefined): boolean {
    if (!lastContact) return true;
    return Date.now() - new Date(lastContact).getTime() > 14 * 24 * 60 * 60 * 1000;
}

export const ProviderDetail: React.FC<ProviderDetailProps> = ({ providerId, navigate }) => {
    const [provider, setProvider] = useState<any>(null);
    const [territory, setTerritory] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [contactLoading, setContactLoading] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: err } = await supabase.from('providers').select('*').eq('id', providerId).single();
            if (err) throw err;
            setProvider(data);

            if (data?.territory_id) {
                const { data: t } = await supabase.from('territories').select('id, name').eq('id', data.territory_id).single();
                setTerritory(t);
            }
        } catch (err) {
            console.error(err);
            setError("Couldn't load provider.");
        } finally {
            setLoading(false);
        }
    }, [providerId]);

    useEffect(() => { load(); }, [load]);

    const handleLogContact = async () => {
        setContactLoading(true);
        try {
            await logContact(providerId, 'provider');
            setProvider((prev: any) => ({ ...prev, last_contact: new Date().toISOString() }));
        } catch (err) {
            console.error(err);
        } finally {
            setContactLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            await deleteProvider(providerId);
            navigate('TERRITORY_HEALTH');
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return (
        <div className="p-4 md:p-8 max-w-3xl mx-auto">
            <div className="animate-pulse space-y-6">
                <div className="h-6 w-40 bg-border-subtle rounded" />
                <div className="h-12 w-3/4 bg-border-subtle rounded" />
                <div className="h-4 w-1/2 bg-border-subtle rounded" />
            </div>
        </div>
    );

    if (error) return (
        <div className="p-4 md:p-8 max-w-3xl mx-auto">
            <div className="flex items-center justify-between p-4 bg-accent-red/5 border border-accent-red/20 rounded-xl">
                <p className="text-sm text-accent-red">{error}</p>
                <button onClick={load} className="flex items-center gap-2 px-4 py-1.5 bg-accent-red/10 text-accent-red font-mono text-[10px] uppercase tracking-wider rounded-full hover:bg-accent-red/20 transition-colors">
                    <RefreshCw size={12} /> Retry
                </button>
            </div>
        </div>
    );

    if (!provider) return null;

    const overdue = isOverdue(provider.last_contact);

    const stageColor: Record<string, string> = {
        active: 'text-accent-green border-accent-green/30',
        research: 'text-accent-blue border-accent-blue/30',
        trial: 'text-accent-yellow border-accent-yellow/30',
        paused: 'text-text-muted border-border-subtle',
    };

    const websiteColor: Record<string, string> = {
        terrible: 'text-accent-red bg-accent-red/5',
        good: 'text-accent-green bg-accent-green/5',
        ok: 'text-text-muted bg-bg-surface',
    };

    return (
        <div className="p-4 md:p-8 max-w-3xl mx-auto">
            {/* Back button */}
            <button
                onClick={() => navigate('TERRITORY_HEALTH')}
                className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors mb-6"
            >
                <ChevronLeft size={16} />
                <span className="font-mono text-[10px] uppercase tracking-widest">Back to Health</span>
            </button>

            {/* Header */}
            <header className="mb-8 md:mb-12">
                <h2 className="text-3xl md:text-6xl mb-2">{provider.business_name || provider.name}</h2>
                {provider.business_name && provider.name !== provider.business_name && (
                    <p className="text-text-secondary text-lg mb-3">{provider.name}</p>
                )}
                <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[10px] text-accent-green uppercase border border-accent-green/30 px-2 py-0.5 rounded">
                        {provider.niche}
                    </span>
                    {provider.tier && (
                        <span className="font-mono text-[10px] text-accent-blue uppercase border border-accent-blue/30 px-2 py-0.5 rounded">
                            {provider.tier}
                        </span>
                    )}
                    <span className={`font-mono text-[10px] uppercase border px-2 py-0.5 rounded ${stageColor[provider.stage] || 'text-text-muted border-border-subtle'}`}>
                        {provider.stage}
                    </span>
                    {provider.is_franchise && (
                        <span className="font-mono text-[10px] text-accent-purple uppercase border border-accent-purple/30 px-2 py-0.5 rounded">Franchise</span>
                    )}
                    {provider.is_disqualified && (
                        <span className="font-mono text-[10px] text-accent-red uppercase border border-accent-red/30 px-2 py-0.5 rounded">Disqualified</span>
                    )}
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Contact & Info */}
                <div className="space-y-6">
                    {/* Contact info */}
                    <div className="bg-bg-card border border-border-subtle rounded-xl p-5 space-y-4">
                        <h5 className="font-mono text-[10px] text-text-muted uppercase tracking-widest">Contact</h5>

                        {provider.phone && (
                            <a href={`tel:${provider.phone}`} className="flex items-center gap-3 text-sm text-text-secondary hover:text-accent-green transition-colors">
                                <Phone size={14} className="shrink-0 text-text-muted" />
                                <span>{provider.phone}</span>
                            </a>
                        )}

                        {provider.address && (
                            <div className="flex items-center gap-3 text-sm text-text-secondary">
                                <MapPin size={14} className="shrink-0 text-text-muted" />
                                <span>{provider.address}</span>
                            </div>
                        )}

                        {provider.current_website_url && (
                            <a
                                href={provider.current_website_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 text-sm text-text-secondary hover:text-accent-blue transition-colors"
                            >
                                <Globe size={14} className="shrink-0 text-text-muted" />
                                <span className="truncate">{provider.current_website_url.replace(/^https?:\/\//, '')}</span>
                                <ExternalLink size={10} className="shrink-0 text-text-muted" />
                            </a>
                        )}

                        {provider.google_business_url && (
                            <a
                                href={provider.google_business_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 text-sm text-text-secondary hover:text-accent-blue transition-colors"
                            >
                                <MapPin size={14} className="shrink-0 text-text-muted" />
                                <span>Google Business Profile</span>
                                <ExternalLink size={10} className="shrink-0 text-text-muted" />
                            </a>
                        )}
                    </div>

                    {/* Reviews & Quality */}
                    <div className="bg-bg-card border border-border-subtle rounded-xl p-5 space-y-4">
                        <h5 className="font-mono text-[10px] text-text-muted uppercase tracking-widest">Reviews & Quality</h5>

                        {provider.review_score != null && (
                            <div className="flex items-center gap-3">
                                <Star size={16} className="text-accent-yellow fill-accent-yellow" />
                                <span className="text-2xl font-semibold">{provider.review_score}</span>
                                {provider.review_count != null && (
                                    <span className="font-mono text-[10px] text-text-muted">({provider.review_count} reviews)</span>
                                )}
                            </div>
                        )}

                        {provider.quality_score != null && (
                            <div>
                                <span className="font-mono text-[10px] text-text-muted uppercase block mb-1">Quality Score</span>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} className={`w-3 h-3 rounded-full ${i <= provider.quality_score ? 'bg-accent-green' : 'bg-border-subtle'}`} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {provider.website_status && (
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] text-text-muted uppercase">Website:</span>
                                <span className={`font-mono text-[10px] uppercase px-2 py-0.5 rounded ${websiteColor[provider.website_status] || 'text-text-muted bg-bg-surface'}`}>
                                    {provider.website_status}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Status & Actions */}
                <div className="space-y-6">
                    {/* Territory & Activity */}
                    <div className="bg-bg-card border border-border-subtle rounded-xl p-5 space-y-4">
                        <h5 className="font-mono text-[10px] text-text-muted uppercase tracking-widest">Activity</h5>

                        {territory && (
                            <div>
                                <span className="font-mono text-[10px] text-text-muted uppercase block mb-1">Territory</span>
                                <button
                                    onClick={() => navigate('TERRITORY_DETAIL', { territoryId: territory.id })}
                                    className="text-sm text-accent-blue hover:underline"
                                >
                                    {territory.name}
                                </button>
                            </div>
                        )}

                        <div>
                            <span className="font-mono text-[10px] text-text-muted uppercase block mb-1">Last Contact</span>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-text-secondary">
                                    {provider.last_contact ? new Date(provider.last_contact).toLocaleDateString() : 'Never'}
                                </span>
                                {overdue && (
                                    <span className="font-mono text-[10px] text-accent-red uppercase">Overdue</span>
                                )}
                            </div>
                        </div>

                        <div>
                            <span className="font-mono text-[10px] text-text-muted uppercase block mb-1">Added</span>
                            <span className="text-sm text-text-secondary">
                                {provider.created_at ? new Date(provider.created_at).toLocaleDateString() : 'Unknown'}
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                        <button
                            onClick={handleLogContact}
                            disabled={contactLoading}
                            className="w-full py-3 bg-accent-green text-bg-base font-mono text-[10px] uppercase font-bold tracking-widest rounded-xl hover:bg-accent-green/90 transition-colors disabled:opacity-50"
                        >
                            {contactLoading ? 'Logging...' : 'Log Contact'}
                        </button>

                        {!confirmingDelete ? (
                            <button
                                onClick={() => setConfirmingDelete(true)}
                                className="w-full py-3 bg-bg-card border border-border-subtle text-text-muted font-mono text-[10px] uppercase tracking-widest rounded-xl hover:border-accent-red/30 hover:text-accent-red transition-colors flex items-center justify-center gap-2"
                            >
                                <Trash2 size={12} />
                                Delete Provider
                            </button>
                        ) : (
                            <div className="flex items-center gap-3 p-3 bg-accent-red/5 border border-accent-red/20 rounded-xl">
                                <span className="font-mono text-[10px] text-accent-red uppercase tracking-wider">Delete?</span>
                                <button
                                    onClick={handleDelete}
                                    className="px-4 py-1.5 bg-accent-red text-white font-mono text-[10px] uppercase tracking-wider rounded-full hover:bg-accent-red/80 transition-colors"
                                >
                                    Confirm
                                </button>
                                <button
                                    onClick={() => setConfirmingDelete(false)}
                                    className="font-mono text-[10px] text-text-muted uppercase tracking-wider hover:text-text-primary transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
