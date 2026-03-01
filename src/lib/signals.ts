export type NicheStatus = 'match' | 'gap' | 'orphan' | 'empty';

export function computeTerritorySignals(territory: any, providers: any[], buyers: any[]) {
  const niches = ['handyman', 'hvac', 'plumbing', 'cleaning', 'electrical'];
  
  const territoryProviders = providers.filter(p => p.territory_id === territory.id);
  const territoryBuyers = buyers.filter(b => b.territory_id === territory.id);

  const nicheStatus = niches.map(niche => {
    const hasProvider = territoryProviders.some(p => p.niche === niche);
    const hasDemand = territoryBuyers.some(b => b.buyer_needs?.some((bn: any) => bn.niche === niche && !bn.filled));
    
    let status: NicheStatus = 'empty';
    if (hasProvider && hasDemand) status = 'match';
    else if (!hasProvider && hasDemand) status = 'gap';
    else if (hasProvider && !hasDemand) status = 'orphan';

    return { niche, status, hasProvider, hasDemand };
  });

  const matchesCount = nicheStatus.filter(s => s.status === 'match').length;
  const gapsCount = nicheStatus.filter(s => s.status === 'gap').length;

  let signal = 'COLD';
  if (gapsCount >= 2) signal = 'BUILD';
  else if (matchesCount >= 2) signal = 'GROW';
  else if (gapsCount > 0 || matchesCount > 0) signal = 'WATCH';

  return {
    ...territory,
    nicheStatus,
    signal,
    buyerCount: territoryBuyers.length,
    providerCount: territoryProviders.length,
    flywheel: (matchesCount / niches.length) * 100
  };
}
