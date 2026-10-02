import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getUserRole, workspaceForRole } from "@/lib/auth/roles";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (next === "/auth/reset-password") {
        return NextResponse.redirect(`${origin}${next}`);
      }
      const { data: { user } } = await supabase.auth.getUser();
      const role = user ? await getUserRole(supabase, user) : null;
      return NextResponse.redirect(`${origin}${role ? workspaceForRole(role) : next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth-code-error`);
}