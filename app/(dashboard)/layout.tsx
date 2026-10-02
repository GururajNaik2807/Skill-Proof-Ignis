import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { DashboardProvider } from "@/context/dashboard-context";
import { ExternalLink } from "lucide-react";

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, share_slug, role")
    .eq("id", user.id)
    .single();

  return (
    <DashboardProvider>
      {/* h-screen + overflow-hidden prevents the whole window from scrolling */}
      <div className="h-screen w-screen overflow-hidden bg-warm-ivory text-ink flex">
        {/* Sidebar remains pinned at full viewport height */}
        <DashboardSidebar
          userEmail={user.email || ""}
          fullName={profile?.full_name || null}
          shareSlug={profile?.share_slug || null}
        />

        {/* Right side content container */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {/* Top header stays sticky */}
          <header className="h-16 border-b border-border bg-white flex items-center justify-between px-6 md:px-8 shrink-0 z-10">
            <div>
              <span className="font-bold text-sm text-ink block">Your SkillProof</span>
              <span className="text-[11px] text-muted-text">Candidate verification workspace</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-deep-green/10 text-deep-green">
                Candidate
              </span>
              <Link
                href="/recruiter/dashboard"
                prefetch={false}
                className="text-xs text-muted-text hover:text-deep-green flex items-center gap-1 font-medium transition-colors"
              >
                Recruiter Mode <ExternalLink className="w-3 h-3 opacity-60" />
              </Link>
            </div>
          </header>

          {/* Only this main container scrolls */}
          <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </DashboardProvider>
  );
}