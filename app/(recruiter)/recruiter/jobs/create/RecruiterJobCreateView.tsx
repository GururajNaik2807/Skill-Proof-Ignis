"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CreateJobPage() {
  const supabase = createClient();
  const router = useRouter();
  
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string; shareSlug?: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState("Full-time");
  const [required, setRequired] = useState("");
  const [niceToHave, setNiceToHave] = useState("");
  
  // App Requirements
  const [reqResume, setReqResume] = useState("Required");
  const [reqCoverLetter, setReqCoverLetter] = useState("Optional");
  const [reqGithub, setReqGithub] = useState("Optional");
  const [reqPortfolio, setReqPortfolio] = useState("Optional");

  const handleCreateJob = async (e: React.FormEvent, status: "active" | "draft") => {
    e.preventDefault();
    setIsSubmitting(true);
    setNotice(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const requiredArray = required.split(",").map((s) => s.trim()).filter(Boolean);
      const niceArray = niceToHave.split(",").map((s) => s.trim()).filter(Boolean);
      const slug = Math.random().toString(36).substring(2, 10);

      const { error } = await supabase.from("jobs").insert({
        recruiter_id: user.id,
        title: title.trim(),
        required_skills: requiredArray,
        nice_to_have: niceArray,
        job_type: jobType,
        status: status,
        share_slug: slug,
        // Assuming database supports arbitrary metadata or we just keep it simple as per schema
      });

      if (error) throw error;

      if (status === "active") {
        setNotice({ type: "success", text: "Job published successfully!", shareSlug: slug });
      } else {
        router.push("/recruiter/jobs");
      }
    } catch (err: any) {
      setNotice({ type: "error", text: err.message || "Failed to create job." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/j/${slug}`);
  };

  if (notice?.type === "success") {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300 py-10 text-center">
        <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-zinc-100">Job published</h1>
        <p className="text-zinc-400">Your job is now live and ready to accept applications.</p>
        
        <div className="p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800 mt-6 max-w-md mx-auto space-y-4">
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Application Link</p>
          <div className="p-3 bg-zinc-950 rounded-lg text-sm text-zinc-300 font-mono break-all border border-zinc-800/80">
            {window.location.origin}/j/{notice.shareSlug}
          </div>
          <div className="flex gap-3 pt-2">
            <button 
              onClick={() => copyLink(notice.shareSlug!)}
              className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold rounded-lg transition-colors"
            >
              Copy Link
            </button>
            <Link 
              href={`/j/${notice.shareSlug}`}
              target="_blank"
              className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded-lg transition-colors"
            >
              Open Application
            </Link>
          </div>
        </div>

        <div className="pt-8">
          <Link href="/recruiter/jobs" className="text-emerald-400 hover:underline text-sm font-bold">
            ← Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300 py-4">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/recruiter/jobs" className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-zinc-400 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-2xl font-bold font-heading text-zinc-100">Create Job</h1>
      </div>

      {notice?.type === "error" && (
        <div className="p-4 rounded-xl border bg-red-500/10 border-red-500/30 text-red-400 flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4" />
          {notice.text}
        </div>
      )}

      <form className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 space-y-8">
        
        {/* Job Details */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-widest border-b border-zinc-800 pb-2">Job Details</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 font-bold">Job title *</label>
              <input
                required
                type="text"
                placeholder="Frontend Engineer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 font-bold">Company / team</label>
              <input
                type="text"
                placeholder="Engineering"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 font-bold">Location</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none appearance-none"
              >
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="On-site">On-site</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 font-bold">Employment type</label>
              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none appearance-none"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
              </select>
            </div>
          </div>
        </div>

        {/* Job Description */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-widest border-b border-zinc-800 pb-2">Job Description</h2>
          
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5 font-bold">Required Skills * (comma separated)</label>
            <input
              required
              type="text"
              placeholder="React, TypeScript, Next.js"
              value={required}
              onChange={(e) => setRequired(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5 font-bold">Nice-to-have Skills (comma separated)</label>
            <input
              type="text"
              placeholder="GraphQL, Tailwind CSS"
              value={niceToHave}
              onChange={(e) => setNiceToHave(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none"
            />
          </div>
        </div>

        {/* Application Requirements */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-widest border-b border-zinc-800 pb-2">Application Requirements</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 border border-zinc-800/80 rounded-xl bg-zinc-950/50">
              <span className="text-sm text-zinc-300 font-bold">Resume</span>
              <select value={reqResume} onChange={(e) => setReqResume(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs outline-none">
                <option>Required</option>
                <option>Optional</option>
              </select>
            </div>
            <div className="flex items-center justify-between p-3 border border-zinc-800/80 rounded-xl bg-zinc-950/50">
              <span className="text-sm text-zinc-300 font-bold">Cover Letter</span>
              <select value={reqCoverLetter} onChange={(e) => setReqCoverLetter(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs outline-none">
                <option>Required</option>
                <option>Optional</option>
              </select>
            </div>
            <div className="flex items-center justify-between p-3 border border-zinc-800/80 rounded-xl bg-zinc-950/50">
              <span className="text-sm text-zinc-300 font-bold">GitHub</span>
              <select value={reqGithub} onChange={(e) => setReqGithub(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs outline-none">
                <option>Required</option>
                <option>Optional</option>
              </select>
            </div>
            <div className="flex items-center justify-between p-3 border border-zinc-800/80 rounded-xl bg-zinc-950/50">
              <span className="text-sm text-zinc-300 font-bold">Portfolio</span>
              <select value={reqPortfolio} onChange={(e) => setReqPortfolio(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs outline-none">
                <option>Required</option>
                <option>Optional</option>
              </select>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-zinc-800 flex justify-end gap-3">
          <button
            type="button"
            onClick={(e) => handleCreateJob(e, "draft")}
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-sm font-bold rounded-xl transition-all disabled:opacity-50"
          >
            Save Draft
          </button>
          <button
            type="submit"
            onClick={(e) => handleCreateJob(e, "active")}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 text-sm font-bold rounded-xl transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Publish Job"}
          </button>
        </div>
      </form>
    </div>
  );
}
