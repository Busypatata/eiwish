"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { inviteCollaboratorSchema } from "@/lib/validations/wishlist";
import type { ActionResult } from "@/lib/actions/auth";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { supabase, user };
}

export async function inviteCollaborator(
  wishlistId: string,
  formData: FormData
): Promise<ActionResult> {
  const ctx = await requireUser();
  if (!ctx) return { error: "You need to be signed in." };
  const { supabase, user } = ctx;

  const parsed = inviteCollaboratorSchema.safeParse({
    username: formData.get("username"),
    role: formData.get("role") ?? "viewer",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  // profiles are public-read, so this lookup works regardless of who's
  // asking — only the *invite write* below is access-controlled.
  const { data: invitee } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", parsed.data.username)
    .maybeSingle();

  if (!invitee) {
    return { error: "No user found with that username." };
  }

  if (invitee.id === user.id) {
    return { error: "You can't invite yourself." };
  }

  // RLS "owners can invite collaborators" rejects this unless the caller
  // actually owns wishlistId — an attempt to invite someone to a wishlist
  // you don't own simply fails here.
  const { error } = await supabase.from("wishlist_collaborators").insert({
    wishlist_id: wishlistId,
    user_id: invitee.id,
    role: parsed.data.role,
    invited_by: user.id,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "That person is already a collaborator." };
    }
    return { error: "Couldn't send the invite. Please try again." };
  }

  revalidatePath(`/wishlists/${wishlistId}`);
  return { success: true };
}

export async function removeCollaborator(
  wishlistId: string,
  collaboratorId: string
): Promise<ActionResult> {
  const ctx = await requireUser();
  if (!ctx) return { error: "You need to be signed in." };
  const { supabase } = ctx;

  const { error } = await supabase
    .from("wishlist_collaborators")
    .delete()
    .eq("id", collaboratorId)
    .eq("wishlist_id", wishlistId);

  if (error) {
    return { error: "Couldn't remove that collaborator. Please try again." };
  }

  revalidatePath(`/wishlists/${wishlistId}`);
  return { success: true };
}
