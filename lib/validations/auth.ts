import { z } from "zod";

// Reused across signup/login. Deliberately doesn't over-specify complexity
// rules beyond a sane minimum length — Supabase Auth enforces its own
// password policy server-side regardless of what we check client-side, so
// this is a UX nicety, not the security boundary.
const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password is too long"); // bcrypt's effective limit

const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username must be at most 30 characters")
  .regex(
    usernameRegex,
    "Username can only contain letters, numbers, and underscores"
  );

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address")
  .max(254);

export const signupSchema = z
  .object({
    email: emailSchema,
    username: usernameSchema,
    displayName: z.string().trim().max(80).optional().default(""),
    password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
