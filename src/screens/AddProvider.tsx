import React, { useState, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import { getTerritories } from '../lib/queries';
import { supabase } from '../lib/supabase';

interface AddProviderProps {
    navigate: (screen: string, context?: any) => void;
    defaultTerritoryId?: string;
}

const NICHES = ['Handyman', 'HVAC', 'Plumber', 'Cleaner', 'Electrician'];
const STAGES = ['research', 'outreach', 'trial', 'active', 'paused'];

export const AddProvider: React.FC<AddProviderProps> = ({ navigate, defaultTerritoryId }) => {
    const [territories, setTerritories] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState({
        name: '',
        business_name: '',
        niche: NICHES[0],
        phone: '',
        email: '',
        address: '',
        current_website_url: '',
        google_business_url: '',
        stage: 'research',
        territory_id: defaultTerritoryId || '',
        notes: '',
    });

    useEffect(() => {
        getTerritories().then(t => {
            setTerritories(t || []);
            if (!form.territory_id && t?.length) {
                setForm(prev => ({ ...prev, territory_id: t[0].id }));
            }
        });
    }, []);

    const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) return;
        setSaving(true);
        setError(null);
        try {
            const record: Record<string, any> = { name: form.name.trim() };
            if (form.business_name) record.business_name = form.business_name;
            if (form.niche) record.niche = form.niche.toLowerCase();
            if (form.phone) record.phone = form.phone;
            if (form.email) record.email = form.email;
            if (form.address) record.address = form.address;
            if (form.current_website_url) record.current_website_url = form.current_website_url;
            if (form.google_business_url) record.google_business_url = form.google_business_url;
            if (form.stage) record.stage = form.stage;
            if (form.territory_id) record.territory_id = form.territory_id;

            const { error: err } = await supabase.from('providers').insert(record);
            if (err) throw err;
            navigate('TERRITORY_HEALTH');
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to create provider.');
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

            <h2 className="text-3xl md:text-5xl mb-2">Add Provider</h2>
            <p className="font-mono text-[10px] text-text-muted uppercase tracking-widest mb-8">New service provider record</p>

            {error && (
                <div className="p-3 mb-6 bg-accent-red/5 border border-accent-red/20 rounded-lg">
                    <p className="text-sm text-accent-red">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className={labelClass}>Name *</label>
                    <input type="text" value={form.name} onChange={e => update('name', e.target.value)} className={inputClass} placeholder="Contact name" required />
                </div>

                <div>
                    <label className={labelClass}>Business Name</label>
                    <input type="text" value={form.business_name} onChange={e => update('business_name', e.target.value)} className={inputClass} placeholder="Business name" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Niche</label>
                        <select value={form.niche} onChange={e => update('niche', e.target.value)} className={inputClass}>
                            {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Stage</label>
                        <select value={form.stage} onChange={e => update('stage', e.target.value)} className={inputClass}>
                            {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>

                <div>
                    <label className={labelClass}>Territory</label>
                    <select value={form.territory_id} onChange={e => update('territory_id', e.target.value)} className={inputClass}>
                        <option value="">No territory</option>
                        {territories.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
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

                <div>
                    <label className={labelClass}>Address</label>
                    <input type="text" value={form.address} onChange={e => update('address', e.target.value)} className={inputClass} placeholder="123 Main St" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Website URL</label>
                        <input type="url" value={form.current_website_url} onChange={e => update('current_website_url', e.target.value)} className={inputClass} placeholder="https://" />
                    </div>
                    <div>
                        <label className={labelClass}>Google Business URL</label>
                        <input type="url" value={form.google_business_url} onChange={e => update('google_business_url', e.target.value)} className={inputClass} placeholder="https://g.co/..." />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={saving || !form.name.trim()}
                    className="w-full bg-accent-green text-bg-base font-mono text-[10px] uppercase font-bold rounded-full py-3 tracking-widest hover:bg-accent-green/90 transition-colors disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Create Provider'}
                </button>
            </form>
        </div>
    );
};
