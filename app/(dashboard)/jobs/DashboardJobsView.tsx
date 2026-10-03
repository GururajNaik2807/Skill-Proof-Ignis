"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Briefcase, CheckCircle2, Clock, ExternalLink, ArrowRight, Loader2, FileText } from "lucide-react";

export default function CandidateJobsPage() {
  const supabase = createClient();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadApps() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("job_applications")
        .select(`
          id,
          status,
          created_at,
          jobs (
            id,
            title,
            job_type,
            required_skills,
            share_slug
          ),
          resumes (
            id,
            file_name
          )
        `)
        .eq("candidate_id", user.id)
        .order("created_at", { ascending: false });

      if (data) setApplications(data);
      setLoading(false);
    }
    loadApps();
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="pb-6 border-b border-zinc-800 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-zinc-100 flex items-center gap-2.5">
            <Briefcase className="w-7 h-7 text-emerald-400" />
            My Applications
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Roles you have applied to with your verified technical proof and resume.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
        </div>
      ) : applications.length === 0 ? (
        <div className="p-12 border border-dashed border-zinc-800 rounded-xl text-center bg-zinc-900/40">
          <Briefcase className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-zinc-200">No applications yet</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            When you apply to jobs via recruiter share links, your application and live evidence will be tracked here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {applications.map((app) => (
            <div
              key={app.id}
              className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-bold text-zinc-100">{app.jobs?.title}</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {app.status}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {app.jobs?.required_skills?.map((skill: string) => (
                    <span key={skill} className="px-2 py-0.5 bg-zinc-950 border border-zinc-800 rounded text-[11px] font-mono text-zinc-300">
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-4 text-[11px] font-mono text-zinc-500 pt-1">
                  <span>Applied on {new Date(app.created_at).toLocaleDateString()}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-zinc-400">
                    <FileText className="w-3 h-3 text-emerald-400" /> {app.resumes?.file_name || "Resume PDF"}
                  </span>
                </div>
              </div>

              <Link
                href={`/j/${app.jobs?.share_slug}`}
                target="_blank"
                className="px-3.5 py-2 rounded-lg border border-zinc-800 hover:bg-zinc-800 text-xs font-semibold text-zinc-300 flex items-center gap-1.5 w-fit"
              >
                View Post <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
