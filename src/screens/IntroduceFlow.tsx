import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Download, Send, FileText, CheckCircle2, Copy, Check, Save } from 'lucide-react';
import { generateOneSheets, generateOneSheet } from '../lib/ai';
import { saveOneSheet } from '../lib/queries';

interface IntroduceFlowProps {
  context: any;
  navigate: (screen: string, context?: any) => void;
}

export const IntroduceFlow: React.FC<IntroduceFlowProps> = ({ context, navigate }) => {
  const { provider, buyer, niche } = context;
  const [activeTab, setActiveTab] = useState('BUYER');
  const [isGenerating, setIsGenerating] = useState(false);
  const [docs, setDocs] = useState<any>(null);

  // One-sheet state
  const [oneSheet, setOneSheet] = useState<string | null>(null);
  const [generatingOneSheet, setGeneratingOneSheet] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    const result = await generateOneSheets(provider, buyer);
    setDocs(result);
    setIsGenerating(false);
  };

  const handleGenerateOneSheet = async () => {
    setGeneratingOneSheet(true);
    const result = await generateOneSheet(provider, buyer, niche);
    setOneSheet(result);
    setGeneratingOneSheet(false);
  };

  const handleCopy = async () => {
    if (!oneSheet) return;
    try {
      await navigator.clipboard.writeText(oneSheet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error('Copy failed');
    }
  };

  const handleSave = async () => {
    if (!oneSheet || !provider?.id || !buyer?.id) return;
    setSaving(true);
    try {
      await saveOneSheet(provider.id, buyer.id, niche, oneSheet);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <button
        onClick={() => navigate('TERRITORY_DETAIL', { territoryId: provider?.territory_id })}
        className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-8 group"
      >
        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        <span className="font-mono text-[10px] uppercase tracking-widest">Back to Match</span>
      </button>

      <header className="mb-12">
        <div className="flex items-center justify-between bg-bg-card border border-border-subtle p-4 rounded-xl mb-8">
          <div className="text-center flex-1">
            <h4 className="text-xl">{provider?.name}</h4>
            <span className="font-mono text-[10px] text-text-secondary uppercase">{provider?.niche}</span>
          </div>
          <div className="flex gap-1 px-8">
            <div className="w-2 h-2 rounded-full bg-accent-green" />
            <div className="w-2 h-2 rounded-full bg-accent-green" />
          </div>
          <div className="text-center flex-1">
            <h4 className="text-xl">{buyer?.org_name}</h4>
            <span className="font-mono text-[10px] text-text-secondary uppercase">{buyer?.property_type}</span>
          </div>
        </div>
        <h2 className="text-5xl">Generate Introduction</h2>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-[1fr,350px] gap-12">
        <div className="space-y-8">
          <div className="flex gap-4 border-b border-border-subtle">
            <button
              onClick={() => setActiveTab('BUYER')}
              className={`pb-4 px-2 font-mono text-[10px] uppercase tracking-widest relative ${activeTab === 'BUYER' ? 'text-text-primary' : 'text-text-secondary'}`}
            >
              1 · For the Buyer
              {activeTab === 'BUYER' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-green" />}
            </button>
            <button
              onClick={() => setActiveTab('PROVIDER')}
              className={`pb-4 px-2 font-mono text-[10px] uppercase tracking-widest relative ${activeTab === 'PROVIDER' ? 'text-text-primary' : 'text-text-secondary'}`}
            >
              2 · For the Provider
              {activeTab === 'PROVIDER' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-green" />}
            </button>
            <button
              onClick={() => setActiveTab('ONESHEET')}
              className={`pb-4 px-2 font-mono text-[10px] uppercase tracking-widest relative ${activeTab === 'ONESHEET' ? 'text-text-primary' : 'text-text-secondary'}`}
            >
              3 · One-Sheet
              {activeTab === 'ONESHEET' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-green" />}
            </button>
          </div>

          <div className="bg-bg-card border border-border-subtle rounded-2xl min-h-[400px] p-12 relative overflow-hidden">
            <AnimatePresence mode="wait">
              {/* ===== BUYER / PROVIDER TABS ===== */}
              {(activeTab === 'BUYER' || activeTab === 'PROVIDER') && (
                <>
                  {isGenerating ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex flex-col items-center justify-center gap-4"
                    >
                      <div className="w-12 h-12 border-2 border-accent-green border-t-transparent rounded-full animate-spin" />
                      <p className="font-mono text-[10px] text-text-secondary uppercase tracking-widest">AI is crafting the brief...</p>
                    </motion.div>
                  ) : docs ? (
                    <motion.div
                      key="content"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-8"
                    >
                      <div className="flex justify-between items-start">
                        <div className="p-3 bg-bg-surface border border-border-subtle rounded-lg">
                          <FileText size={24} className="text-accent-green" />
                        </div>
                        <div className="flex gap-2">
                          <button className="p-2 border border-border-subtle rounded-lg text-text-secondary hover:text-text-primary transition-colors">
                            <Download size={18} />
                          </button>
                          <button className="p-2 border border-border-subtle rounded-lg text-text-secondary hover:text-text-primary transition-colors">
                            <Send size={18} />
                          </button>
                        </div>
                      </div>

                      <div className="prose prose-invert max-w-none">
                        <h3 className="text-3xl font-display mb-6">
                          {activeTab === 'BUYER' ? 'Provider Recommendation' : 'Opportunity Brief'}
                        </h3>
                        <p className="text-xl leading-relaxed text-text-secondary italic">
                          {activeTab === 'BUYER' ? docs.buyerOneSheet : docs.providerBrief}
                        </p>
                      </div>

                      <div className="pt-12 border-t border-border-subtle grid grid-cols-2 gap-8">
                        <div>
                          <span className="font-mono text-[8px] text-text-muted uppercase block mb-2">Key Highlights</span>
                          <ul className="space-y-2">
                            <li className="flex items-center gap-2 text-xs text-text-secondary">
                              <CheckCircle2 size={12} className="text-accent-green" />
                              Verified Response Time
                            </li>
                            <li className="flex items-center gap-2 text-xs text-text-secondary">
                              <CheckCircle2 size={12} className="text-accent-green" />
                              Territory Specialist
                            </li>
                          </ul>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-12 text-center">
                      <div className="w-16 h-16 bg-bg-surface border border-border-subtle rounded-2xl flex items-center justify-center text-text-faint">
                        <FileText size={32} />
                      </div>
                      <div>
                        <h4 className="text-2xl mb-2">No documents generated yet</h4>
                        <p className="text-text-secondary text-sm max-w-xs mx-auto">Click the button to have AI analyze the match and generate custom briefing documents.</p>
                      </div>
                      <button
                        onClick={handleGenerate}
                        className="bg-accent-green text-bg-base font-mono text-xs font-bold px-8 py-3 rounded-full uppercase tracking-wider hover:scale-105 transition-transform"
                      >
                        Generate Docs
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* ===== ONE-SHEET TAB ===== */}
              {activeTab === 'ONESHEET' && (
                <>
                  {generatingOneSheet ? (
                    <motion.div
                      key="onesheet-loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex flex-col items-center justify-center gap-4"
                    >
                      <div className="w-12 h-12 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
                      <p className="font-mono text-[10px] text-text-secondary uppercase tracking-widest">Generating one-sheet...</p>
                    </motion.div>
                  ) : oneSheet ? (
                    <motion.div
                      key="onesheet-content"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <FileText size={18} className="text-accent-blue" />
                          <span className="font-mono text-[10px] text-text-muted uppercase tracking-widest">Introduction Brief</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleCopy}
                            className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] uppercase text-text-muted hover:text-text-primary transition-colors border border-border-subtle rounded-lg"
                          >
                            {copied ? <Check size={12} className="text-accent-green" /> : <Copy size={12} />}
                            {copied ? 'Copied' : 'Copy'}
                          </button>
                          <button
                            onClick={handleSave}
                            disabled={saving || saved}
                            className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] uppercase text-text-muted hover:text-text-primary transition-colors border border-border-subtle rounded-lg disabled:opacity-50"
                          >
                            {saved ? <Check size={12} className="text-accent-green" /> : <Save size={12} />}
                            {saving ? 'Saving...' : saved ? 'Saved' : 'Save'}
                          </button>
                        </div>
                      </div>
                      <div className="whitespace-pre-wrap text-sm text-text-secondary leading-relaxed">
                        {oneSheet}
                      </div>
                    </motion.div>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-12 text-center">
                      <div className="w-16 h-16 bg-bg-surface border border-border-subtle rounded-2xl flex items-center justify-center text-text-faint">
                        <FileText size={32} />
                      </div>
                      <div>
                        <h4 className="text-2xl mb-2">One-Sheet Brief</h4>
                        <p className="text-text-secondary text-sm max-w-xs mx-auto">Generate a shareable introduction document connecting both parties with context and next steps.</p>
                      </div>
                      <button
                        onClick={handleGenerateOneSheet}
                        className="bg-accent-green text-bg-base font-mono text-xs font-bold px-8 py-3 rounded-full uppercase tracking-wider hover:scale-105 transition-transform"
                      >
                        Generate One-Sheet
                      </button>
                    </div>
                  )}
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-bg-card border border-border-subtle p-6 rounded-xl">
            <h5 className="font-mono text-[10px] text-text-secondary uppercase tracking-widest mb-6">Introduction Checklist</h5>
            <div className="space-y-4">
              {[
                "Confirm buyer urgency",
                "Verify provider availability",
                "Generate briefing docs",
                "Generate one-sheet",
                "Send intro email",
                "Log introduction in CRM"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 group cursor-pointer">
                  <div className="w-4 h-4 rounded border border-border-active group-hover:border-accent-green transition-colors" />
                  <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-accent-blue/5 border border-accent-blue/20 p-6 rounded-xl">
            <h5 className="font-mono text-[10px] text-accent-blue uppercase tracking-widest mb-4">Pro Tip</h5>
            <p className="text-sm text-text-secondary leading-relaxed">
              Always send the buyer brief first. Once they confirm interest, the provider brief becomes a much stronger "sell" for the network membership.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
