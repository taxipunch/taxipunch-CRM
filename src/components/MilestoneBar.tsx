import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Milestone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface MilestoneData {
  activeProviders: number;
  engagedBuyers: number;
  introductions: number;
  mrr: number;
}

interface MilestoneDetail {
  id: string;
  label: string;
  description: string;
  requirement: string;
  progress: (d: MilestoneData) => string;
  nextAction: string;
}

const MILESTONE_DETAILS: MilestoneDetail[] = [
  {
    id: 'first_provider',
    label: 'First Provider',
    description: 'sign your first provider to a monthly plan',
    requirement: '1 active provider',
    progress: (d) => d.activeProviders >= 1 ? 'Complete ✓' : `${d.activeProviders}/1 active providers`,
    nextAction: 'pick your strongest prospect and send the 3-option email',
  },
  {
    id: 'first_match',
    label: 'First Match',
    description: 'make your first introduction between a provider and a buyer',
    requirement: '1 completed introduction',
    progress: (d) => d.introductions >= 1 ? 'Complete ✓' : `${d.introductions}/1 introductions made`,
    nextAction: 'open territory detail and use the matches tab to find a pairing',
  },
  {
    id: 'three_providers',
    label: '3 Providers',
    description: 'build a small stable of active providers across niches',
    requirement: '3 active providers',
    progress: (d) => d.activeProviders >= 3 ? 'Complete ✓' : `${d.activeProviders}/3 active providers`,
    nextAction: 'you have prospects — move the next two from contacted to negotiating',
  },
  {
    id: 'first_mrr',
    label: 'First MRR',
    description: 'hit your first recurring revenue milestone',
    requirement: '$500 MRR',
    progress: (d) => d.mrr >= 500 ? 'Complete ✓' : `$${d.mrr.toLocaleString()} / $500 MRR`,
    nextAction: 'one active provider at your base rate gets you here — close the next one',
  },
  {
    id: 'ten_k',
    label: '$10k MRR',
    description: 'the north star — a full provider network generating consistent revenue',
    requirement: '$10,000 MRR',
    progress: (d) => d.mrr >= 10000 ? 'Complete ✓' : `$${d.mrr.toLocaleString()} / $10,000 MRR`,
    nextAction: 'stay consistent — work the pipeline daily and let the matches compound',
  },
];

const MILESTONE_DEFS = [
  { id: 1, title: 'First Provider', check: (d: MilestoneData) => d.activeProviders >= 1 },
  { id: 2, title: 'First Match', check: (d: MilestoneData) => d.introductions >= 1 },
  { id: 3, title: '3 Providers', check: (d: MilestoneData) => d.activeProviders >= 3 },
  { id: 4, title: 'First MRR', check: (d: MilestoneData) => d.mrr >= 500 },
  { id: 5, title: '$10k MRR', check: (d: MilestoneData) => d.mrr >= 10000 },
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
  const detailCardRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
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

  // Outside-click dismiss
  useEffect(() => {
    if (selectedMilestone === null) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        detailCardRef.current && !detailCardRef.current.contains(target) &&
        barRef.current && !barRef.current.contains(target)
      ) {
        setSelectedMilestone(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [selectedMilestone]);

  const selectedDetail = selectedMilestone != null ? MILESTONE_DETAILS[selectedMilestone - 1] : null;
  const selectedMilestoneObj = selectedMilestone != null ? milestones.find(m => m.id === selectedMilestone) : null;

  return (
    <div>
      <div
        ref={barRef}
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
                className={`w-3 h-3 md:w-3.5 md:h-3.5 rounded-full transition-all ${selectedMilestone === m.id ? 'ring-2 ring-accent-green ring-offset-2 ring-offset-bg-base' : ''
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
            ref={detailCardRef}
            key={selectedMilestone}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="bg-bg-card border border-border-subtle rounded-xl p-4 mt-4 w-full"
          >
            <span className="font-mono text-[10px] uppercase tracking-widest text-accent-green">{selectedDetail.label}</span>
            <p className="text-sm text-text-primary mt-1">{selectedDetail.description}</p>

            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <div className="flex-1">
                <span className="font-mono text-[10px] uppercase text-text-muted tracking-widest block mb-1">Requirement</span>
                <span className="font-mono text-[10px] text-text-primary">{selectedDetail.requirement}</span>
              </div>
              <div className="flex-1">
                <span className="font-mono text-[10px] uppercase text-text-muted tracking-widest block mb-1">Current Progress</span>
                <span className="font-mono text-[10px] text-text-primary">{selectedDetail.progress(milestoneData)}</span>
              </div>
            </div>

            <div className="mt-3">
              <span className="font-mono text-[10px] uppercase text-text-muted tracking-widest block mb-1">Next Action</span>
              <p className="text-sm text-text-secondary">{selectedDetail.nextAction}</p>
            </div>

            <div className="flex justify-end mt-3">
              <button
                onClick={() => setSelectedMilestone(null)}
                className="text-text-secondary hover:text-text-primary font-mono text-[10px] uppercase tracking-wider transition-colors min-h-[44px] flex items-center"
              >
                ● close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
