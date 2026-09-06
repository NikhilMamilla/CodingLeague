import { createClient } from '@supabase/supabase-js';
import { auth } from './firebase';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string;
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
}

// Bridges Firebase Auth into Supabase RLS. Supabase's Third-Party Auth
// verifies the Firebase ID token correctly on its own (confirmed live), but
// PostgREST picks the Postgres role to run a query as from the JWT's `role`
// claim, and Firebase tokens don't have one — confirmed live too, every
// request was landing as `anon` regardless of who was logged in. Firebase
// custom claims fix this: once a user's account has `role: "authenticated"`
// set via the Admin SDK, their tokens carry it and PostgREST reads it
// correctly. /api/ensure-role-claim.js sets that claim (a free Vercel
// function, not a paid Firebase Cloud Function). This only needs to happen
// once per uid per session — after that, the claim is already on every token
// Firebase issues until sign-out.
let ensuredForUid: string | null = null;
let ensuring: Promise<void> | null = null;

async function getAuthenticatedToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) { ensuredForUid = null; return null; }

  if (ensuredForUid === user.uid) {
    return user.getIdToken();
  }

  if (!ensuring) {
    ensuring = (async () => {
      const result = await user.getIdTokenResult();
      if (result.claims.role === 'authenticated') return;

      try {
        await fetch('/api/ensure-role-claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: result.token }),
        });
      } catch {
        // Network hiccup — fall through. Worst case this request still goes
        // out as `anon`, which RLS handles safely (it just denies), not a
        // security risk either way.
      }

      await user.getIdToken(true); // force-refresh to pick up the new claim
    })();
  }

  try {
    await ensuring;
  } finally {
    ensuring = null;
  }
  ensuredForUid = user.uid;
  return user.getIdToken();
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  accessToken: getAuthenticatedToken,
});

// Temporary debug hook — see supabase/migrations/0004_debug_whoami.sql.
// Remove both once the RLS rollout in supabase/MIGRATIONS.md is confirmed
// working end to end.
if (typeof window !== 'undefined') {
  (window as any).__supabase = supabase;
}
