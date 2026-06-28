import { z } from "zod";

const slugRegex = /^[a-z0-9-]{3,80}$/;

export const slugify = (input: string): string =>
  input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

export const wishlistSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Give your wishlist a title")
    .max(120, "Title is too long"),
  description: z.string().trim().max(2000, "Description is too long").default(""),
  visibility: z.enum(["private", "shared", "public"]).default("private"),
  slug: z
    .string()
    .trim()
    .regex(slugRegex, "Use lowercase letters, numbers, and hyphens only")
    .optional(),
});

export type WishlistInput = z.infer<typeof wishlistSchema>;

// Reject obviously dangerous protocols up front; the browser/Next <Image>
// pipeline and server-side fetch also won't follow javascript:/data: URLs,
// but we validate here too as defense in depth and for a clean error
// message instead of a silent failure.
const safeUrl = (message: string) =>
  z
    .string()
    .trim()
    .url(message)
    .refine((url) => /^https:\/\//i.test(url), {
      message: "Link must start with https://",
    });

export const wishlistItemSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Give this wish a title")
    .max(200, "Title is too long"),
  description: z.string().trim().max(2000, "Description is too long").default(""),
  productUrl: z
    .union([safeUrl("Enter a valid https:// link"), z.literal("")])
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  price: z
    .union([z.coerce.number().min(0).max(10_000_000), z.nan()])
    .optional()
    .transform((v) => (v === undefined || Number.isNaN(v) ? undefined : v)),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, "Use a 3-letter currency code, e.g. USD")
    .default("USD"),
  priority: z.coerce.number().int().min(0).max(3).default(0),
});

export type WishlistItemInput = z.infer<typeof wishlistItemSchema>;

export const inviteCollaboratorSchema = z.object({
  username: z.string().trim().min(1, "Enter a username"),
  role: z.enum(["viewer", "editor"]).default("viewer"),
});

export type InviteCollaboratorInput = z.infer<typeof inviteCollaboratorSchema>;

export const profileSchema = z.object({
  displayName: z.string().trim().max(80).default(""),
  bio: z.string().trim().max(500).default(""),
});

export type ProfileInput = z.infer<typeof profileSchema>;
