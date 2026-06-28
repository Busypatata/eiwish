import "server-only";
import { Resend } from "resend";

/**
 * Optional: Supabase Auth already sends signup confirmation and password
 * reset emails out of the box using its built-in mailer, so EiWish works
 * with zero email configuration beyond Supabase itself.
 *
 * This wrapper is here for custom transactional emails you may want to
 * add later (e.g. "you were invited to a wishlist", "someone reserved
 * your wish") using Resend for nicer deliverability/branding. Only
 * instantiate the client when RESEND_API_KEY is actually set, so the app
 * doesn't crash in environments that haven't configured it.
 */
let resendClient: Resend | null = null;

export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!resendClient) resendClient = new Resend(apiKey);
  return resendClient;
}

export async function sendCollaboratorInviteEmail(params: {
  to: string;
  inviterName: string;
  wishlistTitle: string;
  wishlistUrl: string;
}): Promise<void> {
  const resend = getResendClient();
  if (!resend) return; // Silently no-op if Resend isn't configured.

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "EiWish <onboarding@resend.dev>",
    to: params.to,
    subject: `${params.inviterName} shared a wishlist with you on EiWish`,
    html: `
      <p>${escapeHtml(params.inviterName)} invited you to view their wishlist "${escapeHtml(
      params.wishlistTitle
    )}" on EiWish.</p>
      <p><a href="${params.wishlistUrl}">View the wishlist</a></p>
    `,
  });
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
