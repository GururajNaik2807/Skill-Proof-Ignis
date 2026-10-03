"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Briefcase, Plus, Copy, Search, Globe, Users, Power, Edit } from "lucide-react";
import Link from "next/link";

type Job = {
  id: string;
  title: string;
  required_skills: string[];
  nice_to_have: string[];
  job_type: string;
  status: string;
  share_slug: string;
  created_at: string;
  applications_count?: number;
};

export default function RecruiterJobsPage() {
  const supabase = createClient();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: dbJobs } = await supabase
        .from("jobs")
        .select("*")
        .eq("recruiter_id", user.id)
        .order("created_at", { ascending: false });
        
      if (dbJobs) {
        // Fetch application counts
        const jobIds = dbJobs.map(j => j.id);
        const { data: apps } = jobIds.length > 0 ? await supabase
          .from("job_applications")
          .select("job_id")
          .in("job_id", jobIds) : { data: [] };
          
        const appsCountMap = (apps || []).reduce((acc: any, curr: any) => {
          acc[curr.job_id] = (acc[curr.job_id] || 0) + 1;
          return acc;
        }, {});

        const enhancedJobs = dbJobs.map((j) => ({
          ...j,
          applications_count: appsCountMap[j.id] || 0,
        }));
        setJobs(enhancedJobs as Job[]);
      }
    }
    setLoading(false);
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-zinc-100 flex items-center gap-3">
            <Briefcase className="w-7 h-7 text-emerald-400" />
            Jobs
          </h1>
        </div>

        <Link
          href="/recruiter/jobs/create"
          className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 text-sm font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create Job
        </Link>
      </div>

      {/* Notice Banner */}
      {notice && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-xs font-mono ${
          notice.type === "success" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-400"
        }`}>
          <div className="flex items-center gap-2">
            {notice.text}
          </div>
          <button onClick={() => setNotice(null)} className="hover:underline">Dismiss</button>
        </div>
      )}

      {/* Tabs placeholder for future */}
      <div className="flex gap-4 border-b border-zinc-800 pb-2 text-sm">
        <span className="font-bold text-emerald-400 border-b-2 border-emerald-400 pb-2">All</span>
        <span className="text-zinc-500 hover:text-zinc-300 cursor-pointer pb-2">Active</span>
        <span className="text-zinc-500 hover:text-zinc-300 cursor-pointer pb-2">Draft</span>
        <span className="text-zinc-500 hover:text-zinc-300 cursor-pointer pb-2">Closed</span>
      </div>

      {/* VIEW: JOB LIST */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-20 text-emerald-400">Loading jobs...</div>
        ) : jobs.length === 0 ? (
          <div className="p-12 border border-dashed border-zinc-800 rounded-2xl text-center bg-zinc-900/30 flex flex-col items-center">
            <Briefcase className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-zinc-200">No jobs yet</h3>
            <p className="text-sm text-zinc-500 mt-1 mb-5">Create your first job to start receiving applications.</p>
            <Link href="/recruiter/jobs/create" className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-lg transition-colors">
              Create Job
            </Link>
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
                    {job.required_skills?.map(skill => (
                      <span key={skill} className="px-2 py-1 bg-zinc-950 border border-zinc-800 rounded text-xs font-mono text-zinc-300">
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono text-zinc-500">
                    <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> {job.job_type}</span>
                    <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {job.applications_count} Applications</span>
                    <span>Created: {new Date(job.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap md:flex-col items-center justify-end gap-2 shrink-0 w-full md:w-auto">
                  <Link 
                    href={`/recruiter/jobs/${job.id}`}
                    className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 hover:border-emerald-500/50 text-zinc-300 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    Open
                  </Link>
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
    </div>
  );
}
