"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
  target_role: string | null;
  share_slug: string | null;
}

export default function DashboardPage() {
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [resumeSkills, setResumeSkills] = useState<ResumeSkill[]>([]);
  const [evidenceList, setEvidenceList] = useState<SkillEvidence[]>([]);
  const [tasks, setTasks] = useState<MicroTask[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & filter state for repositories
  const [repoSearch, setRepoSearch] = useState("");
  const [filterWithTests, setFilterWithTests] = useState(false);

  // Status and notification banners
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isScanningRepos, setIsScanningRepos] = useState(false);
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Load all initial data from Supabase
  const loadDashboardData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // 1. Fetch Profile
      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (prof) setProfile(prof);

      // 2. Fetch Repositories
      const { data: repos } = await supabase
        .from("github_repositories")
        .select("*")
        .eq("user_id", user.id)
        .order("last_commit_at", { ascending: false });
      if (repos) setRepositories(repos);

      // 3. Fetch Resume Skills
      const { data: skills } = await supabase
        .from("resume_skills")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (skills) setResumeSkills(skills);

      // 4. Fetch Evaluated Evidence
      const { data: ev } = await supabase
        .from("skill_evidence")
        .select("*")
        .eq("user_id", user.id)
        .order("confidence_score", { ascending: false });
      if (ev) setEvidenceList(ev);

      // 5. Fetch Active Micro-Tasks
      const { data: taskData } = await supabase
        .from("micro_tasks")
        .select("id, skill_name, title, difficulty, estimated_time, status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3);
      if (taskData) setTasks(taskData as MicroTask[]);
    } catch (err: unknown) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Action: Trigger GitHub Scan
  const handleScanRepos = async () => {
    setIsScanningRepos(true);
    setNotice(null);
    try {
      const res = await fetch("/api/github/scan", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "GitHub scan failed");

      setNotice({
        type: "success",
        message: `Successfully indexed ${data.scannedCount || 0} public repositories from GitHub.`,
      });
      await loadDashboardData();
    } catch (err: unknown) {
      setNotice({
        type: "error",
        message: err instanceof Error ? err.message : "GitHub scan failed",
      });
    } finally {
      setIsScanningRepos(false);
    }
  };

  // Action: Trigger Gemini Resume Extraction
  const handleParseResume = async () => {
    setIsParsingResume(true);
    setNotice(null);
    try {
      const res = await fetch("/api/resume/parse", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to parse skills with Gemini");

      setNotice({
        type: "success",
        message: `Extracted ${data.extractedCount || 0} technical proficiencies via Gemini.`,
      });
      await loadDashboardData();
    } catch (err: unknown) {
      setNotice({
        type: "error",
        message: err instanceof Error ? err.message : "Skill extraction failed",
      });
    } finally {
      setIsParsingResume(false);
    }
  };

  // Action: Trigger Deterministic Evidence Evaluation
  const handleEvaluateEvidence = async () => {
    setIsEvaluating(true);
    setNotice(null);
    try {
      const res = await fetch("/api/evidence/evaluate", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Evaluation failed");

      setNotice({
        type: "success",
        message: `Audit complete: ${data.provenTotal} Proven, ${data.partialTotal} Partial, and ${data.claimedTotal} Claimed skills.`,
      });
      await loadDashboardData();
    } catch (err: unknown) {
      setNotice({
        type: "error",
        message: err instanceof Error ? err.message : "Evidence evaluation failed",
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  // Action: Quick Toggle Micro-Task Status
  const handleToggleTaskStatus = async (taskId: string, currentStatus: MicroTask["status"]) => {
    const nextStatus =
      currentStatus === "todo"
        ? "in_progress"
        : currentStatus === "in_progress"
        ? "completed"
        : "todo";

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: nextStatus } : t))
    );

    try {
      const res = await fetch("/api/tasks/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, status: nextStatus }),
      });
      if (!res.ok) throw new Error("Status update failed");
    } catch (err) {
      console.error(err);
      await loadDashboardData();
    }
  };

  // Dynamic Metrics
  const provenCount = evidenceList.filter((e) => e.status === "proven").length;
  const partialCount = evidenceList.filter((e) => e.status === "partial").length;
  const claimedCount =
    evidenceList.length > 0
      ? evidenceList.filter((e) => e.status === "claimed").length
      : resumeSkills.length;

  // Filtered repositories
  const filteredRepos = repositories.filter((repo) => {
    const matchesSearch =
      repo.repo_name.toLowerCase().includes(repoSearch.toLowerCase()) ||
      (repo.primary_language || "").toLowerCase().includes(repoSearch.toLowerCase());
    const matchesTest = filterWithTests ? repo.has_tests : true;
    return matchesSearch && matchesTest;
  });

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3 text-muted-text text-sm">
          <Loader2 className="w-5 h-5 animate-spin text-deep-green" />
          Loading your verification hub...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold font-heading text-ink">
              Verification Hub
            </h1>
            <span className="px-2 py-0.5 rounded bg-deep-green/10 text-deep-green text-xs font-semibold font-mono">
              Candidate View
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-text mt-1">
            Auditing codebase signals for{" "}
            <span className="font-semibold text-ink">
              {profile?.full_name || "Developer"}
            </span>
            {profile?.github_username && (
              <span className="ml-2 font-mono text-xs bg-soft-surface px-2 py-0.5 rounded border border-border inline-flex items-center gap-1">
                <GitBranch className="w-3 h-3 text-deep-green" />
                @{profile.github_username}
              </span>
            )}
          </p>
        </div>

        {/* Global Action Strip */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleEvaluateEvidence}
            disabled={isEvaluating}
            className="px-3.5 py-2 bg-deep-green text-white text-xs font-semibold rounded-lg hover:bg-deep-green/90 transition-colors flex items-center gap-1.5 shadow-subtle cursor-pointer disabled:opacity-50"
          >
            {isEvaluating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            Evaluate Evidence
          </button>

          <Link
            href="/jobs"
            className="px-3.5 py-2 border border-border bg-white text-xs font-semibold rounded-lg hover:bg-soft-surface transition-colors flex items-center gap-1.5 shadow-subtle"
          >
            <Briefcase className="w-3.5 h-3.5 text-deep-green" />
            Job Match
          </Link>

          <Link
            href="/matrix"
            className="px-3.5 py-2 border border-border bg-white text-xs font-semibold rounded-lg hover:bg-soft-surface transition-colors flex items-center gap-1.5 shadow-subtle"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-deep-green" />
            Evidence Matrix
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

          <Link
            href="/onboarding"
            className="px-3.5 py-2 border border-border text-xs font-semibold rounded-lg hover:bg-soft-surface transition-colors"
          >
            Re-upload
          </Link>
        </div>
      </div>

      {/* Global Status Banner */}
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
            {notice.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span className="font-medium">{notice.message}</span>
          </div>
          <button
            onClick={() => setNotice(null)}
            className="font-semibold hover:underline text-[11px] ml-4 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Verification Stat Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Proven Card */}
        <div className="p-5 bg-white border border-border rounded-xl shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-status-proven uppercase tracking-wider">
              Proven Skills
            </span>
            <span className="w-6 h-6 rounded-full bg-status-proven/10 flex items-center justify-center text-status-proven">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
          </div>
          <div>
            <p className="text-3xl font-bold font-heading text-ink">{provenCount}</p>
            <p className="text-xs text-muted-text mt-1">
              Active commits + unit test suites verified
            </p>
          </div>
        </div>

        {/* Partial Card */}
        <div className="p-5 bg-white border border-border rounded-xl shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-status-partial uppercase tracking-wider">
              Partial Evidence
            </span>
            <span className="w-6 h-6 rounded-full bg-status-partial/10 flex items-center justify-center text-status-partial">
              <Clock className="w-3.5 h-3.5" />
            </span>
          </div>
          <div>
            <p className="text-3xl font-bold font-heading text-ink">{partialCount}</p>
            <p className="text-xs text-muted-text mt-1">
              Config-only or inactive &gt; 12 months
            </p>
          </div>
        </div>

        {/* Claimed-Only Card */}
        <div className="p-5 bg-white border border-border rounded-xl shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-status-claimed uppercase tracking-wider">
              Claimed-Only
            </span>
            <span className="w-6 h-6 rounded-full bg-status-claimed/10 flex items-center justify-center text-status-claimed">
              <AlertTriangle className="w-3.5 h-3.5" />
            </span>
          </div>
          <div>
            <p className="text-3xl font-bold font-heading text-ink">{claimedCount}</p>
            <p className="text-xs text-muted-text mt-1">
              On resume with 0 matching public code
            </p>
          </div>
        </div>
      </div>

      {/* 3. Extracted Resume Claims Section */}
      <div className="bg-white border border-border rounded-xl p-6 shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold font-heading flex items-center gap-2 text-ink">
              <FileText className="w-4 h-4 text-deep-green" />
              Extracted Resume Claims ({resumeSkills.length})
            </h2>
            <p className="text-xs text-muted-text mt-0.5">
              Proficiencies extracted from your uploaded resume by Gemini for GitHub verification.
            </p>
          </div>

          <button
            type="button"
            onClick={handleParseResume}
            disabled={isParsingResume}
            className="px-3 py-1.5 bg-soft-surface text-ink text-xs font-semibold rounded-lg border border-border hover:bg-border/40 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isParsingResume ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-deep-green" />
            )}
            Re-parse with Gemini
          </button>
        </div>

        {resumeSkills.length === 0 ? (
          <div className="p-6 border border-dashed border-border rounded-lg text-center bg-warm-ivory/20">
            <p className="text-xs text-muted-text">
              No technical skills extracted yet. Upload a PDF resume in onboarding or click &ldquo;Re-parse with Gemini&rdquo;.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 pt-1">
            {resumeSkills.map((skill) => {
              const ev = evidenceList.find(
                (e) => e.skill_name.toLowerCase() === skill.skill_name.toLowerCase()
              );
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

      {/* 4. Active Micro-Tasks Quick Widget */}
      {tasks.length > 0 && (
        <div className="bg-white border border-border rounded-xl p-6 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold font-heading flex items-center gap-2 text-ink">
                <Layers className="w-4 h-4 text-deep-green" />
                Active Micro-Tasks ({tasks.length})
              </h2>
              <p className="text-xs text-muted-text mt-0.5">
                Targeted 1–2 hour coding tasks to flip unverified claims into proven GitHub commits[cite: 1, 2].
              </p>
            </div>

            <Link
              href="/tasks"
              className="text-xs font-semibold text-deep-green hover:underline flex items-center gap-1"
            >
              View All Tasks <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`p-3.5 rounded-lg border flex flex-col justify-between gap-3 text-xs transition-colors ${
                  task.status === "completed"
                    ? "bg-status-proven/5 border-status-proven/30"
                    : "bg-soft-surface/40 border-border"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-white border border-border text-ink">
                      {task.skill_name}
                    </span>
                    <span className="text-[10px] text-muted-text capitalize">
                      {task.estimated_time}
                    </span>
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
                  <span className="text-[10px] text-muted-text capitalize">
                    {task.difficulty}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Audited GitHub Repositories Section */}
      <div className="bg-white border border-border rounded-xl p-6 shadow-subtle space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold font-heading flex items-center gap-2 text-ink">
              <FolderGit2 className="w-4 h-4 text-deep-green" />
              Audited GitHub Repositories ({repositories.length})
            </h2>
            <p className="text-xs text-muted-text mt-0.5">
              Source code trees, package manifests, and test directories scanned for evidence classification.
            </p>
          </div>

          <button
            type="button"
            onClick={handleScanRepos}
            disabled={isScanningRepos}
            className="px-3.5 py-1.5 bg-deep-green text-white text-xs font-semibold rounded-lg hover:bg-deep-green/90 transition-colors flex items-center gap-1.5 cursor-pointer shadow-subtle disabled:opacity-50"
          >
            {isScanningRepos ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            Re-scan Repositories
          </button>
        </div>

        {/* Search & Filter Bar */}
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
              <Filter className="w-3 h-3" />
              Only Tested Repos
            </button>
          </div>
        )}

        {repositories.length === 0 ? (
          <div className="p-8 border border-dashed border-border rounded-xl text-center bg-warm-ivory/20">
            <GitBranch className="w-8 h-8 text-muted-text/60 mx-auto mb-2" />
            <p className="text-sm font-semibold text-ink">No repositories indexed yet</p>
            <p className="text-xs text-muted-text mt-1 max-w-sm mx-auto">
              Confirm your GitHub username in onboarding or click &ldquo;Re-scan Repositories&rdquo; to fetch your public repositories.
            </p>
            <Link
              href="/onboarding"
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

      {/* 6. Micro-Task Conversion Banner */}
      <div className="p-5 bg-white border border-border rounded-xl shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-deep-green/10 flex items-center justify-center text-deep-green shrink-0 mt-0.5">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-ink">
              Turn Unverified Claims into Proven Evidence
            </h3>
            <p className="text-xs text-muted-text mt-0.5 max-w-xl">
              SkillProof suggests targeted 1–2 hour coding micro-tasks (like adding PyTest test suites or writing Dockerfiles) to turn your unproven resume skills into verified GitHub commits[cite: 1, 2].
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/jobs"
            className="px-3.5 py-2 border border-border text-xs font-semibold rounded-lg hover:bg-soft-surface transition-colors flex items-center gap-1.5"
          >
            Match Job <Briefcase className="w-3.5 h-3.5 text-deep-green" />
          </Link>
          <Link
            href="/tasks"
            className="px-4 py-2 bg-deep-green text-white text-xs font-semibold rounded-lg hover:bg-deep-green/90 transition-colors flex items-center gap-1.5 shadow-subtle"
          >
            Generate Tasks <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}