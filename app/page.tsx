import Link from "next/link";
import { Gift, Lock, Share2, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { HeroTags } from "@/components/site/hero-tags";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 md:grid-cols-2 md:py-28">
          <div>
            <p className="font-display text-sm uppercase tracking-[0.18em] text-secondary">
              For every birthday, holiday, and someday
            </p>
            <h1 className="mt-4 font-display text-5xl font-medium leading-[1.05] tracking-tight md:text-6xl">
              Wishing,
              <br />
              <span className="text-primary">made easy.</span>
            </h1>
            <p className="mt-6 max-w-md text-lg text-muted-foreground">
              Keep every wish in one place. Share the lists that matter,
              keep the rest just for you, and let the people who love you
              know exactly what to get — without ever giving it away.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/signup">Start your first list</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/login">Log in</Link>
              </Button>
            </div>
          </div>
          <div className="flex justify-center md:justify-end">
            <HeroTags />
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-border/70 bg-card/40">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <h2 className="font-display text-3xl font-medium tracking-tight">
              Everything a wishlist should be
            </h2>
            <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <Feature
                icon={<Gift />}
                title="Unlimited lists"
                description="Birthdays, weddings, baby showers, just-because — make as many lists as you need."
              />
              <Feature
                icon={<Lock />}
                title="Private by default"
                description="Every new list starts visible only to you. Nothing goes public until you say so."
              />
              <Feature
                icon={<Share2 />}
                title="Share with the right people"
                description="Invite specific people to a shared list, or post a public page for anyone with the link."
              />
              <Feature
                icon={<Sparkles />}
                title="No double gifts"
                description="Invited guests can quietly mark something as bought, so nobody ends up with two of the same thing."
              />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-5 py-20 text-center">
          <h2 className="font-display text-3xl font-medium tracking-tight">
            Your wishes, organized.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            Free to use, ready in under a minute.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link href="/signup">Create your wishlist</Link>
          </Button>
        </section>
      </main>

      <footer className="border-t border-border/70 px-5 py-8 text-center text-sm text-muted-foreground">
        EiWish — make a wish.
      </footer>
    </div>
  );
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div>
      <div className="flex size-10 items-center justify-center rounded-full bg-accent text-primary [&_svg]:size-5">
        {icon}
      </div>
      <h3 className="mt-4 font-display text-lg font-medium">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
