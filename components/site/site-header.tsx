import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { WishTagMark } from "@/components/site/wish-tag-mark";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/site/user-menu";

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let username: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, avatar_url, display_name")
      .eq("id", user.id)
      .single();
    username = profile?.username ?? null;

    return (
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href="/dashboard" className="flex items-center gap-2">
            <WishTagMark className="size-6" />
            <span className="font-display text-lg font-medium tracking-tight">
              EiWish
            </span>
          </Link>
          <UserMenu
            displayName={profile?.display_name || username || "You"}
            avatarUrl={profile?.avatar_url ?? null}
            username={username ?? ""}
          />
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2">
          <WishTagMark className="size-6" />
          <span className="font-display text-lg font-medium tracking-tight">
            EiWish
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Get started</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
