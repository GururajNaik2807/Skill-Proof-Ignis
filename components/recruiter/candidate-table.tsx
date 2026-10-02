"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Filter, GitBranch, Search } from "lucide-react";
import { useMemo, useState } from "react";

type Candidate = {
  id: string;
  full_name: string | null;
  github_username: string | null;
  avatar_url: string | null;
  bio: string | null;
  github_repositories: { id: string; repo_name: string; primary_language: string | null; has_tests: boolean }[];
  skill_evidence: { id: string; skill_name: string; status: "proven" | "partial" | "claimed"; confidence_score: number }[];
};

export function CandidateTable({ candidates }: { candidates: Candidate[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [match, setMatch] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const filtered = useMemo(() => candidates.filter((candidate) => {
    const haystack = [candidate.full_name, candidate.github_username, ...candidate.skill_evidence.map((item) => item.skill_name), ...candidate.github_repositories.map((repo) => repo.repo_name)].filter(Boolean).join(" ").toLowerCase();
    const proven = candidate.skill_evidence.filter((item) => item.status === "proven").length;
    const partial = candidate.skill_evidence.filter((item) => item.status === "partial").length;
    const statusMatch = status === "all" || candidate.skill_evidence.some((item) => item.status === status);
    const matchLabel = proven > 0 && partial === 0 ? "strong" : proven > 0 || partial > 0 ? "partial" : "needs-review";
    return haystack.includes(query.toLowerCase()) && statusMatch && (match === "all" || matchLabel === match);
  }), [candidates, match, query, status]);

  const selectedCandidates = candidates.filter((candidate) => selectedIds.includes(candidate.id));
  const toggleCandidate = (id: string) => setSelectedIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);

  return <div className="space-y-5">
    <div className="flex flex-col lg:flex-row gap-3"><label className="flex-1 flex items-center gap-3 bg-paper border border-border rounded-[9px] px-3.5 py-2.5"><Search className="w-4 h-4 text-muted-text" /><input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Search candidates, skills, or repositories" className="w-full bg-transparent outline-none text-sm placeholder:text-muted-text" /></label><div className="flex flex-wrap gap-2"><label className="flex items-center gap-2 bg-paper border border-border rounded-[9px] px-3 py-2.5 text-sm"><Filter className="w-4 h-4 text-deep-green" /><select value={status} onChange={(event) => setStatus(event.target.value)} className="bg-transparent outline-none"><option value="all">All evidence</option><option value="proven">Proven</option><option value="partial">Partial</option><option value="claimed">Claimed-only</option></select></label><select value={match} onChange={(event) => setMatch(event.target.value)} className="bg-paper border border-border rounded-[9px] px-3 py-2.5 text-sm outline-none"><option value="all">All job match</option><option value="strong">Strong coverage</option><option value="partial">Partial coverage</option><option value="needs-review">Needs review</option></select></div></div>
    <p className="text-sm text-muted-text"><span className="font-semibold text-ink">{filtered.length}</span> candidates shown</p>
    <div className="border-y border-border bg-paper overflow-x-auto"><div className="min-w-230"><div className="grid grid-cols-[32px_minmax(220px,1.4fr)_minmax(190px,1.1fr)_130px_130px_130px_100px] gap-4 px-5 py-3 text-xs text-muted-text border-b border-border"><span>Select</span><span>Candidate</span><span>Relevant skills</span><span>Evidence coverage</span><span>Job match</span><span>Last analyzed</span><span className="text-right">Action</span></div>{filtered.length === 0 ? <div className="px-5 py-16 text-center text-sm text-muted-text">No candidates match these filters.</div> : filtered.map((candidate) => { const proven = candidate.skill_evidence.filter((item) => item.status === "proven").length; const partial = candidate.skill_evidence.filter((item) => item.status === "partial").length; const matchLabel = proven > 0 && partial === 0 ? "Strong" : proven > 0 || partial > 0 ? "Partial" : "Review"; const skills = candidate.skill_evidence.filter((item) => item.status === "proven").slice(0, 3).map((item) => item.skill_name); return <div key={candidate.id} className="grid grid-cols-[32px_minmax(220px,1.4fr)_minmax(190px,1.1fr)_130px_130px_130px_100px] gap-4 items-center px-5 py-5 border-b border-border last:border-0 hover:bg-warm-ivory/60 transition-colors"><input type="checkbox" checked={selectedIds.includes(candidate.id)} onChange={() => toggleCandidate(candidate.id)} aria-label={`Select ${candidate.full_name || "candidate"}`} className="accent-deep-green" /><div className="flex items-center gap-3 min-w-0">{candidate.avatar_url ? <Image src={candidate.avatar_url} alt={candidate.full_name || "Candidate"} width={40} height={40} className="rounded-full border border-border" /> : <div className="w-10 h-10 rounded-full bg-deep-green/10 flex items-center justify-center text-deep-green font-heading font-bold">{(candidate.full_name || "C").charAt(0).toUpperCase()}</div>}<div className="min-w-0"><p className="font-heading font-bold truncate">{candidate.full_name || "Anonymous Engineer"}</p>{candidate.github_username && <p className="text-xs text-muted-text flex items-center gap-1 mt-1"><GitBranch className="w-3 h-3" />@{candidate.github_username}</p>}</div></div><div className="flex flex-wrap gap-1.5">{skills.length ? skills.map((skill) => <span key={skill} className="text-xs bg-soft-surface px-2 py-1 rounded-md">{skill}</span>) : <span className="text-xs text-muted-text">No proven skills</span>}</div><div><p className="font-heading font-bold text-emerald">{proven}/{candidate.skill_evidence.length || 0}</p><p className="text-xs text-muted-text mt-1">{partial} partial</p></div><span className={`text-xs font-semibold ${matchLabel === "Strong" ? "text-status-proven" : matchLabel === "Partial" ? "text-status-partial" : "text-status-claimed"}`}>{matchLabel}</span><span className="text-xs text-muted-text">Profile evidence</span><Link href={`/recruiter/candidate/${candidate.id}`} className="justify-self-end inline-flex items-center gap-1 text-sm font-semibold text-deep-green hover:text-ink">Review <ArrowRight className="w-3.5 h-3.5" /></Link></div>; })}</div></div>
    {selectedCandidates.length >= 2 && <section className="border border-border bg-paper p-5 sm:p-6"><div className="flex items-center justify-between gap-4 mb-5"><div><p className="text-sm font-semibold text-deep-green">Comparison</p><h2 className="font-heading text-xl font-bold mt-1">Evidence side by side</h2><p className="text-sm text-muted-text mt-1">Compare the signals. SkillProof does not make the hiring decision.</p></div><button type="button" onClick={() => setSelectedIds([])} className="text-sm text-muted-text hover:text-ink">Clear selection</button></div><div className="grid md:grid-cols-2 gap-5">{selectedCandidates.map((candidate) => <div key={candidate.id} className="border border-border p-4"><p className="font-heading font-bold">{candidate.full_name || "Anonymous Engineer"}</p><p className="text-xs text-muted-text mt-1">{candidate.github_username ? `@${candidate.github_username}` : "No GitHub username"}</p><div className="mt-4 space-y-2">{candidate.skill_evidence.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 text-sm"><span>{item.skill_name}</span><span className={`text-xs font-semibold ${item.status === "proven" ? "text-status-proven" : item.status === "partial" ? "text-status-partial" : "text-status-claimed"}`}>{item.status === "claimed" ? "Needs review" : item.status === "proven" ? "Supported" : "Partially supported"}</span></div>)}</div></div>)}</div></section>}
  </div>;
}
