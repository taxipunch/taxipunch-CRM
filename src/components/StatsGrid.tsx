import React from 'react';
import { TrendingUp, Users, Map, Link as LinkIcon, DollarSign } from 'lucide-react';
import { cn } from '../lib/utils';

interface StatsGridProps {
  stats: any;
}

export const StatsGrid: React.FC<StatsGridProps> = ({ stats }) => {
  const statItems = [
    { label: 'Relationships', value: (stats?.providers || 0) + (stats?.buyers || 0), icon: Users, color: 'text-accent-blue' },
    { label: 'Open Matches', value: stats?.openMatches || 0, icon: LinkIcon, color: 'text-accent-green' },
    { label: 'Buyers Contacted', value: stats?.buyers || 0, icon: TrendingUp, color: 'text-accent-purple' },
    { label: 'Providers', value: stats?.providers || 0, icon: Users, color: 'text-accent-orange' },
    { label: 'Territories', value: stats?.territories || 0, icon: Map, color: 'text-accent-yellow' },
    { label: 'MRR', value: `$${(stats?.mrr || 0).toLocaleString()}`, icon: DollarSign, color: 'text-accent-green' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {statItems.map((item, i) => (
        <div key={i} className="bg-bg-card border border-border-subtle p-4 rounded-xl hover:bg-bg-card-hover transition-colors min-w-0">
          <div className="flex justify-between items-start mb-3">
            <div className={cn("p-1.5 rounded-lg bg-bg-surface", item.color)}>
              <item.icon size={14} />
            </div>
          </div>
          <div className="text-2xl mb-0.5">{item.value}</div>
          <div className="font-mono text-[9px] text-text-muted uppercase tracking-widest leading-tight">{item.label}</div>
        </div>
      ))}
    </div>
  );
};
