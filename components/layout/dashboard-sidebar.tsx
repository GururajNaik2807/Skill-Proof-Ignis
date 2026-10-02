"use client";

import { useState, useEffect } from "react";
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
  const [currentHash, setCurrentHash] = useState("");

  // Track the URL hash (#github, #resume, #profile) so only one tab highlights
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash || "");
    };

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [pathname]);

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
      hash: "#github",
    },
    {
      label: "Resume",
      href: "/onboarding#resume",
      icon: FileText,
      hash: "#resume",
    },
    {
      label: "Profile",
      href: "/onboarding#profile",
      icon: UserCheck,
      hash: "#profile",
    },
  ];

  return (
    <aside
      className={`relative h-full border-r border-border bg-paper flex flex-col justify-between transition-all duration-300 shrink-0 z-20 ${
        collapsed ? "w-16 md:w-20" : "w-16 md:w-56"
      }`}
    >
      {/* Collapse Toggle Button */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="hidden md:flex absolute -right-3.5 top-5 w-7 h-7 rounded-full bg-paper border border-border shadow-subtle items-center justify-center text-muted-text hover:text-ink hover:bg-soft-surface transition-colors z-30 cursor-pointer"
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4 text-deep-green" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-deep-green" />
        )}
      </button>

      <div className="flex-1 flex flex-col min-h-0">
        {/* Brand Header */}
        <div
          className={`p-4 border-b border-border flex items-center shrink-0 ${
            collapsed ? "justify-center" : "justify-center md:justify-start md:gap-2.5"
          }`}
        >
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-[9px] bg-deep-green flex items-center justify-center text-white shrink-0 transition-colors group-hover:bg-ink">
              <ShieldCheck className="w-5 h-5 text-emerald" />
            </div>
            {!collapsed && (
              <div className="hidden md:block">
                <span className="font-bold text-base font-heading block leading-none text-ink">
                  SkillProof
                </span>
                <span className="text-[10px] text-muted-text font-mono tracking-wide">
                  Candidate workspace
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="p-2 md:p-3 space-y-1 mt-2 overflow-y-auto flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const itemPath = item.href.split("#")[0];

            let isActive = false;
            if (item.hash) {
              // For onboarding anchor links: active only if both the path and hash match
              isActive = pathname === itemPath && (currentHash === item.hash || (!currentHash && item.hash === "#github"));
            } else {
              // Standard pages
              isActive = pathname === itemPath;
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                onClick={() => {
                  if (item.hash) setCurrentHash(item.hash);
                }}
                title={collapsed ? item.label : undefined}
                className={`flex items-center rounded-lg transition-colors text-xs font-semibold ${
                  collapsed
                    ? "justify-center px-0 py-3"
                    : "justify-center md:justify-start gap-3 px-0 md:px-3.5 py-3 md:py-2.5"
                } ${
                  isActive
                    ? "bg-deep-green text-white shadow-subtle"
                    : "text-ink hover:bg-soft-surface"
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? "text-emerald" : "text-deep-green"
                  }`}
                />
                {!collapsed && <span className="hidden md:inline">{item.label}</span>}
              </Link>
            );
          })}

          {/* Public Verification Link */}
          {shareSlug && (
            <Link
              href={`/v/${shareSlug}`}
              target="_blank"
              prefetch={false}
              title={collapsed ? "Public Proof URL" : undefined}
              className={`flex items-center rounded-lg transition-colors text-xs font-semibold text-muted-text hover:text-ink hover:bg-soft-surface ${
                collapsed ? "justify-center px-0 py-3" : "gap-3 px-3.5 py-2.5"
              }`}
            >
              <ExternalLink className="w-4 h-4 shrink-0 text-muted-text" />
              {!collapsed && <span className="hidden md:inline">Public Proof URL</span>}
            </Link>
          )}
        </nav>
      </div>

      {/* User Footer & Signout */}
      <div
        className={`p-4 border-t border-border flex items-center shrink-0 ${
          collapsed ? "justify-center" : "justify-between"
        }`}
      >
        {!collapsed && (
          <div className="hidden md:block truncate max-w-36">
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