"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
  Briefcase, Plus, Copy, CheckCircle2, AlertCircle, 
  ArrowLeft, Search, Loader2, Globe, Users, Power
} from "lucide-react";

type Job = {
  id: string;
  title: string;
  required_skills: string[];
  nice_to_have: string[];
  job_type: string;
  status: string;
  share_slug: string;
  created_at: string;
};

export default function RecruiterJobsPage() {
  const supabase = createClient();
  const [view, setView] = useState<"list" | "create">("list");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [required, setRequired] = useState("");
  const [niceToHave, setNiceToHave] = useState("");
  const [jobType, setJobType] = useState("Full-time Remote");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("jobs")
        .select("*")
        .eq("recruiter_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setJobs(data as Job[]);
    }
    setLoading(false);
  };

  const handleCreateJob = async (e: React.FormEvent) => {
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
        status: "active",
        share_slug: slug,
      });

      if (error) throw error;

      setNotice({ type: "success", text: "Job published successfully!" });
      setTitle("");
      setRequired("");
      setNiceToHave("");
      setView("list");
      fetchJobs();
    } catch (err: any) {
      setNotice({ type: "error", text: err.message || "Failed to create job." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleJobStatus = async (jobId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "closed" : "active";
    await supabase.from("jobs").update({ status: newStatus }).eq("id", jobId);
    fetchJobs();
  };

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/j/${slug}`);
    setNotice({ type: "success", text: "Shareable link copied to clipboard!" });
    setTimeout(() => setNotice(null), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300 py-4">
      
      {/* Dynamic Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-zinc-100 flex items-center gap-3">
            <Briefcase className="w-7 h-7 text-emerald-400" />
            {view === "list" ? "Job Matches & Descriptions" : "Create New Job"}
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            {view === "list" 
              ? "Manage active roles, copy share links, and review candidate pipelines." 
              : "Define skill requirements to generate a deterministic verification target."}
          </p>
        </div>

        {view === "list" ? (
          <button
            onClick={() => setView("create")}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 text-sm font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create Job
          </button>
        ) : (
          <button
            onClick={() => setView("list")}
            className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-sm font-semibold rounded-xl transition-all flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Jobs
          </button>
        )}
      </div>

      {/* Notice Banner */}
      {notice && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-xs font-mono ${
          notice.type === "success" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-400"
        }`}>
          <div className="flex items-center gap-2">
            {notice.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {notice.text}
          </div>
          <button onClick={() => setNotice(null)} className="hover:underline">Dismiss</button>
        </div>
      )}

      {/* VIEW: JOB LIST */}
      {view === "list" && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-emerald-400" /></div>
          ) : jobs.length === 0 ? (
            <div className="p-12 border border-dashed border-zinc-800 rounded-2xl text-center bg-zinc-900/30">
              <Search className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-zinc-200">No jobs created yet</h3>
              <p className="text-sm text-zinc-500 mt-1 mb-5">Publish your first job description to start collecting verified candidates.</p>
              <button onClick={() => setView("create")} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-lg transition-colors">
                Create your first job
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {jobs.map((job) => (
                <div key={job.id} className={`p-6 border rounded-2xl bg-zinc-900/40 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all ${job.status === 'active' ? 'border-zinc-800 hover:border-emerald-500/30' : 'border-zinc-800/50 opacity-60'}`}>
                  
                  {/* Job Details */}
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold text-zinc-100">{job.title}</h3>
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase ${job.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'}`}>
                        {job.status}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {job.required_skills.map(skill => (
                        <span key={skill} className="px-2 py-1 bg-zinc-950 border border-zinc-800 rounded text-xs font-mono text-zinc-300">
                          {skill}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono text-zinc-500">
                      <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> {job.job_type}</span>
                      <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> 0 Applications</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex md:flex-col items-center justify-end gap-3 shrink-0">
                    <button 
                      onClick={() => copyLink(job.share_slug)}
                      className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 hover:border-cyan-500/50 text-cyan-400 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copy Link
                    </button>
                    <button 
                      onClick={() => toggleJobStatus(job.id, job.status)}
                      className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 hover:border-zinc-600 text-zinc-400 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      <Power className="w-3.5 h-3.5" /> {job.status === 'active' ? 'Close Job' : 'Reactivate'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW: CREATE JOB */}
      {view === "create" && (
        <form onSubmit={handleCreateJob} className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl max-w-3xl mx-auto space-y-6">
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">Job Title</label>
              <input
                required
                type="text"
                placeholder="e.g. Frontend Engineer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-zinc-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">Availability / Location</label>
              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-zinc-100 outline-none appearance-none"
              >
                <option>Full-time Remote</option>
                <option>Full-time On-site</option>
                <option>Contract / Freelance</option>
              </select>
            </div>

            <div className="pt-2 border-t border-zinc-800/50">
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                Required Skills <span className="text-emerald-500/70 lowercase normal-case">(comma separated)</span>
              </label>
              <input
                required
                type="text"
                placeholder="React, TypeScript, Next.js, Jest"
                value={required}
                onChange={(e) => setRequired(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm font-mono text-zinc-100 outline-none"
              />
              <p className="text-[10px] text-zinc-500 mt-1">Candidates will be evaluated primarily against these core requirements.</p>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                Nice-to-have Skills <span className="text-zinc-600 lowercase normal-case">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="Docker, CI/CD, GraphQL"
                value={niceToHave}
                onChange={(e) => setNiceToHave(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-cyan-500 rounded-xl px-4 py-3 text-sm font-mono text-zinc-100 outline-none"
              />
            </div>
          </div>

          <div className="pt-6 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 text-sm font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Publish Job"}
            </button>
          </div>
        </form>
      )}

    </div>
  );
}