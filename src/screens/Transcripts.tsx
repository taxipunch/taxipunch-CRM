import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, RefreshCw, Loader2, Upload, Sparkles, Plus } from 'lucide-react';
import { getTranscripts, updateTranscriptStatus, createTranscript } from '../lib/queries';
import { extractTranscriptFields } from '../lib/ai';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface TranscriptsProps {
    navigate: (screen: string, context?: any) => void;
}

const STATUS_COLORS: Record<string, string> = {
    pending: 'text-accent-yellow border-accent-yellow/30 bg-accent-yellow/5',
    reviewed: 'text-accent-blue border-accent-blue/30 bg-accent-blue/5',
    imported: 'text-accent-green border-accent-green/30 bg-accent-green/5',
};

const NICHES = ['Handyman', 'HVAC', 'Plumber', 'Cleaner', 'Electrician'];
const FILTERS = [
    { id: 'ALL', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'reviewed', label: 'Reviewed' },
    { id: 'imported', label: 'Imported' },
];

const FIELD_ORDER = ['name', 'business_name', 'niche', 'phone', 'email', 'address', 'notes', 'entity_type'] as const;
const FIELD_LABELS: Record<string, string> = {
    name: 'Name',
    business_name: 'Business Name',
    niche: 'Niche',
    phone: 'Phone',
    email: 'Email',
    address: 'Address',
    notes: 'Notes',
    entity_type: 'Entity Type',
};

export const Transcripts: React.FC<TranscriptsProps> = ({ navigate }) => {
    const [transcripts, setTranscripts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [view, setView] = useState<'list' | 'detail' | 'new'>('list');
    const [filter, setFilter] = useState('ALL');

    // Compose state
    const [newContent, setNewContent] = useState('');
    const [newSource, setNewSource] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    // Detail state
    const [extracting, setExtracting] = useState(false);
    const [extractError, setExtractError] = useState<string | null>(null);
    const [extractedFields, setExtractedFields] = useState<Record<string, any> | null>(null);
    const [editedFields, setEditedFields] = useState<Record<string, any>>({});
    const [importing, setImporting] = useState(false);
    const [importError, setImportError] = useState<string | null>(null);
    const [importSuccess, setImportSuccess] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getTranscripts();
            setTranscripts(data || []);
        } catch (err) {
            console.error(err);
            setError("Couldn't load transcripts.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const pendingCount = transcripts.filter(t => (t.status || 'pending') === 'pending').length;
    const selected = transcripts.find(t => t.id === selectedId);

    const filteredTranscripts = filter === 'ALL'
        ? transcripts
        : transcripts.filter(t => (t.status || 'pending') === filter);

    const getFilterCount = (filterId: string) =>
        filterId === 'ALL' ? transcripts.length : transcripts.filter(t => (t.status || 'pending') === filterId).length;

    const resetDetail = () => {
        setSelectedId(null);
        setView('list');
        setExtractedFields(null);
        setEditedFields({});
        setExtractError(null);
        setImportError(null);
        setImportSuccess(false);
    };

    const openDetail = (id: string) => {
        setSelectedId(id);
        setView('detail');
    };

    const handleSaveTranscript = async () => {
        if (!newContent.trim()) return;
        setSaving(true);
        setSaveError(null);
        try {
            const record = await createTranscript(newContent.trim(), newSource.trim() || undefined);
            await load();
            setNewContent('');
            setNewSource('');
            openDetail(record.id);
        } catch (err: any) {
            console.error(err);
            setSaveError(err.message || 'Failed to save transcript.');
        } finally {
            setSaving(false);
        }
    };

    const handleExtract = async (transcript: any) => {
        setExtracting(true);
        setExtractError(null);
        try {
            const result = await extractTranscriptFields(transcript.content);
            console.log('Setting fields:', result);
            // Normalize niche — fuzzy match to predefined options
            if (result.niche && typeof result.niche === 'string') {
                const raw = result.niche.toLowerCase();
                const nicheMap: Record<string, string[]> = {
                    'Handyman': ['handyman', 'drywall', 'tile', 'repair', 'general', 'maintenance'],
                    'HVAC': ['hvac', 'heating', 'cooling', 'air conditioning', 'furnace'],
                    'Plumber': ['plumb', 'pipe', 'drain', 'water'],
                    'Cleaner': ['clean', 'janitorial', 'maid', 'housekeep'],
                    'Electrician': ['electric', 'wiring', 'outlet', 'panel'],
                };
                const matched = Object.entries(nicheMap).find(([, keywords]) =>
                    keywords.some(k => raw.includes(k))
                );
                result.niche = matched ? matched[0] : result.niche.charAt(0).toUpperCase() + result.niche.slice(1).toLowerCase();
            }
            // Normalize entity_type to lowercase to match select values
            if (result.entity_type && typeof result.entity_type === 'string') {
                result.entity_type = result.entity_type.toLowerCase();
            }
            setExtractedFields(result);
            setEditedFields(result);
            await updateTranscriptStatus(transcript.id, 'reviewed');
            setTranscripts(prev => prev.map(t => t.id === transcript.id ? { ...t, status: 'reviewed' } : t));
        } catch (err) {
            console.error('Extraction failed:', err);
            setExtractError('Extraction failed. Check your API key and try again.');
        } finally {
            setExtracting(false);
        }
    };

    const handleImport = async () => {
        if (!selectedId || !editedFields.entity_type) return;
        setImporting(true);
        setImportError(null);
        try {
            const entityType = editedFields.entity_type as 'provider' | 'buyer';
            const table = entityType === 'provider' ? 'providers' : 'buyers';
            const record: Record<string, any> = {};

            if (entityType === 'provider') {
                if (editedFields.name) record.name = editedFields.name;
                if (editedFields.business_name) record.business_name = editedFields.business_name;
                if (editedFields.niche) record.niche = editedFields.niche.toLowerCase();
                if (editedFields.phone) record.phone = editedFields.phone;
                if (editedFields.email) record.email = editedFields.email;
                if (editedFields.address) record.address = editedFields.address;
                record.stage = 'research';
            } else {
                if (editedFields.name) record.contact_name = editedFields.name;
                if (editedFields.business_name) record.org_name = editedFields.business_name;
                if (editedFields.phone) record.phone = editedFields.phone;
                if (editedFields.email) record.email = editedFields.email;
                record.stage = 'prospect';
            }

            const { data, error: insertErr } = await supabase.from(table).insert(record).select().single();
            if (insertErr) throw insertErr;

            // Link transcript to entity and mark imported
            await supabase.from('transcripts').update({
                status: 'imported',
                entity_type: entityType,
                entity_id: data.id,
            }).eq('id', selectedId);

            setTranscripts(prev => prev.map(t => t.id === selectedId ? { ...t, status: 'imported' } : t));
            setImportSuccess(true);
            setTimeout(() => resetDetail(), 1500);
        } catch (err: any) {
            console.error('Import failed:', err);
            setImportError(err.message || 'Import failed. Please try again.');
        } finally {
            setImporting(false);
        }
    };

    const updateField = (key: string, value: string) => {
        setEditedFields(prev => ({ ...prev, [key]: value || null }));
    };

    const inputClass = "w-full bg-bg-base border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-border-active transition-colors";
    const labelClass = "font-mono text-[10px] uppercase text-text-muted tracking-widest block mb-1";

    // Loading state
    if (loading) return (
        <div className="p-4 md:p-8 max-w-3xl mx-auto">
            <div className="animate-pulse space-y-4">
                <div className="h-10 w-48 bg-border-subtle rounded" />
                <div className="h-4 w-32 bg-border-subtle rounded" />
                <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-border-subtle rounded-xl" />)}</div>
            </div>
        </div>
    );

    // Error state
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

    // ── Detail view ──
    if (selected) {
        return (
            <div className="p-4 md:p-8 max-w-5xl mx-auto">
                <button
                    onClick={resetDetail}
                    className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors mb-6"
                >
                    <ChevronLeft size={16} />
                    <span className="font-mono text-[10px] uppercase tracking-widest">Back to Transcripts</span>
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <h2 className="text-2xl md:text-4xl">Transcript Review</h2>
                    <span className={`font-mono text-[10px] uppercase px-2 py-0.5 rounded-full border ${STATUS_COLORS[selected.status || 'pending']}`}>
                        {selected.status || 'pending'}
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left: Raw transcript */}
                    <div className="space-y-4">
                        <h3 className="font-mono text-[10px] text-text-muted uppercase tracking-widest">Raw Transcript</h3>
                        <div className="bg-bg-base border border-border-subtle rounded-xl p-4 h-[500px] overflow-y-auto">
                            <p className="text-sm font-mono text-text-secondary whitespace-pre-wrap leading-relaxed">{selected.content}</p>
                        </div>
                        <p className="font-mono text-[10px] text-text-muted uppercase">
                            {format(new Date(selected.created_at), "MMM do · h:mm a")}
                        </p>
                    </div>

                    {/* Right: AI Extraction */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-mono text-[10px] text-text-muted uppercase tracking-widest">AI Extraction</h3>
                            {!extractedFields && !extracting && (
                                <button
                                    onClick={() => handleExtract(selected)}
                                    className="flex items-center gap-2 px-4 py-2 bg-accent-blue/10 text-accent-blue font-mono text-[10px] uppercase tracking-wider rounded-full hover:bg-accent-blue/20 transition-colors"
                                >
                                    <Sparkles size={12} />
                                    Extract Fields
                                </button>
                            )}
                        </div>

                        {/* Extraction error */}
                        {extractError && (
                            <div className="p-3 bg-accent-red/5 border border-accent-red/20 rounded-lg">
                                <p className="font-mono text-[10px] text-accent-red">{extractError}</p>
                            </div>
                        )}

                        {/* Loading spinner */}
                        {extracting && (
                            <div className="bg-bg-card border border-border-subtle rounded-xl p-12 flex items-center justify-center">
                                <div className="flex items-center gap-3 text-text-muted">
                                    <Loader2 size={20} className="animate-spin" />
                                    <span className="font-mono text-[10px] uppercase tracking-widest">AI is analyzing transcript…</span>
                                </div>
                            </div>
                        )}

                        {/* Extracted fields form */}
                        {extractedFields && !extracting && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-bg-card border border-border-subtle rounded-xl p-4 space-y-4"
                            >
                                {FIELD_ORDER.map(key => (
                                    <div key={key}>
                                        <label className={labelClass}>{FIELD_LABELS[key]}</label>
                                        {key === 'entity_type' ? (
                                            <select
                                                value={editedFields.entity_type || 'provider'}
                                                onChange={e => updateField('entity_type', e.target.value)}
                                                className={inputClass}
                                            >
                                                <option value="provider">Provider</option>
                                                <option value="buyer">Buyer</option>
                                            </select>
                                        ) : key === 'niche' ? (
                                            <select
                                                value={editedFields.niche || ''}
                                                onChange={e => updateField('niche', e.target.value)}
                                                className={inputClass}
                                            >
                                                <option value="">Select niche</option>
                                                {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
                                            </select>
                                        ) : key === 'notes' ? (
                                            <textarea
                                                value={editedFields[key] || ''}
                                                onChange={e => updateField(key, e.target.value)}
                                                rows={3}
                                                className={`${inputClass} resize-none`}
                                                placeholder={`Enter ${FIELD_LABELS[key].toLowerCase()}`}
                                            />
                                        ) : (
                                            <input
                                                type="text"
                                                value={editedFields[key] || ''}
                                                onChange={e => updateField(key, e.target.value)}
                                                className={inputClass}
                                                placeholder={`Enter ${FIELD_LABELS[key].toLowerCase()}`}
                                            />
                                        )}
                                    </div>
                                ))}

                                {/* Import error */}
                                {importError && (
                                    <div className="p-3 bg-accent-red/5 border border-accent-red/20 rounded-lg">
                                        <p className="font-mono text-[10px] text-accent-red">{importError}</p>
                                    </div>
                                )}

                                <AnimatePresence mode="wait">
                                    {importSuccess ? (
                                        <motion.div
                                            key="success"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="w-full py-3 bg-accent-green/20 text-accent-green font-mono text-[10px] uppercase font-bold tracking-widest text-center rounded-full"
                                        >
                                            ✓ Imported Successfully
                                        </motion.div>
                                    ) : (
                                        <button
                                            key="import"
                                            onClick={handleImport}
                                            disabled={importing || !extractedFields}
                                            className="w-full py-3 bg-accent-green text-bg-base font-mono text-[10px] uppercase font-bold tracking-widest rounded-full hover:bg-accent-green/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            <Upload size={14} />
                                            {importing ? 'Importing…' : 'Import to CRM'}
                                        </button>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )}

                        {/* Empty state */}
                        {!extractedFields && !extracting && !extractError && (
                            <div className="bg-bg-card border border-dashed border-border-subtle rounded-xl p-12 text-center">
                                <p className="font-mono text-[10px] text-text-muted uppercase tracking-widest">
                                    Click "Extract Fields" to analyze this transcript
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ── New transcript view ──
    if (view === 'new') {
        return (
            <div className="p-4 md:p-8 max-w-2xl mx-auto">
                <button
                    onClick={() => setView('list')}
                    className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors mb-6"
                >
                    <ChevronLeft size={16} />
                    <span className="font-mono text-[10px] uppercase tracking-widest">Back to Transcripts</span>
                </button>

                <h2 className="text-3xl md:text-5xl mb-2">New Transcript</h2>
                <p className="font-mono text-[10px] text-text-muted uppercase tracking-widest mb-8">Paste or type a voice call transcript</p>

                <div className="space-y-5">
                    <div>
                        <label className="font-mono text-[10px] uppercase text-text-muted tracking-widest block mb-1">Paste or type transcript</label>
                        <textarea
                            value={newContent}
                            onChange={e => setNewContent(e.target.value)}
                            className="w-full bg-bg-base border border-border-subtle rounded-xl p-4 text-sm font-mono text-text-secondary h-[400px] resize-none focus:outline-none focus:border-border-active transition-colors placeholder-text-muted"
                            placeholder="Paste your transcript here…"
                        />
                    </div>
                    <div>
                        <label className="font-mono text-[10px] uppercase text-text-muted tracking-widest block mb-1">Source (optional)</label>
                        <input
                            type="text"
                            value={newSource}
                            onChange={e => setNewSource(e.target.value)}
                            className="w-full bg-bg-base border border-border-subtle rounded-lg px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-border-active transition-colors"
                            placeholder="Voicemail, live call, pocket…"
                        />
                    </div>

                    {saveError && (
                        <div className="p-3 bg-accent-red/5 border border-accent-red/20 rounded-lg">
                            <p className="font-mono text-[10px] text-accent-red">{saveError}</p>
                        </div>
                    )}

                    <button
                        onClick={handleSaveTranscript}
                        disabled={saving || !newContent.trim()}
                        className="w-full bg-accent-green text-bg-base font-mono text-[10px] uppercase font-bold rounded-full py-3 tracking-widest hover:bg-accent-green/90 transition-colors disabled:opacity-50"
                    >
                        {saving ? 'Saving…' : 'Save Transcript'}
                    </button>
                </div>
            </div>
        );
    }

    // ── List view ──
    return (
        <div className="p-4 md:p-8 max-w-3xl mx-auto">
            <header className="mb-8">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-3xl md:text-5xl mb-2">Transcripts</h2>
                        <p className="font-mono text-xs text-text-secondary uppercase tracking-widest">
                            Voice Intake · {pendingCount} Pending
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setView('new')}
                            className="flex items-center gap-1.5 bg-accent-green text-bg-base font-mono text-[10px] uppercase font-bold px-4 py-2 rounded-full hover:bg-accent-green/90 transition-colors"
                        >
                            <Plus size={12} /> New
                        </button>
                        <button
                            onClick={load}
                            className="p-2 rounded-lg bg-bg-card border border-border-subtle hover:bg-bg-card-hover transition-colors text-text-muted hover:text-text-primary"
                        >
                            <RefreshCw size={16} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Filter pills */}
            <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
                {FILTERS.map(f => {
                    const count = getFilterCount(f.id);
                    const isActive = filter === f.id;
                    return (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id)}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-wider whitespace-nowrap transition-colors border",
                                isActive
                                    ? "bg-accent-green/10 border-accent-green/30 text-accent-green font-bold"
                                    : "bg-bg-card border-border-subtle text-text-muted hover:text-text-primary hover:border-border-active"
                            )}
                        >
                            {f.label}
                            <span className={cn(
                                "text-[9px] px-1.5 py-0.5 rounded-full",
                                isActive ? "bg-accent-green/20 text-accent-green" : "bg-bg-surface text-text-muted"
                            )}>{count}</span>
                        </button>
                    );
                })}
            </div>

            {filteredTranscripts.length === 0 ? (
                <div className="py-20 text-center border border-dashed border-border-subtle rounded-xl">
                    <p className="font-mono text-xs text-text-muted uppercase tracking-widest">
                        {filter === 'ALL' ? 'No transcripts yet' : `No ${filter} transcripts`}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredTranscripts.map(t => (
                        <button
                            key={t.id}
                            onClick={() => openDetail(t.id)}
                            className="w-full text-left bg-bg-card border border-border-subtle rounded-xl p-4 hover:bg-bg-card-hover hover:border-border-hover transition-all group"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-mono text-[10px] text-text-muted uppercase">
                                    {format(new Date(t.created_at), "MMM do · h:mm a")}
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className={`font-mono text-[10px] uppercase px-2 py-0.5 rounded-full border ${STATUS_COLORS[t.status || 'pending']}`}>
                                        {t.status || 'pending'}
                                    </span>
                                    <ChevronRight size={14} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </div>
                            <p className="text-sm text-text-secondary line-clamp-2 group-hover:text-text-primary transition-colors">
                                {t.content?.slice(0, 120)}{(t.content?.length || 0) > 120 ? '…' : ''}
                            </p>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
