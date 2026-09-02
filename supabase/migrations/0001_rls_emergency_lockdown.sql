-- ============================================================================
-- 0001_rls_emergency_lockdown.sql
--
-- EMERGENCY BRAKE. Apply this alone only if you need the hole closed right now
-- and can tolerate writes being down. It enables RLS on every public table and
-- grants SELECT only. With no INSERT/UPDATE/DELETE policy present, RLS denies
-- by default, so the "anyone can edit and delete all data" vector closes.
--
-- WHAT THIS BREAKS until 0002 is applied:
--   * new user registration (participants INSERT, counters UPDATE)
--   * profile edits
--   * every admin panel write (contests, results, badges, certificates,
--     announcements, sponsors, settings)
-- Reads — leaderboard, profiles, contests, certificate verification — keep
-- working.
--
-- Prefer applying 0001 and 0002 together. See MIGRATIONS.md for the runbook.
-- ============================================================================

alter table public.participants    enable row level security;
alter table public.contests        enable row level security;
alter table public.contest_results enable row level security;
alter table public.certificates    enable row level security;
alter table public.announcements   enable row level security;
alter table public.sponsors        enable row level security;
alter table public.settings        enable row level security;
alter table public.counters        enable row level security;

-- Read stays open so the public site keeps rendering. Column-level narrowing
-- of email/phone happens in 0002.
create policy p_read_all on public.participants
  for select to anon, authenticated using (true);
create policy c_read_all on public.contests
  for select to anon, authenticated using (true);
create policy cr_read_all on public.contest_results
  for select to anon, authenticated using (true);
create policy cert_read_all on public.certificates
  for select to anon, authenticated using (true);
create policy ann_read_all on public.announcements
  for select to anon, authenticated using (true);
create policy sp_read_all on public.sponsors
  for select to anon, authenticated using (true);
create policy st_read_all on public.settings
  for select to anon, authenticated using (true);
create policy cnt_read_all on public.counters
  for select to anon, authenticated using (true);

-- Deliberately no write policies. Writes are denied for anon and authenticated
-- until 0002 introduces identity-aware ones.
