"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  GitBranch,
  FolderGit2,
  Check,
  X,
  ExternalLink,
  Sparkles,
  FileText,
  RefreshCw,
  Layers,
  Code2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Search,
  Filter,
  Briefcase,
  Share2,
  Circle,
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

interface MicroTask {
  id: string;
  skill_name: string;
  title: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimated_time: string;
  status: "todo" | "in_progress" | "completed";
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
  const [tasks, setTasks] = useState<MicroTask[]>([]);
  const [loading, setLoading] = useState(true);

  const [repoSearch, setRepoSearch] = useState("");
  const [filterWithTests, setFilterWithTests] = useState(false);

  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isScanningRepos, setIsScanningRepos] = useState(false);
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const hasFetched = useRef(false);

  // Core loader: Checks localStorage first unless forceRefresh is true
  const loadDashboardData = async (forceRefresh = false) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Read from localStorage cache if not forced
      if (!forceRefresh) {
        const cached = getCachedDashboard(user.id);
        if (cached) {
          setProfile(cached.profile as Profile);
          setRepositories(cached.repositories as Repository[]);
          setResumeSkills(cached.resumeSkills as ResumeSkill[]);
          setEvidenceList(cached.evidenceList as SkillEvidence[]);
          setTasks(cached.tasks as MicroTask[]);
          setLoading(false);
          return; // Zero network requests
        }
      }

      // 2. Fetch fresh data from Supabase in a single parallel batch
      const [
        { data: prof },
        { data: repos },
        { data: skills },
        { data: ev },
        { data: taskData },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, github_username, avatar_url, target_role, share_slug, last_scan_at, last_parse_at")
          .eq("id", user.id)
          .single(),
        supabase
          .from("github_repositories")
          .select("id, repo_name, repo_url, primary_language, has_tests, has_docker, last_commit_at")
          .eq("user_id", user.id)
          .order("last_commit_at", { ascending: false }),
        supabase
          .from("resume_skills")
          .select("id, skill_name, claimed_context")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("skill_evidence")
          .select("id, skill_name, status, confidence_score, evidence_summary")
          .eq("user_id", user.id)
          .order("confidence_score", { ascending: false }),
        supabase
          .from("micro_tasks")
          .select("id, skill_name, title, difficulty, estimated_time, status")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(3),
      ]);

      const newProfile = prof ? (prof as Profile) : null;
      const newRepos = repos ? (repos as Repository[]) : [];
      const newSkills = skills ? (skills as ResumeSkill[]) : [];
      const newEvidence = ev ? (ev as SkillEvidence[]) : [];
      const newTasks = taskData ? (taskData as MicroTask[]) : [];

      setProfile(newProfile);
      setRepositories(newRepos);
      setResumeSkills(newSkills);
      setEvidenceList(newEvidence);
      setTasks(newTasks);

      // 3. Save to localStorage cache for instant return on navigation
      setCachedDashboard(user.id, {
        profile: newProfile,
        repositories: newRepos,
        resumeSkills: newSkills,
        evidenceList: newEvidence,
        tasks: newTasks,
      });
    } catch (err: unknown) {
      console.error("Failed to load dashboard data:", err);
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

  // Action: Re-scan Trigger (Explicit cache invalidation)
  const handleScanRepos = async () => {
    if (profile?.last_scan_at && Date.now() - new Date(profile.last_scan_at).getTime() < 60000) {
      setNotice({ type: "error", message: "Please wait 60 seconds before scanning again to avoid API limits." });
      return;
    }

    setIsScanningRepos(true);
    setNotice(null);
    try {
      const res = await fetch("/api/github/scan", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "GitHub scan failed");

      if (profile?.id) {
        clearDashboardCache(profile.id);
      }
      setNotice({ type: "success", message: `Indexed ${data.scannedCount || 0} public repositories.` });
      await loadDashboardData(true); // Forced network fetch
    } catch (err: unknown) {
      setNotice({ type: "error", message: err instanceof Error ? err.message : "GitHub scan failed" });
    } finally {
      setIsScanningRepos(false);
    }
  };

  // Action: Re-parse Trigger (Explicit cache invalidation)
  const handleParseResume = async () => {
    if (profile?.last_parse_at && Date.now() - new Date(profile.last_parse_at).getTime() < 60000) {
      setNotice({ type: "error", message: "Please wait 60 seconds before parsing again." });
      return;
    }

    setIsParsingResume(true);
    setNotice(null);
    try {
      const res = await fetch("/api/resume/parse", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to parse skills");

      if (profile?.id) {
        clearDashboardCache(profile.id);
      }
      setNotice({ type: "success", message: `Extracted ${data.extractedCount || 0} skills via Gemini.` });
      await loadDashboardData(true); // Forced network fetch
    } catch (err: unknown) {
      setNotice({ type: "error", message: err instanceof Error ? err.message : "Skill extraction failed" });
    } finally {
      setIsParsingResume(false);
    }
  };

  // Action: Evidence Evaluate Trigger (Explicit cache invalidation)
  const handleEvaluateEvidence = async () => {
    setIsEvaluating(true);
    setNotice(null);
    try {
      const res = await fetch("/api/evidence/evaluate", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Evaluation failed");

      if (profile?.id) {
        clearDashboardCache(profile.id);
      }
      setNotice({ type: "success", message: `Audit complete: ${data.provenTotal} Proven, ${data.partialTotal} Partial.` });
      await loadDashboardData(true); // Forced network fetch
    } catch (err: unknown) {
      setNotice({ type: "error", message: err instanceof Error ? err.message : "Evidence evaluation failed" });
    } finally {
      setIsEvaluating(false);
    }
  };

  // Action: Local State Optimistic Update + Cache Sync
  const handleToggleTaskStatus = async (taskId: string, currentStatus: MicroTask["status"]) => {
    const nextStatus: MicroTask["status"] =
      currentStatus === "todo"
        ? "in_progress"
        : currentStatus === "in_progress"
        ? "completed"
        : "todo";

    const updatedTasks = tasks.map((t) => (t.id === taskId ? { ...t, status: nextStatus } : t));
    setTasks(updatedTasks);

    // Sync updated task immediately to localStorage so switching tabs retains it
    if (profile?.id) {
      setCachedDashboard(profile.id, {
        profile,
        repositories,
        resumeSkills,
        evidenceList,
        tasks: updatedTasks,
      });
    }

    try {
      const res = await fetch("/api/tasks/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, status: nextStatus }),
      });
      if (!res.ok) throw new Error("Status update failed");
    } catch (err) {
      console.error(err);
      await loadDashboardData(true); // Revert on failure
    }
  };

  const provenCount = evidenceList.filter((e) => e.status === "proven").length;
  const partialCount = evidenceList.filter((e) => e.status === "partial").length;
  const claimedCount =
    evidenceList.length > 0
      ? evidenceList.filter((e) => e.status === "claimed").length
      : resumeSkills.length;

  const filteredRepos = repositories.filter((repo) => {
    const matchesSearch =
      repo.repo_name.toLowerCase().includes(repoSearch.toLowerCase()) ||
      (repo.primary_language || "").toLowerCase().includes(repoSearch.toLowerCase());
    const matchesTest = filterWithTests ? repo.has_tests : true;
    return matchesSearch && matchesTest;
  });
  const isAnalysisActive = isScanningRepos || isParsingResume || isEvaluating;

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3 text-muted-text text-sm">
          <Loader2 className="w-5 h-5 animate-spin text-deep-green" />
          Loading your evidence workspace...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-heading text-ink">
              Your SkillProof
            </h1>
            <p className="text-sm text-muted-text mt-2">
              Evidence collected from your resume and public work.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-text mt-2">
            {profile?.avatar_url ? <Image src={profile.avatar_url} alt="" width={24} height={24} className="w-6 h-6 rounded-full" /> : null}
            <span className="font-semibold text-ink">{profile?.full_name || "Candidate"}</span>
            {profile?.github_username && (
              <span className="ml-2 font-mono text-xs bg-soft-surface px-2 py-0.5 rounded border border-border inline-flex items-center gap-1">
                <GitBranch className="w-3 h-3 text-deep-green" /> @{profile.github_username}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleEvaluateEvidence}
            disabled={isEvaluating}
            className="px-3.5 py-2 bg-deep-green text-white text-xs font-semibold rounded-lg hover:bg-deep-green/90 transition-colors flex items-center gap-1.5 shadow-subtle cursor-pointer disabled:opacity-50"
          >
            {isEvaluating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Evaluate Evidence
          </button>
          <Link
            href="/jobs"
            prefetch={false}
            className="px-3.5 py-2 border border-border bg-white text-xs font-semibold rounded-lg hover:bg-soft-surface transition-colors flex items-center gap-1.5 shadow-subtle"
          >
            <Briefcase className="w-3.5 h-3.5 text-deep-green" /> Job Match
          </Link>
          <Link
            href="/matrix"
            prefetch={false}
            className="px-3.5 py-2 border border-border bg-white text-xs font-semibold rounded-lg hover:bg-soft-surface transition-colors flex items-center gap-1.5 shadow-subtle"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-deep-green" /> Evidence Matrix
          </Link>
          {profile?.share_slug && (
            <Link
              href={`/v/${profile.share_slug}`}
              target="_blank"
              title="Open public verified profile"
              className="p-2 border border-border bg-white rounded-lg hover:bg-soft-surface text-muted-text hover:text-ink transition-colors"
            >
              <Share2 className="w-4 h-4 text-deep-green" />
            </Link>
          )}
        </div>
      </div>

      {notice && (
        <div
          role="status"
          className={`flex items-center justify-between rounded-xl border p-4 text-xs ${
            notice.type === "success"
              ? "bg-status-proven/10 border-status-proven/20 text-status-proven"
              : "bg-status-error/10 border-status-error/20 text-status-error"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notice.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span className="font-medium">{notice.message}</span>
          </div>
          <button onClick={() => setNotice(null)} className="font-semibold hover:underline text-[11px] ml-4 cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {isAnalysisActive && <section className="border border-border bg-paper rounded-[10px] p-5 sm:p-6"><p className="text-sm font-semibold text-deep-green mb-4">Analysis in progress</p><div className="grid sm:grid-cols-2 gap-3">{[{ label: "Reading resume", done: resumeSkills.length > 0 }, { label: "Extracting technical claims", done: resumeSkills.length > 0 }, { label: "Inspecting GitHub repositories", done: repositories.length > 0 && !isScanningRepos }, { label: "Checking dependencies and tests", done: repositories.length > 0 && !isScanningRepos }, { label: "Evaluating evidence", done: evidenceList.length > 0 && !isEvaluating }].map((step) => <div key={step.label} className="flex items-center gap-3 text-sm"><span className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs ${step.done ? "bg-status-proven/10 border-status-proven text-status-proven" : "border-border text-muted-text"}`}>{step.done ? "✓" : "·"}</span><span className={step.done ? "text-ink" : "text-muted-text"}>{step.label}</span></div>)}</div></section>}

      <section className="border border-border bg-paper rounded-[10px] p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-[8px] bg-deep-green/10 text-deep-green flex items-center justify-center shrink-0"><ArrowRight className="w-4 h-4" /></div>
          <div className="flex-1"><p className="text-sm font-semibold text-deep-green">Next step</p>
            {!profile?.github_username ? <><h2 className="font-heading text-xl font-bold mt-1">Connect GitHub</h2><p className="text-sm text-muted-text mt-1">Link your public profile so SkillProof can inspect repositories, dependencies, and tests.</p><Link href="/onboarding#github" className="inline-flex mt-4 items-center gap-2 text-sm font-semibold text-deep-green hover:text-ink">Connect GitHub <ArrowRight className="w-4 h-4" /></Link></> : resumeSkills.length === 0 ? <><h2 className="font-heading text-xl font-bold mt-1">Upload your resume</h2><p className="text-sm text-muted-text mt-1">Your resume gives SkillProof the claims to compare against your public work.</p><Link href="/onboarding#resume" className="inline-flex mt-4 items-center gap-2 text-sm font-semibold text-deep-green hover:text-ink">Upload your resume <ArrowRight className="w-4 h-4" /></Link></> : repositories.length === 0 ? <><h2 className="font-heading text-xl font-bold mt-1">Scan your GitHub</h2><p className="text-sm text-muted-text mt-1">Your profile is connected. Inspect its public repositories, dependencies, and tests now.</p><button type="button" onClick={handleScanRepos} disabled={isScanningRepos} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-deep-green hover:text-ink disabled:opacity-50">{isScanningRepos ? "Scanning..." : "Scan repositories"} <ArrowRight className="w-4 h-4" /></button></> : evidenceList.length === 0 ? <><h2 className="font-heading text-xl font-bold mt-1">Evaluate your evidence</h2><p className="text-sm text-muted-text mt-1">Your resume claims and repository scan are ready to compare.</p><button type="button" onClick={handleEvaluateEvidence} disabled={isEvaluating} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-deep-green hover:text-ink disabled:opacity-50">{isEvaluating ? "Evaluating..." : "Evaluate evidence"} <ArrowRight className="w-4 h-4" /></button></> : <><h2 className="font-heading text-xl font-bold mt-1">Analyze a job description</h2><p className="text-sm text-muted-text mt-1">See how your verified experience fits a role and identify the next skill gap.</p><Link href="/jobs" className="inline-flex mt-4 items-center gap-2 text-sm font-semibold text-deep-green hover:text-ink">Analyze a job <ArrowRight className="w-4 h-4" /></Link></>}
          </div>
        </div>
      </section>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white border border-border rounded-xl shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-status-proven uppercase tracking-wider">Proven Skills</span>
            <span className="w-6 h-6 rounded-full bg-status-proven/10 flex items-center justify-center text-status-proven">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
          </div>
          <div>
            <p className="text-3xl font-bold font-heading text-ink">{provenCount}</p>
            <p className="text-xs text-muted-text mt-1">Active commits + unit test suites verified</p>
          </div>
        </div>

        <div className="p-5 bg-white border border-border rounded-xl shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-status-partial uppercase tracking-wider">Partial Evidence</span>
            <span className="w-6 h-6 rounded-full bg-status-partial/10 flex items-center justify-center text-status-partial">
              <Clock className="w-3.5 h-3.5" />
            </span>
          </div>
          <div>
            <p className="text-3xl font-bold font-heading text-ink">{partialCount}</p>
            <p className="text-xs text-muted-text mt-1">Config-only or inactive &gt; 12 months</p>
          </div>
        </div>

        <div className="p-5 bg-white border border-border rounded-xl shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-status-claimed uppercase tracking-wider">Claimed-Only</span>
            <span className="w-6 h-6 rounded-full bg-status-claimed/10 flex items-center justify-center text-status-claimed">
              <AlertTriangle className="w-3.5 h-3.5" />
            </span>
          </div>
          <div>
            <p className="text-3xl font-bold font-heading text-ink">{claimedCount}</p>
            <p className="text-xs text-muted-text mt-1">On resume with 0 matching public code</p>
          </div>
        </div>
      </div>

      <section className="py-1">
        <div className="flex items-center justify-between mb-3"><p className="text-sm font-semibold text-ink">Your verification path</p><span className="text-xs text-muted-text">Based on your current data</span></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {[{ label: "Resume", done: resumeSkills.length > 0 }, { label: "GitHub", done: repositories.length > 0 }, { label: "Skill claims", done: resumeSkills.length > 0 }, { label: "Evidence", done: evidenceList.length > 0 }, { label: "Verification", done: evidenceList.length > 0 }, { label: "Job match", done: false }, { label: "Skill gaps", done: evidenceList.some((item) => item.status !== "proven") }, { label: "Micro-task", done: tasks.length > 0 }].map((step) => <div key={step.label} className={`border-l-2 px-3 py-2 ${step.done ? "border-status-proven" : "border-border"}`}><p className={`text-xs font-semibold ${step.done ? "text-status-proven" : "text-muted-text"}`}>{step.done ? "Complete" : "Next"}</p><p className="text-sm font-medium text-ink mt-1">{step.label}</p></div>)}
        </div>
      </section>

      <section className="border-y border-border bg-paper">
        <div className="px-0 sm:px-1 py-5 flex items-end justify-between gap-4">
          <div><p className="text-sm font-semibold text-deep-green">Evidence summary</p><p className="text-xs text-muted-text mt-1">Each claim is matched against public repository signals.</p></div>
          <Link href="/matrix" className="text-xs font-semibold text-deep-green hover:text-ink">Open full matrix <ArrowRight className="inline w-3.5 h-3.5 ml-1" /></Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="border-y border-border text-xs text-muted-text">
              <tr><th className="py-3 pr-4 font-medium">Skill</th><th className="py-3 px-4 font-medium">Status</th><th className="py-3 px-4 font-medium">Evidence</th><th className="py-3 pl-4 font-medium text-right">Last activity</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {resumeSkills.length === 0 ? <tr><td colSpan={4} className="py-8 text-muted-text">Upload a resume to build your evidence summary.</td></tr> : resumeSkills.map((skill) => {
                const evidence = evidenceList.find((item) => item.skill_name.toLowerCase() === skill.skill_name.toLowerCase());
                const matchedRepos = evidence ? ((evidence as SkillEvidence & { matched_repos?: Repository[] }).matched_repos || []) : [];
                const lastActivity = matchedRepos[0]?.last_commit_at ? new Date(matchedRepos[0].last_commit_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "—";
                const status = evidence?.status || "claimed";
                return <tr key={skill.id} className="hover:bg-warm-ivory/60 transition-colors"><td className="py-4 pr-4 font-semibold">{skill.skill_name}</td><td className="py-4 px-4"><span className={`text-[10px] font-bold tracking-wide px-2 py-1 rounded-md ${status === "proven" ? "text-status-proven bg-status-proven/10" : status === "partial" ? "text-status-partial bg-status-partial/10" : "text-status-claimed bg-status-claimed/10"}`}>{status === "claimed" ? "CLAIMED-ONLY" : status.toUpperCase()}</span></td><td className="py-4 px-4 text-muted-text">{matchedRepos.length ? `${matchedRepos.length} ${matchedRepos.length === 1 ? "repository" : "repositories"}` : "No supporting evidence"}</td><td className="py-4 pl-4 text-right text-muted-text">{lastActivity}</td></tr>;
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between mb-4"><div><p className="text-sm font-semibold text-deep-green">Skills needing attention</p><p className="text-sm text-muted-text mt-1">The claims with the clearest next action.</p></div><Link href="/tasks" className="text-xs font-semibold text-deep-green hover:text-ink">View micro-tasks <ArrowRight className="inline w-3.5 h-3.5 ml-1" /></Link></div>
        {evidenceList.filter((item) => item.status !== "proven").length === 0 ? <div className="border-y border-border py-5 text-sm text-muted-text">All analyzed skills currently have supporting evidence.</div> : <div className="border-y border-border divide-y divide-border">{evidenceList.filter((item) => item.status !== "proven").slice(0, 4).map((item) => <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4"><div><p className="font-semibold">{item.skill_name}</p><p className="text-sm text-muted-text mt-1">{item.evidence_summary || "No supporting evidence summary is available."}</p></div><span className={`self-start text-[10px] font-bold tracking-wide px-2 py-1 rounded-md ${item.status === "partial" ? "bg-status-partial/10 text-status-partial" : "bg-status-claimed/10 text-status-claimed"}`}>{item.status === "claimed" ? "CLAIMED-ONLY" : "PARTIAL"}</span></div>)}</div>}
      </section>

      {/* Resume Claims */}
      <div className="bg-white border border-border rounded-xl p-6 shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold font-heading flex items-center gap-2 text-ink">
              <FileText className="w-4 h-4 text-deep-green" /> Extracted Resume Claims ({resumeSkills.length})
            </h2>
            <p className="text-xs text-muted-text mt-0.5">Proficiencies extracted from your uploaded resume by Gemini.</p>
          </div>
          <button
            type="button"
            onClick={handleParseResume}
            disabled={isParsingResume}
            className="px-3 py-1.5 bg-soft-surface text-ink text-xs font-semibold rounded-lg border border-border hover:bg-border/40 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isParsingResume ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-deep-green" />}
            Re-parse with Gemini
          </button>
        </div>
        {resumeSkills.length === 0 ? (
          <div className="p-6 border border-dashed border-border rounded-lg text-center bg-warm-ivory/20">
            <p className="text-xs text-muted-text">No technical skills extracted yet. Upload a PDF resume.</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 pt-1">
            {resumeSkills.map((skill) => {
              const ev = evidenceList.find((e) => e.skill_name.toLowerCase() === skill.skill_name.toLowerCase());
              return (
                <div
                  key={skill.id}
                  title={skill.claimed_context || undefined}
                  className="px-3 py-1.5 rounded-lg bg-soft-surface/80 border border-border text-xs flex items-center gap-2 group hover:border-deep-green/40 transition-colors"
                >
                  <Code2 className="w-3 h-3 text-muted-text group-hover:text-deep-green" />
                  <span className="font-semibold text-ink">{skill.skill_name}</span>
                  <span
                    className={`text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded border-l border-border pl-2 ${
                      ev?.status === "proven"
                        ? "text-status-proven"
                        : ev?.status === "partial"
                        ? "text-status-partial"
                        : "text-muted-text"
                    }`}
                  >
                    {ev?.status || "Claimed"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Micro-Tasks */}
      {tasks.length > 0 && (
        <div className="bg-white border border-border rounded-xl p-6 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold font-heading flex items-center gap-2 text-ink">
                <Layers className="w-4 h-4 text-deep-green" /> Active Micro-Tasks ({tasks.length})
              </h2>
              <p className="text-xs text-muted-text mt-0.5">Targeted coding tasks to flip unverified claims into proven commits[cite: 1, 2].</p>
            </div>
            <Link href="/tasks" prefetch={false} className="text-xs font-semibold text-deep-green hover:underline flex items-center gap-1">
              View All Tasks <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`p-3.5 rounded-lg border flex flex-col justify-between gap-3 text-xs transition-colors ${
                  task.status === "completed" ? "bg-status-proven/5 border-status-proven/30" : "bg-soft-surface/40 border-border"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-white border border-border text-ink">
                      {task.skill_name}
                    </span>
                    <span className="text-[10px] text-muted-text capitalize">{task.estimated_time}</span>
                  </div>
                  <h4 className={`font-semibold ${task.status === "completed" ? "line-through text-muted-text" : "text-ink"}`}>
                    {task.title}
                  </h4>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border/60">
                  <button
                    type="button"
                    onClick={() => handleToggleTaskStatus(task.id, task.status)}
                    className="flex items-center gap-1.5 text-[11px] font-medium text-muted-text hover:text-ink cursor-pointer"
                  >
                    {task.status === "completed" ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-status-proven" /> Done
                      </>
                    ) : task.status === "in_progress" ? (
                      <>
                        <Clock className="w-3.5 h-3.5 text-status-partial" /> In Progress
                      </>
                    ) : (
                      <>
                        <Circle className="w-3.5 h-3.5 text-muted-text" /> Start Task
                      </>
                    )}
                  </button>
                  <span className="text-[10px] text-muted-text capitalize">{task.difficulty}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scanned Repos */}
      <div className="bg-white border border-border rounded-xl p-6 shadow-subtle space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
              <h2 className="text-base font-bold font-heading flex items-center gap-2 text-ink">
              <FolderGit2 className="w-4 h-4 text-deep-green" /> Recent evidence ({repositories.length} repositories)
            </h2>
            <p className="text-xs text-muted-text mt-0.5">
              Recent public work inspected for languages, dependencies, tests, and activity.
            </p>
          </div>
          <button
            type="button"
            onClick={handleScanRepos}
            disabled={isScanningRepos}
            className="px-3.5 py-1.5 bg-deep-green text-white text-xs font-semibold rounded-lg hover:bg-deep-green/90 transition-colors flex items-center gap-1.5 cursor-pointer shadow-subtle disabled:opacity-50"
          >
            {isScanningRepos ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Re-scan Repositories
          </button>
        </div>

        {repositories.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-text" />
              <input
                type="text"
                placeholder="Search repository or language..."
                value={repoSearch}
                onChange={(e) => setRepoSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-soft-surface/50 border border-border rounded-lg text-xs focus:outline-none focus:border-deep-green text-ink"
              />
            </div>
            <button
              type="button"
              onClick={() => setFilterWithTests(!filterWithTests)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer w-full sm:w-auto justify-center ${
                filterWithTests
                  ? "bg-deep-green/10 border-deep-green text-deep-green"
                  : "bg-white border-border text-muted-text hover:text-ink"
              }`}
            >
              <Filter className="w-3 h-3" /> Only Tested Repos
            </button>
          </div>
        )}

        {repositories.length === 0 ? (
          <div className="p-8 border border-dashed border-border rounded-xl text-center bg-warm-ivory/20">
            <GitBranch className="w-8 h-8 text-muted-text/60 mx-auto mb-2" />
            <p className="text-sm font-semibold text-ink">Your evidence report is not ready yet.</p>
            <p className="text-xs text-muted-text mt-1 max-w-sm mx-auto">
              Upload your resume and connect GitHub. SkillProof will compare your claimed skills with evidence from your public work.
            </p>
            <Link
              href="/onboarding"
              prefetch={false}
              className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium text-deep-green hover:underline"
            >
              Configure profile in onboarding <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-soft-surface/70 text-muted-text uppercase font-semibold border-b border-border">
                <tr>
                  <th className="py-2.5 px-3.5">Repository</th>
                  <th className="py-2.5 px-3.5">Primary Language</th>
                  <th className="py-2.5 px-3.5 text-center">Unit Tests</th>
                  <th className="py-2.5 px-3.5 text-center">Docker / Compose</th>
                  <th className="py-2.5 px-3.5">Last Commit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRepos.map((repo) => (
                  <tr key={repo.id} className="hover:bg-warm-ivory/30 transition-colors">
                    <td className="py-3 px-3.5">
                      <a
                        href={repo.repo_url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-ink hover:text-deep-green flex items-center gap-1.5 group"
                      >
                        {repo.repo_name}
                        <ExternalLink className="w-3 h-3 opacity-40 group-hover:opacity-100 transition-opacity" />
                      </a>
                    </td>
                    <td className="py-3 px-3.5">
                      <span className="font-mono px-2 py-0.5 rounded bg-soft-surface border border-border text-[11px]">
                        {repo.primary_language || "Config / Docs"}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      {repo.has_tests ? (
                        <span className="inline-flex items-center gap-1 text-status-proven font-semibold">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Detected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-muted-text">
                          <X className="w-3.5 h-3.5" /> None
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      {repo.has_docker ? (
                        <span className="inline-flex items-center gap-1 text-status-proven font-semibold">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Configured
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-muted-text">
                          <X className="w-3.5 h-3.5" /> None
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-muted-text">
                      {repo.last_commit_at
                        ? new Date(repo.last_commit_at).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}