"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { profileSchema } from "@/lib/validations/wishlist";
import type { ActionResult } from "@/lib/actions/auth";

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be signed in." };

  const parsed = profileSchema.safeParse({
    displayName: formData.get("displayName") ?? "",
    bio: formData.get("bio") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  // RLS "users can update own profile" still applies; .eq("id", user.id)
  // here is belt-and-suspenders, not the actual security boundary.
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.displayName,
      bio: parsed.data.bio,
    })
    .eq("id", user.id);

  if (error) {
    return { error: "Couldn't update your profile. Please try again." };
  }

  revalidatePath("/account");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateAvatar(avatarUrl: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be signed in." };

  // avatarUrl is expected to already point at a file the user just
  // uploaded into their own storage.foldername(name)[1] === auth.uid()
  // path (enforced by storage policies), so there's nothing further to
  // authorize here beyond the row update itself, which RLS also guards.
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id);

  if (error) {
    return { error: "Couldn't update your avatar. Please try again." };
  }

  revalidatePath("/account");
  return { success: true };
}
