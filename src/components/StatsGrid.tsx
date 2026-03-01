import React from 'react';
import { TrendingUp, Users, Map, Link as LinkIcon, DollarSign } from 'lucide-react';
import { cn } from '../lib/utils';

interface StatsGridProps {
  stats: any;
}

export const StatsGrid: React.FC<StatsGridProps> = ({ stats }) => {
  const statItems = [
    { label: 'Relationships Built', value: (stats?.providers || 0) + (stats?.buyers || 0), icon: Users, color: 'text-accent-blue' },
    { label: 'Open Matches', value: stats?.openMatches || 0, icon: LinkIcon, color: 'text-accent-green' },
    { label: 'Buyers Contacted', value: stats?.buyers || 0, icon: TrendingUp, color: 'text-accent-purple' },
    { label: 'Providers in Network', value: stats?.providers || 0, icon: Users, color: 'text-accent-orange' },
    { label: 'Territories Active', value: stats?.territories || 0, icon: Map, color: 'text-accent-yellow' },
    { label: 'MRR', value: `$${stats?.mrr || 0}`, icon: DollarSign, color: 'text-accent-green' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {statItems.map((item, i) => (
        <div key={i} className="bg-bg-card border border-border-subtle p-6 rounded-xl hover:bg-bg-card-hover transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className={cn("p-2 rounded-lg bg-bg-surface border border-border-subtle", item.color)}>
              <item.icon size={18} />
            </div>
          </div>
          <div className="text-3xl mb-1">{item.value}</div>
          <div className="font-mono text-[10px] text-text-secondary uppercase tracking-wider">{item.label}</div>
        </div>
      ))}
    </div>
  );
};
