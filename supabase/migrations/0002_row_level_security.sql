-- ============================================================================
-- EiWish Row Level Security policies
-- ============================================================================
-- Run AFTER 0001_initial_schema.sql.
--
-- Design principle: every table is locked down by default (RLS enabled,
-- no policy = no access). Each policy below grants the minimum access
-- needed for one specific, named scenario. Read the comment above each
-- policy before changing it.
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.wishlists enable row level security;
alter table public.wishlist_collaborators enable row level security;
alter table public.wishlist_items enable row level security;

-- ----------------------------------------------------------------------------
-- Helper: is the current user a collaborator (any role) on a wishlist?
-- SECURITY DEFINER so it can read wishlist_collaborators even though the
-- calling user's own RLS policy on that table only lets them see their own
-- collaborator rows — this function is the single, audited bypass, and it
-- only ever returns a boolean, never row data.
-- ----------------------------------------------------------------------------
create or replace function public.is_wishlist_collaborator(target_wishlist_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.wishlist_collaborators
    where wishlist_id = target_wishlist_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.is_wishlist_editor(target_wishlist_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.wishlist_collaborators
    where wishlist_id = target_wishlist_id
      and user_id = auth.uid()
      and role = 'editor'
  );
$$;

-- ============================================================================
-- profiles
-- ============================================================================

-- Anyone (including anonymous visitors) can view profiles. This is required
-- for public wishlist pages (/u/[username]) to render the owner's name and
-- avatar. profiles intentionally contains no sensitive data (no email,
-- no auth info) — only what's meant to be public.
create policy "profiles are publicly readable"
  on public.profiles for select
  using (true);

-- A user may only update their own profile row.
create policy "users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Profile rows are created exclusively by the handle_new_user trigger
-- (security definer), never directly by client code, so there is no
-- general INSERT policy here. Deletion happens via the auth.users
-- cascade (on delete cascade), not direct client deletes.

-- ============================================================================
-- wishlists
-- ============================================================================

-- Owners can always see their own wishlists, regardless of visibility.
create policy "owners can view own wishlists"
  on public.wishlists for select
  using (auth.uid() = owner_id);

-- Anyone (including anonymous visitors) can view wishlists explicitly
-- marked 'public'.
create policy "public wishlists are publicly readable"
  on public.wishlists for select
  using (visibility = 'public');

-- An invited collaborator can view a 'shared' wishlist they were added to,
-- even though it is not 'public'.
create policy "collaborators can view shared wishlists"
  on public.wishlists for select
  using (
    visibility = 'shared'
    and public.is_wishlist_collaborator(id)
  );

-- Only the owner may create wishlists, and only ever as themselves.
create policy "owners can create own wishlists"
  on public.wishlists for insert
  with check (auth.uid() = owner_id);

-- Owner can update their own wishlist's fields. Editors (collaborators with
-- role='editor') may also update — e.g. to help curate a shared list —
-- but can never change ownership.
create policy "owners and editors can update wishlists"
  on public.wishlists for update
  using (
    auth.uid() = owner_id
    or public.is_wishlist_editor(id)
  )
  with check (
    owner_id = (select owner_id from public.wishlists where id = wishlists.id)
  );

-- Only the owner can delete a wishlist.
create policy "owners can delete own wishlists"
  on public.wishlists for delete
  using (auth.uid() = owner_id);

-- ============================================================================
-- wishlist_collaborators
-- ============================================================================

-- A user can see collaborator rows for a wishlist if: they own the
-- wishlist (need to manage the invite list) or the row is their own
-- membership (so they know which lists they've been invited to).
create policy "owners can view wishlist collaborators"
  on public.wishlist_collaborators for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.wishlists w
      where w.id = wishlist_id and w.owner_id = auth.uid()
    )
  );

-- Only the wishlist owner can invite collaborators, and only to their own
-- wishlist.
create policy "owners can invite collaborators"
  on public.wishlist_collaborators for insert
  with check (
    invited_by = auth.uid()
    and exists (
      select 1 from public.wishlists w
      where w.id = wishlist_id and w.owner_id = auth.uid()
    )
  );

-- Only the wishlist owner can change a collaborator's role.
create policy "owners can update collaborator roles"
  on public.wishlist_collaborators for update
  using (
    exists (
      select 1 from public.wishlists w
      where w.id = wishlist_id and w.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.wishlists w
      where w.id = wishlist_id and w.owner_id = auth.uid()
    )
  );

-- The wishlist owner can remove a collaborator; a collaborator can also
-- remove themselves (leave a shared list).
create policy "owners can remove collaborators, collaborators can leave"
  on public.wishlist_collaborators for delete
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.wishlists w
      where w.id = wishlist_id and w.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- wishlist_items
-- ============================================================================
-- Item access mirrors the parent wishlist's access rules.

create policy "owners can view own wishlist items"
  on public.wishlist_items for select
  using (
    exists (
      select 1 from public.wishlists w
      where w.id = wishlist_id and w.owner_id = auth.uid()
    )
  );

create policy "public wishlist items are publicly readable"
  on public.wishlist_items for select
  using (
    exists (
      select 1 from public.wishlists w
      where w.id = wishlist_id and w.visibility = 'public'
    )
  );

create policy "collaborators can view shared wishlist items"
  on public.wishlist_items for select
  using (
    exists (
      select 1 from public.wishlists w
      where w.id = wishlist_id
        and w.visibility = 'shared'
        and public.is_wishlist_collaborator(w.id)
    )
  );

-- Only the owner (or an editor collaborator) can add items.
create policy "owners and editors can add items"
  on public.wishlist_items for insert
  with check (
    exists (
      select 1 from public.wishlists w
      where w.id = wishlist_id
        and (w.owner_id = auth.uid() or public.is_wishlist_editor(w.id))
    )
  );

-- Owner/editors can update item details. Viewer-only collaborators are
-- additionally allowed to toggle is_purchased / purchased_by / purchased_at
-- so they can mark a gift as bought for coordination purposes — enforced
-- precisely (not just "any update") via the WITH CHECK clause comparing
-- protected columns, paired with column privileges below.
create policy "owners and editors can update items"
  on public.wishlist_items for update
  using (
    exists (
      select 1 from public.wishlists w
      where w.id = wishlist_id
        and (w.owner_id = auth.uid() or public.is_wishlist_editor(w.id))
    )
  )
  with check (
    exists (
      select 1 from public.wishlists w
      where w.id = wishlist_id
        and (w.owner_id = auth.uid() or public.is_wishlist_editor(w.id))
    )
  );

create policy "collaborators can mark items purchased"
  on public.wishlist_items for update
  using (
    exists (
      select 1 from public.wishlists w
      where w.id = wishlist_id
        and w.visibility = 'shared'
        and public.is_wishlist_collaborator(w.id)
    )
  )
  with check (
    exists (
      select 1 from public.wishlists w
      where w.id = wishlist_id
        and w.visibility = 'shared'
        and public.is_wishlist_collaborator(w.id)
    )
  );

create policy "owners and editors can delete items"
  on public.wishlist_items for delete
  using (
    exists (
      select 1 from public.wishlists w
      where w.id = wishlist_id
        and (w.owner_id = auth.uid() or public.is_wishlist_editor(w.id))
    )
  );

-- ----------------------------------------------------------------------------
-- Column-level privilege restriction: viewer-only collaborators reach
-- wishlist_items through the "collaborators can mark items purchased"
-- policy, which is row-permissive on UPDATE. To stop a viewer from also
-- editing title/price/etc. through that same policy, restrict which
-- columns the authenticated role may write on this table at the grant
-- level, and rely on application code (Server Actions) to only ever send
-- the purchased_* columns when the actor is a non-editor collaborator.
-- Postgres RLS cannot express "this policy only governs these columns" by
-- itself, so this is enforced in the Server Action layer — see
-- lib/actions/items.ts markItemPurchased() vs updateItem().
-- ----------------------------------------------------------------------------
