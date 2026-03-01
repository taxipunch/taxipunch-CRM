import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, RefreshCw, Sparkles, Upload, X } from 'lucide-react';
import { getTranscripts, updateTranscriptStatus, importTranscriptToCRM } from '../lib/queries';
import { extractTranscript } from '../lib/ai';

interface TranscriptsProps {
    navigate: (screen: string, context?: any) => void;
}

const STATUS_COLORS: Record<string, string> = {
    pending: 'text-accent-yellow border-accent-yellow/30 bg-accent-yellow/5',
    reviewed: 'text-accent-blue border-accent-blue/30 bg-accent-blue/5',
    imported: 'text-accent-green border-accent-green/30 bg-accent-green/5',
};

const FIELD_LABELS: Record<string, string> = {
    name: 'Contact Name',
    business_name: 'Business Name',
    niche: 'Niche / Service',
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
    const [extracting, setExtracting] = useState(false);
    const [extractedFields, setExtractedFields] = useState<Record<string, any> | null>(null);
    const [editedFields, setEditedFields] = useState<Record<string, any>>({});
    const [importing, setImporting] = useState(false);
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

    const selected = transcripts.find(t => t.id === selectedId);

    const handleExtract = async (transcript: any) => {
        setExtracting(true);
        try {
            const result = await extractTranscript(transcript.content, 'intake');
            if (result) {
                const fields = {
                    name: result.contact_name || null,
                    business_name: result.org_name || null,
                    niche: result.niches?.[0] || null,
                    phone: null,
                    email: null,
                    address: null,
                    notes: result.summary || null,
                    entity_type: result.entity_type || 'provider',
                };
                setExtractedFields(fields);
                setEditedFields(fields);
                await updateTranscriptStatus(transcript.id, 'reviewed');
                setTranscripts(prev => prev.map(t => t.id === transcript.id ? { ...t, status: 'reviewed' } : t));
            }
        } catch (err) {
            console.error('Extraction failed:', err);
        } finally {
            setExtracting(false);
        }
    };

    const handleImport = async () => {
        if (!selectedId || !editedFields.entity_type) return;
        setImporting(true);
        try {
            await importTranscriptToCRM(selectedId, editedFields.entity_type as 'provider' | 'buyer', editedFields);
            setTranscripts(prev => prev.map(t => t.id === selectedId ? { ...t, status: 'imported' } : t));
            setImportSuccess(true);
            setTimeout(() => {
                setSelectedId(null);
                setExtractedFields(null);
                setEditedFields({});
                setImportSuccess(false);
            }, 1500);
        } catch (err) {
            console.error('Import failed:', err);
        } finally {
            setImporting(false);
        }
    };

    const updateField = (key: string, value: string) => {
        setEditedFields(prev => ({ ...prev, [key]: value || null }));
    };

    if (loading) return <div className="p-4 md:p-8 animate-pulse">Loading transcripts...</div>;

    if (error) return (
        <div className="p-4 md:p-8">
            <div className="flex items-center justify-between p-4 bg-accent-red/5 border border-accent-red/20 rounded-xl">
                <p className="text-sm text-accent-red">{error}</p>
                <button onClick={load} className="flex items-center gap-2 px-4 py-1.5 bg-accent-red/10 text-accent-red font-mono text-[10px] uppercase tracking-wider rounded-full hover:bg-accent-red/20 transition-colors">
                    <RefreshCw size={12} /> Retry
                </button>
            </div>
        </div>
    );

    // Detail view
    if (selected) {
        return (
            <div className="p-4 md:p-8 max-w-5xl mx-auto">
                <button
                    onClick={() => { setSelectedId(null); setExtractedFields(null); setEditedFields({}); }}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left: Raw transcript */}
                    <div className="space-y-4">
                        <h3 className="font-mono text-[10px] text-text-muted uppercase tracking-widest">Raw Transcript</h3>
                        <div className="bg-bg-card border border-border-subtle rounded-xl p-4 max-h-[60vh] overflow-y-auto">
                            <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">{selected.content}</p>
                        </div>
                        <p className="font-mono text-[10px] text-text-muted uppercase">
                            {new Date(selected.created_at).toLocaleString()}
                        </p>
                    </div>

                    {/* Right: Extracted fields */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-mono text-[10px] text-text-muted uppercase tracking-widest">Extracted Fields</h3>
                            {!extractedFields && (
                                <button
                                    onClick={() => handleExtract(selected)}
                                    disabled={extracting}
                                    className="flex items-center gap-2 px-4 py-2 bg-accent-blue/10 text-accent-blue font-mono text-[10px] uppercase tracking-wider rounded-full hover:bg-accent-blue/20 transition-colors disabled:opacity-50"
                                >
                                    <Sparkles size={12} />
                                    {extracting ? 'Extracting...' : 'Extract with AI'}
                                </button>
                            )}
                        </div>

                        {extracting && (
                            <div className="bg-bg-card border border-border-subtle rounded-xl p-8 flex items-center justify-center">
                                <div className="flex items-center gap-3 text-text-muted">
                                    <RefreshCw size={16} className="animate-spin" />
                                    <span className="font-mono text-[10px] uppercase tracking-widest">AI is analyzing transcript...</span>
                                </div>
                            </div>
                        )}

                        {extractedFields && !extracting && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-bg-card border border-border-subtle rounded-xl p-4 space-y-4"
                            >
                                {Object.entries(FIELD_LABELS).map(([key, label]) => (
                                    <div key={key}>
                                        <label className="font-mono text-[10px] text-text-muted uppercase tracking-widest block mb-1">
                                            {label}
                                        </label>
                                        {key === 'entity_type' ? (
                                            <div className="flex gap-2">
                                                {['provider', 'buyer'].map(type => (
                                                    <button
                                                        key={type}
                                                        onClick={() => updateField('entity_type', type)}
                                                        className={`px-4 py-2 rounded-lg font-mono text-[10px] uppercase tracking-wider transition-colors ${editedFields.entity_type === type
                                                                ? 'bg-accent-green text-bg-base font-bold'
                                                                : 'bg-bg-surface border border-border-subtle text-text-muted hover:text-text-primary'
                                                            }`}
                                                    >
                                                        {type}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : key === 'notes' ? (
                                            <textarea
                                                value={editedFields[key] || ''}
                                                onChange={e => updateField(key, e.target.value)}
                                                rows={3}
                                                className="w-full bg-bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-border-active transition-colors resize-none"
                                            />
                                        ) : (
                                            <input
                                                type="text"
                                                value={editedFields[key] || ''}
                                                onChange={e => updateField(key, e.target.value)}
                                                className="w-full bg-bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-border-active transition-colors"
                                                placeholder={`Enter ${label.toLowerCase()}`}
                                            />
                                        )}
                                    </div>
                                ))}

                                <AnimatePresence>
                                    {importSuccess ? (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="w-full py-3 bg-accent-green/20 text-accent-green font-mono text-[10px] uppercase font-bold tracking-widest text-center rounded-xl"
                                        >
                                            ✓ Imported Successfully
                                        </motion.div>
                                    ) : (
                                        <button
                                            onClick={handleImport}
                                            disabled={importing || !editedFields.entity_type}
                                            className="w-full py-3 bg-accent-green text-bg-base font-mono text-[10px] uppercase font-bold tracking-widest rounded-xl hover:bg-accent-green/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            <Upload size={14} />
                                            {importing ? 'Importing...' : 'Import to CRM'}
                                        </button>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )}

                        {!extractedFields && !extracting && (
                            <div className="bg-bg-card border border-dashed border-border-subtle rounded-xl p-12 text-center">
                                <p className="font-mono text-[10px] text-text-muted uppercase tracking-widest">
                                    Click "Extract with AI" to analyze this transcript
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // List view
    return (
        <div className="p-4 md:p-8 max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl md:text-4xl mb-1">Transcripts</h2>
                    <p className="font-mono text-[10px] text-text-muted uppercase tracking-widest">
                        {transcripts.length} transcripts · {transcripts.filter(t => (t.status || 'pending') === 'pending').length} pending review
                    </p>
                </div>
                <button
                    onClick={load}
                    className="p-2 rounded-lg bg-bg-card border border-border-subtle hover:bg-bg-card-hover transition-colors text-text-muted hover:text-text-primary"
                >
                    <RefreshCw size={16} />
                </button>
            </div>

            {transcripts.length === 0 ? (
                <div className="py-20 text-center border border-dashed border-border-subtle rounded-xl">
                    <p className="font-mono text-xs text-text-muted uppercase tracking-widest">No transcripts yet</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {transcripts.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setSelectedId(t.id)}
                            className="w-full text-left bg-bg-card border border-border-subtle rounded-xl p-4 hover:bg-bg-card-hover transition-colors group"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-mono text-[10px] text-text-muted uppercase">
                                    {new Date(t.created_at).toLocaleString()}
                                </span>
                                <span className={`font-mono text-[10px] uppercase px-2 py-0.5 rounded-full border ${STATUS_COLORS[t.status || 'pending']}`}>
                                    {t.status || 'pending'}
                                </span>
                            </div>
                            <p className="text-sm text-text-secondary line-clamp-2 group-hover:text-text-primary transition-colors">
                                {t.content?.slice(0, 150)}{(t.content?.length || 0) > 150 ? '...' : ''}
                            </p>
                            {t.summary && (
                                <p className="font-mono text-[10px] text-text-muted mt-2 truncate">
                                    Summary: {t.summary}
                                </p>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
