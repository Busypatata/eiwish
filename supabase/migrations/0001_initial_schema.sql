-- ============================================================================
-- EiWish initial schema
-- ============================================================================
-- Run this in the Supabase SQL Editor (or via `supabase db push` if using
-- the CLI) on a fresh project. Safe to run once; re-running will error on
-- "already exists" — that's expected and fine.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Extensions
-- ----------------------------------------------------------------------------
create extension if not exists "pgcrypto"; -- gen_random_uuid()
create extension if not exists "citext";   -- case-insensitive username/email matching

-- ----------------------------------------------------------------------------
-- profiles
-- One row per auth.users row. Holds the public-facing identity: username
-- (used in public wishlist URLs), display name, avatar, bio.
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username citext not null unique,
  display_name text not null default '',
  bio text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_format check (username ~ '^[a-zA-Z0-9_]{3,30}$'),
  constraint display_name_length check (char_length(display_name) <= 80),
  constraint bio_length check (char_length(bio) <= 500)
);

comment on table public.profiles is 'Public profile data, one row per user. Username powers public wishlist URLs (/u/[username]).';

-- ----------------------------------------------------------------------------
-- wishlists
-- A user can have unlimited wishlists. visibility controls who can view:
--   'private'      -> owner only
--   'shared'       -> owner + explicitly invited collaborators (see
--                     wishlist_collaborators below)
--   'public'       -> anyone with the link (and discoverable on the owner's
--                     public profile page)
-- ----------------------------------------------------------------------------
create table if not exists public.wishlists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null default '',
  cover_image_url text,
  visibility text not null default 'private'
    check (visibility in ('private', 'shared', 'public')),
  slug citext not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint title_length check (char_length(title) between 1 and 120),
  constraint description_length check (char_length(description) <= 2000),
  constraint slug_format check (slug ~ '^[a-z0-9-]{3,80}$'),
  unique (owner_id, slug)
);

comment on table public.wishlists is 'A named collection of wishlist items belonging to one owner.';

create index if not exists wishlists_owner_id_idx on public.wishlists(owner_id);
create index if not exists wishlists_visibility_idx on public.wishlists(visibility);

-- ----------------------------------------------------------------------------
-- wishlist_collaborators
-- Explicit invite list for 'shared' wishlists. A row here grants the
-- referenced user view (and optionally edit) access to the wishlist,
-- independent of its visibility setting (an owner may invite people to a
-- private list too, e.g. a close family member).
-- ----------------------------------------------------------------------------
create table if not exists public.wishlist_collaborators (
  id uuid primary key default gen_random_uuid(),
  wishlist_id uuid not null references public.wishlists(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'viewer' check (role in ('viewer', 'editor')),
  invited_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (wishlist_id, user_id)
);

comment on table public.wishlist_collaborators is 'Explicit per-user access grants for shared wishlists.';

create index if not exists wishlist_collaborators_user_id_idx on public.wishlist_collaborators(user_id);
create index if not exists wishlist_collaborators_wishlist_id_idx on public.wishlist_collaborators(wishlist_id);

-- ----------------------------------------------------------------------------
-- wishlist_items
-- Individual wish entries within a wishlist.
-- ----------------------------------------------------------------------------
create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  wishlist_id uuid not null references public.wishlists(id) on delete cascade,
  title text not null,
  description text not null default '',
  image_url text,
  product_url text,
  price numeric(12, 2),
  currency text not null default 'USD',
  priority smallint not null default 0 check (priority between 0 and 3),
  is_purchased boolean not null default false,
  purchased_by uuid references public.profiles(id) on delete set null,
  purchased_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint title_length check (char_length(title) between 1 and 200),
  constraint description_length check (char_length(description) <= 2000),
  constraint price_nonnegative check (price is null or price >= 0),
  constraint currency_format check (currency ~ '^[A-Z]{3}$'),
  constraint product_url_format check (
    product_url is null or product_url ~ '^https?://'
  )
);

comment on table public.wishlist_items is 'Individual items inside a wishlist. purchased_by/is_purchased let collaborators mark a gift as bought without revealing it to the owner (enforced in app logic, not just RLS, for the surprise to hold).';

create index if not exists wishlist_items_wishlist_id_idx on public.wishlist_items(wishlist_id);

-- ----------------------------------------------------------------------------
-- updated_at trigger helper
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.wishlists;
create trigger set_updated_at before update on public.wishlists
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.wishlist_items;
create trigger set_updated_at before update on public.wishlist_items
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- New user -> profile bootstrap
-- Supabase Auth creates rows in auth.users; this trigger mirrors a minimal
-- profile row into public.profiles immediately so the rest of the app can
-- always assume a profile exists. Username is derived from signup metadata
-- (validated client + server side before signup) or falls back to a
-- generated placeholder the user is prompted to change.
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  candidate_username citext;
begin
  candidate_username := coalesce(
    new.raw_user_meta_data->>'username',
    'user_' || substr(new.id::text, 1, 8)
  );

  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    candidate_username,
    coalesce(new.raw_user_meta_data->>'display_name', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
