import React, { useState, useRef, useCallback } from 'react';
import { Milestone, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface MilestoneData {
  activeProviders: number;
  engagedBuyers: number;
  introductions: number;
  mrr: number;
}

interface MilestoneDetail {
  description: string;
  requirement: string;
  status: (d: MilestoneData) => string;
  nextAction: string;
}

const MILESTONE_DETAILS: Record<number, MilestoneDetail> = {
  1: {
    description: 'Your public presence is live — prospects can find you and see what you do.',
    requirement: 'Website or landing page published',
    status: () => 'Complete ✓',
    nextAction: 'Share your site link in your next outreach email to build credibility.',
  },
  2: {
    description: 'Your CRM has real prospects loaded — you have people to work.',
    requirement: 'Providers and buyers imported into the system',
    status: () => 'Complete ✓',
    nextAction: 'Review your pipeline and tag the top 5 providers to contact this week.',
  },
  3: {
    description: 'A provider has committed to your network — your supply side is real.',
    requirement: '1 active provider signed',
    status: (d) => d.activeProviders >= 1
      ? 'Complete ✓'
      : `${d.activeProviders}/1 active providers`,
    nextAction: 'Follow up with your top-ranked uncontacted provider in your strongest territory.',
  },
  4: {
    description: 'You\'ve made your first real connection between a provider and a buyer.',
    requirement: '1 completed introduction',
    status: (d) => d.introductions >= 1
      ? 'Complete ✓'
      : `${d.introductions}/1 introductions made`,
    nextAction: 'Find a buyer whose need matches one of your active providers and make the intro today.',
  },
  5: {
    description: 'Revenue is flowing — the marketplace model is validated.',
    requirement: 'MRR greater than $0',
    status: (d) => d.mrr > 0
      ? 'Complete ✓'
      : `$${d.mrr.toLocaleString()} / $1 MRR`,
    nextAction: 'Convert your most engaged provider from trial to paid by sending the billing agreement.',
  },
  6: {
    description: 'You have critical mass on the supply side — enough providers to serve most buyer needs.',
    requirement: '5 active providers in the network',
    status: (d) => d.activeProviders >= 5
      ? 'Complete ✓'
      : `${d.activeProviders}/5 active providers`,
    nextAction: 'Identify the top niche gaps in your territories and recruit a provider for each.',
  },
  7: {
    description: 'Meaningful recurring revenue — proof the flywheel is spinning.',
    requirement: 'MRR ≥ $1,000',
    status: (d) => d.mrr >= 1000
      ? 'Complete ✓'
      : `$${d.mrr.toLocaleString()} / $1,000 MRR`,
    nextAction: 'Focus on converting your most active trial providers to paid plans.',
  },
  8: {
    description: 'Scaling stage — the model works, now it\'s about volume and territory expansion.',
    requirement: 'MRR ≥ $5,000',
    status: (d) => d.mrr >= 5000
      ? 'Complete ✓'
      : `$${d.mrr.toLocaleString()} / $5,000 MRR`,
    nextAction: 'Expand into a new territory with proven demand and recruit 3 providers.',
  },
  9: {
    description: 'Full-time viable — this is a real business generating serious monthly revenue.',
    requirement: 'MRR ≥ $10,000',
    status: (d) => d.mrr >= 10000
      ? 'Complete ✓'
      : `$${d.mrr.toLocaleString()} / $10,000 MRR`,
    nextAction: 'Systemize your onboarding and start delegating outreach to scale beyond your own capacity.',
  },
};

const MILESTONE_DEFS = [
  { id: 1, title: 'First site live', check: () => true },
  { id: 2, title: 'Pipeline loaded', check: () => true },
  { id: 3, title: 'First provider yes', check: (d: MilestoneData) => d.activeProviders >= 1 },
  { id: 4, title: 'First introduction', check: (d: MilestoneData) => d.introductions >= 1 },
  { id: 5, title: 'First MRR', check: (d: MilestoneData) => d.mrr > 0 },
  { id: 6, title: '5 active providers', check: (d: MilestoneData) => d.activeProviders >= 5 },
  { id: 7, title: '$1K MRR', check: (d: MilestoneData) => d.mrr >= 1000 },
  { id: 8, title: '$5K MRR', check: (d: MilestoneData) => d.mrr >= 5000 },
  { id: 9, title: '$10K MRR', check: (d: MilestoneData) => d.mrr >= 10000 },
];

function computeMilestones(data: MilestoneData) {
  let currentFound = false;
  const milestones = MILESTONE_DEFS.map(m => {
    const done = m.check(data);
    if (done) return { ...m, status: 'done' as const };
    if (!currentFound) { currentFound = true; return { ...m, status: 'current' as const }; }
    return { ...m, status: 'upcoming' as const };
  });
  const currentIdx = milestones.findIndex(m => m.status === 'current');
  const currentMilestone = currentIdx >= 0 ? milestones[currentIdx].title : 'All complete!';
  const progress = currentIdx >= 0
    ? Math.round((currentIdx / milestones.length) * 100)
    : 100;
  return { milestones, currentMilestone, progress };
}

interface MilestoneBarProps {
  milestoneData: MilestoneData;
  onClick: () => void;
}

export const MilestoneBar: React.FC<MilestoneBarProps> = ({ milestoneData, onClick }) => {
  const { milestones, currentMilestone, progress } = computeMilestones(milestoneData);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [longPressId, setLongPressId] = useState<number | null>(null);
  const [selectedMilestone, setSelectedMilestone] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressedRef = useRef(false);

  const visibleLabelId = longPressId ?? hoveredId;

  const startPress = useCallback((id: number) => {
    longPressedRef.current = false;
    timerRef.current = setTimeout(() => {
      longPressedRef.current = true;
      setLongPressId(id);
    }, 500);
  }, []);

  const endPress = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleCircleClick = useCallback((e: React.MouseEvent | React.TouchEvent, id: number) => {
    e.stopPropagation();
    if (longPressedRef.current) {
      e.preventDefault();
      longPressedRef.current = false;
      return;
    }
    setSelectedMilestone(prev => prev === id ? null : id);
  }, []);

  const handleBarClick = useCallback(() => {
    if (longPressId !== null) setLongPressId(null);
  }, [longPressId]);

  const selectedDetail = selectedMilestone ? MILESTONE_DETAILS[selectedMilestone] : null;
  const selectedMilestoneObj = selectedMilestone ? milestones.find(m => m.id === selectedMilestone) : null;

  return (
    <div>
      <div
        className="bg-bg-card border border-border-subtle rounded-xl p-4 cursor-pointer hover:bg-bg-card-hover transition-colors group"
        onClick={handleBarClick}
      >
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <Milestone size={14} className="text-accent-yellow" />
            <span className="font-mono text-[10px] text-text-secondary uppercase tracking-widest">
              Current Milestone: {currentMilestone}
            </span>
          </div>
          <span
            className="font-mono text-[10px] text-text-faint group-hover:text-accent-yellow transition-colors uppercase"
            onClick={(e) => { e.stopPropagation(); onClick(); }}
          >
            View Roadmap →
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-border-subtle rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-accent-green shadow-[0_0_10px_rgba(0,230,118,0.5)] transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Milestone circles */}
        <div className="flex justify-between items-center px-1">
          {milestones.map((m) => (
            <div key={m.id} className="relative flex flex-col items-center">
              {/* Desktop hover tooltip */}
              <AnimatePresence>
                {hoveredId === m.id && !longPressId && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.15 }}
                    className="hidden md:block absolute bottom-full mb-2 bg-bg-card border border-border-subtle rounded-lg px-3 py-2 shadow-lg z-10 pointer-events-none min-w-[160px]"
                  >
                    <span className="font-mono text-[10px] uppercase tracking-widest text-text-primary block">{m.title}</span>
                    {MILESTONE_DETAILS[m.id] && (
                      <span className="text-text-secondary text-xs mt-1 block leading-snug">{MILESTONE_DETAILS[m.id].description.split('—')[0].trim()}</span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Circle */}
              <button
                className={`w-3 h-3 md:w-3.5 md:h-3.5 rounded-full transition-all ${selectedMilestone === m.id ? 'ring-2 ring-accent-yellow ring-offset-1 ring-offset-bg-base' : ''
                  } ${m.status === 'done'
                    ? 'bg-accent-green'
                    : m.status === 'current'
                      ? 'bg-accent-yellow shadow-[0_0_8px_rgba(255,193,7,0.4)]'
                      : 'bg-bg-card border border-border-subtle'
                  }`}
                onMouseEnter={() => setHoveredId(m.id)}
                onMouseLeave={() => setHoveredId(null)}
                onMouseDown={(e) => { e.stopPropagation(); startPress(m.id); }}
                onMouseUp={endPress}
                onTouchStart={(e) => { e.stopPropagation(); startPress(m.id); }}
                onTouchEnd={(e) => { endPress(); if (longPressedRef.current) { e.preventDefault(); } }}
                onClick={(e) => handleCircleClick(e, m.id)}
                aria-label={m.title}
              />

              {/* Mobile long-press label */}
              <AnimatePresence>
                {longPressId === m.id && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="md:hidden font-mono text-[9px] uppercase tracking-widest text-text-primary mt-1 whitespace-nowrap absolute top-full"
                  >
                    {m.title}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      {/* Milestone Detail Card */}
      <AnimatePresence>
        {selectedMilestoneObj && selectedDetail && (
          <motion.div
            key={selectedMilestone}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="bg-bg-card border border-border-subtle rounded-2xl p-6 mt-4 relative"
          >
            <button
              onClick={() => setSelectedMilestone(null)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <div className={`w-2 h-2 rounded-full ${selectedMilestoneObj.status === 'done' ? 'bg-accent-green'
                : selectedMilestoneObj.status === 'current' ? 'bg-accent-yellow'
                  : 'bg-border-subtle'
                }`} />
              <h3 className="text-2xl font-display">{selectedMilestoneObj.title}</h3>
            </div>

            <p className="text-sm text-text-secondary mb-4">{selectedDetail.description}</p>

            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-1">
                <span className="font-mono text-[10px] uppercase text-text-muted tracking-widest block mb-1">Requirement</span>
                <span className="font-mono text-[10px] uppercase text-text-secondary">{selectedDetail.requirement}</span>
              </div>
              <div className="flex-1">
                <span className="font-mono text-[10px] uppercase text-text-muted tracking-widest block mb-1">Current Status</span>
                <span className="font-mono text-[10px] uppercase text-text-secondary">{selectedDetail.status(milestoneData)}</span>
              </div>
            </div>

            <div className="border-t border-border-subtle pt-4">
              <span className="font-mono text-[10px] uppercase text-text-muted tracking-widest block mb-1">Next Action</span>
              <p className="text-sm text-text-secondary">{selectedDetail.nextAction}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
