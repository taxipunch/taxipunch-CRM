import React, { useState, useEffect, useCallback } from 'react';
import { getDashboardStats, getTopMatch } from '../lib/queries';
import { generateMorningBrief } from '../lib/ai';
import { format } from 'date-fns';
import { RefreshCw } from 'lucide-react';
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
  const [topMatch, setTopMatch] = useState<any>(null);
  const [isBriefExpanded, setIsBriefExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sData, matchData] = await Promise.all([
        getDashboardStats(),
        getTopMatch(),
      ]);
      setStats(sData);
      setTopMatch(matchData);

      // Generate morning brief from AI with fallback
      try {
        const briefText = await generateMorningBrief(sData);
        setBrief(briefText || `${sData.providers} providers · ${sData.buyers} buyers · $${sData.mrr.toLocaleString()} MRR`);
      } catch {
        setBrief(`${sData.providers} providers · ${sData.buyers} buyers · $${sData.mrr.toLocaleString()} MRR`);
      }
    } catch (err) {
      console.error(err);
      setError("Couldn't load dashboard data. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <header className="mb-6">
        <div className="flex items-baseline gap-3 mb-1">
          <h2 className="text-2xl md:text-3xl">Good morning, Joseph.</h2>
          <span className="font-mono text-[10px] text-text-muted uppercase tracking-[0.2em]">
            {format(new Date(), 'EEEE · MMM do')}
          </span>
        </div>
      </header>

      {/* Error State */}
      {error && (
        <section className="mb-6">
          <div className="flex items-center justify-between p-4 bg-accent-red/5 border border-accent-red/20 rounded-xl">
            <p className="text-sm text-accent-red">{error}</p>
            <button
              onClick={load}
              className="flex items-center gap-2 px-4 py-1.5 bg-accent-red/10 text-accent-red font-mono text-[10px] uppercase tracking-wider rounded-full hover:bg-accent-red/20 transition-colors"
            >
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        </section>
      )}

      {/* Morning Brief */}
      <section className="mb-6">
        {loading ? (
          <div className="h-20 bg-bg-card border border-border-subtle rounded-2xl animate-pulse" />
        ) : (
          <MorningBrief
            text={brief}
            isExpanded={isBriefExpanded}
            onToggle={() => setIsBriefExpanded(!isBriefExpanded)}
          />
        )}
      </section>

      {/* Recommendation Card */}
      <section className="mb-8">
        {loading ? (
          <div className="h-52 bg-bg-card border border-border-subtle rounded-2xl animate-pulse" />
        ) : (
          topMatch ? (
            <RecommendationCard
              title={`Introduce ${topMatch.provider.business_name || topMatch.provider.name} to ${topMatch.buyer.org_name}`}
              description={`${topMatch.buyer.org_name} needs a ${topMatch.niche} provider. ${topMatch.provider.business_name || topMatch.provider.name} is active in that territory.`}
              onClick={() => navigate('NEXT_ACTIONS', { filterType: 'MATCH' })}
            />
          ) : (
            <div className="p-8 text-center border border-dashed border-border-subtle rounded-2xl">
              <p className="font-mono text-xs text-text-muted uppercase tracking-widest">No active matches yet</p>
            </div>
          )
        )}
      </section>

      {/* Milestone Bar */}
      <section className="mb-8">
        <MilestoneBar
          currentMilestone="First Provider Yes"
          progress={33}
          onClick={() => navigate('ROADMAP')}
        />
      </section>

      {/* Stats Grid */}
      <section>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-24 bg-bg-card border border-border-subtle rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <StatsGrid stats={stats} />
        )}
      </section>
    </div>
  );
};
