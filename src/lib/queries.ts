import { supabase } from './supabase';

// Shared match-finding logic used by both getTopMatch and getDashboardStats
async function fetchMatchData() {
  const [{ data: buyers }, { data: providers }] = await Promise.all([
    supabase.from('buyers').select('*, buyer_needs(*)').eq('buyer_needs.filled', false),
    supabase.from('providers').select('*').not('territory_id', 'is', null),
  ]);
  return { buyers: buyers || [], providers: providers || [] };
}

function findAllMatches(buyers: any[], providers: any[]) {
  const matches: { provider: any; buyer: any; niche: string }[] = [];
  for (const buyer of buyers) {
    const needs = buyer.buyer_needs?.filter((n: any) => !n.filled) || [];
    for (const need of needs) {
      const provider = providers.find(
        p => p.niche?.toLowerCase() === need.niche?.toLowerCase() && p.territory_id === buyer.territory_id
      );
      if (provider) {
        matches.push({ provider, buyer, niche: need.niche as string });
      }
    }
  }
  return matches;
}

export async function getTopMatch() {
  const { buyers, providers } = await fetchMatchData();
  const matches = findAllMatches(buyers, providers);
  return matches.length > 0 ? matches[0] : null;
}

export async function getTerritories() {
  const { data, error } = await supabase.from('territories').select('*');
  if (error) throw error;
  return data;
}

export async function getProviders() {
  const { data, error } = await supabase.from('providers').select('*');
  if (error) throw error;
  return data;
}

export async function getBuyers() {
  const { data, error } = await supabase.from('buyers').select('*, buyer_needs(*)');
  if (error) throw error;
  return data;
}

export async function getActionItems() {
  const { data, error } = await supabase.from('action_items')
    .select('*')
    .eq('done', false)
    .order('priority', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getTranscripts() {
  const { data, error } = await supabase.from('transcripts').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getDashboardStats() {
  const MONTHLY_RATE = 297;
  const [providerRes, buyerRes, introRes, territoryRes, activeRes, matchData] = await Promise.all([
    supabase.from('providers').select('id', { count: 'exact' }),
    supabase.from('buyers').select('id', { count: 'exact' }),
    supabase.from('introductions').select('id', { count: 'exact' }),
    supabase.from('territories').select('id', { count: 'exact' }),
    supabase.from('providers').select('id', { count: 'exact' }).eq('stage', 'active'),
    fetchMatchData(),
  ]);

  const activeCount = activeRes.count || 0;
  const openMatches = findAllMatches(matchData.buyers, matchData.providers).length;

  return {
    providers: providerRes.count || 0,
    buyers: buyerRes.count || 0,
    introductions: introRes.count || 0,
    territories: territoryRes.count || 0,
    mrr: activeCount * MONTHLY_RATE,
    openMatches,
  };
}

export async function deleteProvider(id: string) {
  const { error } = await supabase.from('providers').delete().eq('id', id);
  if (error) throw error;
}

export async function deleteBuyer(id: string) {
  const { error } = await supabase.from('buyers').delete().eq('id', id);
  if (error) throw error;
}

export async function markActionDone(id: string) {
  const { error } = await supabase.from('action_items').update({ done: true }).eq('id', id);
  if (error) throw error;
}

export async function logContact(entityId: string, entityType: 'provider' | 'buyer') {
  const table = entityType === 'provider' ? 'providers' : 'buyers';
  const { error } = await supabase.from(table).update({ last_contact: new Date().toISOString() }).eq('id', entityId);
  if (error) throw error;
}
