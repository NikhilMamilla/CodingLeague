-- ============================================================================
-- 0002_rls_firebase_identity.sql
--
-- Restores writes, safely, by teaching Postgres who the Firebase user is.
--
-- PREREQUISITES — this migration is inert until all three are done:
--   1. Supabase Dashboard -> Authentication -> Sign In / Providers ->
--      Third-Party Auth -> add Firebase, with your Firebase project ID.
--   2. A Firebase blocking function (beforeUserCreated / beforeUserSignedIn)
--      that stamps the custom claim  role: "authenticated"  onto the ID token.
--      Without it PostgREST treats every request as `anon`, and none of the
--      `to authenticated` policies below will ever match.
--   3. src/lib/supabase.ts passes the Firebase ID token (see MIGRATIONS.md).
--
-- Identity model: auth.jwt() ->> 'sub' is the Firebase UID, which is exactly
-- what participants.uid already stores.
-- ============================================================================

-- ── Helpers ─────────────────────────────────────────────────────────────────

create or replace function public.fb_uid()
returns text
language sql stable
as $fn$ select nullif(auth.jwt() ->> 'sub', '') $fn$;

-- SECURITY DEFINER is required here: this reads participants, and participants
-- has policies that call this function. Without it the policy recurses.
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $fn$
  select exists (
    select 1 from public.participants p
    where p.uid = public.fb_uid()
      and p.role in ('admin', 'super_admin')
  )
$fn$;

grant execute on function public.fb_uid()   to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;

-- ── participants ────────────────────────────────────────────────────────────

create policy p_insert_self on public.participants
  for insert to authenticated
  with check (uid = public.fb_uid());

create policy p_update_self on public.participants
  for update to authenticated
  using (uid = public.fb_uid())
  with check (uid = public.fb_uid());

create policy p_admin_all on public.participants
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- RLS cannot compare OLD and NEW, so privileged columns are pinned by trigger.
-- Without this, p_update_self would let any user set their own role to 'admin',
-- or their own rating to 3000.
create or replace function public.participants_guard()
returns trigger
language plpgsql security definer set search_path = public
as $fn$
begin
  if public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- Self-registration may not choose its own privileges or standings.
    new.role                  := 'participant';
    new.rating                := 800;
    new.peak_rating           := 800;
    new.peak_title            := null;
    new.rating_history        := '[]'::jsonb;
    new.tier                  := 'Beginner';
    new.badges                := '[]'::jsonb;
    new.streak                := 0;
    new.monthly_points        := 0;
    new.contests_participated := 0;
    new.attendance            := 0;
    new.founding_member       := false;
    new.founding_rank         := null;
    new.founding_awarded_at   := null;
    new.founding_season_id    := null;
    return new;
  end if;

  -- UPDATE: silently discard changes to anything the user does not own.
  new.uid                   := old.uid;
  new.participant_id        := old.participant_id;
  new.role                  := old.role;
  new.rating                := old.rating;
  new.peak_rating           := old.peak_rating;
  new.peak_title            := old.peak_title;
  new.rating_history        := old.rating_history;
  new.tier                  := old.tier;
  new.badges                := old.badges;
  new.streak                := old.streak;
  new.monthly_points        := old.monthly_points;
  new.contests_participated := old.contests_participated;
  new.attendance            := old.attendance;
  new.last_contest_date     := old.last_contest_date;
  new.founding_member       := old.founding_member;
  new.founding_rank         := old.founding_rank;
  new.founding_awarded_at   := old.founding_awarded_at;
  new.founding_season_id    := old.founding_season_id;
  new.created_at            := old.created_at;
  return new;
end $fn$;

drop trigger if exists participants_guard_ins on public.participants;
drop trigger if exists participants_guard_upd on public.participants;

create trigger participants_guard_ins
  before insert on public.participants
  for each row execute function public.participants_guard();

create trigger participants_guard_upd
  before update on public.participants
  for each row execute function public.participants_guard();

-- ── Sensitive columns: hide email/phone from logged-out visitors ────────────
-- Fixes the `sensitive_columns_exposed` advisor finding. RLS is row-level only;
-- column exposure is controlled by GRANT.
--
-- REQUIRES the code change in MIGRATIONS.md step 5 — public pages must stop
-- requesting email/phone, or their SELECT will now fail for anon.

revoke select on public.participants from anon;
grant select (
  uid, participant_id, full_name, photo_url, bio, github, linkedin,
  college, university, branch, year, city, state,
  rating, peak_rating, peak_title, tier, streak, rating_history, badges,
  monthly_points, contests_participated, attendance, role,
  founding_member, founding_rank, founding_awarded_at, founding_season_id,
  created_at,
  codeforces_handle, leetcode_username, codechef_username,
  hackerrank_username, gfg_username,
  codeforces_url, leetcode_url, codechef_url, hackerrank_url, gfg_url
) on public.participants to anon;

revoke select on public.certificates from anon;
grant select (
  id, certificate_id, verification_code, participant_id, participant_name,
  certificate_type, contest_name, season, position, issued_date,
  cloudinary_url, cloudinary_public_id, status, issued_by, created_at
) on public.certificates to anon;

-- ── Admin-owned tables: public reads (from 0001), admin-only writes ────────

create policy c_admin_write    on public.contests        for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy cr_admin_write   on public.contest_results for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy cert_admin_write on public.certificates    for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy ann_admin_write  on public.announcements   for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy sp_admin_write   on public.sponsors        for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy st_admin_write   on public.settings        for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ── counters ────────────────────────────────────────────────────────────────
-- Registration needs to increment 'participant_id'. Rather than granting every
-- signed-in user UPDATE on counters, do the increment atomically in a definer
-- function. This also removes the read-modify-write race in incrementCounter().

create policy cnt_admin_write on public.counters for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- `min_floor` reproduces the drift-correction the client used to do by hand
-- (comparing the stored counter against the actual max participant_id before
-- writing). The whole thing is one atomic statement, so unlike the old
-- read-then-write in Register.tsx this can't hand out the same value twice
-- under concurrent registrations.
create or replace function public.next_counter(counter_id text, min_floor bigint default 0)
returns bigint
language plpgsql security definer set search_path = public
as $fn$
declare v bigint;
begin
  if public.fb_uid() is null then
    raise exception 'not authenticated';
  end if;
  insert into public.counters (id, value) values (counter_id, min_floor)
    on conflict (id) do update
      set value = greatest(public.counters.value, min_floor) + 1
    returning value into v;
  return v;
end $fn$;

grant execute on function public.next_counter(text, bigint) to authenticated;
