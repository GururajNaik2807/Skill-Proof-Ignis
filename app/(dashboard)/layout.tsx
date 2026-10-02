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
          <header className="h-16 border-b border-border bg-paper flex items-center justify-between px-5 md:px-8 shrink-0">
            <div>
              <p className="font-heading font-bold text-sm text-ink">Your SkillProof</p>
              <p className="text-xs text-muted-text hidden sm:block">Candidate verification workspace</p>
            </div>
            <span className="text-xs font-medium text-deep-green bg-deep-green/8 px-2.5 py-1 rounded-md">Candidate</span>
          </header>

          <main className="flex-1 p-5 md:p-8 max-w-7xl w-full mx-auto overflow-y-auto page-enter">
            {children}
          </main>
        </div>
      </div>
    </DashboardProvider>
  );
}