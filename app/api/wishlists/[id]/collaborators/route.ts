import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json([], { status: 401 });

  const { data } = await supabase
    .from("wishlist_collaborators")
    .select("id, role, profiles(username, display_name, avatar_url)")
    .eq("wishlist_id", id);

  const collaborators = (data ?? []).map((c) => ({
    id: c.id,
    role: c.role,
    profile: Array.isArray(c.profiles) ? c.profiles[0] : c.profiles,
  }));

  return NextResponse.json(collaborators);
}
