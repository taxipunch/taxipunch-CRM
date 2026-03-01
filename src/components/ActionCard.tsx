import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, MessageSquare, Link as LinkIcon, ArrowRight, TrendingUp, FileText, Loader2, Check } from 'lucide-react';
import { ActionItem } from '../types';
import { cn } from '../lib/utils';

interface ActionCardProps {
  action: ActionItem;
  isExpanded: boolean;
  onToggle: () => void;
  onNavigate?: (screen: string, context?: any) => void;
  onComplete?: (id: string) => void;
}

export const ActionCard: React.FC<ActionCardProps> = ({ action, isExpanded, onToggle, onNavigate, onComplete }) => {
  const [buttonState, setButtonState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [confirmingDone, setConfirmingDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAction = (callback?: () => void) => {
    if (buttonState !== 'idle') return;
    setButtonState('loading');
    setTimeout(() => {
      setButtonState('done');
      if (callback) callback();
      setTimeout(() => setButtonState('idle'), 1500);
    }, 800);
  };

  const handleComplete = async () => {
    if (!onComplete) return;
    setError(null);
    try {
      await onComplete(action.id);
    } catch (err) {
      setError('Failed to mark done');
      setConfirmingDone(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'transcript_review': return <MessageSquare size={18} className="text-accent-blue" />;
      case 'match_ready': return <LinkIcon size={18} className="text-accent-green" />;
      case 'followup_due': return <AlertCircle size={18} className="text-accent-yellow" />;
      case 'niche_signal': return <TrendingUp size={18} className="text-accent-orange" />;
      case 'intro_confirm': return <CheckCircle2 size={18} className="text-accent-purple" />;
      default: return <FileText size={18} className="text-text-secondary" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-accent-red';
      case 'medium': return 'bg-accent-yellow';
      case 'low': return 'bg-text-faint';
      default: return 'bg-text-faint';
    }
  };

  return (
    <div className={cn(
      "bg-bg-card border border-border-subtle rounded-xl overflow-hidden transition-all",
      isExpanded ? "ring-1 ring-border-active" : "hover:bg-bg-card-hover"
    )}>
      <div
        className="p-4 flex items-center gap-4 cursor-pointer group"
        onClick={onToggle}
      >
        <div className={cn("w-1 h-8 rounded-full", getPriorityColor(action.priority))} />
        <div className="p-2 rounded-lg bg-bg-surface border border-border-subtle">
          {getIcon(action.type)}
        </div>
        <div className="flex-1">
          <h4 className="text-lg leading-tight">{action.title}</h4>
          <p className="text-text-secondary text-xs font-mono">{action.summary}</p>
        </div>

        {/* Done button — two-stage confirmation */}
        {onComplete && !confirmingDone && (
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmingDone(true); }}
            className="text-text-muted hover:text-accent-green transition-colors p-1 opacity-0 group-hover:opacity-100"
            title="Mark as done"
          >
            <Check size={16} />
          </button>
        )}

        <div className="text-text-faint">
          <ArrowRight size={16} className={cn("transition-transform", isExpanded ? "rotate-90" : "")} />
        </div>
      </div>

      {/* Inline done confirmation */}
      {confirmingDone && (
        <div className="flex items-center gap-3 px-4 pb-3" onClick={e => e.stopPropagation()}>
          <span className="font-mono text-[10px] text-accent-green uppercase tracking-wider">Done?</span>
          <button
            onClick={handleComplete}
            className="px-3 py-1 bg-accent-green text-bg-base font-mono text-[10px] uppercase tracking-wider rounded-full hover:bg-accent-green/80 transition-colors"
          >
            Confirm
          </button>
          <button
            onClick={() => setConfirmingDone(false)}
            className="font-mono text-[10px] text-text-muted uppercase tracking-wider hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Inline error */}
      {error && (
        <div className="px-4 pb-3">
          <span className="font-mono text-[10px] text-accent-red">{error}</span>
        </div>
      )}

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border-subtle bg-bg-surface/50 p-6"
          >
            {action.type === 'transcript_review' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-bg-card border border-border-subtle rounded-lg">
                    <span className="font-mono text-[8px] text-text-muted uppercase block mb-1">Entity</span>
                    <span className="text-sm">South Williamsport HOA</span>
                  </div>
                  <div className="p-3 bg-bg-card border border-border-subtle rounded-lg">
                    <span className="font-mono text-[8px] text-text-muted uppercase block mb-1">Niches</span>
                    <span className="text-sm">HVAC, Plumbing</span>
                  </div>
                </div>
                <textarea
                  placeholder="Add reviewer comments..."
                  className="w-full bg-bg-card border border-border-subtle rounded-lg p-3 text-sm font-serif focus:outline-none focus:border-border-active min-h-[80px]"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => handleAction()}
                    disabled={buttonState !== 'idle'}
                    className="flex-1 bg-accent-blue text-bg-base font-mono text-[10px] font-bold py-2 rounded uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity"
                  >
                    {buttonState === 'loading' && <Loader2 size={12} className="animate-spin" />}
                    {buttonState === 'done' && <Check size={12} />}
                    {buttonState === 'done' ? 'Added ✓' : 'Approve & Add to CRM'}
                  </button>
                  <button className="px-4 border border-border-subtle text-text-secondary font-mono text-[10px] uppercase hover:text-accent-red transition-colors">
                    Flag
                  </button>
                </div>
              </div>
            )}

            {action.type === 'match_ready' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 p-4 bg-bg-card border border-border-subtle rounded-lg text-center">
                    <span className="font-mono text-[8px] text-text-muted uppercase block mb-1">Provider</span>
                    <span className="text-lg">John's HVAC</span>
                  </div>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-accent-green" />
                    <div className="w-2 h-2 rounded-full bg-accent-green" />
                  </div>
                  <div className="flex-1 p-4 bg-bg-card border border-border-subtle rounded-lg text-center">
                    <span className="font-mono text-[8px] text-text-muted uppercase block mb-1">Buyer</span>
                    <span className="text-lg">Loyalsock Mgmt</span>
                  </div>
                </div>
                <button
                  onClick={() => handleAction(() => onNavigate?.('INTRODUCE_FLOW'))}
                  disabled={buttonState !== 'idle'}
                  className="w-full bg-accent-green text-bg-base font-mono text-[10px] font-bold py-3 rounded uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity"
                >
                  {buttonState === 'loading' && <Loader2 size={12} className="animate-spin" />}
                  {buttonState === 'done' && <Check size={12} />}
                  {buttonState === 'done' ? 'Generated ✓' : 'Generate Intro Docs'}
                </button>
              </div>
            )}

            {action.type === 'followup_due' && (
              <div className="space-y-4">
                <div className="p-4 bg-accent-yellow/5 border border-accent-yellow/20 rounded-lg">
                  <p className="text-sm text-accent-yellow italic">"Hey, just checking in on that HVAC project we discussed last week..."</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleAction()}
                    disabled={buttonState !== 'idle'}
                    className="flex-1 bg-accent-yellow text-bg-base font-mono text-[10px] font-bold py-2 rounded uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity"
                  >
                    {buttonState === 'loading' && <Loader2 size={12} className="animate-spin" />}
                    {buttonState === 'done' && <Check size={12} />}
                    {buttonState === 'done' ? 'Generated ✓' : 'Generate Follow-up Doc'}
                  </button>
                  <button className="flex-1 border border-border-subtle text-text-secondary font-mono text-[10px] uppercase py-2 rounded">
                    Log Contact
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
