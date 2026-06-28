"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SubmitButton({
  children,
  className,
  variant,
  disabled,
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "secondary" | "outline" | "destructive" | "ghost";
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending || disabled}
      variant={variant}
      className={cn("w-full", className)}
    >
      {pending && <Loader2 className="animate-spin" />}
      {children}
    </Button>
  );
}
