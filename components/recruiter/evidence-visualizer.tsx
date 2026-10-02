"use client";

import { useState } from "react";
import { FolderGit2, ExternalLink, ChevronDown, Check, GitCommit, FileCode, CheckCircle2, AlertCircle } from "lucide-react";

export function EvidenceVisualizer({ evidence }: { evidence: any[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!evidence?.length) {
    return <div className="border-y border-zinc-800 py-8 text-sm text-zinc-400">No evidence evaluation has been stored for this candidate.</div>;
  }

  return (
    <div className="border border-zinc-800/80 bg-zinc-900/40 rounded-xl overflow-hidden divide-y divide-zinc-800/50">
      {evidence.map((item) => {
        const isExpanded = expandedId === item.id;
        const isProven = item.status === "proven";
        const isPartial = item.status === "partial";
        
        return (
          <div key={item.id} className="flex flex-col transition-colors">
            {/* Header / Summary row */}
            <div 
              className={`p-5 cursor-pointer hover:bg-zinc-800/50 flex flex-col lg:flex-row lg:items-center gap-5 justify-between ${isExpanded ? 'bg-zinc-800/30' : ''}`}
              onClick={() => setExpandedId(isExpanded ? null : item.id)}
            >
              <div className="flex-1">
                <p className="font-heading text-lg font-bold text-zinc-100 flex items-center gap-2">
                  {item.skill_name}
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-md ${
                    isProven ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : 
                    isPartial ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : 
                    "bg-zinc-800 text-zinc-400 border border-zinc-700"
                  }`}>
                    {item.status === "claimed" ? "CLAIMED-ONLY" : item.status.toUpperCase()}
                  </span>
                </p>
                <p className="text-sm text-zinc-400 mt-1 line-clamp-1">{item.evidence_summary || "No evidence explanation was stored."}</p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Confidence</p>
                  <p className="text-lg font-mono font-bold text-zinc-200">{Math.round(Number(item.confidence_score) * 100)}%</p>
                </div>
                <ChevronDown className={`w-5 h-5 text-zinc-500 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
              </div>
            </div>

            {/* Expanded Drawer / Interactive Inspector */}
            {isExpanded && (
              <div className="p-6 bg-zinc-950 border-t border-zinc-800/50">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Visual Verification Path</h4>
                
                {/* Visual Path Flow */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 relative mb-8">
                  {/* Step 1 */}
                  <div className="flex-1 relative z-10 flex flex-col items-center sm:items-start group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 z-10">
                        <FileCode className="w-4 h-4" />
                      </div>
                      <div className="hidden sm:block h-px bg-zinc-800 flex-1 -ml-4" />
                    </div>
                    <div className="mt-3 text-center sm:text-left pr-4">
                      <p className="text-xs font-bold text-zinc-300">Resume Claim</p>
                      <p className="text-[10px] text-zinc-500 mt-1 font-mono">Extracted by Gemini Flash</p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex-1 relative z-10 flex flex-col items-center sm:items-start">
                    <div className="flex items-center gap-3 w-full">
                      <div className={`w-8 h-8 rounded-full border flex items-center justify-center z-10 transition-colors ${
                        item.matched_repos?.length ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400" : "bg-zinc-800 border-zinc-700 text-zinc-500"
                      }`}>
                        <GitCommit className="w-4 h-4" />
                      </div>
                      <div className="hidden sm:block h-px bg-zinc-800 flex-1 -ml-4" />
                    </div>
                    <div className="mt-3 text-center sm:text-left pr-4">
                      <p className="text-xs font-bold text-zinc-300">Target Repository</p>
                      <p className="text-[10px] text-zinc-500 mt-1 font-mono">
                        {item.matched_repos?.length ? `${item.matched_repos.length} Repositories matched` : "No repositories linked"}
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex-1 relative z-10 flex flex-col items-center sm:items-start">
                    <div className="flex items-center gap-3 w-full">
                      <div className={`w-8 h-8 rounded-full border flex items-center justify-center z-10 transition-colors ${
                        isProven ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-zinc-800 border-zinc-700 text-zinc-500"
                      }`}>
                        {isProven ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      </div>
                    </div>
                    <div className="mt-3 text-center sm:text-left pr-4">
                      <p className="text-xs font-bold text-zinc-300">Signal Detected</p>
                      <p className="text-[10px] text-zinc-500 mt-1 font-mono">
                        {isProven ? "Test suite / AST signal confirmed" : isPartial ? "Config or basic imports only" : "No codebase evidence found"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-zinc-800">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Auditor Report</h4>
                    <p className="text-sm text-zinc-300 leading-relaxed bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                      {item.evidence_summary || "No detailed summary available."}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Matched Codebase Evidence</h4>
                    {item.matched_repos?.length ? (
                      <div className="space-y-3">
                        {item.matched_repos.map((repo: any) => (
                          <div key={repo.url} className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-800 hover:border-emerald-500/30 transition-colors">
                            <a href={repo.url} target="_blank" rel="noreferrer" className="flex items-center justify-between group">
                              <span className="flex items-center gap-2 text-sm font-bold text-zinc-200 group-hover:text-emerald-400 transition-colors">
                                <FolderGit2 className="w-4 h-4 text-emerald-500" />
                                {repo.name}
                              </span>
                              <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover:text-emerald-400" />
                            </a>
                            <div className="mt-2 flex items-center gap-3">
                              <span className="text-[10px] text-zinc-500 font-mono bg-zinc-950 px-2 py-1 rounded border border-zinc-800">AST Match</span>
                              <span className="text-[10px] text-zinc-500 font-mono bg-zinc-950 px-2 py-1 rounded border border-zinc-800">Dependencies</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-zinc-900/50 rounded-lg border border-dashed border-zinc-800 text-sm text-zinc-500 text-center">
                        No specific repository references were recorded for this skill.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
