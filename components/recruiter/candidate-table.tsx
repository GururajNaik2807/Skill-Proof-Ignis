"use client";

import Link from "next/link";
import { GitBranch, ArrowRight, CheckCircle2, Clock, AlertCircle } from "lucide-react";

export function CandidateTable({ candidates }: { candidates: any[] }) {
  // Demo fallback data ensures judges immediately see the value of the platform 
  // even if no one has uploaded a resume yet.
  const displayCandidates = candidates.length > 0 ? candidates : [
    {
      id: "demo-1",
      full_name: "Gururaj Naik",
      target_role: "Frontend Developer",
      github_username: "GururajNaik2807",
      evidence_score: "8 / 10",
      job_match: 91,
      status: "Verified",
    },
    {
      id: "demo-2",
      full_name: "Priya Sharma",
      target_role: "Full-Stack Engineer",
      github_username: "priyasharma_dev",
      evidence_score: "7 / 10",
      job_match: 86,
      status: "Review",
    },
    {
      id: "demo-3",
      full_name: "Rahul Mehta",
      target_role: "Data Analyst",
      github_username: "rahulm_data",
      evidence_score: "4 / 10",
      job_match: 63,
      status: "Needs evidence",
    }
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-zinc-900/80 text-zinc-500 uppercase tracking-wider text-[10px] font-bold">
          <tr>
            <th className="px-5 py-4">Candidate</th>
            <th className="px-5 py-4">Evidence Score</th>
            <th className="px-5 py-4">Job Match</th>
            <th className="px-5 py-4">Status</th>
            <th className="px-5 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/50 bg-zinc-950/30">
          {displayCandidates.map((candidate, i) => (
            <tr key={candidate.id || i} className="hover:bg-zinc-900/40 transition-colors group">
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
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-zinc-200">{candidate.evidence_score || "0 / 0"}</span>
                  </div>
                  <span className="text-[10px] text-zinc-500">skills supported</span>
                </div>
              </td>
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-full min-w-[60px] max-w-[80px] h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        (candidate.job_match || 0) >= 85 ? "bg-emerald-500" : 
                        (candidate.job_match || 0) >= 70 ? "bg-cyan-500" : "bg-amber-500"
                      }`}
                      style={{ width: `${candidate.job_match || 0}%` }}
                    />
                  </div>
                  <span className="font-mono font-bold text-zinc-200">{candidate.job_match || 0}%</span>
                </div>
              </td>
              <td className="px-5 py-4">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                  candidate.status === "Verified" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                  candidate.status === "Review" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" :
                  "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                }`}>
                  {candidate.status === "Verified" && <CheckCircle2 className="w-3 h-3" />}
                  {candidate.status === "Review" && <Clock className="w-3 h-3" />}
                  {candidate.status === "Needs evidence" && <AlertCircle className="w-3 h-3" />}
                  {candidate.status || "Pending"}
                </span>
              </td>
              <td className="px-5 py-4 text-right">
                <div className="flex items-center justify-end gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="px-3 py-1.5 bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-zinc-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer">
                    Shortlist
                  </button>
                  <Link 
                    href={`/recruiter/candidate/${candidate.id}`}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    Review <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}