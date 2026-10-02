import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { DashboardProvider } from "@/context/dashboard-context";
import { ArrowRight, UserCheck } from "lucide-react";

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
      <div className="h-screen w-screen overflow-hidden bg-[#050505] text-[#EDEDED] flex font-sans selection:bg-[#00E5FF]/20">
        {/* Pinned Desktop Sidebar */}
        <DashboardSidebar
          userEmail={user.email || ""}
          fullName={profile?.full_name || null}
          shareSlug={profile?.share_slug || null}
        />

        {/* Workspace Canvas */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {/* Streamlined Minimalist Header */}
          <header className="h-12 border-b border-white/[0.08] bg-[#09090b]/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-10">
            <div className="flex items-center gap-2.5 text-xs text-[#8A8F98]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00E599] animate-pulse shadow-[0_0_8px_#00E599]" />
              <span className="font-mono text-[11px] text-[#EDEDED]">SkillProof Inspector</span>
              <span className="text-white/20">/</span>
              <span className="truncate max-w-[200px] text-[#8A8F98]">{profile?.full_name || user.email}</span>
            </div>

            {/* Compact Segmented Switcher */}
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center p-0.5 rounded-lg bg-[#121214] border border-white/[0.08] text-xs">
                <span className="px-2.5 py-1 rounded-[6px] bg-white/[0.08] text-[#EDEDED] font-medium shadow-sm flex items-center gap-1.5">
                  <UserCheck className="w-3 h-3 text-[#00E5FF]" /> Candidate
                </span>
                <Link
                  href="/recruiter/dashboard"
                  prefetch={false}
                  className="px-2.5 py-1 text-[#8A8F98] hover:text-[#EDEDED] font-medium transition-colors"
                >
                  Recruiter
                </Link>
              </div>

              {profile?.share_slug && (
                <Link
                  href={`/v/${profile.share_slug}`}
                  target="_blank"
                  className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono text-[#8A8F98] hover:text-[#00E5FF] px-2.5 py-1 rounded-md border border-transparent hover:border-white/[0.08] hover:bg-white/[0.03] transition-colors"
                >
                  Public Matrix <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          </header>

          {/* Full vertical space workspace container */}
          <main className="flex-1 overflow-y-auto p-5 md:p-8 max-w-[1500px] w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </DashboardProvider>
  );
}