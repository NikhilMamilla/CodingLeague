-- ============================================================================
-- 0004_debug_whoami.sql — temporary diagnostic, not part of the security fix
--
-- fb_uid() being non-null only proves the Firebase JWT was verified — it was
-- granted execute to `anon` too, so it says nothing about which Postgres
-- role PostgREST actually assigned the request. auth.role() is the one that
-- answers that directly, but it lives in the `auth` schema, which isn't
-- exposed over the REST API — this wraps it so it's callable as an RPC.
--
-- Safe to drop once the RLS rollout in supabase/MIGRATIONS.md is confirmed
-- working end to end: `drop function public.debug_whoami();`
-- ============================================================================

create or replace function public.debug_whoami()
returns jsonb
language sql stable
as $fn$
  select jsonb_build_object(
    'postgres_role',  auth.role(),
    'jwt_role_claim', auth.jwt() ->> 'role',
    'jwt_sub',        auth.jwt() ->> 'sub',
    'jwt_aud',        auth.jwt() ->> 'aud',
    'is_admin',       public.is_admin()
  )
$fn$;

grant execute on function public.debug_whoami() to anon, authenticated;
