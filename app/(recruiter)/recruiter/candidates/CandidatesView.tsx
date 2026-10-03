"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Users, GitBranch, ArrowRight, Loader2, CheckSquare } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { calculateMatchScore, ParsedJobRequirement, CandidateSkillInput } from "@/lib/shared/match-calculator";

export default function CandidatesPage() {
  const supabase = createClient();
  const router = useRouter();
  
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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
      .select("id, title, required_skills")
      .eq("recruiter_id", user.id);

    if (!jobs || jobs.length === 0) {
      setCandidates([]);
      setLoading(false);
      return;
    }

    const jobMap = new Map(jobs.map((j: any) => [j.id, j.title]));
    const jobIds = jobs.map((j: any) => j.id);

    // 2. Get applications for these jobs
    const { data: apps } = await supabase
      .from("job_applications")
      .select("id, job_id, candidate_id, status, created_at")
      .in("job_id", jobIds)
      .order("created_at", { ascending: false });

    if (!apps || apps.length === 0) {
      setCandidates([]);
      setLoading(false);
      return;
    }

    // 3. Get candidate profiles & 4. Get skill evidence (Parallelized)
    const candidateIds = apps.map((a: any) => a.candidate_id);
    const [ { data: profiles }, { data: evidenceList } ] = await Promise.all([
      supabase.from("profiles").select("id, full_name, github_username").in("id", candidateIds),
      supabase.from("skill_evidence").select("user_id, skill_name, status").in("user_id", candidateIds)
    ]);

    const profileMap = new Map(profiles?.map((p: any) => [p.id, p]) || []);

    const evidenceByCandidate = new Map<string, any[]>();
    evidenceList?.forEach((e: any) => {
      const existing = evidenceByCandidate.get(e.user_id) || [];
      existing.push(e);
      evidenceByCandidate.set(e.user_id, existing);
    });

    const jobDetailsMap = new Map(jobs.map((j: any) => [j.id, j]));

    const enriched = apps.map((app: any) => {
      const p = profileMap.get(app.candidate_id);
      const jobData = jobDetailsMap.get(app.job_id);
      
      const reqList: string[] = jobData?.required_skills || [];
      const requirements: ParsedJobRequirement[] = reqList.map(skill_name => ({
        skill_name,
        importance: "required" as const
      }));

      const candidateEv = evidenceByCandidate.get(app.candidate_id) || [];
      const candidateSkills: CandidateSkillInput[] = candidateEv.map((e: any) => ({
        skill_name: e.skill_name,
        status: e.status
      }));

      const matchPercent = calculateMatchScore(requirements, candidateSkills).overall_score;

      return {
        id: app.id,
        candidate_id: app.candidate_id,
        full_name: p?.full_name || "Unknown Candidate",
        github_username: p?.github_username,
        job_title: jobData?.title,
        status: app.status || "Pending",
        match_score: matchPercent,
        job_id: app.job_id,
        evidence_score: `${candidateEv.filter((e: any) => e.status === "proven").length} / ${candidateEv.length}`
      };
    });

    setCandidates(enriched);
    setLoading(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      } else {
        if (prev.length >= 4) return prev; // Limit to 4
        return [...prev, id];
      }
    });
  };

  const handleCompare = () => {
    if (selectedIds.length === 0) return;
    router.push(`/recruiter/compare?ids=${selectedIds.join(",")}`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300 py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-zinc-100 flex items-center gap-3">
            <Users className="w-7 h-7 text-emerald-400" />
            Candidates Pipeline
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Manage applicants across all active jobs. Select up to 4 to compare.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-emerald-400" /></div>
      ) : candidates.length === 0 ? (
        <div className="p-12 border border-dashed border-zinc-800 rounded-2xl text-center bg-zinc-900/30 flex flex-col items-center">
          <Users className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-zinc-200">No candidates found</h3>
          <p className="text-sm text-zinc-500 mt-1 mb-5">
            Ensure your jobs are active and share links are distributed.
          </p>
          <Link href="/recruiter/jobs" className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-lg transition-colors">
            View Jobs
          </Link>
        </div>
      ) : (
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-zinc-950 text-zinc-400 uppercase tracking-wider text-[10px] font-bold border-b border-zinc-800">
                <tr>
                  <th className="px-5 py-4 w-12 text-center">
                    <input 
                      type="checkbox" 
                      className="rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500/20 disabled:opacity-50"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(candidates.slice(0, 4).map(c => c.id));
                        } else {
                          setSelectedIds([]);
                        }
                      }}
                      checked={selectedIds.length > 0 && selectedIds.length === Math.min(candidates.length, 4)}
                    />
                  </th>
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
                    <td className="px-5 py-4 text-center">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(c.id)}
                        onChange={() => toggleSelect(c.id)}
                        className="rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500/20"
                      />
                    </td>
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
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        c.status === "Shortlisted" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                        c.status === "Review" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" :
                        "bg-zinc-800 text-zinc-400 border border-zinc-700"
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link 
                        href={`/recruiter/candidate/${c.id}`}
                        className="inline-flex items-center px-3 py-1.5 bg-zinc-900 border border-zinc-700 hover:border-emerald-500 text-zinc-300 hover:text-emerald-400 text-xs font-semibold rounded-lg transition-colors"
                      >
                        Review <ArrowRight className="w-3 h-3 ml-1.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Floating Action Bar */}
      <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${selectedIds.length > 0 ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}>
        <div className="bg-zinc-900/90 backdrop-blur-lg border border-emerald-500/30 p-4 rounded-2xl shadow-[0_8px_32px_-4px_rgba(0,229,255,0.15)] flex items-center gap-6">
          <span className="text-sm font-bold text-zinc-200">
            {selectedIds.length} candidate{selectedIds.length !== 1 ? 's' : ''} selected
          </span>
          <button
            onClick={handleCompare}
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 text-sm font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg"
          >
            <CheckSquare className="w-4 h-4" /> Compare Candidates
          </button>
        </div>
      </div>
    </div>
  );
}
