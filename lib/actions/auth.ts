"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth";

async function clientKey(action: string): Promise<string> {
  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    hdrs.get("x-real-ip") ??
    "unknown";
  return `${action}:${ip}`;
}

export type ActionResult = { error: string } | { success: true };

/**
 * A generic, non-revealing message used whenever an operation could leak
 * whether an email/username exists in the system. Enumeration of valid
 * accounts is a real attack vector (helps attackers target phishing/
 * credential-stuffing), so login, signup, and password-reset failures are
 * deliberately vague where it matters.
 */
const GENERIC_AUTH_ERROR = "That didn't work. Please check your details and try again.";

export async function signup(formData: FormData): Promise<ActionResult> {
  const key = await clientKey("signup");
  const { allowed } = rateLimit(key, { max: 5, windowMs: 15 * 60_000 });
  if (!allowed) {
    return { error: "Too many attempts. Please wait a few minutes and try again." };
  }

  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    username: formData.get("username"),
    displayName: formData.get("displayName") ?? "",
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { email, username, displayName, password } = parsed.data;

  // Check username availability up front using the admin client (bypasses
  // RLS, which is fine here — we're only checking existence, not exposing
  // any sensitive row data, and profiles are public-read anyway).
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (existing) {
    return { error: "That username is already taken." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username, display_name: displayName },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    // Supabase already returns reasonably safe messages for signup
    // (e.g. "User already registered" without details), but we still
    // avoid surfacing raw internals.
    return { error: error.message || GENERIC_AUTH_ERROR };
  }

  redirect("/signup/check-email");
}

export async function login(formData: FormData): Promise<ActionResult> {
  const key = await clientKey("login");
  const { allowed } = rateLimit(key, { max: 10, windowMs: 5 * 60_000 });
  if (!allowed) {
    return { error: "Too many attempts. Please wait a few minutes and try again." };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: GENERIC_AUTH_ERROR };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: GENERIC_AUTH_ERROR };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function requestPasswordReset(
  formData: FormData
): Promise<ActionResult> {
  const key = await clientKey("password-reset");
  const { allowed } = rateLimit(key, { max: 5, windowMs: 15 * 60_000 });
  if (!allowed) {
    // Same generic success shape even when rate-limited, to avoid
    // signalling anything different to a script hammering this endpoint.
    return { success: true };
  }

  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    // Always return success-shaped UI copy from the calling page regardless
    // of validation outcome, to avoid confirming/denying email existence.
    // We still short-circuit here to avoid calling Supabase with garbage.
    return { success: true };
  }

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/reset-password`,
  });

  // Intentionally always return success: whether or not this email is
  // registered, the response is identical, so the form can't be used to
  // enumerate accounts.
  return { success: true };
}

export async function resetPassword(formData: FormData): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();

  // This action only succeeds if the user has a valid recovery session,
  // established by clicking the emailed reset link (handled in
  // app/auth/callback/route.ts). There is no way to reset an arbitrary
  // user's password from here.
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { error: error.message || GENERIC_AUTH_ERROR };
  }

  redirect("/dashboard");
}
