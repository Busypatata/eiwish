import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site/site-header";
import { WishlistCard } from "@/components/wishlist/wishlist-card";
import { NewWishlistDialog } from "@/components/wishlist/new-wishlist-dialog";
import { Gift } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // RLS "owners can view own wishlists" scopes this to the current user
  // regardless of the lack of an explicit .eq filter, but we add one
  // anyway for clarity and to avoid relying solely on RLS in app logic.
  const { data: wishlists } = await supabase
    .from("wishlists")
    .select("id, title, description, visibility, wishlist_items(count)")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-display text-3xl font-medium tracking-tight">
            My wishlists
          </h1>
          <NewWishlistDialog />
        </div>

        {wishlists && wishlists.length > 0 ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {wishlists.map((w) => (
              <WishlistCard
                key={w.id}
                id={w.id}
                title={w.title}
                description={w.description}
                visibility={w.visibility}
                itemCount={w.wishlist_items?.[0]?.count ?? 0}
              />
            ))}
          </div>
        ) : (
          <div className="mt-16 flex flex-col items-center gap-3 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-accent text-primary">
              <Gift className="size-7" />
            </div>
            <h2 className="font-display text-xl font-medium">
              No wishlists yet
            </h2>
            <p className="max-w-xs text-sm text-muted-foreground">
              Create your first wishlist to start collecting the things
              you&apos;re hoping for.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
