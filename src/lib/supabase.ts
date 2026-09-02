import { createClient } from '@supabase/supabase-js';
import { auth } from './firebase';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string;
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  // Bridges Firebase Auth into Supabase (Supabase "Third-Party Auth").
  // Every PostgREST request carries the current Firebase ID token, so
  // `auth.jwt() ->> 'sub'` resolves to the Firebase UID inside RLS policies.
  // Requires: Firebase enabled as a Supabase third-party auth provider, and a
  // Firebase blocking function that stamps the `role: "authenticated"` claim
  // (see supabase/MIGRATIONS.md). Until both are done, requests still reach
  // Postgres as `anon`.
  accessToken: async () => (await auth.currentUser?.getIdToken()) ?? null,
});
