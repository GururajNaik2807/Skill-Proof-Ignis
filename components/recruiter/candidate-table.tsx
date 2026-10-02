"use client";

import Link from "next/link";
import { GitBranch, ArrowRight, CheckCircle2, Clock, AlertCircle, TestTube, FileCode2 } from "lucide-react";

export function CandidateTable({ candidates }: { candidates: any[] }) {
  if (!candidates || candidates.length === 0) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center bg-zinc-950/50">
        <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
          <AlertCircle className="w-5 h-5 text-zinc-500" />
        </div>
        <h3 className="text-sm font-bold text-zinc-200">No candidates in pipeline</h3>
        <p className="text-xs text-zinc-500 mt-1 mb-5">Share your active job links to start receiving verified applications.</p>
        <Link href="/recruiter/jobs/create" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 text-xs font-bold rounded-lg transition-colors">
          Post a New Job
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-zinc-900/80 text-zinc-500 uppercase tracking-wider text-[10px] font-bold border-b border-zinc-800/80">
          <tr>
            <th className="px-5 py-4">Candidate</th>
            <th className="px-5 py-4">Evidence Score</th>
            <th className="px-5 py-4">Job Match</th>
            <th className="px-5 py-4">Status</th>
            <th className="px-5 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/50 bg-zinc-950/30">
          {candidates.map((candidate, i) => {
            // Check if they have verified signals to show badges
            const scoreParts = (candidate.evidence_score || "").split("/");
            const provenCount = parseInt(scoreParts[0] || "0", 10);
            
            return (
              <tr key={candidate.application_id || candidate.id || i} className="hover:bg-zinc-900/40 transition-colors group">
                <td className="px-5 py-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-zinc-100 text-sm">{candidate.full_name || "Unknown Candidate"}</span>
                    <span className="text-xs text-zinc-500 mt-0.5">{candidate.target_role || "Software Engineer"}</span>
                    {candidate.github_username && (
                      <span className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 mt-1.5">
                        <GitBranch className="w-3 h-3 text-emerald-500" /> @{candidate.github_username}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-col gap-2">
                    <span className="font-mono font-bold text-zinc-200">{candidate.evidence_score || "0/0 Proven Skills"}</span>
                    {provenCount > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 bg-zinc-900 border border-zinc-800 text-[9px] text-zinc-400 px-1.5 py-0.5 rounded-sm">
                          <FileCode2 className="w-2.5 h-2.5 text-emerald-500" /> Verified Commits
                        </span>
                        {provenCount > 2 && (
                          <span className="inline-flex items-center gap-1 bg-zinc-900 border border-zinc-800 text-[9px] text-zinc-400 px-1.5 py-0.5 rounded-sm">
                            <TestTube className="w-2.5 h-2.5 text-cyan-500" /> Test Coverage Found
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-col gap-1.5">
                    <span className="font-bold text-zinc-200 text-xs">{candidate.job_match || 0}% Skill Match</span>
                    <div className="w-full min-w-[80px] max-w-[120px] h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          (candidate.job_match || 0) >= 85 ? "bg-emerald-500" : 
                          (candidate.job_match || 0) >= 70 ? "bg-cyan-500" : "bg-amber-500"
                        }`}
                        style={{ width: `${candidate.job_match || 0}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                    candidate.status === "Shortlisted" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                    candidate.status === "Reviewing" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" :
                    "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  }`}>
                    {candidate.status === "Shortlisted" && <CheckCircle2 className="w-3 h-3" />}
                    {candidate.status === "Reviewing" && <Clock className="w-3 h-3" />}
                    {candidate.status || "Pending"}
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link 
                      href={`/recruiter/candidate/${candidate.id}`}
                      className="px-4 py-2 bg-zinc-900 border border-zinc-700 hover:border-emerald-500 hover:text-emerald-400 text-zinc-300 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      View Evidence <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}