import { supabase } from './supabase';

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
  const [providers, buyers, introductions, territories, activeProviders] = await Promise.all([
    supabase.from('providers').select('id', { count: 'exact' }),
    supabase.from('buyers').select('id', { count: 'exact' }),
    supabase.from('introductions').select('id', { count: 'exact' }),
    supabase.from('territories').select('id', { count: 'exact' }),
    supabase.from('providers').select('id', { count: 'exact' }).eq('stage', 'active'),
  ]);

  const activeCount = activeProviders.count || 0;

  return {
    providers: providers.count || 0,
    buyers: buyers.count || 0,
    introductions: introductions.count || 0,
    territories: territories.count || 0,
    mrr: activeCount * MONTHLY_RATE,
    openMatches: 0 // Placeholder
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
