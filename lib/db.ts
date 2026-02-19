import { supabaseAnon, supabaseAdmin } from './supabase';

export interface WaitlistEntry {
  id: number;
  name: string;
  email: string;
  company: string;
  venue_type: string;
  message: string | null;
  created_at: string;
}

export interface AddToWaitlistParams {
  name: string;
  email: string;
  company: string;
  venueType: string;
  message?: string;
}

// No-op: table created via Supabase migrations
export async function initWaitlistTable() {
  return Promise.resolve();
}

// Add entry to waitlist
export async function addToWaitlist(data: AddToWaitlistParams) {
  const { data: result, error } = await supabaseAnon
    .from('waitlist')
    .upsert(
      {
        name: data.name,
        email: data.email,
        company: data.company,
        venue_type: data.venueType,
        message: data.message || null,
        created_at: new Date().toISOString(),
      },
      {
        onConflict: 'email',
        ignoreDuplicates: false,
      }
    )
    .select('id, email')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return result;
}

// Check if email already exists
export async function checkEmailExists(email: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('waitlist')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data !== null;
}

// Get waitlist count
export async function getWaitlistCount(): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from('waitlist')
    .select('*', { count: 'exact', head: true });

  if (error) {
    throw new Error(error.message);
  }

  return count || 0;
}
