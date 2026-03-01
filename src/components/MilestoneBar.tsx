import React, { useState, useRef, useCallback } from 'react';
import { Milestone } from 'lucide-react';

const MILESTONES = [
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

interface MilestoneBarProps {
  currentMilestone: string;
  progress: number;
  onClick: () => void;
}

export const MilestoneBar: React.FC<MilestoneBarProps> = ({ currentMilestone, progress, onClick }) => {
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [longPressId, setLongPressId] = useState<number | null>(null);
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

  const handleClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (longPressedRef.current) {
      e.preventDefault();
      longPressedRef.current = false;
      return;
    }
    onClick();
  }, [onClick]);

  // Dismiss long-press tooltip on outside tap
  const handleBarClick = useCallback(() => {
    if (longPressId !== null) {
      setLongPressId(null);
    }
  }, [longPressId]);

  return (
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
        {MILESTONES.map((m) => (
          <div key={m.id} className="relative flex flex-col items-center">
            {/* Tooltip */}
            {visibleLabelId === m.id && (
              <div className="absolute bottom-full mb-2 px-2 py-1 bg-bg-card border border-border-subtle rounded text-text-primary font-mono text-[10px] uppercase whitespace-nowrap z-10 pointer-events-none shadow-lg">
                {m.title}
              </div>
            )}

            {/* Circle */}
            <button
              className={`w-3 h-3 md:w-3.5 md:h-3.5 rounded-full transition-all ${m.status === 'done'
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
              onClick={(e) => { e.stopPropagation(); handleClick(e); }}
              aria-label={m.title}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
