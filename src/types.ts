// Single source of truth for all app-level types

export interface Territory {
  id: string;
  name: string;
  zone: string;
  signal: string;
  buyerCount: number;
  providerCount: number;
  flywheel: number;
  nicheStatus: {
    niche: string;
    status: 'match' | 'gap' | 'orphan' | 'empty';
    hasProvider: boolean;
    hasDemand: boolean;
  }[];
}

export interface Provider {
  id: string;
  name: string;
  business_name: string;
  niche: string;
  tier: string;
  stage: string;
  last_contact: string;
  review_score?: number;
  review_count?: number;
  address?: string;
  quality_score?: number;
  current_website_url?: string;
  phone?: string;
  email?: string;
  google_business_url?: string;
  website_status?: string;
  is_franchise?: boolean;
  is_disqualified?: boolean;
  notes?: string;
  source?: string;
  website_built_url?: string;
  one_sheet?: string;
}

export interface Buyer {
  id: string;
  org_name: string;
  contact_name: string;
  property_type: string;
  units: number;
  stage: string;
  last_contact: string;
  phone?: string;
  email?: string;
  notes?: string;
  source?: string;
}

export interface ActionItem {
  id: string;
  type: 'transcript_review' | 'match_ready' | 'followup_due' | 'niche_signal' | 'intro_confirm';
  priority: 'high' | 'medium' | 'low';
  title: string;
  summary: string;
  entity_id?: string;
  secondary_entity_id?: string;
  done: boolean;
}
