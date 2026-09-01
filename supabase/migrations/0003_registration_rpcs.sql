-- ============================================================================
-- 0003_registration_rpcs.sql
--
-- Two self-registration side effects that 0002 would otherwise silently break:
--
-- 1. Founding Member claim. Register.tsx used to call reserveFoundingRank()
--    (src/lib/foundingMembers.ts), which reads+writes public.counters
--    directly from the browser. Under 0002 only admins can write counters, so
--    that call would start failing for every new signup. It also could not be
--    allowed as a bare RLS policy: whether a signup gets founding_member=true
--    depends on trusted server state (program enabled? slots left? before the
--    cutoff?) that the client must not decide for itself. This RPC does the
--    whole read-check-increment-stamp sequence atomically, server-side.
--
--    The admin-invoked path (src/lib/foundingMembers.ts: assignFoundingMember,
--    resetAndReassignFoundingMembers) is untouched by this file — admins
--    already bypass participants_guard via is_admin(), so their direct table
--    writes keep working exactly as before.
--
-- 2. The "Founding Member Awarded" announcement Register.tsx posts right
--    after a successful claim. Plain INSERT is now admin-only (ann_admin_write
--    in 0002); this RPC allows exactly one self-service case: a user
--    announcing their own, just-confirmed founding-member status.
--
-- Pairs with the Register.tsx changes in this same PR — see MIGRATIONS.md.
-- ============================================================================

create or replace function public.claim_founding_member()
returns jsonb
language plpgsql security definer set search_path = public
as $fn$
declare
  v_uid      text;
  v_settings jsonb;
  v_max      integer;
  v_cutoff   timestamptz;
  v_season   text;
  v_label    text;
  v_rank     bigint;
  v_badges   jsonb;
  v_has_badge boolean;
begin
  v_uid := public.fb_uid();
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select data into v_settings from public.settings where key = 'foundingMembers';
  if v_settings is null or (v_settings ->> 'enabled') is distinct from 'true' then
    return null;
  end if;

  v_max := coalesce((v_settings ->> 'maxFoundingMembers')::integer, 0);
  if v_max <= 0 then
    return null;
  end if;

  v_cutoff := nullif(v_settings ->> 'cutOffDate', '')::timestamptz;
  if v_cutoff is not null and now() > v_cutoff then
    return null;
  end if;

  v_season := coalesce(v_settings ->> 'seasonId', '2026-27');
  v_label  := coalesce(v_settings ->> 'seasonLabel', v_season);

  -- Row lock via UPDATE ... WHERE ... RETURNING makes this race-free: two
  -- concurrent signups cannot both land on the same rank the way the old
  -- read-then-write in reserveFoundingRank() could.
  insert into public.counters (id, value) values ('foundingMembers', 0)
    on conflict (id) do nothing;

  update public.counters set value = value + 1
    where id = 'foundingMembers' and value < v_max
    returning value into v_rank;

  if v_rank is null then
    return null; -- slots full
  end if;

  select badges into v_badges from public.participants where uid = v_uid;
  v_badges    := coalesce(v_badges, '[]'::jsonb);
  v_has_badge := exists (
    select 1 from jsonb_array_elements(v_badges) b where b ->> 'type' = 'founding_member'
  );

  update public.participants set
    founding_member     = true,
    founding_rank        = v_rank,
    founding_awarded_at = now(),
    founding_season_id  = v_season,
    badges = case when v_has_badge then v_badges
      else v_badges || jsonb_build_array(jsonb_build_object(
        'type', 'founding_member', 'label', 'Founding Member', 'emoji', '🏅',
        'awardedAt', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
      ))
    end
  where uid = v_uid;

  -- 0 rows matched (no participants row yet) means Register.tsx called this
  -- before upsertParticipant — the slot was already consumed above, so raise
  -- rather than silently drop it.
  if not found then
    raise exception 'claim_founding_member: no participants row for %', v_uid;
  end if;

  return jsonb_build_object('rank', v_rank, 'seasonId', v_season, 'seasonLabel', v_label);
end $fn$;

grant execute on function public.claim_founding_member() to authenticated;

create or replace function public.announce_founding_member(p_season_id text)
returns void
language plpgsql security definer set search_path = public
as $fn$
declare v_uid text;
begin
  v_uid := public.fb_uid();
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  -- Only lets a user announce a status the DB already confirms for them —
  -- not an arbitrary broadcast. claim_founding_member() must have run first.
  if not exists (
    select 1 from public.participants
    where uid = v_uid and founding_member = true and founding_season_id = p_season_id
  ) then
    raise exception 'not a confirmed founding member for season %', p_season_id;
  end if;

  insert into public.announcements (title, body, category, created_by, created_at)
  values (
    'Founding Member Awarded',
    'Congratulations! You are among the first registered participants of CWCL and have received Founding Member recognition for season ' || p_season_id || '.',
    'Results', 'System', now()
  );
end $fn$;

grant execute on function public.announce_founding_member(text) to authenticated;
