import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
}

export interface Buyer {
  id: string;
  org_name: string;
  contact_name: string;
  property_type: string;
  units: number;
  stage: string;
  last_contact: string;
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
