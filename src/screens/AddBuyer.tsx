import React, { useState, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import { getTerritories } from '../lib/queries';
import { supabase } from '../lib/supabase';

interface AddBuyerProps {
    navigate: (screen: string, context?: any) => void;
    defaultTerritoryId?: string;
}

const PROPERTY_TYPES = ['HOA', 'Property Manager', 'Landlord'];
const STAGES = ['prospect', 'negotiating', 'active', 'onboarded', 'churned'];
const NICHES = ['Handyman', 'HVAC', 'Plumber', 'Cleaner', 'Electrician'];

export const AddBuyer: React.FC<AddBuyerProps> = ({ navigate, defaultTerritoryId }) => {
    const [territories, setTerritories] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState({
        org_name: '',
        contact_name: '',
        property_type: PROPERTY_TYPES[0],
        units: '',
        phone: '',
        email: '',
        stage: 'prospect',
        territory_id: defaultTerritoryId || '',
    });

    const [selectedNeeds, setSelectedNeeds] = useState<string[]>([]);

    useEffect(() => {
        getTerritories().then(t => {
            setTerritories(t || []);
            if (!form.territory_id && t?.length) {
                setForm(prev => ({ ...prev, territory_id: t[0].id }));
            }
        });
    }, []);

    const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

    const toggleNeed = (niche: string) => {
        setSelectedNeeds(prev =>
            prev.includes(niche) ? prev.filter(n => n !== niche) : [...prev, niche]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.org_name.trim()) return;
        setSaving(true);
        setError(null);
        try {
            const record: Record<string, any> = { org_name: form.org_name.trim() };
            if (form.contact_name) record.contact_name = form.contact_name;
            if (form.property_type) record.property_type = form.property_type;
            if (form.units) record.units = parseInt(form.units, 10);
            if (form.phone) record.phone = form.phone;
            if (form.email) record.email = form.email;
            if (form.stage) record.stage = form.stage;
            if (form.territory_id) record.territory_id = form.territory_id;

            const { data, error: err } = await supabase.from('buyers').insert(record).select().single();
            if (err) throw err;

            // Create buyer_needs
            if (selectedNeeds.length > 0 && data) {
                const needs = selectedNeeds.map(niche => ({
                    buyer_id: data.id,
                    niche: niche.toLowerCase(),
                    filled: false,
                }));
                const { error: needsErr } = await supabase.from('buyer_needs').insert(needs);
                if (needsErr) console.error('Failed to create needs:', needsErr);
            }

            navigate('TERRITORY_HEALTH');
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to create buyer.');
        } finally {
            setSaving(false);
        }
    };

    const inputClass = "w-full bg-bg-card border border-border-subtle rounded-lg px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-border-active transition-colors";
    const labelClass = "font-mono text-[10px] uppercase text-text-muted mb-1 block";

    return (
        <div className="p-4 md:p-8 max-w-2xl mx-auto">
            <button
                onClick={() => navigate('TERRITORY_HEALTH')}
                className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors mb-6"
            >
                <ChevronLeft size={16} />
                <span className="font-mono text-[10px] uppercase tracking-widest">Back</span>
            </button>

            <h2 className="text-3xl md:text-5xl mb-2">Add Buyer</h2>
            <p className="font-mono text-[10px] text-text-muted uppercase tracking-widest mb-8">New property buyer record</p>

            {error && (
                <div className="p-3 mb-6 bg-accent-red/5 border border-accent-red/20 rounded-lg">
                    <p className="text-sm text-accent-red">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className={labelClass}>Organization Name *</label>
                    <input type="text" value={form.org_name} onChange={e => update('org_name', e.target.value)} className={inputClass} placeholder="Organization name" required />
                </div>

                <div>
                    <label className={labelClass}>Contact Name</label>
                    <input type="text" value={form.contact_name} onChange={e => update('contact_name', e.target.value)} className={inputClass} placeholder="Primary contact" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Property Type</label>
                        <select value={form.property_type} onChange={e => update('property_type', e.target.value)} className={inputClass}>
                            {PROPERTY_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Units</label>
                        <input type="number" value={form.units} onChange={e => update('units', e.target.value)} className={inputClass} placeholder="0" min="0" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Stage</label>
                        <select value={form.stage} onChange={e => update('stage', e.target.value)} className={inputClass}>
                            {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Territory</label>
                        <select value={form.territory_id} onChange={e => update('territory_id', e.target.value)} className={inputClass}>
                            <option value="">No territory</option>
                            {territories.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Phone</label>
                        <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} className={inputClass} placeholder="(570) 000-0000" />
                    </div>
                    <div>
                        <label className={labelClass}>Email</label>
                        <input type="email" value={form.email} onChange={e => update('email', e.target.value)} className={inputClass} placeholder="email@example.com" />
                    </div>
                </div>

                {/* Needs checkboxes */}
                <div>
                    <label className={labelClass}>Service Needs</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
                        {NICHES.map(niche => {
                            const selected = selectedNeeds.includes(niche);
                            return (
                                <button
                                    key={niche}
                                    type="button"
                                    onClick={() => toggleNeed(niche)}
                                    className={`px-4 py-2.5 rounded-lg font-mono text-[10px] uppercase tracking-wider transition-colors border ${selected
                                            ? 'bg-accent-green/10 border-accent-green/30 text-accent-green font-bold'
                                            : 'bg-bg-card border-border-subtle text-text-muted hover:text-text-primary hover:border-border-active'
                                        }`}
                                >
                                    {niche}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={saving || !form.org_name.trim()}
                    className="w-full bg-accent-green text-bg-base font-mono text-[10px] uppercase font-bold rounded-full py-3 tracking-widest hover:bg-accent-green/90 transition-colors disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Create Buyer'}
                </button>
            </form>
        </div>
    );
};
