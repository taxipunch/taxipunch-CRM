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

export async function getMilestoneProgress() {
  const MONTHLY_RATE = 297;
  const [activeRes, engagedRes, introRes] = await Promise.all([
    supabase.from('providers').select('id', { count: 'exact' }).eq('stage', 'active'),
    supabase.from('buyers').select('id', { count: 'exact' }).neq('stage', 'prospect'),
    supabase.from('introductions').select('id', { count: 'exact' }),
  ]);

  const activeProviders = activeRes.count || 0;
  const engagedBuyers = engagedRes.count || 0;
  const introductions = introRes.count || 0;
  const mrr = activeProviders * MONTHLY_RATE;

  return { activeProviders, engagedBuyers, introductions, mrr };
}

export async function updateTranscriptStatus(id: string, status: string) {
  const { error } = await supabase.from('transcripts').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function getPendingTranscriptCount() {
  const { count, error } = await supabase.from('transcripts').select('id', { count: 'exact' }).eq('status', 'pending');
  if (error) throw error;
  return count || 0;
}

export async function createTranscript(content: string, source?: string) {
  const record: Record<string, any> = { content, status: 'pending' };
  if (source) record.summary = source; // store source in summary field
  const { data, error } = await supabase.from('transcripts').insert(record).select().single();
  if (error) throw error;
  return data;
}

export async function importTranscriptToCRM(
  transcriptId: string,
  entityType: 'provider' | 'buyer',
  fields: Record<string, any>
) {
  const table = entityType === 'provider' ? 'providers' : 'buyers';
  const record: Record<string, any> = {};

  if (entityType === 'provider') {
    if (fields.name) record.name = fields.name;
    if (fields.business_name) record.business_name = fields.business_name;
    if (fields.niche) record.niche = fields.niche;
    if (fields.phone) record.phone = fields.phone;
    if (fields.email) record.email = fields.email;
    if (fields.address) record.address = fields.address;
    if (fields.notes) record.notes = fields.notes;
    record.stage = 'prospect';
  } else {
    if (fields.name) record.contact_name = fields.name;
    if (fields.business_name) record.org_name = fields.business_name;
    if (fields.phone) record.phone = fields.phone;
    if (fields.email) record.email = fields.email;
    if (fields.notes) record.notes = fields.notes;
    record.stage = 'prospect';
  }

  const { data, error } = await supabase.from(table).insert(record).select().single();
  if (error) throw error;

  // Link transcript to imported entity and mark as imported
  await supabase.from('transcripts').update({
    status: 'imported',
    entity_type: entityType,
    entity_id: data.id,
  }).eq('id', transcriptId);

  return data;
}

export async function saveOneSheet(providerId: string, buyerId: string, niche: string, oneSheet: string) {
  // Try to find existing introduction
  const { data: existing } = await supabase.from('introductions')
    .select('id')
    .eq('provider_id', providerId)
    .eq('buyer_id', buyerId)
    .eq('niche', niche)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from('introductions')
      .update({ one_sheet: oneSheet })
      .eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('introductions')
      .insert({ provider_id: providerId, buyer_id: buyerId, niche, one_sheet: oneSheet, status: 'draft' });
    if (error) throw error;
  }
}

export async function saveProviderOneSheet(providerId: string, oneSheet: string) {
  const { error } = await supabase.from('providers').update({ one_sheet: oneSheet }).eq('id', providerId);
  if (error) throw error;
}

export async function saveIntroductionOneSheet(introductionId: string, oneSheet: string) {
  const { error } = await supabase.from('introductions').update({ one_sheet: oneSheet }).eq('id', introductionId);
  if (error) throw error;
}
