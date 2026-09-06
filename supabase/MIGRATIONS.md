# Supabase security runbook

Fixes the two Supabase advisor findings on project `niuskdszahvvumwzknow`:
`rls_disabled_in_public` and `sensitive_columns_exposed`.

All the code and SQL this runbook needs is already written and committed.
What's left is two dashboard actions that need your credentials — nobody
else can do these for you. Follow the steps **in order**.

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

**How the identity bridge works**: Supabase has native support for trusting
another auth provider's tokens directly — called "Third-Party Auth." Once
Firebase is registered there (Step 1 below), Supabase verifies a Firebase ID
token against Firebase's own public keys and treats the request as
`authenticated`. `src/lib/supabase.ts` just forwards the current Firebase ID
token on every request (`accessToken` option) — no signing secret of ours
involved, no Firebase Cloud Function, no paid plan. Two earlier approaches
were considered and dropped:
- A Firebase *blocking function* to stamp a custom claim — dropped because
  Firebase Cloud Functions require the paid Blaze plan just to deploy, even
  at zero usage cost, and turned out to be unnecessary — Third-Party Auth
  grants `authenticated` on its own, without needing a custom claim.
- A Vercel function that verified the Firebase token and self-signed a
  Supabase-compatible JWT — dropped because it depended on Supabase's legacy
  HS256 JWT secret, which this project has already rotated away from in
  favor of asymmetric signing keys (visible under Project Settings → API →
  JWT Keys). That legacy secret is kept around only so already-issued tokens
  keep validating until they expire — building new infrastructure on it
  would break the moment it's revoked.

## What's already done (this PR)

- `supabase/migrations/0001_rls_emergency_lockdown.sql` — RLS on all 8 tables,
  public SELECT only. No write policies yet, so all writes deny by default.
- `supabase/migrations/0002_rls_firebase_identity.sql` — maps
  `auth.jwt()->>'sub'` (the Firebase UID) to `participants.uid`; self/admin
  write policies; a trigger that stops a user from granting themselves
  `role: 'admin'` or editing their own rating through the self-update policy;
  revokes `email`/`phone` from `anon`.
- `supabase/migrations/0003_registration_rpcs.sql` — two RPCs the
  registration flow needs once direct counter/announcement writes are
  admin-only: `claim_founding_member()` and `announce_founding_member()`.
- `src/lib/supabase.ts` — sends the Firebase ID token on every Supabase
  request, which is what makes `auth.jwt()` resolve in `0002`'s policies
  once Step 1 below is done.
- `src/lib/db.ts` — `getBasicParticipants()` (public Leaderboard, dashboard
  widgets) no longer requests `email`, since `0002` revokes that column from
  `anon`.
- `src/pages/admin/ManageCertificates.tsx` — switched from
  `getBasicParticipants()` to `getParticipants()`, the admin-only column set
  that still includes `email` (this page emails certificates to
  participants — it broke when `email` came out of the public list above).
- `src/pages/auth/Register.tsx` — registration used to write directly to
  `counters` and `announcements` from the browser. Those tables are
  admin-only under `0002`, so registration would fail for every new signup
  once RLS is fully on. Rewired to call `next_counter()`,
  `claim_founding_member()`, and `announce_founding_member()` instead.

`npx tsc --noEmit` and `npm run build` both pass with these changes.

## Confirmed impact of the current half-applied state

Only `0001` has been applied to the live database so far (verified directly:
`is_admin()`, `next_counter()`, `claim_founding_member()` don't exist yet in
the live project, and `email` is still readable by `anon`). That means **every
write to every table is currently blocked for everyone, including admins** —
registration, profile edits, CSV contest-result imports, all admin panels.
The last participant record was created 2026-09-01; nobody has been able to
register since. This isn't a bug — it's `0001` doing exactly what it's
supposed to until `0002`/`0003` are applied. The steps below finish that.

## Steps

### Step 1 — Enable Firebase as a Supabase Third-Party Auth provider

Supabase Dashboard → your project → Authentication → Sign In / Providers →
**Third-Party Auth** → Add provider → **Firebase** → enter project ID:
```
codingleague-e7dd9
```
→ Save. That's the entire step — no keys, no secrets, nothing to protect.

### Step 2 — Redeploy the frontend

Vercel Dashboard → your project → Deployments → confirm the latest commit on
`main` is deployed (it should auto-deploy from the push; redeploy manually if
not). This ships the `accessToken` bridge in `src/lib/supabase.ts`.

### Step 3 — Apply `0002` and `0003`

Supabase SQL Editor, in order:
[`0002_rls_firebase_identity.sql`](migrations/0002_rls_firebase_identity.sql),
then
[`0003_registration_rpcs.sql`](migrations/0003_registration_rpcs.sql).

This restores every write path — registration, profile edits, admin panels,
CSV imports — now scoped to the signed-in user's own row (or to admins), and
closes the `sensitive_columns_exposed` finding for logged-out visitors.

## Verifying

**Confirm `0002`/`0003` actually applied** — Supabase Dashboard → Database →
Functions. You should see `is_admin`, `fb_uid`, `next_counter`,
`claim_founding_member`, `announce_founding_member`, `participants_guard`
listed. If they're missing, the SQL Editor run didn't go through.

**Confirm RLS from a browser console, logged out**:

```js
// works — public leaderboard columns
await supabase.from('participants').select('uid, full_name').limit(1);
// email/phone should now be refused
await supabase.from('participants').select('email').limit(1);
// must NOT delete anything
await supabase.from('participants').delete().neq('uid', '');
```

Then, **logged in as a normal participant**: confirm your own profile edit
still saves, and that a fresh registration through `/register` completes.

Then, **logged in as admin**: confirm the CSV import in Manage Contests /
Import Results goes through, and the other admin panels (Manage Users,
Manage Certificates, Founding Member Settings) still read and write
correctly.

Finally: Supabase Dashboard → Advisors → Security — both findings should
clear (may take a few minutes to re-scan).

### If writes still fail with an RLS error after Step 1–3

That would mean Third-Party Auth isn't granting the `authenticated` role the
way expected — tell me and we'll add a diagnostic RPC to see exactly what
`auth.jwt()` looks like server-side for a real logged-in request, rather than
guessing further.

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
