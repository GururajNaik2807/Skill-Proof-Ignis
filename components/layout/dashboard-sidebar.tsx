"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldCheck,
  LayoutDashboard,
  CheckCircle2,
  GitBranch,
  FileText,
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
      href: "/onboarding#github",
      icon: GitBranch,
    },
    {
      label: "Resume",
      href: "/onboarding#resume",
      icon: FileText,
    },
    {
      label: "Profile",
      href: "/onboarding#profile",
      icon: UserCheck,
    },
  ];

  return (
    <aside
      className={`relative border-r border-border bg-white flex flex-col justify-between transition-all duration-300 shrink-0 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Collapse Toggle Button */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute -right-3.5 top-6 w-7 h-7 rounded-full bg-white border border-border shadow-subtle flex items-center justify-center text-muted-text hover:text-ink hover:bg-soft-surface transition-colors z-20 cursor-pointer"
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4 text-deep-green" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-deep-green" />
        )}
      </button>

      <div>
        {/* Brand Header */}
        <div className={`p-5 border-b border-border flex items-center ${collapsed ? "justify-center" : "gap-2.5"}`}>
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-deep-green flex items-center justify-center text-white shrink-0 transition-transform group-hover:scale-105">
              <ShieldCheck className="w-5 h-5 text-emerald" />
            </div>
            {!collapsed && (
              <div>
                <span className="font-bold text-base font-heading block leading-none text-ink">
                  SkillProof
                </span>
                <span className="text-[10px] text-muted-text font-mono uppercase tracking-wider">
                  Dev Portal
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                title={collapsed ? item.label : undefined}
                className={`flex items-center rounded-lg transition-colors text-xs font-semibold ${
                  collapsed ? "justify-center px-0 py-3" : "gap-3 px-3.5 py-2.5"
                } ${
                  isActive
                    ? "bg-deep-green text-white shadow-subtle"
                    : "text-ink hover:bg-soft-surface"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-emerald" : "text-deep-green"}`} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}

          {/* Public Verification Link */}
          {shareSlug && (
            <Link
              href={`/v/${shareSlug}`}
              target="_blank"
              title={collapsed ? "Public Proof URL" : undefined}
              className={`flex items-center rounded-lg transition-colors text-xs font-semibold text-muted-text hover:text-ink hover:bg-soft-surface ${
                collapsed ? "justify-center px-0 py-3" : "gap-3 px-3.5 py-2.5"
              }`}
            >
              <ExternalLink className="w-4 h-4 shrink-0 text-muted-text" />
              {!collapsed && <span>Public Proof URL</span>}
            </Link>
          )}
        </nav>
      </div>

      {/* User Footer & Signout */}
      <div className={`p-4 border-t border-border flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
        {!collapsed && (
          <div className="truncate max-w-36">
            <p className="text-xs font-bold text-ink truncate">
              {fullName || "Candidate"}
            </p>
            <p className="text-[10px] text-muted-text truncate">{userEmail}</p>
          </div>
        )}

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
  );
}