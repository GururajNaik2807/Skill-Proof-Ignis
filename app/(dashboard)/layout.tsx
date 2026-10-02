import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { DashboardProvider } from "@/context/dashboard-context";
import { getUserRole } from "@/lib/auth/roles";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const role = await getUserRole(supabase, user);
  if (role !== "candidate") {
    redirect(role === "recruiter" ? "/recruiter/dashboard" : "/login?error=profile-role-required");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, share_slug, role")
    .eq("id", user.id)
    .single();

  return (
    <DashboardProvider>
      <div className="min-h-screen bg-warm-ivory text-ink flex">
        <DashboardSidebar
          userEmail={user.email || ""}
          fullName={profile?.full_name || null}
          shareSlug={profile?.share_slug || null}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 border-b border-border bg-white flex items-center justify-between px-6 md:px-8 shrink-0">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-status-proven"></span>
              <span className="text-xs font-medium text-muted-text">
                Real-time Codebase Evidence Synchronization Active
              </span>
            </div>

            <div className="flex items-center gap-3" />
          </header>

          <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </DashboardProvider>
  );
}