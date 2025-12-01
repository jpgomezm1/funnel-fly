import { createClient } from '@supabase/supabase-js';

// Irrelevant Hub Supabase connection
// Using Service Role Key for internal dashboard access (bypasses RLS)
const HUB_SUPABASE_URL = import.meta.env.VITE_HUB_SUPABASE_URL;
const HUB_SUPABASE_SERVICE_KEY = import.meta.env.VITE_HUB_SUPABASE_SERVICE_KEY;

if (!HUB_SUPABASE_URL || !HUB_SUPABASE_SERVICE_KEY) {
  console.warn('Hub Supabase environment variables not configured. Hub features will not work.');
}

export const hubSupabase = HUB_SUPABASE_URL && HUB_SUPABASE_SERVICE_KEY
  ? createClient(HUB_SUPABASE_URL, HUB_SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

// Types for Hub data
export interface HubProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  country: string;
  company: string;
  position: string;
  created_at: string;
  updated_at: string;
  stack_generator_uses: number;
  tool_comparator_uses: number;
  impact_analyzer_uses: number;
  ai_assistant_uses: number;
  last_activity_at: string | null;
  lead_score: number;
  lead_status: string;
  terms_accepted: boolean;
  terms_accepted_at: string | null;
  privacy_accepted: boolean;
  privacy_accepted_at: string | null;
  consent_ip_address: string | null;
  marketing_consent: boolean;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  source: string;
  subscribed_at: string;
  is_active: boolean;
}
