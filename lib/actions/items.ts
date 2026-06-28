"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { wishlistItemSchema } from "@/lib/validations/wishlist";
import type { ActionResult } from "@/lib/actions/auth";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { supabase, user };
}

/**
 * The image URL comes from a prior, already-authorized Supabase Storage
 * upload (see lib/uploads.ts), which itself only writes to the calling
 * user's own folder per the storage RLS policies. Here we just validate
 * shape (must be a real https URL pointing at our own Supabase Storage
 * origin) so a tampered form field can't smuggle in something like a
 * javascript: URL or an arbitrary external image.
 */
function sanitizeImageUrl(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string" || !value) return null;
  try {
    const url = new URL(value);
    const supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).host;
    if (url.protocol !== "https:" || url.host !== supabaseHost) return null;
    return value;
  } catch {
    return null;
  }
}

export async function addWishlistItem(
  wishlistId: string,
  formData: FormData
): Promise<ActionResult> {
  const ctx = await requireUser();
  if (!ctx) return { error: "You need to be signed in." };
  const { supabase } = ctx;

  const parsed = wishlistItemSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    productUrl: formData.get("productUrl") ?? "",
    price: formData.get("price") ?? undefined,
    currency: formData.get("currency") || "USD",
    priority: formData.get("priority") ?? 0,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  // RLS "owners and editors can add items" enforces that wishlistId
  // actually belongs to (or is editable by) the current user — an
  // arbitrary/foreign wishlistId here simply gets rejected by the
  // database, not by this application code.
  const { error } = await supabase.from("wishlist_items").insert({
    wishlist_id: wishlistId,
    title: parsed.data.title,
    description: parsed.data.description,
    product_url: parsed.data.productUrl ?? null,
    price: parsed.data.price ?? null,
    currency: parsed.data.currency,
    priority: parsed.data.priority,
    image_url: sanitizeImageUrl(formData.get("imageUrl")),
  });

  if (error) {
    return { error: "Couldn't add that wish. Please try again." };
  }

  revalidatePath(`/wishlists/${wishlistId}`);
  return { success: true };
}

export async function updateWishlistItem(
  wishlistId: string,
  itemId: string,
  formData: FormData
): Promise<ActionResult> {
  const ctx = await requireUser();
  if (!ctx) return { error: "You need to be signed in." };
  const { supabase } = ctx;

  const parsed = wishlistItemSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    productUrl: formData.get("productUrl") ?? "",
    price: formData.get("price") ?? undefined,
    currency: formData.get("currency") || "USD",
    priority: formData.get("priority") ?? 0,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { error } = await supabase
    .from("wishlist_items")
    .update({
      title: parsed.data.title,
      description: parsed.data.description,
      product_url: parsed.data.productUrl ?? null,
      price: parsed.data.price ?? null,
      currency: parsed.data.currency,
      priority: parsed.data.priority,
      image_url: sanitizeImageUrl(formData.get("imageUrl")),
    })
    .eq("id", itemId)
    .eq("wishlist_id", wishlistId);

  if (error) {
    return { error: "Couldn't update that wish. Please try again." };
  }

  revalidatePath(`/wishlists/${wishlistId}`);
  return { success: true };
}

export async function deleteWishlistItem(
  wishlistId: string,
  itemId: string
): Promise<ActionResult> {
  const ctx = await requireUser();
  if (!ctx) return { error: "You need to be signed in." };
  const { supabase } = ctx;

  const { error } = await supabase
    .from("wishlist_items")
    .delete()
    .eq("id", itemId)
    .eq("wishlist_id", wishlistId);

  if (error) {
    return { error: "Couldn't remove that wish. Please try again." };
  }

  revalidatePath(`/wishlists/${wishlistId}`);
  return { success: true };
}

/**
 * Marking an item purchased is a deliberately narrow action, separate from
 * the general updateWishlistItem above. It only ever writes
 * is_purchased/purchased_by/purchased_at, never title/price/etc, so a
 * viewer-only collaborator (who is allowed to mark gifts as bought, per
 * the "collaborators can mark items purchased" RLS policy) can never use
 * this code path to silently edit other fields.
 */
export async function toggleItemPurchased(
  wishlistId: string,
  itemId: string,
  purchased: boolean
): Promise<ActionResult> {
  const ctx = await requireUser();
  if (!ctx) return { error: "You need to be signed in." };
  const { supabase, user } = ctx;

  const { error } = await supabase
    .from("wishlist_items")
    .update({
      is_purchased: purchased,
      purchased_by: purchased ? user.id : null,
      purchased_at: purchased ? new Date().toISOString() : null,
    })
    .eq("id", itemId)
    .eq("wishlist_id", wishlistId);

  if (error) {
    return { error: "Couldn't update that. Please try again." };
  }

  revalidatePath(`/wishlists/${wishlistId}`);
  return { success: true };
}
