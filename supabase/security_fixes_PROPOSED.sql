-- PROPOSED fixes for two existing problems in schema.sql. NOT applied by anyone yet.
-- Read, discuss as a team, then run in Supabase Studio if you agree.
-- The app code would need the small changes noted below.

-- PROBLEM 1: every new account becomes an officer.
-- schema.sql gives role 'officer' to every user that signs up, and the
-- "Track my report" page lets citizens sign up. So any citizen can change
-- report statuses and, with cases.sql, create and publish cases and photos.
--
-- FIX: new accounts become 'citizen'. Officers are promoted by hand.
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('citizen', 'officer', 'admin'));
alter table public.profiles alter column role set default 'citizen';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role) values (new.id, 'citizen')
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Existing accounts: review this list, then demote everyone who is not staff.
--   select p.id, u.email, p.role from public.profiles p join auth.users u on u.id = p.id;
--   update public.profiles set role = 'citizen' where id not in ('<officer user id>', ...);
-- To make someone an officer later:
--   update public.profiles set role = 'officer' where id = '<user id>';

-- PROBLEM 2: anyone can read every report, including phone numbers.
-- The policy "public can read report by tracking code" uses `using (true)`,
-- which allows reading the whole table, not one report.
--
-- FIX: remove public reading; look a report up through a function that needs
-- the tracking code and returns only safe columns (no phone, no description).
drop policy if exists "public can read report by tracking code" on public.reports;

drop policy if exists "officers read reports" on public.reports;
create policy "officers read reports"
  on public.reports for select
  to authenticated
  using (public.is_officer());

create or replace function public.report_by_tracking_code(code text)
returns table (tracking_code text, problem text, address text, landmark text, status text, created_at timestamptz, case_code text, case_title text, case_stage text)
language sql
stable
security definer set search_path = public
as $$
  select r.tracking_code, r.problem, r.address, r.landmark, r.status, r.created_at,
         c.case_code, c.title, c.stage
  from public.reports r
  left join public.cases c on c.id = r.case_id and c.is_published
  where r.tracking_code = upper(trim(code))
  limit 1;
$$;
grant execute on function public.report_by_tracking_code(text) to anon, authenticated;

-- App changes needed after running this:
--  - src/App.tsx TrackPage and src/lib/cases.ts getCaseForReport: call
--    supabase.rpc('report_by_tracking_code', { code }) instead of selecting from `reports`.
--  - A tracking code would still be the only key to a report. It is short, so
--    consider making it longer or adding a rate limit.
