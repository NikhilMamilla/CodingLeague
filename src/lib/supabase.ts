import { createClient } from '@supabase/supabase-js';
import { auth } from './firebase';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string;
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  // Bridges Firebase Auth into Supabase via Supabase's native "Third-Party
  // Auth" support (Dashboard -> Authentication -> Sign In / Providers ->
  // Third-Party Auth -> Firebase). Supabase verifies this token directly
  // against Firebase's own public keys and treats it as `authenticated` — no
  // signing secret of ours involved, so nothing here can be broken by
  // Supabase rotating its own JWT signing keys, and no Firebase Cloud
  // Function or paid plan is needed. auth.jwt() ->> 'sub' in the RLS
  // policies (supabase/migrations/0002, 0003) resolves to the Firebase UID.
  accessToken: async () => (await auth.currentUser?.getIdToken()) ?? null,
});
