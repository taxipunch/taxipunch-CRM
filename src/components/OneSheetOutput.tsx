import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Copy, Check } from 'lucide-react';

interface OneSheetOutputProps {
    content: string | null;
    loading: boolean;
    error: string | null;
    copied: boolean;
    onRegenerate: () => void;
    onCopy: () => void;
}

export const OneSheetOutput: React.FC<OneSheetOutputProps> = ({
    content,
    loading,
    error,
    copied,
    onRegenerate,
    onCopy,
}) => {
    return (
        <AnimatePresence mode="wait">
            {loading && (
                <motion.div
                    key="loading"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-bg-card border border-border-subtle rounded-xl p-4 mt-3 w-full space-y-3"
                >
                    <div className="h-3 w-3/4 bg-bg-surface rounded animate-pulse" />
                    <div className="h-3 w-full bg-bg-surface rounded animate-pulse" />
                    <div className="h-3 w-1/2 bg-bg-surface rounded animate-pulse" />
                </motion.div>
            )}

            {error && !loading && (
                <motion.div
                    key="error"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center justify-between p-4 mt-3 bg-accent-red/5 border border-accent-red/20 rounded-xl w-full"
                >
                    <span className="font-mono text-[10px] text-accent-red">{error}</span>
                    <button
                        onClick={onRegenerate}
                        className="flex items-center gap-2 px-4 py-1.5 bg-accent-red/10 text-accent-red font-mono text-[10px] uppercase tracking-wider rounded-full hover:bg-accent-red/20 transition-colors min-h-[44px]"
                    >
                        <RefreshCw size={12} /> Retry
                    </button>
                </motion.div>
            )}

            {content && !loading && !error && (
                <motion.div
                    key="content"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-bg-card border border-border-subtle rounded-xl p-4 mt-3 w-full"
                >
                    <div className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap mb-4">
                        {content}
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onCopy}
                            className="text-text-secondary hover:text-text-primary font-mono text-[10px] uppercase tracking-wider transition-colors min-h-[44px] flex items-center gap-1.5"
                        >
                            {copied ? <Check size={12} className="text-accent-green" /> : <Copy size={12} />}
                            {copied ? '● copied!' : '● copy'}
                        </button>
                        <button
                            onClick={onRegenerate}
                            className="text-text-secondary hover:text-text-primary font-mono text-[10px] uppercase tracking-wider transition-colors min-h-[44px] flex items-center gap-1.5"
                        >
                            <RefreshCw size={12} />
                            ● regenerate
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
