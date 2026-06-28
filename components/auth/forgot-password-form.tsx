"use client";

import { useState } from "react";
import { toast } from "sonner";
import { requestPasswordReset } from "@/lib/actions/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/site/submit-button";
import { CheckCircle2 } from "lucide-react";

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);

  async function handleSubmit(formData: FormData) {
    await requestPasswordReset(formData);
    // Always show the same success state regardless of whether the email
    // is registered, so this form can't be used to enumerate accounts.
    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-accent text-secondary">
          <CheckCircle2 className="size-6" />
        </div>
        <p className="text-sm text-muted-foreground">
          If an account exists for that email, we&apos;ve sent a link to
          reset your password.
        </p>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
      </div>
      <SubmitButton>Send reset link</SubmitButton>
    </form>
  );
}
