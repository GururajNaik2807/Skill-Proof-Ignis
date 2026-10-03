"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  GitBranch,
  FolderGit2,
  Search,
  Check,
  Copy,
  Sparkles,
  ShieldAlert,
  Loader2,
  Layers,
  Clock
} from "lucide-react";
import { useDashboard } from "@/context/dashboard-context";

interface MatchedRepo {
  name: string;
  url: string;
  has_tests: boolean;
  has_docker: boolean;
  primary_language?: string | null;
  last_commit_at: string | null;
}

// Skill Category classifier
function categorizeSkill(skill: string): "Languages" | "Infrastructure" | "Frameworks" | "Tools" {
  const s = skill.toLowerCase();
  if (["python", "typescript", "javascript", "golang", "rust", "c++", "ruby", "java", "c#", "php"].includes(s)) return "Languages";
  if (["docker", "kubernetes", "aws", "terraform", "ci/cd", "github actions", "linux", "gcp", "azure"].includes(s)) return "Infrastructure";
  if (["react", "next.js", "vue", "fastapi", "django", "express", "node", "tailwind", "angular", "spring", "flask"].includes(s)) return "Frameworks";
  return "Tools";
}

export default function EvidenceMatrixPage() {
  const { resumeSkills, evidenceList, repositories, loading } = useDashboard();
  const [activeFilter, setActiveFilter] = useState<"all" | "proven" | "partial" | "claimed">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Map real database entities from Supabase Context
  const allClaims = resumeSkills.map((claim) => {
    const ev = evidenceList.find(
      (e) => e.skill_name.trim().toLowerCase() === claim.skill_name.trim().toLowerCase()
    );

    // Repositories associated with this claim from real database evaluation
    const matchedRepos: MatchedRepo[] = (ev?.matched_repos as unknown as MatchedRepo[]) || [];

    return {
      id: claim.id,
      name: claim.skill_name,
      claimedContext: claim.claimed_context,
      status: ev?.status || ("claimed" as const),
      confidence: ev?.confidence_score ? Math.round(Number(ev.confidence_score) * 100) : 0,
      summary: ev?.evidence_summary || null,
      repos: matchedRepos,
      category: categorizeSkill(claim.skill_name),
    };
  });

  // Dynamic selected skill from real user claims
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);

  // If no skill is explicitly selected, fall back to the first available claim
  const currentSkillId = selectedSkillId || (allClaims.length > 0 ? allClaims[0].id : null);
  const activeClaim = allClaims.find((c) => c.id === currentSkillId) || allClaims[0];

  const filteredClaims = allClaims.filter((claim) => {
    const matchesFilter = activeFilter === "all" || claim.status === activeFilter;
    const matchesSearch = claim.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const copyRepoUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 1500);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center gap-3 text-sm text-[#8A8F98]">
        <Loader2 className="w-5 h-5 animate-spin text-[#00E5FF]" />
        Loading your verified evidence matrix...
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter text-[#EDEDED] font-sans pb-16">
      {/* Top Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 text-xs text-[#8A8F98] hover:text-[#EDEDED] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </Link>
            <span className="text-white/20">/</span>
            <span className="text-xs text-[#00E5FF] font-mono">Proof Inspector</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#EDEDED]">Evidence Matrix & Audit Trail</h1>
          <p className="text-xs text-[#8A8F98] mt-1">
            Real verification traces drawn directly from your resume and indexed public GitHub repositories.
          </p>
        </div>

        {/* Global Quick Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-[#0A0A0C] border border-white/[0.08] rounded-xl self-start md:self-auto">
          {(["all", "proven", "partial", "claimed"] as const).map((filterKey) => (
            <button
              key={filterKey}
              onClick={() => setActiveFilter(filterKey)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all cursor-pointer ${
                activeFilter === filterKey
                  ? "bg-white/[0.08] text-[#EDEDED] shadow-sm border border-white/[0.08]"
                  : "text-[#8A8F98] hover:text-[#EDEDED] hover:bg-white/[0.03] border border-transparent"
              }`}
            >
              {filterKey === "claimed" ? "Unverified" : filterKey}
            </button>
          ))}
        </div>
      </div>

      {/* MASTER-DETAIL SPLIT INSPECTOR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[640px]">
        {/* LEFT PANEL: 35% Width Claims Master List */}
        <div className="lg:col-span-4 flex flex-col bg-[#0A0A0C] border border-white/[0.08] rounded-2xl overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.6)]">
          {/* Search Box */}
          <div className="p-3.5 border-b border-white/[0.08] bg-[#0E0E11]/60 flex items-center gap-2.5">
            <Search className="w-4 h-4 text-[#8A8F98]" />
            <input
              type="text"
              placeholder="Search claims..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-[#EDEDED] placeholder-[#8A8F98] outline-none font-sans"
            />
          </div>

          {/* Grouped Skills List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4 max-h-[650px] hide-scrollbar">
            {filteredClaims.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#8A8F98]">
                {resumeSkills.length === 0
                  ? "No resume claims found. Please upload a resume first."
                  : "No claims match the active filter."}
              </div>
            ) : (
              ["Languages", "Frameworks", "Infrastructure", "Tools"].map((category) => {
                const groupItems = filteredClaims.filter((c) => c.category === category);
                if (groupItems.length === 0) return null;

                return (
                  <div key={category} className="space-y-1.5">
                    <div className="px-2.5 py-1 text-[10px] font-mono tracking-widest text-[#8A8F98] uppercase">
                      {category}
                    </div>
                    {groupItems.map((item) => {
                      const isSelected = activeClaim && activeClaim.id === item.id;

                      return (
                        <button
                          key={item.id}
                          onClick={() => setSelectedSkillId(item.id)}
                          className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer relative flex flex-col gap-1.5 ${
                            isSelected
                              ? "bg-[#141418] border-[#00E5FF]/40 shadow-[0_0_20px_rgba(0,229,255,0.06)]"
                              : "bg-[#09090b]/40 border-white/[0.04] hover:bg-[#121216] hover:border-white/[0.08]"
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute left-0 top-3 bottom-3 w-1 bg-[#00E5FF] rounded-r-full shadow-[0_0_8px_#00E5FF]" />
                          )}
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-semibold tracking-tight ${isSelected ? "text-[#EDEDED]" : "text-[#D1D5DB]"}`}>
                              {item.name}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider font-mono border ${
                                item.status === "proven"
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  : item.status === "partial"
                                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                  : "bg-white/[0.04] text-[#8A8F98] border-white/[0.08]"
                              }`}
                            >
                              {item.status === "proven" ? "VERIFIED" : item.status === "partial" ? "PARTIAL" : "UNVERIFIED"}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-[#8A8F98] font-mono">
                            <span>{item.repos.length ? `${item.repos.length} repository match` : "0 repos"}</span>
                            <span>•</span>
                            <span>{item.confidence > 0 ? `${item.confidence}% confidence` : "No public signal"}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANEL: 65% Width Evidence Inspector Card */}
        <div className="lg:col-span-8 flex flex-col bg-[#0A0A0C] border border-white/[0.08] rounded-2xl overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.6)]">
          {!activeClaim ? (
            <div className="h-full flex flex-col items-center justify-center text-[#8A8F98] p-12 text-center">
              <FolderGit2 className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm">No skill claims available to inspect.</p>
              <Link href="/onboarding#resume" className="mt-3 text-xs text-[#00E5FF] hover:underline">
                Upload your resume to extract claims →
              </Link>
            </div>
          ) : (
            <>
              {/* Inspector Header: Breadcrumbs & Meta Bar */}
              <div className="px-5 py-3.5 border-b border-white/[0.08] bg-[#0E0E11]/80 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
                <div className="flex items-center gap-2 text-[#8A8F98] truncate">
                  <FolderGit2 className="w-3.5 h-3.5 text-[#00E5FF]" />
                  <span className="text-[#EDEDED] font-semibold">Skill: {activeClaim.name}</span>
                  <span className="text-white/20">/</span>
                  <span className="text-[#8A8F98]">{activeClaim.category}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider font-mono border ${
                      activeClaim.status === "proven"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                        : activeClaim.status === "partial"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : "bg-white/[0.04] text-[#8A8F98] border-white/[0.08]"
                    }`}
                  >
                    {activeClaim.status.toUpperCase()}
                  </span>
                  {activeClaim.confidence > 0 && (
                    <span className="text-[11px] font-mono text-[#8A8F98] bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                      {activeClaim.confidence}% Score
                    </span>
                  )}
                </div>
              </div>

              {/* Inspector Body Canvas */}
              <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                {/* 1. Context & Claim Mapping */}
                <div className="p-4 rounded-xl border border-white/[0.06] bg-[#0E0E12] flex items-start gap-3.5 shadow-sm">
                  <div className="p-2 rounded-lg bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20 shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-[#00E5FF] font-semibold">
                      Claim Context & Audit Reasoning
                    </h3>
                    <p className="text-sm text-[#D1D5DB] mt-1 leading-relaxed">
                      {activeClaim.summary ||
                        (activeClaim.status === "claimed"
                          ? "This skill was identified in your uploaded resume, but no corresponding code, dependency, or commit footprint was found across your public GitHub repositories."
                          : "Verified from your indexed public work.")}
                    </p>
                    {activeClaim.claimedContext && (
                      <p className="text-xs text-[#8A8F98] mt-2 font-mono border-t border-white/5 pt-2">
                        <span className="text-[#EDEDED]">Resume context:</span> &ldquo;{activeClaim.claimedContext}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                {/* 2. Real Supporting Repositories from Database */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-[#EDEDED] uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <GitBranch className="w-4 h-4 text-[#00E5FF]" /> Matched Repositories ({activeClaim.repos.length})
                    </span>
                    <span className="text-[11px] font-mono text-[#8A8F98]">
                      Total Repos Indexed: {repositories.length}
                    </span>
                  </h4>

                  {activeClaim.repos.length === 0 ? (
                    <div className="p-8 rounded-xl border border-dashed border-white/10 bg-[#050507] text-center flex flex-col items-center">
                      <ShieldAlert className="w-8 h-8 text-[#8A8F98]/40 mb-2" />
                      <p className="text-sm font-medium text-[#EDEDED]">0 Repositories Found</p>
                      <p className="text-xs text-[#8A8F98] max-w-md mt-1 mb-4">
                        No public repository demonstrates active usage or tests for &quot;{activeClaim.name}&quot;.
                      </p>
                      <Link
                        href="/tasks"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EDEDED] text-[#050507] text-xs font-semibold hover:bg-white transition-colors"
                      >
                        <Layers className="w-3.5 h-3.5" /> Start Micro-Task to Prove It
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeClaim.repos.map((repo, idx) => (
                        <div
                          key={idx}
                          className="rounded-xl border border-white/[0.08] bg-[#050507] overflow-hidden shadow-inner"
                        >
                          <div className="px-4 py-2.5 bg-[#09090C] border-b border-white/[0.06] flex items-center justify-between text-xs font-mono">
                            <div className="flex items-center gap-2 text-[#EDEDED]">
                              <FolderGit2 className="w-3.5 h-3.5 text-[#00E5FF]" />
                              <a
                                href={repo.url}
                                target="_blank"
                                rel="noreferrer"
                                className="hover:text-[#00E5FF] hover:underline flex items-center gap-1"
                              >
                                {repo.name} <ExternalLink className="w-3 h-3 opacity-60" />
                              </a>
                            </div>
                            <div className="flex items-center gap-2 text-[#8A8F98]">
                              <button
                                onClick={() => copyRepoUrl(repo.url)}
                                title="Copy repository link"
                                className="p-1 hover:text-[#EDEDED] transition-colors"
                              >
                                {copiedUrl === repo.url ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5 opacity-60" />
                                )}
                              </button>
                            </div>
                          </div>

                          <div className="p-4 space-y-3">
                            <div className="flex flex-wrap gap-2 text-xs">
                              {repo.primary_language && (
                                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[#EDEDED] font-mono text-[11px]">
                                  {repo.primary_language}
                                </span>
                              )}
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-mono border ${
                                  repo.has_tests
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    : "bg-white/5 text-[#8A8F98] border-white/10"
                                }`}
                              >
                                Tests: {repo.has_tests ? "✓ Detected" : "None"}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-mono border ${
                                  repo.has_docker
                                    ? "bg-[#00E5FF]/10 text-[#00E5FF] border-[#00E5FF]/20"
                                    : "bg-white/5 text-[#8A8F98] border-white/10"
                                }`}
                              >
                                Docker: {repo.has_docker ? "✓ Configured" : "None"}
                              </span>
                            </div>

                            <p className="text-xs text-[#8A8F98] font-mono flex items-center gap-1.5">
                              <Clock className="w-3 h-3" />
                              Last Commit:{" "}
                              <span className="text-[#EDEDED]">
                                {repo.last_commit_at
                                  ? new Date(repo.last_commit_at).toLocaleDateString(undefined, {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })
                                  : "Unknown"}
                              </span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Verified System Context */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl border border-white/[0.06] bg-[#0E0E12] flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] font-mono uppercase tracking-wider text-[#8A8F98]">
                        Evaluation Method
                      </span>
                      <span className="text-sm font-semibold text-[#EDEDED] font-mono">AST & Commit Log</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-white/[0.06] bg-[#0E0E12] flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] font-mono uppercase tracking-wider text-[#8A8F98]">
                        Status
                      </span>
                      <span
                        className={`text-sm font-semibold font-mono ${
                          activeClaim.status === "proven"
                            ? "text-emerald-400"
                            : activeClaim.status === "partial"
                            ? "text-amber-400"
                            : "text-[#8A8F98]"
                        }`}
                      >
                        {activeClaim.status === "proven"
                          ? "Audit Passed"
                          : activeClaim.status === "partial"
                          ? "Partial Signal"
                          : "Unverified Claim"}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-white/[0.06] bg-[#0E0E12] flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] font-mono uppercase tracking-wider text-[#8A8F98]">
                        Verification Score
                      </span>
                      <span className="text-sm font-semibold text-[#00E5FF] font-mono">
                        {activeClaim.confidence}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
