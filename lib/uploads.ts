"use client";

import { createClient } from "@/lib/supabase/client";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB, matches storage bucket limit

export class UploadError extends Error {}

function extensionFor(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) return fromName;
  return file.type.split("/")[1] ?? "jpg";
}

function validateImageFile(file: File) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new UploadError("Please upload a JPEG, PNG, WebP, or GIF image.");
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new UploadError("Images must be 5MB or smaller.");
  }
}

/**
 * Uploads to a bucket using the {userId}/... path convention required by
 * the storage RLS policies (see supabase/migrations/0003_storage.sql).
 * The server independently re-validates this path on every write, so a
 * tampered client can't escape its own folder no matter what path is
 * requested here.
 */
async function uploadToBucket(
  bucket: "avatars" | "item-images",
  file: File,
  userId: string,
  subPath?: string
): Promise<string> {
  validateImageFile(file);

  const supabase = createClient();
  const ext = extensionFor(file);
  const filename = `${crypto.randomUUID()}.${ext}`;
  const path = subPath
    ? `${userId}/${subPath}/${filename}`
    : `${userId}/${filename}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });

  if (error) {
    throw new UploadError("Upload failed. Please try again.");
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadAvatar(file: File, userId: string): Promise<string> {
  return uploadToBucket("avatars", file, userId);
}

export async function uploadItemImage(
  file: File,
  userId: string,
  wishlistId: string
): Promise<string> {
  return uploadToBucket("item-images", file, userId, wishlistId);
}
