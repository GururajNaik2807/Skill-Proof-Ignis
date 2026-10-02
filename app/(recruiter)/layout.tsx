import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  ShieldCheck,
  Users,
  Briefcase,
  LogOut,
  Building2,
  LayoutDashboard,
  FileSearch,
  Star,
  Settings,
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex">
      {/* Recruiter Sidebar */}
      <aside className="w-60 border-r border-zinc-800/80 bg-zinc-950 flex flex-col justify-between hidden md:flex shrink-0 z-10">
        <div>
          {/* Brand Header */}
          <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between">
            <Link href="/recruiter/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-base font-heading block leading-none text-zinc-100">
                  SkillProof
                </span>
                <span className="text-[10px] text-zinc-500 font-mono tracking-wide uppercase">
                  Recruiter Workspace
                </span>
              </div>
            </Link>
          </div>

          {/* Org details banner */}
          <div className="mx-4 mt-5 p-3 bg-zinc-900/50 border border-zinc-800/80 rounded-xl flex items-center gap-3 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-400">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-zinc-200 truncate">
                {profile?.company_name || "Engineering Team"}
              </p>
              <p className="text-[10px] text-emerald-400 font-mono truncate">Verified Recruiter</p>
            </div>
          </div>

          {/* Expanded Navigation */}
          <nav className="p-3 space-y-1 mt-4">
            <Link
              href="/recruiter/dashboard"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 text-emerald-400" />
              Overview
            </Link>
            <Link
              href="/recruiter/jobs"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100 transition-colors"
            >
              <Briefcase className="w-4 h-4 text-emerald-400" />
              Jobs
            </Link>
            <Link
              href="/recruiter/dashboard"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100 transition-colors"
            >
              <Users className="w-4 h-4 text-emerald-400" />
              Candidates
            </Link>
            <Link
              href="/recruiter/dashboard"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100 transition-colors"
            >
              <FileSearch className="w-4 h-4 text-emerald-400" />
              Evidence
            </Link>
            <Link
              href="/recruiter/dashboard"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100 transition-colors"
            >
              <Star className="w-4 h-4 text-emerald-400" />
              Shortlist
            </Link>
          </nav>
        </div>

        {/* Bottom Actions */}
        <div>
          <div className="px-3 pb-2">
            <Link
              href="/recruiter/dashboard"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
          </div>
          <div className="p-4 border-t border-zinc-800/80 flex items-center justify-between bg-zinc-950">
            <div className="truncate max-w-36">
              <p className="text-xs font-bold text-zinc-200 truncate">
                {profile?.full_name || user.email?.split("@")[0]}
              </p>
              <p className="text-[10px] text-zinc-500 font-mono truncate">{user.email}</p>
            </div>
            <form action="/auth/signout" method="POST">
              <button
                type="submit"
                title="Sign out"
                className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-16 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md flex items-center justify-between px-5 md:px-8 shrink-0">
          <div>
            <p className="font-heading font-bold text-sm text-zinc-100">Recruiter Workspace</p>
            <p className="text-[11px] font-mono text-zinc-500 hidden sm:block">Evidence-led candidate review</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md uppercase tracking-wider">
              Recruiter
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}