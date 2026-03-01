import React from 'react';
import { cn } from '../lib/utils';

interface MorningBriefProps {
  text: string;
  isExpanded: boolean;
  onToggle: () => void;
}

export const MorningBrief: React.FC<MorningBriefProps> = ({ text, isExpanded, onToggle }) => {
  return (
    <div
      className={cn(
        "bg-bg-card border border-border-subtle rounded-2xl p-6 cursor-pointer transition-all hover:border-border-active group",
        isExpanded ? "shadow-2xl shadow-accent-blue/5" : ""
      )}
      onClick={onToggle}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-mono text-[10px] text-text-secondary uppercase tracking-widest">Morning Brief</h3>
        <span className="text-[10px] font-mono text-text-faint uppercase group-hover:text-text-secondary transition-colors">
          {isExpanded ? 'Collapse' : 'Expand'}
        </span>
      </div>
      <p className={cn(
        "text-lg leading-relaxed transition-all duration-500",
        isExpanded ? "" : "line-clamp-1"
      )}>
        {text || "Analyzing yesterday's activity..."}
      </p>
    </div>
  );
};
