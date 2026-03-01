import React, { useState, useEffect } from 'react';
import { getDashboardStats } from '../lib/queries';
import { format } from 'date-fns';
import { MorningBrief } from '../components/MorningBrief';
import { RecommendationCard } from '../components/RecommendationCard';
import { MilestoneBar } from '../components/MilestoneBar';
import { StatsGrid } from '../components/StatsGrid';

interface DashboardProps {
  navigate: (screen: string, context?: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ navigate }) => {
  const [stats, setStats] = useState<any>(null);
  const [brief, setBrief] = useState<string>('');
  const [isBriefExpanded, setIsBriefExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [sData, bData] = await Promise.all([
          getDashboardStats(),
          // In a real app, we'd fetch recent activity first
          Promise.resolve("Yesterday was productive. 3 new transcripts reviewed.")
        ]);
        setStats(sData);
        setBrief(bData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <header className="mb-12">
        <span className="font-mono text-[10px] text-text-secondary uppercase tracking-[0.3em] block mb-2">
          {format(new Date(), 'EEEE · MMMM do, yyyy')}
        </span>
        <h2 className="text-4xl md:text-6xl">Good morning, Joseph.</h2>
      </header>

      {/* Morning Brief */}
      <section className="mb-12">
        <MorningBrief 
          text={brief} 
          isExpanded={isBriefExpanded} 
          onToggle={() => setIsBriefExpanded(!isBriefExpanded)} 
        />
      </section>

      {/* Recommendation Card */}
      <section className="mb-12">
        <RecommendationCard 
          title="Introduce John's HVAC to Loyalsock Property Management"
          description="Loyalsock just flagged an urgent HVAC need for 40 units. John has a 100% response rate and is active in that territory. This intro has a high probability of conversion to MRR."
          onClick={() => navigate('NEXT_ACTIONS', { filterType: 'MATCH' })}
        />
      </section>

      {/* Milestone Bar */}
      <section className="mb-12">
        <MilestoneBar 
          currentMilestone="First Provider Yes"
          progress={33}
          onClick={() => navigate('ROADMAP')}
        />
      </section>

      {/* Stats Grid */}
      <section>
        <StatsGrid stats={stats} />
      </section>
    </div>
  );
};
