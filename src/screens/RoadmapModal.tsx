import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, Circle, ExternalLink, ArrowRight } from 'lucide-react';

interface RoadmapModalProps {
  onClose: () => void;
}

export const RoadmapModal: React.FC<RoadmapModalProps> = ({ onClose }) => {
  const [selectedStage, setSelectedStage] = useState(3);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const milestones = [
    { id: 1, title: 'First site live', status: 'done' },
    { id: 2, title: 'Pipeline loaded', status: 'done' },
    { id: 3, title: 'First provider yes', status: 'current' },
    { id: 4, title: 'First buyer conversation', status: 'upcoming' },
    { id: 5, title: 'First intro made', status: 'upcoming' },
    { id: 6, title: 'First MRR', status: 'upcoming' },
    { id: 7, title: '$1K MRR', status: 'upcoming' },
    { id: 8, title: '$5K MRR', status: 'upcoming' },
    { id: 9, title: '$10K MRR', status: 'upcoming' },
  ];

  const stageDetails: Record<number, any> = {
    3: {
      title: "First Provider Yes",
      description: "Moving from prospect to partner. This stage is about validating the value proposition with the supply side of the marketplace.",
      actions: [
        "Finalize provider agreement",
        "Onboard first network member",
        "Set up billing profile"
      ],
      resources: [
        { label: "Provider Pitch Deck", type: "PDF", link: "#" },
        { label: "Onboarding Checklist", type: "DOC", link: "#" }
      ],
      unlocks: "Enables the first real introductions to property managers."
    }
  };

  const detail = stageDetails[selectedStage] || {
    title: milestones.find(m => m.id === selectedStage)?.title,
    description: "Strategic context for this stage of the network build.",
    actions: ["Action item 1", "Action item 2"],
    resources: [],
    unlocks: "Next level of the flywheel."
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-bg-base/95 backdrop-blur-xl flex items-center justify-center p-8"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="max-w-6xl w-full h-full flex flex-col">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h2 className="text-5xl mb-2">Network Roadmap</h2>
            <p className="font-mono text-xs text-text-secondary uppercase tracking-widest">The path to $10k MRR</p>
          </div>
          <button
            onClick={onClose}
            className="p-4 rounded-full bg-bg-card border border-border-subtle hover:text-accent-red transition-colors"
          >
            <X size={24} />
          </button>
        </header>

        <div className="flex justify-between items-center mb-20 relative">
          <div className="absolute left-0 right-0 h-px bg-border-subtle -z-10" />
          {milestones.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedStage(m.id)}
              className="flex flex-col items-center gap-4 group relative"
            >
              <div className={`
                w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all
                ${m.status === 'done' ? 'bg-accent-green border-accent-green text-bg-base' : ''}
                ${m.status === 'current' ? 'bg-bg-card border-accent-yellow shadow-[0_0_20px_rgba(255,193,7,0.3)]' : ''}
                ${m.status === 'upcoming' ? 'bg-bg-card border-border-subtle text-text-faint' : ''}
                ${selectedStage === m.id ? 'scale-125 ring-4 ring-accent-green/20' : ''}
              `}>
                {m.status === 'done' ? <CheckCircle2 size={20} /> : <Circle size={16} />}
              </div>
              <span className={`
                absolute top-full mt-4 font-mono text-[8px] uppercase tracking-widest whitespace-nowrap text-center w-24
                ${selectedStage === m.id ? 'text-text-primary font-bold' : 'text-text-secondary'}
              `}>
                {m.title}
              </span>
            </button>
          ))}
        </div>

        <div className="flex-1 grid grid-cols-[1fr,400px] gap-12 overflow-y-auto pr-4">
          <div className="space-y-12">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <span className="text-8xl font-display text-text-faint">0{selectedStage}</span>
                <div>
                  <h3 className="text-5xl">{detail.title}</h3>
                  <span className="font-mono text-[10px] text-accent-yellow uppercase tracking-widest">Current Stage</span>
                </div>
              </div>
              <p className="text-2xl text-text-secondary leading-relaxed italic">
                {detail.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-12">
              <div>
                <h4 className="font-mono text-[10px] text-text-secondary uppercase tracking-widest mb-6">Key Actions</h4>
                <ul className="space-y-4">
                  {detail.actions.map((action: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 group">
                      <ArrowRight size={14} className="mt-1 text-accent-green opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="text-lg text-text-secondary group-hover:text-text-primary transition-colors">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-mono text-[10px] text-text-secondary uppercase tracking-widest mb-6">Unlocks</h4>
                <div className="p-6 bg-accent-green/5 border border-accent-green/20 rounded-xl">
                  <p className="text-lg text-accent-green leading-relaxed">
                    {detail.unlocks}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <h4 className="font-mono text-[10px] text-text-secondary uppercase tracking-widest">Resources</h4>
            <div className="space-y-3">
              {detail.resources.map((res: any, i: number) => (
                <a
                  key={i}
                  href={res.link}
                  className="flex items-center justify-between p-4 bg-bg-card border border-border-subtle rounded-xl hover:border-border-active transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-bg-surface rounded-lg text-text-faint group-hover:text-text-primary transition-colors">
                      <FileText size={18} />
                    </div>
                    <div>
                      <span className="block text-sm">{res.label}</span>
                      <span className="font-mono text-[8px] text-text-muted uppercase">{res.type}</span>
                    </div>
                  </div>
                  <ExternalLink size={14} className="text-text-faint group-hover:text-text-primary transition-colors" />
                </a>
              ))}
              {detail.resources.length === 0 && (
                <p className="font-mono text-[10px] text-text-faint uppercase">No resources for this stage yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const FileText = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);
