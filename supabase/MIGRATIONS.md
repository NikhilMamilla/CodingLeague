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
token against Firebase's own public keys — confirmed working live via
`debug_whoami()` (see `0004_debug_whoami.sql`), `auth.jwt()->>'sub'` resolves
correctly. But PostgREST picks the Postgres role for a request from the
JWT's `role` claim, and Firebase ID tokens don't carry one — also confirmed
live, `auth.jwt()->>'role'` came back as the literal string `"anon"` on every
request regardless of who was logged in, which is PostgREST's fallback for a
missing role claim.

The fix is a Firebase **custom claim**: once a user's Firebase account has
`role: "authenticated"` set via the Admin SDK, every ID token issued to them
afterward carries it at the top level, and PostgREST reads it correctly.
`api/ensure-role-claim.js` sets that claim — a free Vercel function, not a
Firebase Cloud Function, so no Blaze plan needed (setting a custom claim is a
plain Admin SDK/API call; only *deploying code to run inside Firebase* needs
Blaze). `src/lib/supabase.ts` calls it once per login, then force-refreshes
the Firebase token so it picks up the new claim before talking to Supabase.

Two earlier approaches were tried and dropped before this one:
- A Firebase *blocking function* to stamp the same claim automatically on
  every sign-in — dropped because Firebase Cloud Functions (blocking
  functions included) require the paid Blaze plan just to deploy, even at
  zero usage cost. The claim itself is exactly what's needed, as it turned
  out; only that specific delivery mechanism was the problem.
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

### Already done

- Step "Enable Firebase as a Supabase Third-Party Auth provider" — done,
  confirmed working (`debug_whoami()` shows `jwt_sub` and `jwt_aud`
  resolving correctly).
- `0001`, `0002`, `0003` — applied.
- `0004_debug_whoami.sql` — applied (temporary, drop it once everything below
  is confirmed working: `drop function public.debug_whoami();`).

### Step 1 — Get a new Firebase service account key

Firebase Console → your project (`codingleague-e7dd9`) → ⚙️ Project
Settings → **Service Accounts** tab → **Generate new private key** → this
downloads a JSON file.

If you generated one for this earlier and pasted its contents anywhere
outside a secrets manager (chat, a doc, etc.), delete that key from this same
page first (find it by its key ID, click the trash icon) and generate a
fresh one — treat any key that's been pasted in plaintext anywhere as
burned, even if you're fairly sure it hasn't been misused.

**Do not commit this file. Do not paste its contents into chat.** Copy the
three fields below directly from the file into Vercel in the next step, then
delete the download.

### Step 2 — Add 3 environment variables in Vercel

Vercel Dashboard → your project → Settings → **Environment Variables** → add
each of these (Production + Preview):

| Name | Value |
|---|---|
| `FIREBASE_PROJECT_ID` | `project_id` from the service account JSON (`codingleague-e7dd9`) |
| `FIREBASE_CLIENT_EMAIL` | `client_email` from the service account JSON |
| `FIREBASE_PRIVATE_KEY` | `private_key` from the service account JSON — paste it exactly as it appears, `\n` sequences and all |

None of these get a `VITE_` prefix — that prefix is what makes Vite ship a
variable to the browser, and these three must never reach the browser.

### Step 3 — Redeploy

Vercel Dashboard → Deployments → redeploy the latest commit on `main` (env
var changes need a fresh deploy to take effect).

## Verifying

**Confirm the role claim is working** — log out fully, log back in, browser
console:

```js
JSON.stringify((await __supabase.rpc('debug_whoami')).data)
```

`postgres_role` should now say `"authenticated"` (it was showing `"anon"`
before Steps 1–3 above). If it still says `"anon"` after a full logout/login,
the Vercel env vars from Step 2 likely didn't get picked up — check the
`api/ensure-role-claim` function's logs in Vercel Dashboard → Deployments →
(latest) → Functions for the actual error.

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

### If `postgres_role` still isn't `"authenticated"` after all 3 steps

Send the exact output of the `debug_whoami()` call above — with real data
instead of guessing further, this has been fast to pin down every time so
far.

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
