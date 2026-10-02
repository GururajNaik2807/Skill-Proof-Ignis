import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  ShieldCheck,
  Users,
  Briefcase,
  LogOut,
  Building2,
} from "lucide-react";
import { getUserRole } from "@/lib/auth/roles";

export default async function RecruiterLayout({
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
  if (role !== "recruiter") {
    redirect(role === "candidate" ? "/dashboard" : "/login?error=profile-role-required");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-warm-ivory text-ink flex">
      {/* Recruiter Sidebar */}
      <aside className="w-64 border-r border-border bg-white flex flex-col justify-between hidden md:flex shrink-0">
        <div>
          <div className="p-6 border-b border-border flex items-center justify-between">
            <Link href="/recruiter/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-deep-green flex items-center justify-center text-white">
                <ShieldCheck className="w-5 h-5 text-emerald" />
              </div>
              <div>
                <span className="font-bold text-base font-heading block leading-none">
                  SkillProof
                </span>
                <span className="text-[10px] text-muted-text font-mono uppercase tracking-wider">
                  Recruiter Workspace
                </span>
              </div>
            </Link>
          </div>

          {/* Org details banner */}
          <div className="mx-4 mt-4 p-3 bg-soft-surface/60 border border-border rounded-lg flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-white border border-border flex items-center justify-center text-deep-green">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-ink truncate">
                {profile?.company_name || "Engineering Team"}
              </p>
              <p className="text-[10px] text-muted-text truncate">Verified Recruiter</p>
            </div>
          </div>

          <nav className="p-4 space-y-1.5 mt-2">
            <Link
              href="/recruiter/dashboard"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium text-ink hover:bg-soft-surface transition-colors"
            >
              <Users className="w-4 h-4 text-deep-green" />
              Verified Candidates
            </Link>
            <Link
              href="/recruiter/jobs"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium text-ink hover:bg-soft-surface transition-colors"
            >
              <Briefcase className="w-4 h-4 text-deep-green" />
              Job Matches & JDs
            </Link>
          </nav>
        </div>

        {/* User bar & signout */}
        <div className="p-4 border-t border-border flex items-center justify-between">
          <div className="truncate max-w-36">
            <p className="text-xs font-semibold text-ink truncate">
              {profile?.full_name || user.email}
            </p>
            <p className="text-[10px] text-muted-text truncate">{user.email}</p>
          </div>
          <form action="/auth/signout" method="POST">
            <button
              type="submit"
              title="Sign out"
              className="p-2 text-muted-text hover:text-status-error hover:bg-status-error/10 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-white flex items-center justify-between px-6 md:px-8">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-status-proven"></span>
            <span className="text-xs font-medium text-muted-text">
              Live GitHub Codebase Verification Active
            </span>
          </div>
          <div className="flex items-center gap-3" />
        </header>

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}