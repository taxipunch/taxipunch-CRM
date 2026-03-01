import React from 'react';
import { Milestone } from 'lucide-react';

interface MilestoneBarProps {
  currentMilestone: string;
  progress: number;
  onClick: () => void;
}

export const MilestoneBar: React.FC<MilestoneBarProps> = ({ currentMilestone, progress, onClick }) => {
  return (
    <div 
      className="bg-bg-card border border-border-subtle rounded-xl p-4 cursor-pointer hover:bg-bg-card-hover transition-colors group"
      onClick={onClick}
    >
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <Milestone size={14} className="text-accent-yellow" />
          <span className="font-mono text-[10px] text-text-secondary uppercase tracking-widest">
            Current Milestone: {currentMilestone}
          </span>
        </div>
        <span className="font-mono text-[10px] text-text-faint group-hover:text-accent-yellow transition-colors uppercase">
          View Roadmap →
        </span>
      </div>
      <div className="h-1.5 bg-border-subtle rounded-full overflow-hidden">
        <div 
          className="h-full bg-accent-green shadow-[0_0_10px_rgba(0,230,118,0.5)] transition-all duration-1000" 
          style={{ width: `${progress}%` }} 
        />
      </div>
    </div>
  );
};
