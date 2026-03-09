import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, Phone, Mail, Globe, MapPin, ExternalLink, Star, Trash2, RefreshCw, StickyNote } from 'lucide-react';
import { logContact, deleteProvider, saveProviderOneSheet } from '../lib/queries';
import { generateOneSheet } from '../lib/ai';
import { OneSheetOutput } from '../components/OneSheetOutput';
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

    // One-sheet state (must be before early returns per Rules of Hooks)
    const [oneSheetContent, setOneSheetContent] = useState<string | null>(null);
    const [oneSheetLoading, setOneSheetLoading] = useState(false);
    const [oneSheetError, setOneSheetError] = useState<string | null>(null);
    const [oneSheetCopied, setOneSheetCopied] = useState(false);
    const [showOneSheet, setShowOneSheet] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<any>(null);
    const [saveLoading, setSaveLoading] = useState(false);

    const handleEditToggle = () => {
        if (!isEditing) setEditForm({ ...provider });
        setIsEditing(!isEditing);
    };

    const handleSave = async () => {
        setSaveLoading(true);
        try {
            const payload = {
                business_name: editForm.business_name,
                name: editForm.name,
                niche: editForm.niche,
                tier: editForm.tier,
                stage: editForm.stage,
                phone: editForm.phone,
                email: editForm.email,
                address: editForm.address,
                current_website_url: editForm.current_website_url,
                google_business_url: editForm.google_business_url,
                review_score: editForm.review_score ? parseFloat(editForm.review_score) : null,
                review_count: editForm.review_count ? parseInt(editForm.review_count, 10) : null,
                quality_score: editForm.quality_score ? parseInt(editForm.quality_score, 10) : null,
                website_status: editForm.website_status,
                notes: editForm.notes,
                is_franchise: editForm.is_franchise,
                is_disqualified: editForm.is_disqualified
            };
            const { error: err } = await supabase.from('providers').update(payload).eq('id', providerId);
            if (err) throw err;
            setProvider((prev: any) => ({ ...prev, ...payload }));
            setIsEditing(false);
        } catch (err) {
            console.error(err);
            setError('Failed to save changes.');
        } finally {
            setSaveLoading(false);
        }
    };

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

    // Sync one-sheet content from provider data after load
    useEffect(() => {
        if (provider?.one_sheet) {
            setOneSheetContent(provider.one_sheet);
        }
    }, [provider?.one_sheet]);

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
        prospect: 'text-accent-yellow border-accent-yellow/30',
        contacted: 'text-accent-blue border-accent-blue/30',
        negotiating: 'text-accent-purple border-accent-purple/30',
        active: 'text-accent-green border-accent-green/30',
        bench: 'text-text-secondary border-border-subtle',
    };

    const canGenerate = provider.stage === 'active' || provider.stage === 'bench';


    const handleGenerateOneSheet = async () => {
        setShowOneSheet(true);
        setOneSheetLoading(true);
        setOneSheetError(null);
        try {
            const template = provider.stage === 'bench' ? 'overflow_pitch' : 'provider_profile';
            const result = await generateOneSheet({
                template: template as any,
                provider,
                territory: territory?.name,
                openBuyerCount: template === 'overflow_pitch' ? 0 : undefined,
            });
            setOneSheetContent(result);
            await saveProviderOneSheet(provider.id, result);
        } catch (err: any) {
            setOneSheetError(err?.message || 'Failed to generate one-sheet');
        } finally {
            setOneSheetLoading(false);
        }
    };

    const handleCopyOneSheet = async () => {
        if (!oneSheetContent) return;
        try {
            await navigator.clipboard.writeText(oneSheetContent);
            setOneSheetCopied(true);
            setTimeout(() => setOneSheetCopied(false), 2000);
        } catch { console.error('Copy failed'); }
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
            <header className="mb-8 md:mb-12 relative">
                <div className="absolute right-0 top-0 flex gap-2">
                    {isEditing ? (
                        <>
                            <button onClick={handleEditToggle} className="px-4 py-1.5 font-mono text-[10px] uppercase font-bold rounded-full text-text-muted hover:text-text-primary transition-colors hover:bg-bg-surface h-[32px] flex items-center justify-center">
                                Cancel
                            </button>
                            <button onClick={handleSave} disabled={saveLoading} className="px-4 py-1.5 bg-accent-green text-bg-base font-mono text-[10px] uppercase font-bold rounded-full hover:bg-accent-green/90 transition-colors disabled:opacity-50 h-[32px] flex items-center justify-center">
                                {saveLoading ? 'Saving...' : 'Save'}
                            </button>
                        </>
                    ) : (
                        <button onClick={handleEditToggle} className="px-4 py-1.5 bg-bg-surface border border-border-subtle text-text-primary hover:border-border-active transition-colors font-mono text-[10px] uppercase font-bold rounded-full h-[32px] flex items-center justify-center">
                            Edit
                        </button>
                    )}
                </div>

                <div className="pr-[140px] md:pr-[180px]">
                    {isEditing ? (
                        <input
                            value={editForm.business_name || editForm.name || ''}
                            onChange={e => setEditForm({ ...editForm, business_name: e.target.value })}
                            className="bg-bg-card border border-border-subtle rounded px-3 py-1.5 w-full text-3xl md:text-5xl mb-2 text-text-primary focus:outline-none focus:border-border-active"
                            placeholder="Business Name"
                        />
                    ) : (
                        <h2 className="text-3xl md:text-6xl mb-2">{provider.business_name || provider.name}</h2>
                    )}

                    {isEditing ? (
                        <input
                            value={editForm.name || ''}
                            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                            className="bg-bg-card border border-border-subtle rounded px-3 py-1.5 w-full text-lg mb-3 text-text-secondary focus:outline-none focus:border-border-active"
                            placeholder="Owner/Contact Name"
                        />
                    ) : (
                        provider.business_name && provider.name !== provider.business_name && (
                            <p className="text-text-secondary text-lg mb-3">{provider.name}</p>
                        )
                    )}

                    <div className="flex flex-wrap items-center gap-2 mt-2">
                        {isEditing ? (
                            <>
                                <input
                                    value={editForm.niche || ''}
                                    onChange={e => setEditForm({ ...editForm, niche: e.target.value })}
                                    placeholder="Niche"
                                    className="bg-bg-surface border border-border-subtle rounded px-2 py-1 font-mono text-[10px] uppercase text-accent-green focus:outline-none focus:border-border-active w-32"
                                />
                                <input
                                    value={editForm.tier || ''}
                                    onChange={e => setEditForm({ ...editForm, tier: e.target.value })}
                                    placeholder="Tier"
                                    className="bg-bg-surface border border-border-subtle rounded px-2 py-1 font-mono text-[10px] uppercase text-accent-blue focus:outline-none focus:border-border-active w-24"
                                />
                                <select
                                    value={editForm.stage || 'prospect'}
                                    onChange={e => setEditForm({ ...editForm, stage: e.target.value })}
                                    className="bg-bg-surface border border-border-subtle rounded px-2 py-1 font-mono text-[10px] uppercase text-text-primary focus:outline-none focus:border-border-active"
                                >
                                    <option value="prospect">Prospect</option>
                                    <option value="contacted">Contacted</option>
                                    <option value="negotiating">Negotiating</option>
                                    <option value="active">Active</option>
                                    <option value="bench">Bench</option>
                                </select>
                                <label className="flex items-center gap-1 font-mono text-[10px] uppercase text-accent-purple border border-border-subtle rounded px-2 py-1 bg-bg-surface">
                                    <input type="checkbox" checked={editForm.is_franchise || false} onChange={e => setEditForm({ ...editForm, is_franchise: e.target.checked })} className="accent-accent-purple" />
                                    Franchise
                                </label>
                                <label className="flex items-center gap-1 font-mono text-[10px] uppercase text-accent-red border border-border-subtle rounded px-2 py-1 bg-bg-surface">
                                    <input type="checkbox" checked={editForm.is_disqualified || false} onChange={e => setEditForm({ ...editForm, is_disqualified: e.target.checked })} className="accent-accent-red" />
                                    Disqualified
                                </label>
                            </>
                        ) : (
                            <>
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
                            </>
                        )}
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Contact & Info */}
                <div className="space-y-6">
                    {/* Contact info */}
                    <div className="bg-bg-card border border-border-subtle rounded-xl p-5 space-y-4">
                        <h5 className="font-mono text-[10px] text-text-muted uppercase tracking-widest">Contact</h5>

                        {isEditing ? (
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <Phone size={14} className="shrink-0 text-text-muted" />
                                    <input
                                        type="tel"
                                        value={editForm.phone || ''}
                                        onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                                        placeholder="Phone number"
                                        className="bg-bg-surface border border-border-subtle rounded px-3 py-1.5 w-full text-sm focus:outline-none focus:border-border-active"
                                    />
                                </div>
                                <div className="flex items-center gap-3">
                                    <Mail size={14} className="shrink-0 text-text-muted" />
                                    <input
                                        type="email"
                                        value={editForm.email || ''}
                                        onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                        placeholder="Email address"
                                        className="bg-bg-surface border border-border-subtle rounded px-3 py-1.5 w-full text-sm focus:outline-none focus:border-border-active"
                                    />
                                </div>
                                <div className="flex items-center gap-3">
                                    <MapPin size={14} className="shrink-0 text-text-muted" />
                                    <input
                                        type="text"
                                        value={editForm.address || ''}
                                        onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                                        placeholder="Address"
                                        className="bg-bg-surface border border-border-subtle rounded px-3 py-1.5 w-full text-sm focus:outline-none focus:border-border-active"
                                    />
                                </div>
                                <div className="flex items-center gap-3">
                                    <Globe size={14} className="shrink-0 text-text-muted" />
                                    <input
                                        type="url"
                                        value={editForm.current_website_url || ''}
                                        onChange={e => setEditForm({ ...editForm, current_website_url: e.target.value })}
                                        placeholder="Website URL"
                                        className="bg-bg-surface border border-border-subtle rounded px-3 py-1.5 w-full text-sm focus:outline-none focus:border-border-active"
                                    />
                                </div>
                                <div className="flex items-center gap-3">
                                    <MapPin size={14} className="shrink-0 text-text-muted" />
                                    <input
                                        type="url"
                                        value={editForm.google_business_url || ''}
                                        onChange={e => setEditForm({ ...editForm, google_business_url: e.target.value })}
                                        placeholder="Google Business URL"
                                        className="bg-bg-surface border border-border-subtle rounded px-3 py-1.5 w-full text-sm focus:outline-none focus:border-border-active"
                                    />
                                </div>
                            </div>
                        ) : (
                            <>
                                {provider.phone && (
                                    <a href={`tel:${provider.phone}`} className="flex items-center gap-3 text-sm text-text-secondary hover:text-accent-green transition-colors">
                                        <Phone size={14} className="shrink-0 text-text-muted" />
                                        <span>{provider.phone}</span>
                                    </a>
                                )}

                                {provider.email && (
                                    <a href={`mailto:${provider.email}`} className="flex items-center gap-3 text-sm text-text-secondary hover:text-accent-blue transition-colors">
                                        <Mail size={14} className="shrink-0 text-text-muted" />
                                        <span>{provider.email}</span>
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
                            </>
                        )}
                    </div>

                    {/* Reviews & Quality */}
                    <div className="bg-bg-card border border-border-subtle rounded-xl p-5 space-y-4">
                        <h5 className="font-mono text-[10px] text-text-muted uppercase tracking-widest">Reviews & Quality</h5>

                        {isEditing ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="font-mono text-[10px] text-text-muted uppercase block mb-1">Review Score</label>
                                        <input
                                            type="number" step="0.1" min="0" max="5"
                                            value={editForm.review_score || ''}
                                            onChange={e => setEditForm({ ...editForm, review_score: e.target.value })}
                                            className="bg-bg-surface border border-border-subtle rounded px-3 py-1.5 w-full text-sm focus:outline-none focus:border-border-active"
                                        />
                                    </div>
                                    <div>
                                        <label className="font-mono text-[10px] text-text-muted uppercase block mb-1">Review Count</label>
                                        <input
                                            type="number" min="0"
                                            value={editForm.review_count || ''}
                                            onChange={e => setEditForm({ ...editForm, review_count: e.target.value })}
                                            className="bg-bg-surface border border-border-subtle rounded px-3 py-1.5 w-full text-sm focus:outline-none focus:border-border-active"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="font-mono text-[10px] text-text-muted uppercase block mb-1">Quality Score (1-5)</label>
                                        <input
                                            type="number" min="1" max="5"
                                            value={editForm.quality_score || ''}
                                            onChange={e => setEditForm({ ...editForm, quality_score: e.target.value })}
                                            className="bg-bg-surface border border-border-subtle rounded px-3 py-1.5 w-full text-sm focus:outline-none focus:border-border-active"
                                        />
                                    </div>
                                    <div>
                                        <label className="font-mono text-[10px] text-text-muted uppercase block mb-1">Website Status</label>
                                        <select
                                            value={editForm.website_status || ''}
                                            onChange={e => setEditForm({ ...editForm, website_status: e.target.value })}
                                            className="bg-bg-surface border border-border-subtle rounded px-3 py-1.5 w-full text-sm focus:outline-none focus:border-border-active"
                                        >
                                            <option value="">Unknown</option>
                                            <option value="ok">OK</option>
                                            <option value="good">Good</option>
                                            <option value="terrible">Terrible</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
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
                            </>
                        )}
                    </div>

                    {/* Notes */}
                    {(provider.notes || isEditing) && (
                        <div className="bg-bg-card border border-border-subtle rounded-xl p-5 space-y-2">
                            <h5 className="font-mono text-[10px] text-text-muted uppercase tracking-widest flex items-center gap-2">
                                <StickyNote size={12} /> Notes
                            </h5>
                            {isEditing ? (
                                <textarea
                                    value={editForm.notes || ''}
                                    onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                                    placeholder="Add notes..."
                                    className="bg-bg-surface border border-border-subtle rounded px-3 py-2 w-full text-sm min-h-[100px] focus:outline-none focus:border-border-active"
                                />
                            ) : (
                                <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{provider.notes}</p>
                            )}
                        </div>
                    )}
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

                        {/* One-Sheet Button */}
                        {canGenerate ? (
                            <button
                                onClick={oneSheetContent && !showOneSheet
                                    ? () => setShowOneSheet(true)
                                    : handleGenerateOneSheet
                                }
                                className="w-full py-3 bg-bg-card border border-border-subtle text-text-secondary font-mono text-[10px] uppercase tracking-widest rounded-xl hover:border-accent-green/30 hover:text-accent-green transition-colors"
                            >
                                {oneSheetContent ? '● View One-Sheet' : '● Generate One-Sheet'}
                            </button>
                        ) : (
                            <div className="relative group">
                                <button
                                    disabled
                                    className="w-full py-3 bg-bg-card border border-border-subtle text-text-muted font-mono text-[10px] uppercase tracking-widest rounded-xl cursor-not-allowed opacity-50"
                                >
                                    ● One-Sheet
                                </button>
                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-bg-card border border-border-subtle rounded-lg text-text-muted font-mono text-[9px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    available once active or bench
                                </span>
                            </div>
                        )}

                        {showOneSheet && (
                            <OneSheetOutput
                                content={oneSheetContent}
                                loading={oneSheetLoading}
                                error={oneSheetError}
                                copied={oneSheetCopied}
                                onRegenerate={handleGenerateOneSheet}
                                onCopy={handleCopyOneSheet}
                            />
                        )}

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
