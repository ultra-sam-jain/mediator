-- Run in Supabase: SQL Editor → New query → paste → Run

create table if not exists public.leads (
  id uuid primary key,
  created_at timestamptz not null default now(),
  source text not null,
  name text not null default '',
  phone text not null default '',
  project text not null default '',
  budget text not null default '',
  email text not null default '',
  property_type text not null default '',
  intent text not null default '',
  status text not null default 'PENDING'
    check (status in ('PENDING', 'SUCCESS', 'FAILED')),
  raw_payload jsonb not null default '{}'::jsonb,
  forward_error text
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_source_idx on public.leads (source);
create index if not exists leads_status_idx on public.leads (status);

-- API uses SUPABASE_SERVICE_ROLE_KEY on the server (bypasses RLS). Block public access:
alter table public.leads enable row level security;
