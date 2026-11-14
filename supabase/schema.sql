-- TUGON reports table + RLS
-- Run this in Supabase Studio -> SQL Editor

-- 1. Reports table
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  tracking_code text not null unique,
  problem text not null,
  address text not null default '',
  landmark text not null default '',
  description text not null default '',
  timing text not null default '',
  phone text not null default '',
  risk_questions text[] not null default '{}',
  status text not null default 'new' check (status in ('new', 'in_progress', 'resolved')),
  created_at timestamptz not null default now()
);

-- 2. Profile table linking auth users to an officer role
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'officer' check (role in ('officer', 'admin')),
  full_name text not null default '',
  created_at timestamptz not null default now()
);

-- Auto-create a profile when a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'officer')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper: is the current user an officer?
create or replace function public.is_officer()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('officer', 'admin')
  );
$$;

-- 3. RLS
alter table public.reports enable row level security;
alter table public.profiles enable row level security;

-- Anyone (anon citizens) can insert a report
create policy "public can insert reports"
  on public.reports for insert
  to anon, authenticated
  with check (true);

-- Anyone with a tracking code can read that one report (for /track lookup)
create policy "public can read report by tracking code"
  on public.reports for select
  to anon, authenticated
  using (true);

-- Only officers can update status
create policy "officers can update reports"
  on public.reports for update
  to authenticated
  using (public.is_officer())
  with check (public.is_officer());

-- Profiles: users read their own; officers read all
create policy "users read own profile"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy "officers read all profiles"
  on public.profiles for select
  to authenticated
  using (public.is_officer());
