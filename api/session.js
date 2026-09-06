// Vercel serverless function — the free replacement for the Firebase blocking
// function approach. Firebase Cloud Functions (even ones that would cost $0 at
// this app's traffic) require the paid Blaze plan just to deploy; this runs on
// Vercel's free tier instead, which the app is already hosted on.
//
// What it does: verifies a Firebase ID token server-side, then mints a
// short-lived Supabase-compatible JWT (signed with Supabase's own JWT secret,
// not Firebase's) carrying `sub: <firebase uid>` and `role: authenticated`.
// PostgREST decodes that with the same secret and switches to the
// `authenticated` Postgres role, so `auth.jwt() ->> 'sub'` in the RLS
// policies (supabase/migrations/0002, 0003) resolves to the Firebase UID —
// identical end result to Supabase's Third-Party Auth feature, without
// needing that feature or any Firebase-side function at all.
//
// Cannot be abused to mint a token for someone else's account: verifyIdToken
// cryptographically checks the token was issued by Firebase for this exact
// project and hasn't expired, so the minted token's `sub` can only ever be
// the uid the caller already authenticated as with Firebase.
//
// Required Vercel env vars (Project Settings -> Environment Variables — do
// NOT prefix these with VITE_, or they'd ship to the browser):
//   FIREBASE_PROJECT_ID    - e.g. codingleague-e7dd9 (not secret)
//   FIREBASE_CLIENT_EMAIL  - from a Firebase service account JSON
//   FIREBASE_PRIVATE_KEY   - from the same JSON (keep the \n sequences as-is;
//                            they're unescaped below)
//   SUPABASE_JWT_SECRET    - Supabase Dashboard -> Project Settings -> API ->
//                            JWT Settings -> JWT Secret (legacy HS256 secret)
//
// See supabase/MIGRATIONS.md for how to obtain each of these.

import jwt from 'jsonwebtoken';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    }),
  });
}

const SUPABASE_SESSION_TTL_SECONDS = 55 * 60; // under a Firebase ID token's 1h lifetime

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
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
  } catch {
    res.status(401).json({ error: 'Invalid or expired Firebase ID token' });
    return;
  }

  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    res.status(500).json({ error: 'Server misconfigured: SUPABASE_JWT_SECRET not set' });
    return;
  }

  const now = Math.floor(Date.now() / 1000);
  const exp = now + SUPABASE_SESSION_TTL_SECONDS;
  const token = jwt.sign(
    { sub: decoded.uid, role: 'authenticated', aud: 'authenticated', iat: now, exp },
    secret,
    { algorithm: 'HS256' }
  );

  res.status(200).json({ access_token: token, expires_at: exp * 1000 });
}
