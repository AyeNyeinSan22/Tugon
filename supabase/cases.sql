-- TUGON public progress: cases, case updates, photos, and the report -> case link.
-- Run this in Supabase Studio -> SQL Editor AFTER schema.sql. It is safe to run more than once.
-- It does not change or delete any existing report.

-- 1. Cases: one issue an officer decided to act on, usually because of several reports.
create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  case_code text not null unique,
  title text not null,
  area text not null default '',
  category text not null default '',
  summary text not null default '',
  stage text not null default 'reported'
    check (stage in ('reported', 'under_review', 'work_scheduled', 'work_in_progress', 'completed')),
  -- A case is visible to the public only after an officer presses Publish.
  is_published boolean not null default false,
  published_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Case updates: the timeline shown inside a case. A photo is optional.
create table if not exists public.case_updates (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  stage text not null
    check (stage in ('reported', 'under_review', 'work_scheduled', 'work_in_progress', 'completed')),
  note text not null default '',
  photo_path text,
  photo_caption text not null default '',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists case_updates_case_idx on public.case_updates (case_id, created_at);

-- 3. Link a report to the case that handles it (many reports -> one case).
alter table public.reports add column if not exists case_id uuid references public.cases (id) on delete set null;
create index if not exists reports_case_idx on public.reports (case_id);

-- 4. Row level security
alter table public.cases enable row level security;
alter table public.case_updates enable row level security;

drop policy if exists "public reads published cases" on public.cases;
create policy "public reads published cases"
  on public.cases for select
  to anon, authenticated
  using (is_published or public.is_officer());

drop policy if exists "officers manage cases" on public.cases;
create policy "officers manage cases"
  on public.cases for all
  to authenticated
  using (public.is_officer())
  with check (public.is_officer());

drop policy if exists "public reads updates of published cases" on public.case_updates;
create policy "public reads updates of published cases"
  on public.case_updates for select
  to anon, authenticated
  using (
    public.is_officer()
    or exists (select 1 from public.cases c where c.id = case_updates.case_id and c.is_published)
  );

drop policy if exists "officers manage case updates" on public.case_updates;
create policy "officers manage case updates"
  on public.case_updates for all
  to authenticated
  using (public.is_officer())
  with check (public.is_officer());

-- 5. How many reports are attached to a case, without exposing the reports themselves.
create or replace function public.case_report_count(target uuid)
returns integer
language sql
stable
security definer set search_path = public
as $$
  select count(*)::int from public.reports r
  join public.cases c on c.id = r.case_id
  where r.case_id = target and (c.is_published or public.is_officer());
$$;

-- 6. Photo storage. Officers upload; anyone can view.
-- NOTE: the bucket is public, so a photo of an UNPUBLISHED case can be opened by
-- someone who has its exact address. File names are random, but do not upload a
-- photo you would not want seen. Officer photos only: never copy a citizen's photo here.
insert into storage.buckets (id, name, public)
values ('case-photos', 'case-photos', true)
on conflict (id) do nothing;

drop policy if exists "anyone views case photos" on storage.objects;
create policy "anyone views case photos"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'case-photos');

drop policy if exists "officers upload case photos" on storage.objects;
create policy "officers upload case photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'case-photos' and public.is_officer());

drop policy if exists "officers remove case photos" on storage.objects;
create policy "officers remove case photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'case-photos' and public.is_officer());
