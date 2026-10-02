import type { SupabaseClient, User } from "@supabase/supabase-js";

export type AppRole = "candidate" | "recruiter";

export function normalizeRole(value: unknown): AppRole | null {
  if (value === "candidate" || value === "developer") return "candidate";
  if (value === "recruiter" || value === "employer") return "recruiter";
  return null;
}

export async function getUserRole(
  supabase: SupabaseClient,
  user: User
): Promise<AppRole | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  return normalizeRole(profile?.role ?? user.user_metadata?.role);
}

export function workspaceForRole(role: AppRole): string {
  return role === "recruiter" ? "/recruiter/dashboard" : "/dashboard";
}
