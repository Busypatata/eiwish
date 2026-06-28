"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { wishlistSchema, slugify } from "@/lib/validations/wishlist";
import type { ActionResult } from "@/lib/actions/auth";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function createWishlist(formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await requireUser();

  const parsed = wishlistSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    visibility: formData.get("visibility") ?? "private",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const baseSlug = slugify(parsed.data.title) || "wishlist";
  let slug = baseSlug;
  let suffix = 1;

  // Resolve slug collisions within this owner's own wishlists. owner_id is
  // always set to the authenticated user (never trusted from the client),
  // so this can't be used to probe or collide with another user's lists.
  while (true) {
    const { data: existing } = await supabase
      .from("wishlists")
      .select("id")
      .eq("owner_id", user.id)
      .eq("slug", slug)
      .maybeSingle();

    if (!existing) break;
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  const { data, error } = await supabase
    .from("wishlists")
    .insert({
      owner_id: user.id,
      title: parsed.data.title,
      description: parsed.data.description,
      visibility: parsed.data.visibility,
      slug,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Couldn't create the wishlist. Please try again." };
  }

  revalidatePath("/dashboard");
  redirect(`/wishlists/${data.id}`);
}

export async function updateWishlist(
  wishlistId: string,
  formData: FormData
): Promise<ActionResult> {
  const { supabase } = await requireUser();

  const parsed = wishlistSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    visibility: formData.get("visibility") ?? "private",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  // No owner_id check needed in the query itself — RLS's
  // "owners and editors can update wishlists" policy already restricts
  // this update to rows the current user is authorized to touch, and
  // silently affects 0 rows otherwise rather than ever leaking other
  // users' data.
  const { error } = await supabase
    .from("wishlists")
    .update({
      title: parsed.data.title,
      description: parsed.data.description,
      visibility: parsed.data.visibility,
    })
    .eq("id", wishlistId);

  if (error) {
    return { error: "Couldn't update the wishlist. Please try again." };
  }

  revalidatePath(`/wishlists/${wishlistId}`);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteWishlist(wishlistId: string): Promise<ActionResult> {
  const { supabase } = await requireUser();

  // RLS "owners can delete own wishlists" ensures this only ever succeeds
  // for the actual owner; item rows cascade-delete via the FK constraint.
  const { error } = await supabase
    .from("wishlists")
    .delete()
    .eq("id", wishlistId);

  if (error) {
    return { error: "Couldn't delete the wishlist. Please try again." };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
