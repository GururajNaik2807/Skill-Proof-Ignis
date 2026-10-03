"use client";

import { useState } from "react";
import Link from "next/link";
import { GitBranch, ExternalLink, Star, ArrowDownUp, Check } from "lucide-react";

export function CompareTable({ initialData, shortlistAction }: { initialData: any[], shortlistAction: (appId: string) => void }) {
  const [data, setData] = useState(initialData);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: "asc" | "desc" } | null>(null);

  const sortData = (key: string) => {
    let direction: "asc" | "desc" = "desc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "desc") {
      direction = "asc";
    }

    const sorted = [...data].sort((a, b) => {
      let valA, valB;
      
      switch(key) {
        case 'match':
          valA = a.app.match_score || 0;
          valB = b.app.match_score || 0;
          break;
        case 'proven':
          valA = a.proven.length;
          valB = b.proven.length;
          break;
        case 'recency':
          valA = new Date(a.lastCommitAt || 0).getTime();
          valB = new Date(b.lastCommitAt || 0).getTime();
          break;
        default:
          return 0;
      }

      if (valA < valB) return direction === "asc" ? -1 : 1;
      if (valA > valB) return direction === "asc" ? 1 : -1;
      return 0;
    });

    setData(sorted);
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: string) => {
    if (sortConfig?.key === key) {
      return <ArrowDownUp className={`w-3 h-3 ${sortConfig.direction === "asc" ? "rotate-180" : ""} transition-transform`} />;
    }
    return <ArrowDownUp className="w-3 h-3 opacity-30" />;
  };

  return (
    <div className="overflow-x-auto bg-zinc-900/40 border border-zinc-800/80 rounded-2xl shadow-xl">
      <table className="w-full text-left text-sm whitespace-nowrap min-w-max">
        <thead className="bg-zinc-950 text-zinc-400 uppercase tracking-wider text-[10px] font-bold border-b border-zinc-800">
          <tr>
            <th className="px-5 py-4 w-48">
              <span className="block mb-2">Live Filters</span>
              <div className="flex flex-col gap-1.5">
                <button onClick={() => sortData('match')} className="flex items-center gap-1.5 text-zinc-300 hover:text-emerald-400 text-[10px] uppercase tracking-wider">
                  {getSortIcon('match')} Match Score
                </button>
                <button onClick={() => sortData('proven')} className="flex items-center gap-1.5 text-zinc-300 hover:text-emerald-400 text-[10px] uppercase tracking-wider">
                  {getSortIcon('proven')} Total Proven
                </button>
                <button onClick={() => sortData('recency')} className="flex items-center gap-1.5 text-zinc-300 hover:text-emerald-400 text-[10px] uppercase tracking-wider">
                  {getSortIcon('recency')} Activity Recency
                </button>
              </div>
            </th>
            {data.map((c) => {
              const isBestMatch = (c.app.match_score || 0) === Math.max(...data.map(d => d.app.match_score || 0)) && (c.app.match_score || 0) > 0;
              return (
                <th key={c.app.id} className={`px-5 py-4 min-w-[280px] border-l border-zinc-800/50 align-top relative ${isBestMatch ? 'bg-cyan-950/20 border-t-2 border-t-cyan-400 border-l-cyan-400/50 border-r-cyan-400/50 shadow-[0_-15px_30px_-15px_rgba(0,229,255,0.15)] z-10' : ''}`}>
                  <div className="flex flex-col">
                    <Link href={`/recruiter/candidate/${c.profile.id}`} className="text-sm font-bold text-zinc-100 hover:text-cyan-400">{c.profile.full_name}</Link>
                    <p className="text-[10px] text-zinc-500 mt-1">{c.proven.length} / {c.proven.length + c.partial.length} skills proven</p>
                    {c.profile.github_username && (
                      <a href={`https://github.com/${c.profile.github_username}`} target="_blank" className="flex items-center gap-1 text-[10px] text-zinc-500 mt-1.5 hover:text-zinc-300">
                        <GitBranch className="w-3 h-3 text-emerald-500/70" /> @{c.profile.github_username} <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/50">
          <tr>
            <td className="px-5 py-4 font-bold text-zinc-400">GitHub Evidence Score %</td>
            {data.map(c => {
              const isBestMatch = (c.app.match_score || 0) === Math.max(...data.map(d => d.app.match_score || 0)) && (c.app.match_score || 0) > 0;
              return (
                <td key={c.app.id} className={`px-5 py-4 border-l border-zinc-800/50 relative ${isBestMatch ? 'bg-cyan-950/20 border-l-cyan-400/50 border-r-cyan-400/50 z-10' : ''}`}>
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-2 font-mono font-bold text-lg ${
                      (c.app.match_score || 0) >= 85 ? "text-cyan-400" : (c.app.match_score || 0) >= 70 ? "text-cyan-400/80" : "text-amber-400"
                    }`}>
                      {c.app.match_score || 0}%
                    </span>
                    {isBestMatch && (
                      <span className="px-2 py-0.5 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold rounded flex items-center gap-1 uppercase tracking-wider">
                        <Star className="w-3 h-3 fill-cyan-400" /> Best Match
                      </span>
                    )}
                  </div>
                </td>
              );
            })}
          </tr>
          <tr>
            <td className="px-5 py-4 font-bold text-zinc-400 whitespace-normal">Parsed Skills & Verification</td>
            {data.map(c => {
              const isBestMatch = (c.app.match_score || 0) === Math.max(...data.map(d => d.app.match_score || 0)) && (c.app.match_score || 0) > 0;
              return (
                <td key={c.app.id} className={`px-5 py-4 border-l border-zinc-800/50 whitespace-normal align-top relative ${isBestMatch ? 'bg-cyan-950/20 border-l-cyan-400/50 border-r-cyan-400/50 z-10' : ''}`}>
                  <div className="flex flex-col gap-3">
                  <div>
                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1"><Check className="w-3 h-3" /> Proven (Code)</p>
                    <div className="flex flex-wrap gap-1">
                      {c.proven.length === 0 ? <span className="text-xs text-zinc-600">None</span> : 
                        c.proven.map((p: any) => (
                          <span key={p.id} className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono rounded">
                            {p.skill_name}
                          </span>
                        ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1"><Check className="w-3 h-3" /> Partial (Config)</p>
                    <div className="flex flex-wrap gap-1">
                      {c.partial.length === 0 ? <span className="text-xs text-zinc-600">None</span> : 
                        c.partial.map((p: any) => (
                          <span key={p.id} className="px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-mono rounded">
                            {p.skill_name}
                          </span>
                        ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1.5">Claimed (Resume)</p>
                    <div className="flex flex-wrap gap-1">
                      {c.claimed.length === 0 ? <span className="text-xs text-zinc-600">None</span> : 
                        c.claimed.map((p: any) => (
                          <span key={p.id} className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 text-zinc-400 text-[10px] font-mono rounded">
                            {p.skill_name}
                          </span>
                        ))}
                    </div>
                  </div>
                </div>
              </td>
            ))}
          </tr>
          <tr>
            <td className="px-5 py-4 font-bold text-zinc-400 whitespace-normal">Top Languages Used</td>
            {data.map(c => {
              const isBestMatch = (c.app.match_score || 0) === Math.max(...data.map(d => d.app.match_score || 0)) && (c.app.match_score || 0) > 0;
              return (
                <td key={c.app.id} className={`px-5 py-4 border-l border-zinc-800/50 align-top relative ${isBestMatch ? 'bg-cyan-950/20 border-l-cyan-400/50 border-r-cyan-400/50 z-10' : ''}`}>
                  <div className="flex flex-wrap gap-1.5">
                    {c.topLanguages?.length ? (
                      c.topLanguages.map((lang: string) => (
                        <span key={lang} className="px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-300 font-mono">
                          {lang}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-zinc-600">No language data</span>
                    )}
                  </div>
                </td>
              );
            })}
          </tr>
          <tr>
            <td className="px-5 py-4 font-bold text-zinc-400 whitespace-normal">Recent Activity & Signals</td>
            {data.map(c => {
              const isBestMatch = (c.app.match_score || 0) === Math.max(...data.map(d => d.app.match_score || 0)) && (c.app.match_score || 0) > 0;
              return (
                <td key={c.app.id} className={`px-5 py-4 border-l border-zinc-800/50 text-xs text-zinc-300 relative ${isBestMatch ? 'bg-cyan-950/20 border-l-cyan-400/50 border-r-cyan-400/50 z-10' : ''}`}>
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Public Repos:</span>
                      <span className="font-mono">{c.repoCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Repos w/ Tests:</span>
                      <span className="font-mono text-emerald-400">{c.reposWithTests}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Recent Activity:</span>
                      <span className="font-mono">{c.lastCommitAt ? new Date(c.lastCommitAt).toLocaleDateString() : "None"}</span>
                    </div>
                  </div>
                </td>
              );
            })}
          </tr>
          <tr>
            <td className="px-5 py-4 font-bold text-zinc-400">Action</td>
            {data.map(c => {
              const isBestMatch = (c.app.match_score || 0) === Math.max(...data.map(d => d.app.match_score || 0)) && (c.app.match_score || 0) > 0;
              return (
                <td key={c.app.id} className={`px-5 py-4 border-l border-zinc-800/50 relative ${isBestMatch ? 'bg-cyan-950/20 border-b-2 border-b-cyan-400 border-l-cyan-400/50 border-r-cyan-400/50 shadow-[0_15px_30px_-15px_rgba(0,229,255,0.15)] z-10' : ''}`}>
                  {c.app.status === "shortlisted" ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 text-cyan-400 font-bold rounded-lg text-xs border border-cyan-500/20 w-full justify-center">
                      <Star className="w-3.5 h-3.5" /> Shortlisted
                    </span>
                  ) : c.app.id ? (
                    <button 
                      onClick={() => {
                        shortlistAction(c.app.id);
                        const updated = data.map(d => d.app.id === c.app.id ? { ...d, app: { ...d.app, status: "shortlisted" } } : d);
                        setData(updated);
                      }} 
                      className={`w-full px-4 py-2 font-bold rounded-lg text-xs transition-colors shadow-sm ${isBestMatch ? 'bg-cyan-500 hover:bg-cyan-600 text-zinc-950' : 'bg-emerald-500 hover:bg-emerald-600 text-zinc-950'}`}
                    >
                      Shortlist Candidate
                    </button>
                  ) : (
                    <span className="text-xs text-zinc-500 w-full text-center block">No Application</span>
                  )}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
