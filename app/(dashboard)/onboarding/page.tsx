"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  UserCheck, 
  GitBranch, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Briefcase,
  FileUp,
  Trash2,
  FileText
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ResumeRecord {
  id: string;
  file_name: string;
  created_at: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Profile Form State
  const [fullName, setFullName] = useState("");
  const [githubUsername, setGithubUsername] = useState("");
  const [targetRole, setTargetRole] = useState("");

  // Resume State
  const [existingResume, setExistingResume] = useState<ResumeRecord | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const hasFetched = useRef(false);

  // Load both Profile and existing Resume
  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const [ { data: profile }, { data: resume } ] = await Promise.all([
        supabase.from("profiles").select("full_name, github_username, target_role").eq("id", user.id).single(),
        supabase.from("resumes").select("id, file_name, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).single()
      ]);

      if (profile) {
        setFullName(profile.full_name || "");
        setGithubUsername(profile.github_username || "");
        setTargetRole(profile.target_role || "");
      }

      if (resume) {
        setExistingResume(resume as ResumeRecord);
      } else {
        setExistingResume(null);
      }
    } catch (error) {
      console.error("Error loading onboarding data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasFetched.current) {
      loadData();
      hasFetched.current = true;
    }
  }, [router, supabase]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNotice(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication required");

      const cleanGithubHandle = githubUsername.replace("@", "").trim();

      // Changed from update() to upsert() to fix the missing row error
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id, // ID is required for upsert
          full_name: fullName.trim(),
          github_username: cleanGithubHandle,
          target_role: targetRole.trim(),
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      setNotice({ 
        type: "success", 
        message: "Profile saved successfully!" 
      });

    } catch (err: unknown) {
      setNotice({ 
        type: "error", 
        message: err instanceof Error ? err.message : "Failed to save profile details." 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setNotice({ type: "error", message: "Only PDF files are supported." });
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
      if (!res.ok) throw new Error(data.error || "Failed to upload resume");

      setNotice({ type: "success", message: "Resume uploaded and parsed successfully!" });
      await loadData(); // Refresh to show the new resume file
    } catch (err: unknown) {
      setNotice({ type: "error", message: err instanceof Error ? err.message : "Upload failed" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteResume = async () => {
    if (!existingResume) return;
    setIsDeleting(true);
    setNotice(null);

    try {
      // Deleting from public.resumes will cascade and delete associated resume_skills
      const { error } = await supabase.from("resumes").delete().eq("id", existingResume.id);
      if (error) throw error;

      setExistingResume(null);
      setNotice({ type: "success", message: "Resume deleted. You can now upload a new one." });
    } catch (err: unknown) {
      setNotice({ type: "error", message: err instanceof Error ? err.message : "Failed to delete resume." });
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3 text-muted-text text-sm">
          <Loader2 className="w-5 h-5 animate-spin text-deep-green" />
          Loading your configuration...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div id="profile" className="pb-6 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-ink flex items-center gap-2.5">
            <UserCheck className="w-7 h-7 text-deep-green" />
            Profile Configuration
          </h1>
          <p className="text-xs sm:text-sm text-muted-text mt-1">
            Manage your personal details and primary resume for SkillProof verification.
          </p>
        </div>
        <Link 
          href="/dashboard"
          className="px-4 py-2 border border-border text-xs font-semibold rounded-lg hover:bg-soft-surface transition-colors flex items-center gap-1.5"
        >
          To Dashboard <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {notice && (
        <div role="status" className={`flex items-center justify-between rounded-xl border p-4 text-xs ${notice.type === "success" ? "bg-status-proven/10 border-status-proven/20 text-status-proven" : "bg-status-error/10 border-status-error/20 text-status-error"}`}>
          <div className="flex items-center gap-2.5">
            {notice.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span className="font-medium">{notice.message}</span>
          </div>
          <button onClick={() => setNotice(null)} className="font-semibold hover:underline text-[11px] ml-4 cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* Part 1: Profile Details */}
      <div id="github" className="bg-white border border-border rounded-xl p-6 shadow-subtle space-y-5">
        <h2 className="text-sm font-bold text-ink uppercase tracking-wider border-b border-border pb-3">Identity & GitHub</h2>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Gururaj Naik"
              className="w-full px-3.5 py-2.5 bg-soft-surface/50 border border-border rounded-lg text-xs focus:outline-none focus:border-deep-green text-ink"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5 text-muted-text" /> GitHub Username
            </label>
            <input
              type="text"
              required
              value={githubUsername}
              onChange={(e) => setGithubUsername(e.target.value)}
              placeholder="e.g. gururajnaik"
              className="w-full px-3.5 py-2.5 bg-soft-surface/50 border border-border rounded-lg text-xs focus:outline-none focus:border-deep-green text-ink font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-muted-text" /> Target Role
            </label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Data Analyst"
              className="w-full px-3.5 py-2.5 bg-soft-surface/50 border border-border rounded-lg text-xs focus:outline-none focus:border-deep-green text-ink"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-deep-green text-white text-xs font-semibold rounded-lg hover:bg-deep-green/90 transition-colors flex items-center gap-2 shadow-subtle cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Profile"}
            </button>
          </div>
        </form>
      </div>

      {/* Part 2: Resume Management */}
      <div id="resume" className="bg-white border border-border rounded-xl p-6 shadow-subtle space-y-5">
        <h2 className="text-sm font-bold text-ink uppercase tracking-wider border-b border-border pb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-deep-green" /> Primary Resume
        </h2>
        
        {existingResume ? (
          <div className="p-4 bg-status-proven/5 border border-status-proven/20 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-status-proven/10 flex items-center justify-center text-status-proven">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink truncate max-w-xs">{existingResume.file_name}</p>
                <p className="text-[11px] text-muted-text mt-0.5">
                  Uploaded on {new Date(existingResume.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDeleteResume}
              disabled={isDeleting}
              className="px-3.5 py-2 border border-status-error/30 text-status-error text-xs font-semibold rounded-lg hover:bg-status-error/10 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Delete & Replace
            </button>
          </div>
        ) : (
          <div className="border-2 border-dashed border-border rounded-xl p-8 text-center bg-soft-surface/30">
            <input
              type="file"
              id="resume-upload"
              accept=".pdf"
              className="hidden"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
            <label 
              htmlFor="resume-upload" 
              className={`flex flex-col items-center justify-center gap-3 cursor-pointer ${isUploading ? 'opacity-50 pointer-events-none' : 'hover:opacity-80'}`}
            >
              <div className="w-12 h-12 rounded-full bg-deep-green/10 flex items-center justify-center text-deep-green">
                {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <FileUp className="w-6 h-6" />}
              </div>
              <div>
                <p className="text-sm font-bold text-ink">
                  {isUploading ? "Uploading & Extracting..." : "Click to upload PDF resume"}
                </p>
                <p className="text-xs text-muted-text mt-1">Maximum file size 5MB.</p>
              </div>
            </label>
          </div>
        )}
      </div>
    </div>
  );
}