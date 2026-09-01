# Supabase security runbook

Fixes the two Supabase advisor findings on project `niuskdszahvvumwzknow`:
`rls_disabled_in_public` and `sensitive_columns_exposed`.

All the code and SQL this runbook needs is already written and committed.
What's left is dashboard/CLI actions that need your credentials — nobody else
can do these for you. Follow the steps **in order**; skipping ahead breaks
the live site (see "Why order matters" below).

## Why this wasn't a one-line fix

Auth is **Firebase**. The database is **Supabase**. Nothing bridged the two,
so from Postgres' point of view every request was the anonymous role —
`auth.uid()` was always `NULL`. That meant there was no identity to write a
useful RLS policy against, which is why RLS was off. `VITE_SUPABASE_ANON_KEY`
is public by design (it ships in the JS bundle) — that's only safe once RLS
is on. With RLS off it was effectively an admin credential handed to every
visitor: anyone could read, edit, or delete any row via the REST API,
regardless of the admin gate in `src/components/auth/AdminRoute.tsx` (that's
a client-side React redirect — it hides UI, it doesn't stop API calls).

## What's already done (this PR)

- `supabase/migrations/0001_rls_emergency_lockdown.sql` — RLS on all 8 tables,
  public SELECT only. No write policies yet, so all writes deny by default.
- `supabase/migrations/0002_rls_firebase_identity.sql` — maps
  `auth.jwt()->>'sub'` (the Firebase UID, via Supabase Third-Party Auth) to
  `participants.uid`; self/admin write policies; a trigger that stops a user
  from granting themselves `role: 'admin'` or editing their own rating
  through the self-update policy; revokes `email`/`phone` from `anon`.
- `supabase/migrations/0003_registration_rpcs.sql` — two RPCs the
  registration flow needs once direct counter/announcement writes are
  admin-only: `claim_founding_member()` and `announce_founding_member()`.
- `src/lib/supabase.ts` — sends the Firebase ID token on every Supabase
  request (`accessToken` option), which is what makes `auth.jwt()` resolve in
  `0002`'s policies.
- `src/lib/db.ts` — `getBasicParticipants()` (public Leaderboard, dashboard
  widgets) no longer requests `email`, since `0002` revokes that column from
  `anon`.
- `src/pages/admin/ManageCertificates.tsx` — switched from
  `getBasicParticipants()` to `getParticipants()`, the admin-only column set
  that still includes `email` (this page emails certificates to
  participants — it broke when `email` came out of the public list above).
- `src/pages/auth/Register.tsx` — registration used to write directly to
  `counters` and `announcements` from the browser (`generateParticipantId()`,
  `reserveFoundingRank()`, the founding-member announcement). Those tables
  are admin-only under `0002`, so registration would have started failing for
  every new signup the moment RLS went on. Rewired to call `next_counter()`,
  `claim_founding_member()`, and `announce_founding_member()` instead — same
  behavior, but atomic and server-verified rather than a client-trusted
  read-then-write (which also had a pre-existing race: two signups could
  land on the same participant ID or founding-member rank).
- `functions/` — a Firebase Cloud Functions scaffold with the one function
  step 3 below needs.

`npx tsc --noEmit` and `npm run build` both pass with these changes.

## Why order matters

Steps 1–5 must land in order before writes work again. Applying `0002`/`0003`
before steps 2–4 (the Firebase side) leaves every request arriving as `anon`
— none of the `to authenticated` policies match, and every write in the app
starts failing, including registration and every admin panel.

### Step 1 — Apply `0001` now

This is the one urgent step: it closes the "anyone can delete all your data"
hole immediately, and is safe to run before anything else.

Supabase Dashboard → your project → SQL Editor → paste the contents of
[`0001_rls_emergency_lockdown.sql`](migrations/0001_rls_emergency_lockdown.sql)
→ Run.

Reads (leaderboard, profiles, contests, certificate verification) keep
working. **Writes go down** — registration, profile edits, every admin panel
— until step 5. If that outage isn't acceptable, do steps 2–4 first, then
apply `0001`, `0002`, and `0003` back to back in one sitting instead.

### Step 2 — Enable Firebase as a Supabase auth provider

Supabase Dashboard → your project → Authentication → Sign In / Providers →
Third-Party Auth → Add provider → Firebase → enter project ID
`codingleague-e7dd9` (from `VITE_FIREBASE_PROJECT_ID` in your `.env`) → Save.

### Step 3 — Deploy the Firebase blocking function

Supabase reads which Postgres role to run a query as from the JWT's `role`
claim. Firebase doesn't set one on its ID tokens by default, so without this
function every request still arrives as `anon` even after step 2.
`functions/index.js` (already written) adds it on every sign-in.

This needs the Blaze (pay-as-you-go) plan — blocking functions require it,
even at zero traffic cost for a project this size. From the repo root:

```
npm install -g firebase-tools      # if you don't have it
firebase login
cd functions && npm install && cd ..
firebase deploy --only functions
```

`.firebaserc` already points at `codingleague-e7dd9`, and `firebase.json`
already points at the `functions/` folder — no prompts to answer beyond your
Google login.

Verify: sign out and back in on the live site, then in Firebase Console →
Authentication → Users → your user → check the "Custom Claims" field shows
`{"role":"authenticated"}`.

### Step 4 — Deploy the frontend with the new `supabase.ts`

Whatever your normal deploy is (`vercel.json` is in the repo root, so likely
a Vercel deploy on push to `main` — merge/push this branch and let it run).
This ships the `accessToken` bridge in `src/lib/supabase.ts`; without it,
steps 2–3 have nothing to attach the ID token to.

### Step 5 — Apply `0002` and `0003`

Same SQL Editor as step 1, in order: `0002_rls_firebase_identity.sql`, then
`0003_registration_rpcs.sql`.

This restores every write path — registration, profile edits, admin panels —
now scoped to the signed-in user's own row (or to admins), and closes the
`sensitive_columns_exposed` finding for logged-out visitors.

## Verifying

From a browser console on the live site, **logged out**:

```js
// works — public leaderboard columns
await supabase.from('participants').select('uid, full_name').limit(1);
// email/phone should now be refused
await supabase.from('participants').select('email').limit(1);
// must NOT delete anything
await supabase.from('participants').delete().neq('uid', '');
```

Then, **logged in as a normal participant**: confirm your own profile edit
still saves, and that a fresh registration through `/register` completes
(including the founding-member flow, if the program is currently enabled in
Settings).

Then, **logged in as admin**: confirm the admin panels (Manage Users,
Manage Contests, Manage Certificates, Founding Member Settings) still read
and write correctly.

Finally: Supabase Dashboard → Advisors → Security — both findings should
clear (may take a few minutes to re-scan).

## Known remaining gap — not closed by this PR

`0002`'s column revoke only applies to the `anon` role. Any *signed-in*
participant can still read every other participant's `email`/`phone` by
calling the REST API directly for the `participants` table (column grants
aren't row-aware, so the `authenticated` role's grant can't distinguish "my
own row" from "someone else's row" the way the row-level policies can).

Closing this needs a `public_participants` view (no `email`/`phone`) that the
leaderboard and profile pages query instead of the base table, with the base
table itself locked down to self/admin only. That's a larger schema change
than this PR — worth a follow-up if participant PII exposure to other
logged-in members (not the open internet) is a concern for your threat model.
