import Link from "next/link";
import { Lock, Users, Globe } from "lucide-react";
import type { Visibility } from "@/types/database";
import { Badge } from "@/components/ui/badge";

const visibilityMeta: Record<
  Visibility,
  { icon: React.ReactNode; label: string }
> = {
  private: { icon: <Lock className="size-3" />, label: "Private" },
  shared: { icon: <Users className="size-3" />, label: "Shared" },
  public: { icon: <Globe className="size-3" />, label: "Public" },
};

export function WishlistCard({
  id,
  title,
  description,
  visibility,
  itemCount,
}: {
  id: string;
  title: string;
  description: string;
  visibility: Visibility;
  itemCount: number;
}) {
  const meta = visibilityMeta[visibility];

  return (
    <Link
      href={`/wishlists/${id}`}
      className="tag-notch group block rounded-xl border border-border bg-card p-5 pt-7 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-lg font-medium leading-snug">
          {title}
        </h3>
        <Badge variant="muted" className="shrink-0 gap-1">
          {meta.icon}
          {meta.label}
        </Badge>
      </div>
      {description && (
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
          {description}
        </p>
      )}
      <p className="mt-4 text-xs text-muted-foreground">
        {itemCount} {itemCount === 1 ? "wish" : "wishes"}
      </p>
    </Link>
  );
}
