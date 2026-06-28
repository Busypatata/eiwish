import { Mail } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";

export default function CheckEmailPage() {
  return (
    <AuthShell title="Check your inbox">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-accent text-primary">
          <Mail className="size-6" />
        </div>
        <p className="text-sm text-muted-foreground">
          We sent a confirmation link to your email. Click it to activate
          your account and start your first wishlist.
        </p>
      </div>
    </AuthShell>
  );
}
