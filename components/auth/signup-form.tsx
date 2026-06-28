"use client";

import { toast } from "sonner";
import { signup } from "@/lib/actions/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/site/submit-button";

export function SignupForm() {
  async function handleSubmit(formData: FormData) {
    const result = await signup(formData);
    if (result && "error" in result) {
      toast.error(result.error);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          name="username"
          autoComplete="username"
          placeholder="jamielee"
          required
          minLength={3}
          maxLength={30}
          pattern="[a-zA-Z0-9_]+"
          title="Letters, numbers, and underscores only"
        />
        <p className="text-xs text-muted-foreground">
          This becomes your public link: eiwish.app/u/yourname
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="displayName">Display name</Label>
        <Input
          id="displayName"
          name="displayName"
          autoComplete="name"
          placeholder="Jamie Lee"
          maxLength={80}
        />
      </div>
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
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
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
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
      </div>
      <SubmitButton>Create account</SubmitButton>
    </form>
  );
}
