-- Loma accounts, step 2 of docs/ROADMAP.md: sign in with an email link, and
-- Loma remembers each person's chats and the facts they save.
--
-- Run once in the NEW Supabase project (SQL Editor -> New query -> paste -> Run).
-- Safe to run again: everything is "if not exists" / "or replace".
--
-- Who can sign up: only email addresses listed in public.allowed_emails.
-- Add the owner's address there after running this (it is not written in this
-- file because the repository is public):
--   insert into public.allowed_emails (email) values ('owner@example.com');
--
-- Every table has row level security: a signed-in person can only ever read
-- and change their own rows. The public (anon) key alone can read nothing.

-- 1. Who may create an account ------------------------------------------------
create table if not exists public.allowed_emails (
  email text primary key check (email = lower(email))
);
alter table public.allowed_emails enable row level security;
-- No policies: only the dashboard and the service role can read or change it.

create or replace function public.only_allowed_signups()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is null or not exists (
    select 1 from public.allowed_emails where email = lower(new.email)
  ) then
    raise exception 'Loma accounts are not open yet';
  end if;
  return new;
end;
$$;

drop trigger if exists only_allowed_signups on auth.users;
create trigger only_allowed_signups
  before insert on auth.users
  for each row execute function public.only_allowed_signups();

-- 2. Profiles ------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 80),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create or replace function public.create_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists create_profile on auth.users;
create trigger create_profile
  after insert on auth.users
  for each row execute function public.create_profile();

-- 3. Conversations and their messages ------------------------------------------
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text check (char_length(title) <= 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists conversations_user_idx on public.conversations (user_id, updated_at desc);
alter table public.conversations enable row level security;

create table if not exists public.messages (
  id bigint generated always as identity primary key,
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  -- The message as sent to Loma: text, or blocks that refer to uploaded files by id.
  content jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists messages_conversation_idx on public.messages (conversation_id, id);
alter table public.messages enable row level security;

-- 4. Memories: short facts a person asks Loma to remember ----------------------
create table if not exists public.memories (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  fact text not null check (char_length(fact) between 1 and 500),
  created_at timestamptz not null default now()
);
create index if not exists memories_user_idx on public.memories (user_id, created_at desc);
alter table public.memories enable row level security;

-- 5. Each person sees and changes only their own rows --------------------------
drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists "own conversations" on public.conversations;
create policy "own conversations" on public.conversations
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "own messages" on public.messages;
create policy "own messages" on public.messages
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.conversations c where c.id = conversation_id and c.user_id = (select auth.uid()))
  );

drop policy if exists "own memories" on public.memories;
create policy "own memories" on public.memories
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
