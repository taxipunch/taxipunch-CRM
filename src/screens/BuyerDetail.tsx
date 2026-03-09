import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, Phone, Mail, MapPin, Building2, RefreshCw, Trash2, Check, X, StickyNote } from 'lucide-react';
import { logContact, deleteBuyer } from '../lib/queries';
import { supabase } from '../lib/supabase';

interface BuyerDetailProps {
    buyerId: string;
    navigate: (screen: string, context?: any) => void;
}

function isOverdue(lastContact: string | null | undefined): boolean {
    if (!lastContact) return true;
    return Date.now() - new Date(lastContact).getTime() > 14 * 24 * 60 * 60 * 1000;
}

export const BuyerDetail: React.FC<BuyerDetailProps> = ({ buyerId, navigate }) => {
    const [buyer, setBuyer] = useState<any>(null);
    const [territory, setTerritory] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [contactLoading, setContactLoading] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<any>(null);
    const [saveLoading, setSaveLoading] = useState(false);

    const handleEditToggle = () => {
        if (!isEditing) setEditForm({ ...buyer });
        setIsEditing(!isEditing);
    };

    const handleSave = async () => {
        setSaveLoading(true);
        try {
            const payload = {
                org_name: editForm.org_name,
                contact_name: editForm.contact_name,
                property_type: editForm.property_type,
                units: editForm.units ? parseInt(editForm.units, 10) : null,
                phone: editForm.phone,
                email: editForm.email,
                notes: editForm.notes,
                stage: editForm.stage
            };
            const { error: err } = await supabase.from('buyers').update(payload).eq('id', buyerId);
            if (err) throw err;
            setBuyer((prev: any) => ({ ...prev, ...payload }));
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
            const { data, error: err } = await supabase
                .from('buyers')
                .select('*, buyer_needs(*)')
                .eq('id', buyerId)
                .single();
            if (err) throw err;
            setBuyer(data);

            if (data?.territory_id) {
                const { data: t } = await supabase.from('territories').select('id, name').eq('id', data.territory_id).single();
                setTerritory(t);
            }
        } catch (err) {
            console.error(err);
            setError("Couldn't load buyer.");
        } finally {
            setLoading(false);
        }
    }, [buyerId]);

    useEffect(() => { load(); }, [load]);

    const handleLogContact = async () => {
        setContactLoading(true);
        try {
            await logContact(buyerId, 'buyer');
            setBuyer((prev: any) => ({ ...prev, last_contact: new Date().toISOString() }));
        } catch (err) {
            console.error(err);
        } finally {
            setContactLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            await deleteBuyer(buyerId);
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

    if (!buyer) return null;

    const overdue = isOverdue(buyer.last_contact);
    const needs = buyer.buyer_needs || [];
    const filledCount = needs.filter((n: any) => n.filled).length;

    const stageColor: Record<string, string> = {
        prospect: 'text-accent-yellow border-accent-yellow/30',
        contacted: 'text-accent-blue border-accent-blue/30',
        interested: 'text-accent-purple border-accent-purple/30',
        active: 'text-accent-green border-accent-green/30',
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
                            value={editForm.org_name || ''}
                            onChange={e => setEditForm({ ...editForm, org_name: e.target.value })}
                            className="bg-bg-card border border-border-subtle rounded px-3 py-1.5 w-full text-3xl md:text-5xl mb-2 text-text-primary focus:outline-none focus:border-border-active"
                            placeholder="Organization Name"
                        />
                    ) : (
                        <h2 className="text-3xl md:text-6xl mb-2">{buyer.org_name}</h2>
                    )}

                    {isEditing ? (
                        <input
                            value={editForm.contact_name || ''}
                            onChange={e => setEditForm({ ...editForm, contact_name: e.target.value })}
                            className="bg-bg-card border border-border-subtle rounded px-3 py-1.5 w-full text-lg mb-3 text-text-secondary focus:outline-none focus:border-border-active"
                            placeholder="Contact Name"
                        />
                    ) : (
                        buyer.contact_name && <p className="text-text-secondary text-lg mb-3">{buyer.contact_name}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 mt-2">
                        {isEditing ? (
                            <>
                                <select
                                    value={editForm.property_type || ''}
                                    onChange={e => setEditForm({ ...editForm, property_type: e.target.value })}
                                    className="bg-bg-surface border border-border-subtle rounded px-2 py-1 font-mono text-[10px] uppercase text-text-primary focus:outline-none focus:border-border-active"
                                >
                                    <option value="">No Property Type</option>
                                    <option value="HOA">HOA</option>
                                    <option value="Property Manager">Property Manager</option>
                                    <option value="Landlord">Landlord</option>
                                </select>
                                <input
                                    type="number"
                                    value={editForm.units || ''}
                                    onChange={e => setEditForm({ ...editForm, units: e.target.value })}
                                    placeholder="Units"
                                    className="bg-bg-surface border border-border-subtle rounded px-2 py-1 font-mono text-[10px] uppercase text-text-primary focus:outline-none focus:border-border-active w-24"
                                />
                                <select
                                    value={editForm.stage || 'prospect'}
                                    onChange={e => setEditForm({ ...editForm, stage: e.target.value })}
                                    className="bg-bg-surface border border-border-subtle rounded px-2 py-1 font-mono text-[10px] uppercase text-text-primary focus:outline-none focus:border-border-active"
                                >
                                    <option value="prospect">Prospect</option>
                                    <option value="contacted">Contacted</option>
                                    <option value="interested">Interested</option>
                                    <option value="active">Active</option>
                                </select>
                            </>
                        ) : (
                            <>
                                {buyer.property_type && (
                                    <span className="font-mono text-[10px] text-accent-blue uppercase border border-accent-blue/30 px-2 py-0.5 rounded">
                                        {buyer.property_type}
                                    </span>
                                )}
                                {buyer.units != null && (
                                    <span className="font-mono text-[10px] text-accent-green uppercase border border-accent-green/30 px-2 py-0.5 rounded">
                                        {buyer.units} units
                                    </span>
                                )}
                                <span className={`font-mono text-[10px] uppercase border px-2 py-0.5 rounded ${stageColor[buyer.stage] || 'text-text-muted border-border-subtle'}`}>
                                    {buyer.stage}
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Needs */}
                <div className="space-y-6">
                    <div className="bg-bg-card border border-border-subtle rounded-xl p-5 space-y-4">
                        <div className="flex justify-between items-center">
                            <h5 className="font-mono text-[10px] text-text-muted uppercase tracking-widest">Service Needs</h5>
                            <span className="font-mono text-[10px] text-text-muted">{filledCount}/{needs.length} filled</span>
                        </div>

                        {needs.length > 0 ? (
                            <div className="space-y-2">
                                {needs.map((need: any) => (
                                    <div key={need.id} className="flex items-center justify-between p-3 bg-bg-surface border border-border-subtle rounded-lg">
                                        <div className="flex items-center gap-2">
                                            {need.filled ? (
                                                <div className="w-5 h-5 rounded-full bg-accent-green/10 flex items-center justify-center">
                                                    <Check size={12} className="text-accent-green" />
                                                </div>
                                            ) : (
                                                <div className="w-5 h-5 rounded-full bg-accent-yellow/10 flex items-center justify-center">
                                                    <X size={12} className="text-accent-yellow" />
                                                </div>
                                            )}
                                            <span className="text-sm">{need.niche}</span>
                                        </div>
                                        <span className={`font-mono text-[10px] uppercase ${need.filled ? 'text-accent-green' : 'text-accent-yellow'}`}>
                                            {need.filled ? 'Filled' : 'Open'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-8 text-center border border-dashed border-border-subtle rounded-xl">
                                <p className="font-mono text-[10px] text-text-muted uppercase tracking-widest">No needs recorded</p>
                            </div>
                        )}
                    </div>

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
                            </div>
                        ) : (
                            <>
                                {buyer.contact_name && (
                                    <div className="flex items-center gap-3 text-sm text-text-secondary">
                                        <Building2 size={14} className="shrink-0 text-text-muted" />
                                        <span>{buyer.contact_name}</span>
                                    </div>
                                )}

                                {buyer.phone && (
                                    <a href={`tel:${buyer.phone}`} className="flex items-center gap-3 text-sm text-text-secondary hover:text-accent-green transition-colors">
                                        <Phone size={14} className="shrink-0 text-text-muted" />
                                        <span>{buyer.phone}</span>
                                    </a>
                                )}

                                {buyer.email && (
                                    <a href={`mailto:${buyer.email}`} className="flex items-center gap-3 text-sm text-text-secondary hover:text-accent-blue transition-colors">
                                        <Mail size={14} className="shrink-0 text-text-muted" />
                                        <span>{buyer.email}</span>
                                    </a>
                                )}
                            </>
                        )}
                    </div>

                    {/* Notes */}
                    {(buyer.notes || isEditing) && (
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
                                <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{buyer.notes}</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Right: Activity & Actions */}
                <div className="space-y-6">
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
                                    {buyer.last_contact ? new Date(buyer.last_contact).toLocaleDateString() : 'Never'}
                                </span>
                                {overdue && (
                                    <span className="font-mono text-[10px] text-accent-red uppercase">Overdue</span>
                                )}
                            </div>
                        </div>

                        <div>
                            <span className="font-mono text-[10px] text-text-muted uppercase block mb-1">Added</span>
                            <span className="text-sm text-text-secondary">
                                {buyer.created_at ? new Date(buyer.created_at).toLocaleDateString() : 'Unknown'}
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
                                Delete Buyer
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
