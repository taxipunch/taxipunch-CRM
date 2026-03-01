import React from 'react';
import { Provider } from '../types';

interface ProviderCardProps {
  provider: Provider;
  onClick?: () => void;
}

export const ProviderCard: React.FC<ProviderCardProps> = ({ provider, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="bg-bg-card border border-border-subtle p-4 rounded-xl hover:bg-bg-card-hover transition-all cursor-pointer"
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-xl">{provider.name}</h4>
        <span className="font-mono text-[10px] text-accent-green uppercase border border-accent-green/30 px-2 py-0.5 rounded">
          {provider.niche}
        </span>
      </div>
      <p className="text-text-secondary text-xs font-mono mb-4">{provider.business_name}</p>
      <div className="flex justify-between items-end">
        <span className="font-mono text-[10px] text-text-faint uppercase">Stage: {provider.stage}</span>
        <span className="font-mono text-[10px] text-text-muted uppercase">Last: {provider.last_contact || 'Never'}</span>
      </div>
    </div>
  );
};
