"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ShieldCheck,
  LayoutDashboard,
  CheckCircle2,
  GitBranch,
  Briefcase,
  Layers,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ExternalLink,
  UserCheck,
} from "lucide-react";

interface SidebarProps {
  userEmail: string;
  fullName: string | null;
  shareSlug: string | null;
}

export function DashboardSidebar({ userEmail, fullName, shareSlug }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  };

  const navItems = [
    {
      label: "Overview",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Evidence",
      href: "/matrix",
      icon: CheckCircle2,
    },
    {
      label: "Job Match",
      href: "/jobs",
      icon: Briefcase,
    },
    {
      label: "Micro-Tasks",
      href: "/tasks",
      icon: Layers,
    },
    {
      label: "GitHub",
      href: "/github",
      icon: GitBranch,
    },
    {
      label: "Profile & Resume",
      href: "/profile",
      icon: UserCheck,
    },
  ];

  return (
    <aside
      className={`relative h-full border-r border-white/10 bg-[#0A0A0A] flex flex-col justify-between transition-all duration-300 shrink-0 z-20 ${
        collapsed ? "w-16 md:w-20" : "w-16 md:w-56"
      }`}
    >
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="hidden md:flex absolute -right-3.5 top-5 w-7 h-7 rounded-full bg-[#050505] border border-white/10 shadow-[0_0_10px_rgba(0,0,0,0.5)] items-center justify-center text-[#8A8F98] hover:text-[#EDEDED] hover:bg-white/5 transition-colors z-30 cursor-pointer"
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4 text-[#00E5FF]" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-[#00E5FF]" />
        )}
      </button>

      <div className="flex-1 flex flex-col min-h-0">
        <div
          className={`p-4 border-b border-white/10 flex items-center shrink-0 ${
            collapsed ? "justify-center" : "justify-center md:justify-start md:gap-2.5"
          }`}
        >
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-[9px] border border-[#00E5FF]/30 bg-[#00E5FF]/10 flex items-center justify-center text-white shrink-0 transition-colors group-hover:bg-[#00E5FF]/20 shadow-[0_0_12px_rgba(0,229,255,0.15)]">
              <ShieldCheck className="w-5 h-5 text-[#00E5FF]" />
            </div>
            {!collapsed && (
              <div className="hidden md:block">
                <span className="font-bold text-base font-sans block leading-none text-[#EDEDED] tracking-tight">
                  SkillProof
                </span>
                <span className="text-[10px] text-[#8A8F98] font-mono tracking-wide">
                  Candidate workspace
                </span>
              </div>
            )}
          </Link>
        </div>

        <nav className="p-2 md:p-3 space-y-1 mt-2 overflow-y-auto flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`flex items-center rounded-lg transition-colors text-xs font-semibold ${
                  collapsed
                    ? "justify-center px-0 py-3"
                    : "justify-center md:justify-start gap-3 px-0 md:px-3.5 py-3 md:py-2.5"
                } ${
                  isActive
                    ? "bg-white/10 text-[#EDEDED] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] border border-white/5"
                    : "text-[#8A8F98] hover:text-[#EDEDED] hover:bg-white/5 border border-transparent"
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? "text-[#00E5FF]" : "text-[#8A8F98]"
                  }`}
                />
                {!collapsed && <span className="hidden md:inline">{item.label}</span>}
              </Link>
            );
          })}

          {shareSlug && (
            <Link
              href={`/v/${shareSlug}`}
              target="_blank"
              title={collapsed ? "Public Proof URL" : undefined}
              className={`flex items-center rounded-lg transition-colors text-xs font-semibold text-[#8A8F98] hover:text-[#EDEDED] hover:bg-white/5 border border-transparent ${
                collapsed ? "justify-center px-0 py-3" : "gap-3 px-3.5 py-2.5"
              }`}
            >
              <ExternalLink className="w-4 h-4 shrink-0 text-[#8A8F98]" />
              {!collapsed && <span className="hidden md:inline">Public Proof URL</span>}
            </Link>
          )}
        </nav>
      </div>

      <div
        className={`p-4 border-t border-white/10 flex items-center shrink-0 ${
          collapsed ? "justify-center" : "justify-between"
        }`}
      >
        {!collapsed && (
          <div className="hidden md:block truncate max-w-36">
            <p className="text-xs font-bold text-[#EDEDED] truncate">
              {fullName || "Candidate"}
            </p>
            <p className="text-[10px] text-[#8A8F98] truncate">{userEmail}</p>
          </div>
        )}

        <button
          type="button"
          onClick={handleSignOut}
          title="Sign out"
          className="p-2 text-[#8A8F98] hover:text-[#F59E0B] hover:bg-[#F59E0B]/10 rounded-lg transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}