"use client";

import { toast } from "sonner";
import { resetPassword } from "@/lib/actions/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/site/submit-button";

export function ResetPasswordForm() {
  async function handleSubmit(formData: FormData) {
    const result = await resetPassword(formData);
    if (result && "error" in result) {
      toast.error(result.error);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
      </div>
      <SubmitButton>Update password</SubmitButton>
    </form>
  );
}
