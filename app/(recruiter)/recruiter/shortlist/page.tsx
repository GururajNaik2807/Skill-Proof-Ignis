"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Users, GitBranch, ArrowRight, Loader2, Star } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ShortlistPage() {
  const supabase = createClient();
  const router = useRouter();
  
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Get recruiter's jobs
    const { data: jobs } = await supabase
      .from("jobs")
      .select("id, title")
      .eq("recruiter_id", user.id);

    if (!jobs || jobs.length === 0) {
      setCandidates([]);
      setLoading(false);
      return;
    }

    const jobMap = new Map(jobs.map((j: any) => [j.id, j.title]));
    const jobIds = jobs.map((j: any) => j.id);

    // 2. Get applications for these jobs WHERE status = shortlisted
    const { data: apps } = await supabase
      .from("job_applications")
      .select("id, job_id, candidate_id, status, created_at")
      .in("job_id", jobIds)
      .eq("status", "shortlisted")
      .order("created_at", { ascending: false });

    if (!apps || apps.length === 0) {
      setCandidates([]);
      setLoading(false);
      return;
    }

    const candidateIds = apps.map((a: any) => a.candidate_id);

    // 3. Get candidate profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, github_username")
      .in("id", candidateIds);

    const profileMap = new Map(profiles?.map((p: any) => [p.id, p]) || []);

    const enriched = apps.map((app: any) => {
      const p = profileMap.get(app.candidate_id);
      return {
        id: app.id,
        candidate_id: app.candidate_id,
        full_name: p?.full_name || "Unknown Candidate",
        github_username: p?.github_username,
        job_title: jobMap.get(app.job_id),
        status: app.status || "Shortlisted",
        match_score: app.match_score || 0,
        job_id: app.job_id
      };
    });

    setCandidates(enriched);
    setLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300 py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-zinc-100 flex items-center gap-3">
            <Star className="w-7 h-7 text-emerald-400" />
            Shortlisted Candidates
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Review top talent that you have bookmarked for interviews.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-emerald-400" /></div>
      ) : candidates.length === 0 ? (
        <div className="p-12 border border-dashed border-zinc-800 rounded-2xl text-center bg-zinc-900/30 flex flex-col items-center">
          <Star className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-zinc-200">No candidates shortlisted yet</h3>
          <p className="text-sm text-zinc-500 mt-1 mb-5">
            Go to your Candidate pipeline or review candidates to add them to your shortlist.
          </p>
          <Link href="/recruiter/candidates" className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-lg transition-colors">
            View Candidates Pipeline
          </Link>
        </div>
      ) : (
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-zinc-950 text-zinc-400 uppercase tracking-wider text-[10px] font-bold border-b border-zinc-800">
                <tr>
                  <th className="px-5 py-4">Candidate</th>
                  <th className="px-5 py-4">Applied Job</th>
                  <th className="px-5 py-4">Job Match Score</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {candidates.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-800/40 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-zinc-100 text-sm">{c.full_name}</span>
                        {c.github_username && (
                          <span className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 mt-1">
                            <GitBranch className="w-3 h-3 text-emerald-500/70" /> @{c.github_username}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-zinc-300">
                      {c.job_title}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              c.match_score >= 85 ? "bg-emerald-500" : 
                              c.match_score >= 70 ? "bg-cyan-500" : "bg-amber-500"
                            }`}
                            style={{ width: `${c.match_score}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-zinc-200">{c.match_score}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {c.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link 
                        href={`/recruiter/candidate/${c.candidate_id}`}
                        className="inline-flex items-center px-3 py-1.5 bg-zinc-900 border border-zinc-700 hover:border-emerald-500 text-zinc-300 hover:text-emerald-400 text-xs font-semibold rounded-lg transition-colors"
                      >
                        Review Profile <ArrowRight className="w-3 h-3 ml-1.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
