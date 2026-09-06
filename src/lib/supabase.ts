import { createClient } from '@supabase/supabase-js';
import { auth } from './firebase';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string;
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
}

// Bridges Firebase Auth into Supabase RLS — without Supabase's Third-Party
// Auth feature or a Firebase Cloud Function, both of which would need the
// paid Firebase Blaze plan just to set up. Instead /api/session (a free
// Vercel serverless function, see api/session.js) verifies the Firebase ID
// token and mints a short-lived Supabase-compatible JWT. RLS policies read
// the Firebase UID via `auth.jwt() ->> 'sub'` either way — they don't know or
// care which bridge produced the token.
let cached: { token: string; expiresAt: number } | null = null;
let inflight: Promise<string | null> | null = null;

async function fetchSupabaseToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) { cached = null; return null; }

  // 60s safety margin so a token never gets used right up against expiry.
  if (cached && Date.now() < cached.expiresAt - 60_000) return cached.token;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      if (!res.ok) { cached = null; return null; }
      const data = await res.json();
      cached = { token: data.access_token, expiresAt: data.expires_at };
      return cached.token;
    } catch {
      cached = null;
      return null;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  accessToken: fetchSupabaseToken,
});
