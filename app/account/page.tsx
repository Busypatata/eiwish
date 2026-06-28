import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site/site-header";
import { AccountForm } from "@/components/account/account-form";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/dashboard");

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-10">
        <h1 className="font-display text-3xl font-medium tracking-tight">
          Account settings
        </h1>
        <div className="mt-8 rounded-xl border border-border bg-card p-6">
          <AccountForm profile={profile} />
        </div>
      </main>
    </div>
  );
}
