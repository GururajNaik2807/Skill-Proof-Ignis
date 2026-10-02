import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
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
    <div className="min-h-screen bg-warm-ivory text-ink flex">
      {/* Collapsible Left Navigation Bar */}
      <DashboardSidebar
        userEmail={user.email || ""}
        fullName={profile?.full_name || null}
        shareSlug={profile?.share_slug || null}
      />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-white flex items-center justify-between px-6 md:px-8 shrink-0">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-status-proven"></span>
            <span className="text-xs font-medium text-muted-text">
              Real-time Codebase Evidence Synchronization Active
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/recruiter/dashboard"
              className="text-xs text-muted-text hover:text-deep-green flex items-center gap-1 font-medium transition-colors"
            >
              Recruiter Mode <ExternalLink className="w-3 h-3 opacity-60" />
            </Link>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}