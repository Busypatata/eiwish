import Link from "next/link";
import { WishTagMark } from "@/components/site/wish-tag-mark";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-background px-5 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <WishTagMark className="size-7" />
          <span className="font-display text-xl font-medium tracking-tight">
            EiWish
          </span>
        </Link>
        <div className="rounded-xl border border-border bg-card p-7 shadow-sm">
          <h1 className="font-display text-2xl font-medium tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
          )}
          <div className="mt-6">{children}</div>
        </div>
        {footer && (
          <p className="mt-5 text-center text-sm text-muted-foreground">
            {footer}
          </p>
        )}
      </div>
    </div>
  );
}
