-- Run this ONCE in the SQL Editor of EACH Supabase project
create table if not exists public.keepalive (
  id bigint generated always as identity primary key,
  note text,
  created_at timestamptz default now()
);

alter table public.keepalive enable row level security;

create policy "keepalive anon select" on public.keepalive for select to anon using (true);
create policy "keepalive anon insert" on public.keepalive for insert to anon with check (true);
create policy "keepalive anon delete" on public.keepalive for delete to anon using (true);
