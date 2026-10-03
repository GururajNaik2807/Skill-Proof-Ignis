"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  GitBranch,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  ArrowLeft,
  FileUp,
  Trash2,
  Loader2,
  ExternalLink,
  Code2,
  AlertCircle,
  Check,
  RotateCcw,
  Briefcase,
  User,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useDashboard } from "@/context/dashboard-context";

// ---------------------------------------------------------------------------
// TypeScript Data Models & Pipeline Types
// ---------------------------------------------------------------------------
export type StepStatus = "completed" | "active" | "locked";

export interface PipelineStep {
  id: string;
  number: number;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const PIPELINE_STEPS: PipelineStep[] = [
  {
    id: "resume",
    number: 1,
    label: "Resume Intake",
    sublabel: "PDF Parse",
    icon: FileText,
  },
  {
    id: "github",
    number: 2,
    label: "Identity & GitHub",
    sublabel: "Repo Sync",
    icon: GitBranch,
  },
  {
    id: "claims",
    number: 3,
    label: "AI Skill Triage",
    sublabel: "Claim Mapping",
    icon: Sparkles,
  },
  {
    id: "audit",
    number: 4,
    label: "Evidence Audit",
    sublabel: "Signal Check",
    icon: ShieldCheck,
  },
  {
    id: "complete",
    number: 5,
    label: "Verification Hub",
    sublabel: "Public Proof",
    icon: CheckCircle2,
  },
];

interface ResumeRecord {
  id: string;
  file_name: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Main Path UI Component
// ---------------------------------------------------------------------------
export default function ProfileResumePath() {
  const router = useRouter();
  const supabase = createClient();
  const { profile, resumeSkills, evidenceList, repositories, refreshData } = useDashboard();

  // Active step index (0-indexed: 0 = resume, 1 = github, 2 = claims, 3 = audit, 4 = complete)
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);

  // Resume Stage State
  const [resumeRecord, setResumeRecord] = useState<ResumeRecord | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // GitHub & Identity Stage State
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [githubUsername, setGithubUsername] = useState(profile?.github_username || "");
  const [targetRole, setTargetRole] = useState(profile?.target_role || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isScanningRepos, setIsScanningRepos] = useState(false);

  // Audit Stage State
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Banner Notices
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const initialized = useRef(false);

  // Sync profile values into local form state
  useEffect(() => {
    if (profile && !initialized.current) {
      setFullName(profile.full_name || "");
      setGithubUsername(profile.github_username || "");
      setTargetRole(profile.target_role || "");
      initialized.current = true;
    }
  }, [profile]);

  // Load single active PDF record
  const fetchResume = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("resumes")
        .select("id, file_name, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setResumeRecord(data || null);
    } catch (err) {
      console.error("Resume fetch failed:", err);
    }
  };

  useEffect(() => {
    fetchResume();
  }, []);

  // Determine unlock status and starting node based on real database records
  const hasResume = Boolean(resumeRecord);
  const hasIdentity = Boolean(profile?.github_username && profile?.full_name);
  const hasSkills = resumeSkills.length > 0;
  const hasEvaluated = evidenceList.length > 0;

  // Auto-route to the furthest active incomplete step on first load
  useEffect(() => {
    if (!hasResume) {
      setActiveStepIndex(0);
    } else if (!hasIdentity) {
      setActiveStepIndex(1);
    } else if (!hasSkills) {
      setActiveStepIndex(2);
    } else if (!hasEvaluated) {
      setActiveStepIndex(3);
    }
  }, [hasResume, hasIdentity, hasSkills, hasEvaluated]);

  // Step Status Computations
  const getStepStatus = (index: number): StepStatus => {
    if (index === 0) {
      return hasResume ? "completed" : activeStepIndex === 0 ? "active" : "locked";
    }
    if (index === 1) {
      if (!hasResume) return "locked";
      return hasIdentity ? "completed" : activeStepIndex === 1 ? "active" : "locked";
    }
    if (index === 2) {
      if (!hasResume || !hasIdentity) return "locked";
      return hasSkills ? "completed" : activeStepIndex === 2 ? "active" : "locked";
    }
    if (index === 3) {
      if (!hasResume || !hasIdentity || !hasSkills) return "locked";
      return hasEvaluated ? "completed" : activeStepIndex === 3 ? "active" : "locked";
    }
    if (index === 4) {
      if (!hasResume || !hasIdentity || !hasSkills || !hasEvaluated) return "locked";
      return "completed";
    }
    return "locked";
  };

  const getLockReason = (index: number): string => {
    if (index === 1 && !hasResume) return "Upload a resume PDF to configure identity & GitHub sync.";
    if (index === 2 && !hasIdentity) return "Confirm your GitHub profile handle to review extracted skills.";
    if (index === 3 && !hasSkills) return "Skills must be extracted before running the verification audit.";
    if (index === 4 && !hasEvaluated) return "Execute the verification audit to view your verified portfolio hub.";
    return "Locked step";
  };

  // Node Click Handler with Step Protection
  const handleNodeClick = (index: number) => {
    const status = getStepStatus(index);
    if (status === "locked" && index !== activeStepIndex) {
      setNotice({ type: "error", message: getLockReason(index) });
      return;
    }
    setNotice(null);
    setActiveStepIndex(index);
  };

  // -------------------------------------------------------------------------
  // Step Action Handlers
  // -------------------------------------------------------------------------
  const handleUploadResume = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setNotice({ type: "error", message: "Only standard text PDF files are supported." });
      return;
    }

    setIsUploading(true);
    setNotice(null);

    try {
      const formData = new FormData();
      formData.append("resume", file);

      const res = await fetch("/api/resume/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload resume.");

      await Promise.all([fetchResume(), refreshData()]);
      setNotice({
        type: "success",
        message: `Resume parsed! Extracted ${data.skillsExtracted || 0} technical proficiencies via Gemini.`,
      });
      setActiveStepIndex(1); // Proceed to Node 2
    } catch (err: unknown) {
      setNotice({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to upload resume.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteResume = async () => {
    if (!resumeRecord) return;
    setIsDeleting(true);
    setNotice(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabase.from("resume_skills").delete().eq("user_id", user.id);
      }

      const { error } = await supabase.from("resumes").delete().eq("id", resumeRecord.id);
      if (error) throw error;

      setResumeRecord(null);
      await refreshData();
      setNotice({ type: "success", message: "Resume removed. Drop a new PDF to restart mapping." });
      setActiveStepIndex(0);
    } catch (err: unknown) {
      setNotice({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to remove resume.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setNotice(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Authenticated session missing.");

      const cleanGithub = githubUsername.replace("@", "").trim();

      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        full_name: fullName.trim(),
        github_username: cleanGithub,
        target_role: targetRole.trim() || null,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      // Automatically trigger GitHub repository indexing if handle is set
      if (cleanGithub) {
        setIsScanningRepos(true);
        await fetch("/api/github/scan", { method: "POST" });
        setIsScanningRepos(false);
      }

      await refreshData();
      setNotice({ type: "success", message: "Developer identity & GitHub repositories linked." });
      setActiveStepIndex(2); // Proceed to Node 3
    } catch (err: unknown) {
      setNotice({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to save profile.",
      });
    } finally {
      setIsSavingProfile(false);
      setIsScanningRepos(false);
    }
  };

  const handleRunAudit = async () => {
    setIsEvaluating(true);
    setNotice(null);

    try {
      const res = await fetch("/api/evidence/evaluate", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Evidence evaluation failed.");

      await refreshData();
      setNotice({
        type: "success",
        message: `Audit completed: ${data.provenTotal || 0} Proven, ${data.partialTotal || 0} Partial signals.`,
      });
      setActiveStepIndex(4); // Advance to completion view
    } catch (err: unknown) {
      setNotice({
        type: "error",
        message: err instanceof Error ? err.message : "Audit evaluation failed.",
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* ------------------------------------------------------------------- */}
      {/* Top Header & Public Link Status                                     */}
      {/* ------------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
              Verification Pipeline
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-zinc-100 tracking-tight">
            Developer Qualification Path
          </h1>
        </div>

        {profile?.share_slug && (
          <Link
            href={`/v/${profile.share_slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800/80 text-xs font-mono text-zinc-300 transition-colors w-fit"
          >
            <span>proof/v/{profile.share_slug}</span>
            <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
          </Link>
        )}
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* Interactive Horizontal Pipeline (Left to Right)                    */}
      {/* ------------------------------------------------------------------- */}
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-4 sm:p-6 shadow-2xl backdrop-blur-md">
        <div className="relative flex items-center justify-between">
          {/* Background Connector Bar with Dynamic Emerald Segment Width */}
          <div className="absolute top-5 left-6 right-6 h-[2px] bg-zinc-800/80 z-0">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500"
              style={{
                width: `${(Math.max(0, activeStepIndex) / (PIPELINE_STEPS.length - 1)) * 100}%`,
              }}
            />
          </div>

          {/* Pipeline Nodes */}
          {PIPELINE_STEPS.map((step, idx) => {
            const status = getStepStatus(idx);
            const isCurrent = activeStepIndex === idx;
            const isPassed = status === "completed";
            const isBlocked = status === "locked" && !isCurrent;
            const StepIcon = step.icon;

            return (
              <div
                key={step.id}
                className="relative z-10 flex flex-col items-center group cursor-pointer"
                onClick={() => handleNodeClick(idx)}
              >
                {/* Node Circle */}
                <button
                  type="button"
                  title={isBlocked ? getLockReason(idx) : `Go to ${step.label}`}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border font-mono text-xs cursor-pointer ${
                    isPassed && !isCurrent
                      ? "bg-zinc-950 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:scale-105"
                      : isCurrent
                      ? "bg-zinc-950 border-cyan-400 text-cyan-300 ring-4 ring-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.4)] scale-110"
                      : "bg-zinc-950 border-zinc-800 text-zinc-600 hover:border-zinc-700"
                  }`}
                >
                  {isPassed && !isCurrent ? (
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  ) : isBlocked ? (
                    <Lock className="w-3.5 h-3.5 text-zinc-600" />
                  ) : (
                    <StepIcon className="w-4 h-4" />
                  )}
                </button>

                {/* Node Text Metadata */}
                <div className="mt-3 text-center">
                  <p
                    className={`text-xs font-semibold tracking-tight transition-colors ${
                      isCurrent
                        ? "text-cyan-300 font-bold"
                        : isPassed
                        ? "text-zinc-200"
                        : "text-zinc-600"
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="text-[10px] font-mono text-zinc-500 hidden sm:block mt-0.5">
                    {step.sublabel}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Global Notice Banner */}
      {notice && (
        <div
          role="status"
          className={`flex items-center justify-between rounded-xl border p-4 text-xs transition-all ${
            notice.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-red-500/10 border-red-500/30 text-red-300"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notice.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            )}
            <span>{notice.message}</span>
          </div>
          <button
            onClick={() => setNotice(null)}
            className="font-mono hover:underline text-[11px] ml-4 text-zinc-400 hover:text-zinc-100"
          >
            [close]
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* Focused Stage Workspace (Decoupled Stage View)                      */}
      {/* ------------------------------------------------------------------- */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 sm:p-10 shadow-2xl relative min-h-[420px] flex flex-col justify-between">
        {/* ================================================================= */}
        {/* NODE 1: Resume Upload / Parsing                                   */}
        {/* ================================================================= */}
        {activeStepIndex === 0 && (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-zinc-800/60 border border-zinc-700/60 text-[10px] font-mono text-zinc-300 mb-2">
                <span>STAGE 01</span>
                <span>/</span>
                <span className="text-emerald-400">PDF EXTRACTION</span>
              </div>
              <h2 className="text-xl font-bold font-heading text-zinc-100">
                Upload Primary Technical Resume
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
                SkillProof inspects textual claims using Google Gemini to extract concrete proficiencies, frameworks, and developer tools. Strictly 1 active document is retained.
              </p>
            </div>

            {resumeRecord ? (
              <div className="p-5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-100 font-mono truncate max-w-md">
                      {resumeRecord.file_name}
                    </p>
                    <p className="text-[11px] font-mono text-zinc-400 mt-0.5">
                      Ingested on {new Date(resumeRecord.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDeleteResume}
                  disabled={isDeleting}
                  className="px-3.5 py-2 border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 text-red-400 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 w-fit"
                >
                  {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  Replace Document
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-zinc-800 hover:border-zinc-700 rounded-xl p-10 text-center bg-zinc-950/40 transition-colors">
                <input
                  type="file"
                  id="resume-dropzone-input"
                  accept=".pdf"
                  className="hidden"
                  onChange={handleUploadResume}
                  disabled={isUploading}
                />
                <label
                  htmlFor="resume-dropzone-input"
                  className={`flex flex-col items-center justify-center gap-3 cursor-pointer ${
                    isUploading ? "opacity-50 pointer-events-none" : ""
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <FileUp className="w-6 h-6" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-200">
                      {isUploading ? "Extracting skill claims via Gemini..." : "Click to select or drop technical PDF resume"}
                    </p>
                    <p className="text-[11px] font-mono text-zinc-500 mt-1">
                      Max file size 5MB • Formatted PDF with selectable text
                    </p>
                  </div>
                </label>
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* NODE 2: Identity & GitHub Repo Sync                               */}
        {/* ================================================================= */}
        {activeStepIndex === 1 && (
          <form onSubmit={handleSaveIdentity} className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-zinc-800/60 border border-zinc-700/60 text-[10px] font-mono text-zinc-300 mb-2">
                <span>STAGE 02</span>
                <span>/</span>
                <span className="text-cyan-400">SOURCE SYNC</span>
              </div>
              <h2 className="text-xl font-bold font-heading text-zinc-100">
                Developer Identity & GitHub Profile
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
                SkillProof crawls your public commits, dependencies, and test directories to prove whether claimed skills exist in code.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-zinc-500" /> Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Gururaj Naik"
                  className="w-full px-3.5 py-2.5 bg-zinc-950/80 border border-zinc-800 focus:border-cyan-500 rounded-lg text-xs font-mono text-zinc-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5 flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5 text-zinc-500" /> GitHub Username
                </label>
                <input
                  type="text"
                  required
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                  placeholder="e.g. GururajNaik2807"
                  className="w-full px-3.5 py-2.5 bg-zinc-950/80 border border-zinc-800 focus:border-cyan-500 rounded-lg text-xs font-mono text-zinc-100 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-zinc-500" /> Target Evaluation Role
                </label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Full-Stack Engineer / Data Analyst"
                  className="w-full px-3.5 py-2.5 bg-zinc-950/80 border border-zinc-800 focus:border-cyan-500 rounded-lg text-xs font-mono text-zinc-100 focus:outline-none"
                />
              </div>
            </div>

            {repositories.length > 0 && (
              <div className="p-3.5 rounded-lg border border-zinc-800 bg-zinc-950/50 flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-400">
                  Indexed repositories: <strong className="text-zinc-200">{repositories.length}</strong>
                </span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Ready for cross-reference
                </span>
              </div>
            )}
          </form>
        )}

        {/* ================================================================= */}
        {/* NODE 3: Claim Extraction & AI Skill Mapping                       */}
        {/* ================================================================= */}
        {activeStepIndex === 2 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-zinc-800/60 border border-zinc-700/60 text-[10px] font-mono text-zinc-300 mb-2">
                  <span>STAGE 03</span>
                  <span>/</span>
                  <span className="text-cyan-400">SKILL TRIAGE</span>
                </div>
                <h2 className="text-xl font-bold font-heading text-zinc-100">
                  Extracted Resume Claims ({resumeSkills.length})
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
                  Canonical skills detected by Gemini. These proficiencies represent claimed candidate competencies queued for evidence auditing.
                </p>
              </div>

              <button
                type="button"
                onClick={async () => {
                  setNotice(null);
                  try {
                    await fetch("/api/resume/parse", { method: "POST" });
                    await refreshData();
                    setNotice({ type: "success", message: "Proficiencies re-extracted via Gemini." });
                  } catch {
                    setNotice({ type: "error", message: "Failed to re-extract skills." });
                  }
                }}
                className="px-3 py-1.5 border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-mono rounded-lg transition-colors flex items-center gap-1.5 w-fit"
              >
                <RotateCcw className="w-3.5 h-3.5 text-cyan-400" /> Re-parse Claims
              </button>
            </div>

            {resumeSkills.length === 0 ? (
              <div className="p-8 border border-dashed border-zinc-800 rounded-xl text-center bg-zinc-950/40">
                <Code2 className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-zinc-300">No skill claims extracted</p>
                <p className="text-xs text-zinc-500 mt-1">
                  Return to Stage 1 to upload or replace your resume document.
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 pt-1 max-h-64 overflow-y-auto pr-2">
                {resumeSkills.map((skill) => (
                  <div
                    key={skill.id}
                    title={skill.claimed_context || undefined}
                    className="px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800/80 text-xs flex items-center gap-2 hover:border-zinc-700 transition-colors"
                  >
                    <Code2 className="w-3 h-3 text-cyan-400" />
                    <span className="font-mono text-zinc-200">{skill.skill_name}</span>
                    <span className="text-[9px] font-mono uppercase px-1 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                      Claimed
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* NODE 4: Review & Verification Audit                               */}
        {/* ================================================================= */}
        {activeStepIndex === 3 && (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-zinc-800/60 border border-zinc-700/60 text-[10px] font-mono text-zinc-300 mb-2">
                <span>STAGE 04</span>
                <span>/</span>
                <span className="text-emerald-400">SIGNAL AUDIT</span>
              </div>
              <h2 className="text-xl font-bold font-heading text-zinc-100">
                Execute Evidence Verification Audit
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
                Cross-references every claimed proficiency against GitHub test suites, package manifests, and commit timestamps to assign deterministic tiers.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block">
                  Proven Tier
                </span>
                <p className="text-lg font-bold font-heading text-zinc-100 mt-1">Unit Tests + Code</p>
                <p className="text-xs text-zinc-400 mt-1">Passing suites in public repositories.</p>
              </div>

              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block">
                  Partial Tier
                </span>
                <p className="text-lg font-bold font-heading text-zinc-100 mt-1">Config / Inactive</p>
                <p className="text-xs text-zinc-400 mt-1">Found in package manifests or inactive &gt; 12mo.</p>
              </div>

              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/60">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
                  Claimed Tier
                </span>
                <p className="text-lg font-bold font-heading text-zinc-100 mt-1">Zero Public Code</p>
                <p className="text-xs text-zinc-400 mt-1">Queued for actionable micro-task flipping.</p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-zinc-200">Ready to audit codebase signals?</p>
                <p className="text-[11px] font-mono text-zinc-500">
                  Target handle: @{profile?.github_username || "none"} • {resumeSkills.length} claims
                </p>
              </div>

              <button
                type="button"
                onClick={handleRunAudit}
                disabled={isEvaluating}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50"
              >
                {isEvaluating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Run Evidence Audit
              </button>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* NODE 5: Verified Profile Dashboard                                */}
        {/* ================================================================= */}
        {activeStepIndex === 4 && (
          <div className="space-y-6 text-center py-6">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(16,185,129,0.25)]">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <h2 className="text-2xl font-bold font-heading text-zinc-100">
                Verification Pipeline Complete
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1.5 max-w-md mx-auto">
                Your deterministic qualification matrix is active. You can revisit any completed pipeline node anytime or explore your verified workspace.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto text-left">
              <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950 font-mono">
                <span className="text-[10px] text-zinc-500 block">PROVEN SKILLS</span>
                <span className="text-base font-bold text-emerald-400">
                  {evidenceList.filter((e) => e.status === "proven").length}
                </span>
              </div>
              <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950 font-mono">
                <span className="text-[10px] text-zinc-500 block">PARTIAL TIERS</span>
                <span className="text-base font-bold text-amber-400">
                  {evidenceList.filter((e) => e.status === "partial").length}
                </span>
              </div>
              <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950 font-mono">
                <span className="text-[10px] text-zinc-500 block">INDEXED REPOS</span>
                <span className="text-base font-bold text-zinc-200">{repositories.length}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              >
                Go to Verification Hub <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => router.push("/matrix")}
                className="px-4 py-2.5 border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                View Evidence Matrix
              </button>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* Stage Bottom Navigation Action Bar                                */}
        {/* ----------------------------------------------------------------- */}
        <div className="pt-6 border-t border-zinc-800/80 flex items-center justify-between mt-8">
          <button
            type="button"
            onClick={() => setActiveStepIndex((prev) => Math.max(0, prev - 1))}
            disabled={activeStepIndex === 0}
            className="px-3.5 py-2 rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 text-xs font-mono transition-colors disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>

          <div className="flex items-center gap-2">
            {activeStepIndex === 0 && (
              <button
                type="button"
                onClick={() => setActiveStepIndex(1)}
                disabled={!hasResume}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 text-xs font-bold rounded-lg transition-colors disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
              >
                Continue to GitHub <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {activeStepIndex === 1 && (
              <button
                type="button"
                onClick={handleSaveIdentity}
                disabled={isSavingProfile || isScanningRepos || !fullName || !githubUsername}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 text-xs font-bold rounded-lg transition-colors disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
              >
                {isSavingProfile || isScanningRepos ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    Save & Sync Repos <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            )}

            {activeStepIndex === 2 && (
              <button
                type="button"
                onClick={() => setActiveStepIndex(3)}
                disabled={!hasSkills}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 text-xs font-bold rounded-lg transition-colors disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
              >
                Proceed to Audit <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {activeStepIndex === 3 && (
              <button
                type="button"
                onClick={handleRunAudit}
                disabled={isEvaluating}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 text-xs font-bold rounded-lg transition-colors disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
              >
                {isEvaluating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <>Run Audit & Complete</>}
              </button>
            )}

            {activeStepIndex === 4 && (
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                View Hub <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
