"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  GitBranch,
  FolderGit2,
  Sparkles,
  Layers,
  Code2,
  AlertCircle,
  Loader2,
  ShieldAlert,
  FileCode,
  Box,
  ChevronRight,
  Search,
  User,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  getCachedDashboard,
  setCachedDashboard,
  clearDashboardCache,
} from "@/lib/cache/dashboard-cache";

interface Repository {
  id: string;
  repo_name: string;
  repo_url: string;
  primary_language: string | null;
  has_tests: boolean;
  has_docker: boolean;
  last_commit_at: string | null;
}

interface ResumeSkill {
  id: string;
  skill_name: string;
  claimed_context: string | null;
}

interface SkillEvidence {
  id: string;
  skill_name: string;
  status: "proven" | "partial" | "claimed";
  confidence_score: number;
  evidence_summary: string | null;
  matched_repos?: { name: string; url: string; has_tests: boolean; last_commit_at: string | null }[];
}

interface Profile {
  id: string;
  full_name: string | null;
  github_username: string | null;
  avatar_url?: string | null;
  target_role: string | null;
  share_slug: string | null;
  last_scan_at: string | null;
  last_parse_at: string | null;
}

export default function DashboardPage() {
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [resumeSkills, setResumeSkills] = useState<ResumeSkill[]>([]);
  const [evidenceList, setEvidenceList] = useState<SkillEvidence[]>([]);
  const [loading, setLoading] = useState(true);

  // Interactive Verification State
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);

  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const hasFetched = useRef(false);

  const loadDashboardData = async (forceRefresh = false) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (!forceRefresh) {
        const cached = getCachedDashboard(user.id);
        if (cached) {
          setProfile(cached.profile as Profile);
          setRepositories(cached.repositories as Repository[]);
          setResumeSkills(cached.resumeSkills as ResumeSkill[]);
          setEvidenceList(cached.evidenceList as SkillEvidence[]);

          if (cached.resumeSkills && (cached.resumeSkills as ResumeSkill[]).length > 0) {
            setSelectedSkillId((cached.resumeSkills as ResumeSkill[])[0].id);
          }

          setLoading(false);
          return;
        }
      }

      const [
        { data: prof },
        { data: repos },
        { data: skills },
        { data: ev },
      ] = await Promise.all([
        supabase.from("profiles").select("id, full_name, github_username, avatar_url, target_role, share_slug, last_scan_at, last_parse_at").eq("id", user.id).single(),
        supabase.from("github_repositories").select("id, repo_name, repo_url, primary_language, has_tests, has_docker, last_commit_at").eq("user_id", user.id).order("last_commit_at", { ascending: false }),
        supabase.from("resume_skills").select("id, skill_name, claimed_context").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("skill_evidence").select("id, skill_name, status, confidence_score, evidence_summary").eq("user_id", user.id).order("confidence_score", { ascending: false }),
      ]);

      const newProfile = prof ? (prof as Profile) : null;
      const newRepos = repos ? (repos as Repository[]) : [];
      const newSkills = skills ? (skills as ResumeSkill[]) : [];
      const newEvidence = ev ? (ev as SkillEvidence[]) : [];

      setProfile(newProfile);
      setRepositories(newRepos);
      setResumeSkills(newSkills);
      setEvidenceList(newEvidence);

      if (newSkills.length > 0) {
        setSelectedSkillId(newSkills[0].id);
      }

      setCachedDashboard(user.id, { profile: newProfile, repositories: newRepos, resumeSkills: newSkills, evidenceList: newEvidence, tasks: [] });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasFetched.current) {
      loadDashboardData(false);
      hasFetched.current = true;
    }
  }, []);

  const handleEvaluateEvidence = async () => {
    setIsEvaluating(true);
    setNotice(null);
    try {
      const res = await fetch("/api/evidence/evaluate", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Evaluation failed");
      if (profile?.id) clearDashboardCache(profile.id);
      setNotice({ type: "success", message: `Audit complete: ${data.provenTotal} Proven, ${data.partialTotal} Partial.` });
      await loadDashboardData(true);
    } catch (err: unknown) {
      setNotice({ type: "error", message: err instanceof Error ? err.message : "Failed" });
    } finally {
      setIsEvaluating(false);
    }
  };

  const provenCount = evidenceList.filter((e) => e.status === "proven").length;
  const partialCount = evidenceList.filter((e) => e.status === "partial").length;
  const claimedCount = evidenceList.length > 0 ? evidenceList.filter((e) => e.status === "claimed").length : resumeSkills.length;

  const totalAnalyzed = evidenceList.length || 1;
  const trustScore = Math.round(((provenCount * 1) + (partialCount * 0.5)) / totalAnalyzed * 100);

  const selectedSkill = resumeSkills.find(s => s.id === selectedSkillId);
  const activeEvidence = selectedSkill ? evidenceList.find(e => e.skill_name.toLowerCase() === selectedSkill.skill_name.toLowerCase()) : null;
  const matchedRepos = activeEvidence ? (activeEvidence.matched_repos || []) : [];

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3 text-[#8A8F98] text-sm">
          <Loader2 className="w-5 h-5 animate-spin text-[#00E5FF]" />
          Verifying public evidence...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter text-[#EDEDED] font-sans pb-12">
      {/* TIER 1: Header & Quick Summary */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 pb-6 border-b border-white/10">
        <div className="flex items-start gap-4">
          {profile?.avatar_url ? (
            <Image src={profile.avatar_url} alt="" width={64} height={64} className="w-16 h-16 rounded-xl border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.5)]" />
          ) : (
            <div className="w-16 h-16 rounded-xl border border-white/10 bg-[#0A0A0A] flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
              <User className="w-8 h-8 text-[#8A8F98]" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-semibold tracking-tight text-[#EDEDED] leading-none">
                {profile?.full_name || "Candidate"}
              </h1>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-widest border ${trustScore >= 80 ? 'bg-[#00E599]/10 text-[#00E599] border-[#00E599]/30' : trustScore >= 50 ? 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30' : 'bg-white/5 text-[#8A8F98] border-white/10'}`}>
                {trustScore}% TRUST SCORE
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm text-[#8A8F98]">
              {profile?.github_username && (
                <span className="font-mono text-xs inline-flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5 text-[#00E5FF]" /> github.com/{profile.github_username}
                </span>
              )}
              <span>•</span>
              <span>{resumeSkills.length} claims extracted</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="px-4 py-2 bg-[#0A0A0A] border border-white/10 rounded-lg flex flex-col justify-center min-w-[120px] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <span className="text-[10px] text-[#8A8F98] font-semibold uppercase tracking-wider mb-0.5">Verified</span>
            <span className="text-lg font-bold text-[#00E599] leading-none flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> {provenCount}
            </span>
          </div>
          <div className="px-4 py-2 bg-[#0A0A0A] border border-white/10 rounded-lg flex flex-col justify-center min-w-[120px] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <span className="text-[10px] text-[#8A8F98] font-semibold uppercase tracking-wider mb-0.5">Partial</span>
            <span className="text-lg font-bold text-[#F59E0B] leading-none flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> {partialCount}
            </span>
          </div>
          <div className="px-4 py-2 bg-[#0A0A0A] border border-white/10 rounded-lg flex flex-col justify-center min-w-[120px] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <span className="text-[10px] text-[#8A8F98] font-semibold uppercase tracking-wider mb-0.5">Unverified</span>
            <span className="text-lg font-bold text-[#8A8F98] leading-none flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" /> {claimedCount}
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold tracking-tight">Technical Evidence Audit</h2>
        <button onClick={handleEvaluateEvidence} disabled={isEvaluating} className="px-3.5 py-1.5 bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-[#00E5FF] text-xs font-semibold rounded-md hover:bg-[#00E5FF]/20 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
          {isEvaluating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} Run Deep Scan
        </button>
      </div>

      {notice && (
        <div className={`flex items-center justify-between rounded-xl border p-4 text-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] ${notice.type === "success" ? "bg-[#00E599]/10 border-[#00E599]/20 text-[#00E599]" : "bg-[#F05D5E]/10 border-[#F05D5E]/20 text-[#F05D5E]"}`}>
          <div className="flex items-center gap-2.5">
            {notice.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span className="font-medium">{notice.message}</span>
          </div>
          <button onClick={() => setNotice(null)} className="font-semibold hover:underline cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* TIER 2 & 3: Main Stage (2/3) + Sidebar (1/3) */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* LEFT COMPONENT: Interactive Verification Flow */}
        <div className="lg:col-span-2 bg-[#0A0A0A] border border-white/10 rounded-xl flex overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.05)] h-[550px]">
          {/* Skill List Pane */}
          <div className="w-2/5 border-r border-white/10 bg-[#050505] flex flex-col">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#0A0A0A]">
              <span className="text-xs font-semibold text-[#EDEDED]">Resume Claims</span>
              <span className="text-[10px] font-mono text-[#8A8F98] bg-white/5 px-2 py-0.5 rounded">{resumeSkills.length} total</span>
            </div>
            <div className="flex-1 overflow-y-auto hide-scrollbar p-3 space-y-1">
              {resumeSkills.length === 0 ? (
                <p className="text-xs text-[#8A8F98] p-4 text-center">No claims extracted.</p>
              ) : (
                resumeSkills.map((skill) => {
                  const isSelected = selectedSkillId === skill.id;
                  const ev = evidenceList.find((e) => e.skill_name.toLowerCase() === skill.skill_name.toLowerCase());
                  const status = ev?.status || "claimed";

                  return (
                    <button
                      key={skill.id}
                      onClick={() => setSelectedSkillId(skill.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#0A0A0A] border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                          : "border-transparent hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${status === "proven" ? "bg-[#00E599]" : status === "partial" ? "bg-[#F59E0B]" : "bg-[#8A8F98]"}`} />
                        <span className={`text-sm font-medium truncate ${isSelected ? "text-[#00E5FF]" : "text-[#EDEDED]"}`}>{skill.skill_name}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? "text-[#00E5FF] translate-x-1" : "text-transparent"}`} />
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Proof Inspector Pane */}
          <div className="w-3/5 bg-[#0A0A0A] flex flex-col relative">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#050505]">
              <span className="text-xs font-mono text-[#8A8F98] uppercase tracking-wider flex items-center gap-2">
                <Search className="w-3.5 h-3.5" /> Evidence Inspector
              </span>
              {activeEvidence && (
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-widest border ${activeEvidence.status === "proven" ? "bg-[#00E599]/10 text-[#00E599] border-[#00E599]/30" : activeEvidence.status === "partial" ? "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30" : "bg-white/5 text-[#8A8F98] border-white/10"}`}>
                  {activeEvidence.status.toUpperCase()}
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {!selectedSkill ? (
                <div className="h-full flex flex-col items-center justify-center text-[#8A8F98]">
                  <Code2 className="w-8 h-8 mb-3 opacity-20" />
                  <p className="text-sm">Select a claim to inspect evidence.</p>
                </div>
              ) : !activeEvidence || activeEvidence.status === "claimed" ? (
                <div className="h-full flex flex-col items-center justify-center text-[#8A8F98] text-center max-w-sm mx-auto">
                  <ShieldAlert className="w-10 h-10 mb-4 text-[#8A8F98]/40" />
                  <h3 className="text-[#EDEDED] font-semibold mb-2">No public evidence found</h3>
                  <p className="text-xs leading-relaxed mb-6">We scanned connected repositories but could not find configuration files, imports, or recent commits proving proficiency in <strong className="text-[#EDEDED]">{selectedSkill.skill_name}</strong>.</p>

                  <div className="w-full p-4 bg-[#050505] border border-white/10 rounded-lg text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                    <div className="flex items-center gap-2 mb-2">
                      <Layers className="w-4 h-4 text-[#F59E0B]" />
                      <span className="text-xs font-semibold text-[#EDEDED]">Recommended Action</span>
                    </div>
                    <p className="text-[11px] text-[#8A8F98] mb-3">Complete a verified micro-task to flip this claim to Proven.</p>
                    <Link href="/tasks" className="text-xs font-medium bg-[#EDEDED] text-[#050505] px-3 py-1.5 rounded hover:bg-white transition-colors block text-center">
                      Start {selectedSkill.skill_name} Task
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-[#EDEDED] mb-2">{selectedSkill.skill_name} Analysis</h3>
                    <p className="text-sm text-[#8A8F98] leading-relaxed">{activeEvidence.evidence_summary || "Code, configuration, and dependencies successfully detected in public repositories."}</p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-semibold text-[#EDEDED] uppercase tracking-wider mb-3 flex items-center gap-2">
                      <FolderGit2 className="w-4 h-4" /> Supporting Repositories
                    </h4>

                    {matchedRepos.map((repo, idx) => (
                      <div key={idx} className="bg-[#050505] border border-white/10 rounded-lg overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                        <div className="px-4 py-2.5 border-b border-white/10 flex justify-between items-center bg-[#0A0A0A]">
                          <a href={repo.url} target="_blank" rel="noreferrer" className="font-mono text-xs text-[#EDEDED] hover:text-[#00E5FF] flex items-center gap-2 transition-colors">
                            <GitBranch className="w-3.5 h-3.5 text-[#8A8F98]" /> {repo.name}
                          </a>
                          <span className="text-[10px] text-[#8A8F98] font-mono">
                            {repo.last_commit_at ? new Date(repo.last_commit_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown'}
                          </span>
                        </div>
                        <div className="p-4 font-mono text-[11px] text-[#8A8F98] leading-relaxed bg-[#050505]">
                          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/5">
                            <FileCode className="w-3.5 h-3.5" /> <span className="text-[#00E5FF]">Source Code Match</span>
                          </div>
                          <p className="opacity-60">// SkillProof detected imports, configurations,</p>
                          <p className="opacity-60">// or architectures associated with {selectedSkill.skill_name}.</p>
                          <div className="mt-3 flex gap-2">
                            {repo.has_tests && <span className="px-2 py-0.5 rounded bg-[#00E599]/10 text-[#00E599] border border-[#00E599]/20">Tests: ✓</span>}
                            {repo.has_docker && <span className="px-2 py-0.5 rounded bg-[#00E599]/10 text-[#00E599] border border-[#00E599]/20">Docker: ✓</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COMPONENT: Context & Breakdown */}
        <div className="space-y-6">
          {/* Coverage Card */}
          <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <h3 className="text-sm font-semibold text-[#EDEDED] mb-4">Evidence Coverage</h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[#8A8F98]">Proven</span>
                  <span className="text-[#EDEDED] font-mono">{provenCount}</span>
                </div>
                <div className="h-1.5 w-full bg-[#050505] rounded-full overflow-hidden">
                  <div className="h-full bg-[#00E599] rounded-full" style={{ width: `${(provenCount / Math.max(totalAnalyzed, 1)) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[#8A8F98]">Partial Match</span>
                  <span className="text-[#EDEDED] font-mono">{partialCount}</span>
                </div>
                <div className="h-1.5 w-full bg-[#050505] rounded-full overflow-hidden">
                  <div className="h-full bg-[#F59E0B] rounded-full" style={{ width: `${(partialCount / Math.max(totalAnalyzed, 1)) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[#8A8F98]">Unverified Claim</span>
                  <span className="text-[#EDEDED] font-mono">{claimedCount}</span>
                </div>
                <div className="h-1.5 w-full bg-[#050505] rounded-full overflow-hidden">
                  <div className="h-full bg-[#8A8F98] rounded-full" style={{ width: `${(claimedCount / Math.max(totalAnalyzed, 1)) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Sources Card */}
          <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-[#EDEDED]">Scanned Sources</h3>
              <span className="text-xs font-mono text-[#8A8F98]">{repositories.length} Repos</span>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto hide-scrollbar pr-2">
              {repositories.length === 0 ? (
                <p className="text-xs text-[#8A8F98]">No public repositories connected.</p>
              ) : (
                repositories.slice(0, 5).map(repo => (
                  <div key={repo.id} className="flex justify-between items-center p-2 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <Box className="w-4 h-4 text-[#8A8F98] shrink-0" />
                      <span className="text-xs font-mono text-[#EDEDED] truncate">{repo.repo_name}</span>
                    </div>
                    {repo.primary_language && (
                      <span className="text-[10px] text-[#8A8F98] bg-[#050505] border border-white/10 px-1.5 py-0.5 rounded shrink-0">
                        {repo.primary_language}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}