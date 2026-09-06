# Supabase security runbook

Fixes the two Supabase advisor findings on project `niuskdszahvvumwzknow`:
`rls_disabled_in_public` and `sensitive_columns_exposed`.

All the code and SQL this runbook needs is already written and committed.
What's left is a handful of dashboard actions that need your credentials —
nobody else can do these for you. Follow the steps **in order**.

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

**How the identity bridge works**: `api/session.js` — a free Vercel
serverless function — verifies a Firebase ID token server-side and mints a
short-lived Supabase-compatible JWT (`sub` = Firebase UID, `role` =
`authenticated`), signed with Supabase's own JWT secret. `src/lib/supabase.ts`
fetches one of these before every request. This does the same job as
Supabase's built-in "Third-Party Auth" feature, without needing it — and
without any Firebase Cloud Function, which (even a function that costs
nothing to run) requires enabling Firebase's paid Blaze plan just to deploy.
Everything here runs on tiers you already have for free: Vercel's Hobby plan
and Firebase Admin SDK token verification (a plain API call, not a Cloud
Function).

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
- `api/session.js` — the Vercel serverless function described above.
- `src/lib/supabase.ts` — calls `/api/session` and attaches the resulting
  token to every Supabase request (`accessToken` option), which is what
  makes `auth.jwt()` resolve in `0002`'s policies.
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

### Step 1 — Get a Firebase service account key (free)

Firebase Console → your project (`codingleague-e7dd9`) → ⚙️ Project
Settings → **Service Accounts** tab → **Generate new private key**. This
downloads a JSON file. Nothing here requires Blaze — service accounts and
Admin SDK token verification are on the free Spark plan.

Open that JSON file, you'll need three fields from it: `project_id`,
`client_email`, `private_key`.

**Do not commit this file. Do not put it in `.env`.** It's used only in the
next step, then you can delete the download.

### Step 2 — Get your Supabase JWT secret

Supabase Dashboard → your project → Project Settings → **API** → **JWT
Settings** → copy the **JWT Secret** (may be labeled "Legacy JWT Secret").
This is a different value from the anon key or service role key — it's the
raw secret those keys are *signed with*.

**This value can mint a token for any user, including admins — treat it like
a password.** Never put it in `.env`, never commit it, never prefix it with
`VITE_`.

If your project only shows asymmetric "JWT Signing Keys" with no HS256
secret available at all, tell me — the approach here needs adjusting for
that case.

### Step 3 — Add 4 environment variables in Vercel

Vercel Dashboard → your project → Settings → **Environment Variables** → add
each of these (Production + Preview):

| Name | Value |
|---|---|
| `FIREBASE_PROJECT_ID` | `project_id` from the service account JSON (`codingleague-e7dd9`) |
| `FIREBASE_CLIENT_EMAIL` | `client_email` from the service account JSON |
| `FIREBASE_PRIVATE_KEY` | `private_key` from the service account JSON — paste it exactly as it appears, `\n` sequences and all |
| `SUPABASE_JWT_SECRET` | the JWT Secret from Step 2 |

None of these get a `VITE_` prefix — that prefix is what makes Vite ship a
variable to the browser, and these four must never reach the browser.

### Step 4 — Redeploy

Vercel Dashboard → Deployments → redeploy the latest commit on `main` (env
var changes need a fresh deploy to take effect — Vercel doesn't hot-reload
them into a running deployment).

### Step 5 — Apply `0002` and `0003`

Supabase SQL Editor, in order:
[`0002_rls_firebase_identity.sql`](migrations/0002_rls_firebase_identity.sql),
then
[`0003_registration_rpcs.sql`](migrations/0003_registration_rpcs.sql).

This restores every write path — registration, profile edits, admin panels,
CSV imports — now scoped to the signed-in user's own row (or to admins), and
closes the `sensitive_columns_exposed` finding for logged-out visitors.

## Verifying

**Quick check that the bridge is live at all** — open your deployed site,
log in, open the browser console, and run:

```js
await fetch('/api/session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ idToken: await (await import('firebase/auth')).getAuth().currentUser.getIdToken() }),
}).then(r => r.json());
```

Should return `{ access_token: "...", expires_at: ... }`. An error here means
Step 3 or 4 didn't take — check the function's logs in Vercel Dashboard →
your project → Deployments → (latest) → Functions → `api/session`.

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
