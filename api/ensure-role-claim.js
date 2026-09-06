// Vercel serverless function (free tier).
//
// What's happening: Supabase's Third-Party Auth successfully verifies our
// Firebase ID tokens (confirmed live — auth.jwt() ->> 'sub' resolves
// correctly), but PostgREST decides which Postgres role to run a query as by
// reading the JWT's `role` claim, and Firebase ID tokens don't have one.
// Confirmed live too: `auth.jwt() ->> 'role'` comes back as the literal
// string "anon" for every request — PostgREST's fallback when no role claim
// is present — so every request runs as `anon`, not `authenticated`, no
// matter who's logged in.
//
// The fix Firebase supports for exactly this is a custom claim: once a
// user's Firebase account has `role: "authenticated"` set via the Admin SDK,
// every ID token they get afterward includes it at the top level, and
// PostgREST picks it up correctly. Setting a custom claim is a plain Admin
// SDK call — unlike a blocking function, it does NOT require Firebase's paid
// Blaze plan; it just needs valid Admin SDK credentials, which is what this
// function provides on Vercel's free tier instead.
//
// Cannot be used to claim someone else's account: verifyIdToken
// cryptographically confirms the token was issued by Firebase for this
// project and is unexpired, and the claim is only ever set on that token's
// own uid — never on a client-supplied one.
//
// Required Vercel env vars (Project Settings -> Environment Variables — do
// NOT prefix with VITE_, they must never reach the browser):
//   FIREBASE_PROJECT_ID    - e.g. codingleague-e7dd9 (not secret)
//   FIREBASE_CLIENT_EMAIL  - from a Firebase service account JSON
//   FIREBASE_PRIVATE_KEY   - from the same JSON (\n sequences unescaped below)
//
// See supabase/MIGRATIONS.md for where to get these.

import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Deliberately not run at module load time: a bad/missing env var throwing
// here (rather than inside the handler's try/catch below) crashes the whole
// function before it can return a JSON body, so the client just sees a bare
// 500 with no way to tell what's actually wrong.
function ensureFirebaseAdmin() {
  if (getApps().length) return;

  const projectId   = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey  = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

  const missing = [
    !projectId   && 'FIREBASE_PROJECT_ID',
    !clientEmail && 'FIREBASE_CLIENT_EMAIL',
    !privateKey  && 'FIREBASE_PRIVATE_KEY',
  ].filter(Boolean);
  if (missing.length) {
    throw new Error(`Missing Vercel env var(s): ${missing.join(', ')}`);
  }
  if (!privateKey.includes('BEGIN PRIVATE KEY')) {
    throw new Error('FIREBASE_PRIVATE_KEY does not look like a PEM key — check it was pasted in full, including the BEGIN/END lines');
  }

  initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    ensureFirebaseAdmin();
  } catch (err) {
    res.status(500).json({ error: 'Server misconfigured', detail: String(err?.message ?? err) });
    return;
  }

  const idToken = req.body?.idToken;
  if (!idToken || typeof idToken !== 'string') {
    res.status(400).json({ error: 'Missing idToken' });
    return;
  }

  let decoded;
  try {
    decoded = await getAuth().verifyIdToken(idToken);
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired Firebase ID token', detail: String(err?.message ?? err) });
    return;
  }

  // Already set — skip the extra Admin API round trip.
  if (decoded.role === 'authenticated') {
    res.status(200).json({ updated: false });
    return;
  }

  try {
    const user = await getAuth().getUser(decoded.uid);
    await getAuth().setCustomUserClaims(decoded.uid, {
      ...(user.customClaims || {}),
      role: 'authenticated',
    });
    res.status(200).json({ updated: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to set custom claim', detail: String(err) });
  }
}
