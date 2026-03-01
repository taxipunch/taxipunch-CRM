import React from 'react';
import { cn } from '../lib/utils';

interface NicheCellProps {
  status: 'match' | 'gap' | 'orphan' | 'empty';
  hasProvider: boolean;
  hasDemand: boolean;
  niche: string;
}

export const NicheCell: React.FC<NicheCellProps> = ({ status, hasProvider, hasDemand, niche }) => {
  const statusColors = {
    match: 'bg-accent-green/10 border-accent-green',
    gap: 'bg-accent-red/10 border-accent-red',
    orphan: 'bg-accent-yellow/10 border-accent-yellow',
    empty: 'bg-bg-card border-border-subtle',
  };

  return (
    <div className={cn(
      "h-10 w-full border rounded flex items-center justify-between px-2 relative group",
      statusColors[status]
    )}>
      <span className="font-mono text-[10px] uppercase tracking-tighter opacity-60 truncate">
        {niche.substring(0, 4)}
      </span>
      <div className="flex gap-1">
        <div className={cn(
          "w-1.5 h-1.5 rounded-full",
          hasProvider ? "bg-accent-green" : "bg-text-faint"
        )} />
        <div className={cn(
          "w-1.5 h-1.5 rounded-full",
          hasDemand ? "bg-accent-red" : "bg-text-faint"
        )} />
      </div>
      
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20">
        <div className="bg-bg-surface border border-border-mid px-2 py-1 rounded text-[10px] font-mono whitespace-nowrap">
          {niche}: {status}
        </div>
      </div>
    </div>
  );
};
