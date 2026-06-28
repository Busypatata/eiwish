-- ============================================================================
-- EiWish Storage buckets + policies
-- ============================================================================
-- Run AFTER 0002_row_level_security.sql.
--
-- Two public-read buckets: avatars and wishlist item images. Both are
-- "public" buckets (readable by anyone via URL, since avatars/item photos
-- are meant to be visually shown on potentially public wishlist pages),
-- but WRITE access is tightly scoped: a user may only write into their own
-- folder, named by their auth.uid(). This prevents one user from
-- overwriting or deleting another user's files even though the bucket is
-- publicly readable.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('item-images', 'item-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- avatars bucket
-- Expected path convention: {user_id}/avatar.{ext}
-- ----------------------------------------------------------------------------

create policy "avatar images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "users can upload their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users can update their own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users can delete their own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ----------------------------------------------------------------------------
-- item-images bucket
-- Expected path convention: {user_id}/{wishlist_id}/{item_id}.{ext}
-- Scoped to the uploading user's own folder. Editors uploading images for
-- someone else's shared wishlist upload through a Server Action using the
-- admin client instead (see lib/actions/items.ts), since the storage path
-- convention here is owner-scoped for simplicity and auditability.
-- ----------------------------------------------------------------------------

create policy "item images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'item-images');

create policy "users can upload their own item images"
  on storage.objects for insert
  with check (
    bucket_id = 'item-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users can update their own item images"
  on storage.objects for update
  using (
    bucket_id = 'item-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users can delete their own item images"
  on storage.objects for delete
  using (
    bucket_id = 'item-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
