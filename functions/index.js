/**
 * Firebase Auth blocking function — the bridge that lets Supabase trust
 * Firebase ID tokens.
 *
 * Supabase's PostgREST reads the Postgres role to run queries as from the
 * JWT's `role` claim. Firebase never sets one on its ID tokens, so without
 * this every request from src/lib/supabase.ts (see its `accessToken` option)
 * arrives at Postgres as `anon` — the RLS policies in
 * supabase/migrations/0002_rls_firebase_identity.sql that say
 * `to authenticated` never match, and writes silently fail as if the user
 * were logged out.
 *
 * This runs on every sign-in (not just sign-up) so a user who was signed in
 * before this function existed also gets the claim on their next sign-in.
 *
 * Deploy steps are in ../supabase/MIGRATIONS.md.
 */
const { beforeUserSignedIn } = require('firebase-functions/v2/identity');

exports.addSupabaseRoleClaim = beforeUserSignedIn(() => {
  return {
    customClaims: { role: 'authenticated' },
  };
});
