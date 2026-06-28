import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock, Users, Globe } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ItemsGrid } from "@/components/wishlist/items-grid";
import { WishlistSettingsDialog } from "@/components/wishlist/wishlist-settings-dialog";
import { CopyLinkButton } from "@/components/wishlist/copy-link-button";

const visibilityMeta = {
  private: { icon: Lock, label: "Private" },
  shared: { icon: Users, label: "Shared" },
  public: { icon: Globe, label: "Public" },
} as const;

export default async function WishlistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // RLS on `wishlists` already enforces exactly who may see this row
  // (owner, public visibility, or an invited collaborator on a shared
  // list) — an unauthorized id simply returns no row, which we treat as
  // 404 rather than leaking whether the id exists at all.
  const { data: wishlist } = await supabase
    .from("wishlists")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!wishlist) notFound();

  const isOwner = user?.id === wishlist.owner_id;

  let collaboratorRole: "viewer" | "editor" | null = null;
  if (user && !isOwner) {
    const { data: collab } = await supabase
      .from("wishlist_collaborators")
      .select("role")
      .eq("wishlist_id", wishlist.id)
      .eq("user_id", user.id)
      .maybeSingle();
    collaboratorRole = collab?.role ?? null;
  }

  const canEdit = isOwner || collaboratorRole === "editor";
  const canMarkPurchased = isOwner || collaboratorRole !== null;

 const { data: items } = await supabase
    .from("wishlist_items")
    .select("*, adder:profiles!added_by(display_name, username)")
    .eq("wishlist_id", wishlist.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  let collaborators: {
    id: string;
    role: "viewer" | "editor";
    profile: { username: string; display_name: string; avatar_url: string | null };
  }[] = [];

  if (isOwner && wishlist.visibility === "shared") {
    const { data } = await supabase
      .from("wishlist_collaborators")
      .select("id, role, profile:profiles(username, display_name, avatar_url)")
      .eq("wishlist_id", wishlist.id);

    collaborators = (data ?? []).map((c) => ({
      id: c.id,
      role: c.role,
      profile: Array.isArray(c.profile) ? c.profile[0] : c.profile,
    }));
  }

  const { icon: VisIcon, label: visLabel } = visibilityMeta[wishlist.visibility];

  // Owners viewing their own list see who's bought what kept hidden
  // *from them* is a real product nuance we are not implementing here —
  // EiWish keeps it simple: owners can see purchase status too, since
  // collaborators marking things "bought" is meant to coordinate gifting
  // among guests, while what matters most is preventing duplicate gifts.
  const backHref = isOwner ? "/dashboard" : null;

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
        {backHref && (
          <Link
            href={backHref}
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> All wishlists
          </Link>
        )}

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-3xl font-medium tracking-tight">
                {wishlist.title}
              </h1>
              <Badge variant="muted" className="gap-1">
                <VisIcon className="size-3" />
                {visLabel}
              </Badge>
            </div>
            {wishlist.description && (
              <p className="mt-2 max-w-xl text-muted-foreground">
                {wishlist.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {wishlist.visibility === "public" && (
              <CopyLinkButton wishlistId={wishlist.id} />
            )}
            {isOwner && (
              <WishlistSettingsDialog
                wishlist={wishlist}
                collaborators={collaborators}
              />
            )}
          </div>
        </div>

        <div className="mt-10">
          <ItemsGrid
            items={(items ?? []).map((item) => ({
              ...item,
              adderName: Array.isArray(item.adder)
                ? (item.adder[0]?.display_name || item.adder[0]?.username)
                : ((item.adder as any)?.display_name || (item.adder as any)?.username),
            }))}
            wishlistId={wishlist.id}
            userId={user?.id ?? ""}
            canEdit={canEdit}
            canMarkPurchased={canMarkPurchased && !canEdit}
          />
        </div>
      </main>
    </div>
  );
}
