"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, ArrowRight, BriefcaseBusiness, CheckCircle2, Loader2 } from "lucide-react";

type Comparison = { skill: string; status: "proven" | "partial" | "claimed" | "missing"; evidence_summary: string };
type MatchCandidate = { id: string; full_name: string | null; github_username: string | null; report: { match_percentage: number; provenMatches: Comparison[]; partialMatches: Comparison[]; missingSkills: Comparison[] } };
type MatchResponse = { job: { id: string | null; title: string; company_name: string | null; required_skills: string[]; preferred_skills: string[] }; candidates: MatchCandidate[] };

export default function RecruiterJobsPage() {
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jdText, setJdText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<MatchResponse | null>(null);

  const handleAnalyze = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsAnalyzing(true);
    setError("");
    try {
      const response = await fetch("/api/recruiter/jobs/match", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ job_title: jobTitle, company_name: companyName, jd_text: jdText }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to analyze this job.");
      setResult(data as MatchResponse);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to analyze this job.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return <div className="space-y-8 page-enter"><header className="pb-7 border-b border-border"><Link href="/recruiter/dashboard" className="inline-flex items-center gap-1 text-xs text-muted-text hover:text-ink mb-4"><ArrowLeft className="w-3.5 h-3.5" />Back to candidates</Link><p className="text-sm font-semibold text-deep-green mb-2">Job → required skills → candidates → evidence</p><h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-[-0.04em]">Create Job Match</h1><p className="text-sm text-muted-text mt-2 max-w-xl">Analyze the role once, then compare every candidate against the same requirements.</p></header>
    <form onSubmit={handleAnalyze} className="border border-border bg-paper p-5 sm:p-7 space-y-5"><div className="grid sm:grid-cols-2 gap-4"><label className="space-y-2 text-sm font-semibold">Job title<input required value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} placeholder="e.g. Senior Frontend Engineer" className="w-full mt-2 px-3.5 py-3 bg-warm-ivory border border-border rounded-[9px] outline-none focus:border-deep-green font-normal" /></label><label className="space-y-2 text-sm font-semibold">Company or team<input value={companyName} onChange={(event) => setCompanyName(event.target.value)} placeholder="e.g. Platform team" className="w-full mt-2 px-3.5 py-3 bg-warm-ivory border border-border rounded-[9px] outline-none focus:border-deep-green font-normal" /></label></div><label className="block text-sm font-semibold">Raw job description<textarea required minLength={20} rows={9} value={jdText} onChange={(event) => setJdText(event.target.value)} placeholder="Paste the job description..." className="w-full mt-2 px-3.5 py-3 bg-warm-ivory border border-border rounded-[9px] outline-none focus:border-deep-green font-normal leading-6" /></label>{error && <div className="flex items-center gap-2 text-sm text-status-error"><AlertCircle className="w-4 h-4" />{error}</div>}<div className="flex justify-end"><button type="submit" disabled={isAnalyzing} className="inline-flex items-center gap-2 rounded-[9px] bg-deep-green text-white px-4 py-3 text-sm font-semibold hover:bg-ink disabled:opacity-50">{isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <BriefcaseBusiness className="w-4 h-4" />}{isAnalyzing ? "Analyzing requirements..." : "Analyze Requirements"}</button></div></form>
    {result && <div className="space-y-7"><section className="border-y border-border py-6"><div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"><div><p className="text-sm font-semibold text-deep-green">Requirements extracted</p><h2 className="font-heading text-2xl font-bold mt-1">{result.job.title}</h2>{result.job.company_name && <p className="text-sm text-muted-text mt-1">{result.job.company_name}</p>}</div><p className="text-sm text-muted-text">{result.candidates.length} candidates compared</p></div><div className="grid md:grid-cols-2 gap-6 mt-6"><div><p className="text-xs font-semibold text-muted-text mb-3">Required skills</p><div className="flex flex-wrap gap-2">{result.job.required_skills.map((skill) => <span key={skill} className="text-sm bg-deep-green/10 text-deep-green px-2.5 py-1.5 rounded-md">{skill}</span>)}</div></div><div><p className="text-xs font-semibold text-muted-text mb-3">Preferred skills</p><div className="flex flex-wrap gap-2">{result.job.preferred_skills.length ? result.job.preferred_skills.map((skill) => <span key={skill} className="text-sm bg-soft-surface text-ink px-2.5 py-1.5 rounded-md">{skill}</span>) : <span className="text-sm text-muted-text">None extracted from the description.</span>}</div></div></div></section><section><div className="flex items-end justify-between mb-4"><div><p className="text-sm font-semibold text-deep-green">Candidate comparison</p><h2 className="font-heading text-2xl font-bold mt-1">Evidence-backed matches</h2></div><p className="text-xs text-muted-text">Proven = 1.0 · Partial = 0.5 · Missing = 0</p></div><div className="border-y border-border bg-paper overflow-x-auto"><div className="min-w-212.5">{result.candidates.map((candidate) => <div key={candidate.id} className="grid grid-cols-[minmax(210px,1fr)_110px_minmax(220px,1.2fr)_minmax(220px,1.2fr)_100px] gap-4 items-start px-5 py-5 border-b border-border last:border-0"><div><p className="font-heading font-bold">{candidate.full_name || "Anonymous Engineer"}</p>{candidate.github_username && <p className="text-xs text-muted-text mt-1">@{candidate.github_username}</p>}</div><p className="font-heading text-2xl font-bold text-deep-green">{candidate.report.match_percentage}%</p><div><p className="text-xs font-semibold text-status-proven mb-2">Proven matches</p>{candidate.report.provenMatches.length ? candidate.report.provenMatches.map((item) => <p key={item.skill} className="text-xs text-muted-text flex gap-1.5 mb-1"><CheckCircle2 className="w-3.5 h-3.5 text-status-proven shrink-0" />{item.skill}</p>) : <p className="text-xs text-muted-text">None</p>}</div><div><p className="text-xs font-semibold text-status-claimed mb-2">Gaps and partials</p>{[...candidate.report.partialMatches, ...candidate.report.missingSkills].length ? [...candidate.report.partialMatches, ...candidate.report.missingSkills].map((item) => <p key={item.skill} className="text-xs text-muted-text flex gap-1.5 mb-1"><AlertCircle className="w-3.5 h-3.5 text-status-claimed shrink-0" />{item.skill}</p>) : <p className="text-xs text-muted-text">None</p>}</div><Link href={`/recruiter/candidate/${candidate.id}${result.job.id ? `?jobId=${result.job.id}` : ""}`} className="justify-self-end inline-flex items-center gap-1 text-sm font-semibold text-deep-green hover:text-ink">Review <ArrowRight className="w-3.5 h-3.5" /></Link></div>)}</div></div></section></div>}
  </div>;
}
