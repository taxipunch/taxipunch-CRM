import React from 'react';
import { ArrowRight, TrendingUp } from 'lucide-react';

interface RecommendationCardProps {
  title: string;
  description: string;
  onClick: () => void;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({ title, description, onClick }) => {
  return (
    <div className="bg-accent-green/5 border border-accent-green/30 rounded-2xl p-5 md:p-8 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
        <TrendingUp size={120} />
      </div>

      <div className="relative z-10 max-w-2xl">
        <span className="font-mono text-[10px] text-accent-green uppercase tracking-widest block mb-4">Recommended Move</span>
        <h3 className="text-2xl md:text-4xl mb-4">{title}</h3>
        <p className="text-text-secondary text-lg mb-8 leading-relaxed">
          {description}
        </p>
        <button
          onClick={onClick}
          className="bg-accent-green text-bg-base font-mono text-xs font-bold px-8 py-3 rounded-full uppercase tracking-wider flex items-center gap-2 hover:scale-105 transition-transform"
        >
          Do This Now <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};
