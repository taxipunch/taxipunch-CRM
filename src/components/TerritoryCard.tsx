import React from 'react';
import { Territory } from '../types';
import { NicheCell } from './NicheCell';

interface TerritoryCardProps {
  territory: Territory;
  onClick: () => void;
}

export const TerritoryCard: React.FC<TerritoryCardProps> = ({ territory, onClick }) => {
  const signalColors: Record<string, string> = {
    BUILD: 'text-accent-red border-accent-red/30',
    GROW: 'text-accent-green border-accent-green/30',
    WATCH: 'text-accent-yellow border-accent-yellow/30',
    COLD: 'text-text-muted border-border-subtle',
  };

  return (
    <div 
      onClick={onClick}
      className="bg-bg-card border border-border-subtle p-4 rounded-xl hover:bg-bg-card-hover transition-all cursor-pointer group"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl leading-tight">{territory.name}</h3>
          <span className="font-mono text-xs text-text-secondary uppercase">{territory.zone}</span>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className={`px-2 py-0.5 rounded border text-[10px] font-mono ${signalColors[territory.signal]}`}>
            {territory.signal}
          </div>
          <div className="font-mono text-[10px] text-text-muted">
            B {territory.buyerCount} · P {territory.providerCount}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-end mb-1">
          <span className="font-mono text-[10px] text-text-secondary uppercase">Flywheel</span>
          <span className="font-mono text-[10px] text-accent-green">{Math.round(territory.flywheel)}%</span>
        </div>
        <div className="h-1 bg-border-subtle rounded-full overflow-hidden">
          <div 
            className="h-full bg-accent-green transition-all duration-500" 
            style={{ width: `${territory.flywheel}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-5 gap-1">
        {territory.nicheStatus.map((n) => (
          <NicheCell key={n.niche} {...n} />
        ))}
      </div>
      
      {territory.signal === 'BUILD' && (
        <div className="mt-4 flex gap-1">
          <div className="w-2 h-2 rounded-full bg-accent-green" />
          <div className="w-2 h-2 rounded-full bg-accent-green" />
          <span className="font-mono text-[10px] text-accent-green uppercase ml-1">Build Signal</span>
        </div>
      )}
    </div>
  );
};
