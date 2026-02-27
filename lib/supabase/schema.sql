-- fumi. database schema
-- Run this in Supabase → SQL Editor

create table if not exists babies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  birth_date date not null,
  created_at timestamptz default now()
);

create table if not exists entries (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid references babies(id) on delete cascade not null,
  date date not null,
  type text check (type in ('text', 'photo', 'audio', 'mixed')) default 'text',
  content text default '',
  media_urls text[] default '{}',
  tags text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists chapters (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid references babies(id) on delete cascade not null,
  month integer not null,
  period text,
  status text check (status in ('collecting', 'draft', 'approved')) default 'collecting',
  voice text check (voice in ('yo', 'nosotros', 'baby')) default 'baby',
  generated_content text default '',
  own_text_blocks jsonb default '[]',
  entry_ids uuid[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(baby_id, month)
);
