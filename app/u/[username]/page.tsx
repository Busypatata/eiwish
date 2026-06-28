import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site/site-header";
import { WishlistCard } from "@/components/wishlist/wishlist-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Gift } from "lucide-react";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `@${username} on EiWish`,
    description: `See ${username}'s public wishlists on EiWish.`,
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  // profiles is publicly readable per RLS, so this works for anonymous
  // visitors too.
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .ilike("username", username)
    .maybeSingle();

  if (!profile) notFound();

  // Only 'public' wishlists are visible here — RLS would also block
  // anything else for an anonymous/non-owner visitor regardless, this
  // explicit filter just keeps the query intent clear.
  const { data: wishlists } = await supabase
    .from("wishlists")
    .select("id, title, description, visibility, wishlist_items(count)")
    .eq("owner_id", profile.id)
    .eq("visibility", "public")
    .order("created_at", { ascending: false });

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
        <div className="flex items-center gap-4">
          <Avatar className="size-16 border border-border">
            {profile.avatar_url && <AvatarImage src={profile.avatar_url} />}
            <AvatarFallback className="text-xl">
              {(profile.display_name || profile.username).charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-display text-2xl font-medium tracking-tight">
              {profile.display_name || `@${profile.username}`}
            </h1>
            <p className="text-sm text-muted-foreground">
              @{profile.username}
            </p>
          </div>
        </div>

        {profile.bio && (
          <p className="mt-4 max-w-xl text-muted-foreground">{profile.bio}</p>
        )}

        <h2 className="mt-10 font-display text-xl font-medium">
          Public wishlists
        </h2>

        {wishlists && wishlists.length > 0 ? (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
          <div className="mt-10 flex flex-col items-center gap-3 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-accent text-primary">
              <Gift className="size-7" />
            </div>
            <p className="text-sm text-muted-foreground">
              No public wishlists yet.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
