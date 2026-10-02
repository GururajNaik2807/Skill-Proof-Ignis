import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  ShieldCheck,
  LayoutDashboard,
  FileText,
  Award,
  Briefcase,
  CheckSquare,
  LogOut,
} from "lucide-react";

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

  return (
    <div className="min-h-screen bg-warm-ivory flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-border flex flex-col justify-between shrink-0">
        <div>
          {/* Logo */}
          <div className="h-16 flex items-center gap-2 px-6 border-b border-border">
            <div className="w-7 h-7 rounded-lg bg-deep-green flex items-center justify-center text-white">
              <ShieldCheck className="w-4 h-4 text-emerald" />
            </div>
            <span className="font-bold text-base tracking-tight font-heading">
              SkillProof
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-ink hover:bg-soft-surface transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 text-muted-text" />
              Dashboard
            </Link>

            <Link
              href="/resume"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-ink hover:bg-soft-surface transition-colors"
            >
              <FileText className="w-4 h-4 text-muted-text" />
              Resume Claims
            </Link>

            <Link
              href="/skills"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-ink hover:bg-soft-surface transition-colors"
            >
              <Award className="w-4 h-4 text-muted-text" />
              Evidence Matrix
            </Link>

            <Link
              href="/job-match"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-ink hover:bg-soft-surface transition-colors"
            >
              <Briefcase className="w-4 h-4 text-muted-text" />
              Job Match
            </Link>

            <Link
              href="/micro-tasks"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-ink hover:bg-soft-surface transition-colors"
            >
              <CheckSquare className="w-4 h-4 text-muted-text" />
              Micro-Tasks
            </Link>
          </nav>
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="truncate max-w-[140px]">
              <p className="text-xs font-medium text-ink truncate">
                {user.email}
              </p>
              <p className="text-[10px] text-muted-text">Standard Plan</p>
            </div>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                title="Sign out"
                className="p-1.5 rounded-lg text-muted-text hover:text-status-error hover:bg-status-error/10 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 p-6 md:p-8 max-w-6xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}