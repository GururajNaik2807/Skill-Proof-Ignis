import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Check, ExternalLink, FolderGit2, GitBranch, X } from "lucide-react";
import { calculateMatchScore, parseJobDescription } from "@/lib/gemini/job-matcher";

interface PageProps { params: Promise<{ id: string }>; searchParams?: Promise<{ jobId?: string }> }

export default async function CandidateAuditPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { jobId } = (await searchParams) || {};
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, github_username, avatar_url, bio, target_role")
    .eq("id", id)
    .eq("role", "candidate")
    .single();

  if (!profile) notFound();

  const [{ data: repositories }, { data: evidence }] = await Promise.all([
    supabase.from("github_repositories").select("id, repo_name, repo_url, primary_language, languages_breakdown, detected_dependencies, has_tests, has_docker, last_commit_at").eq("user_id", id).order("last_commit_at", { ascending: false }),
    supabase.from("skill_evidence").select("id, skill_name, status, confidence_score, evidence_summary, matched_repos").eq("user_id", id).order("confidence_score", { ascending: false }),
  ]);

  const proven = evidence?.filter((item) => item.status === "proven").length || 0;
  const partial = evidence?.filter((item) => item.status === "partial").length || 0;
  let jobMatch: { title: string; report: ReturnType<typeof calculateMatchScore> } | null = null;
  if (jobId) {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: job } = user ? await supabase.from("job_descriptions").select("role_title, raw_text").eq("id", jobId).eq("user_id", user.id).single() : { data: null };
    if (job) {
      const parsedJob = await parseJobDescription(job.raw_text);
      jobMatch = { title: job.role_title, report: calculateMatchScore(parsedJob, (evidence || []) as { skill_name: string; status: "proven" | "partial" | "claimed"; confidence_score: number; evidence_summary: string | null }[]) };
    }
  }

  return (
    <div className="space-y-8 page-enter">
      <Link href="/recruiter/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-text hover:text-ink"><ArrowLeft className="w-4 h-4" />Back to candidates</Link>
      <header className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-7 border-b border-border">
        <div className="flex items-start gap-4">
          {profile.avatar_url ? <Image src={profile.avatar_url} alt={profile.full_name || "Candidate"} width={64} height={64} className="rounded-full border border-border" /> : <div className="w-16 h-16 rounded-full bg-deep-green/10 flex items-center justify-center text-deep-green font-heading text-2xl font-bold">{(profile.full_name || "C").charAt(0).toUpperCase()}</div>}
          <div>
            <p className="text-sm font-semibold text-deep-green mb-2">Candidate evidence profile</p>
            <h1 className="font-heading text-3xl font-bold tracking-[-0.04em]">{profile.full_name || "Anonymous Engineer"}</h1>
            {profile.target_role && <p className="text-sm text-muted-text mt-1">{profile.target_role}</p>}
            {profile.github_username && <a href={`https://github.com/${profile.github_username}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-deep-green mt-2"><GitBranch className="w-4 h-4" />@{profile.github_username}<ExternalLink className="w-3 h-3" /></a>}
            <p className="text-sm text-muted-text mt-3 max-w-xl">{profile.bio || "No resume summary provided."}</p>
          </div>
        </div>
        <div className="flex gap-6"><div><p className="text-xs text-muted-text">Analyzed skills</p><p className="font-heading text-2xl font-bold mt-1">{evidence?.length || 0}</p></div><div><p className="text-xs text-muted-text">Proven</p><p className="font-heading text-2xl font-bold mt-1 text-status-proven">{proven}</p></div><div><p className="text-xs text-muted-text">Partial</p><p className="font-heading text-2xl font-bold mt-1 text-status-partial">{partial}</p></div></div>
      </header>

      <section className="border border-border bg-paper p-5 sm:p-7"><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div><p className="text-sm font-semibold text-deep-green">Job-specific match</p>{jobMatch ? <><h2 className="font-heading text-xl font-bold mt-1">{jobMatch.title} · {jobMatch.report.match_percentage}%</h2><p className="text-sm text-muted-text mt-1">Proven matches, partial evidence, and missing requirements are shown below.</p></> : <><h2 className="font-heading text-xl font-bold mt-1">No job selected</h2><p className="text-sm text-muted-text mt-1">Create a job match to compare this candidate against required skills.</p></>}</div><Link href="/recruiter/jobs" className="inline-flex items-center gap-2 text-sm font-semibold text-deep-green">Create Job Match <ExternalLink className="w-4 h-4" /></Link></div>{jobMatch && <div className="grid md:grid-cols-3 gap-4 mt-6"><div><p className="text-xs font-semibold text-status-proven">Proven matches</p>{jobMatch.report.provenMatches.map((item) => <p key={item.skill} className="text-sm mt-2">{item.skill}</p>)}</div><div><p className="text-xs font-semibold text-status-partial">Partial matches</p>{jobMatch.report.partialMatches.map((item) => <p key={item.skill} className="text-sm mt-2">{item.skill}</p>)}</div><div><p className="text-xs font-semibold text-status-claimed">Missing or claimed</p>{jobMatch.report.missingSkills.map((item) => <p key={item.skill} className="text-sm mt-2">{item.skill}</p>)}</div></div>}</section>

      <section>
        <div className="mb-4"><p className="text-sm font-semibold text-deep-green">Required skill evidence</p><h2 className="font-heading text-2xl font-bold mt-1">What the public work supports</h2></div>
        {!evidence?.length ? <div className="border-y border-border py-8 text-sm text-muted-text">No evidence evaluation has been stored for this candidate.</div> : <div className="border-y border-border bg-paper divide-y divide-border">{evidence.map((item) => <div key={item.id} className="p-5 grid lg:grid-cols-[160px_1fr_auto] gap-5 items-start"><div><p className="font-heading text-lg font-bold">{item.skill_name}</p><span className={`inline-block mt-2 text-[10px] font-bold tracking-wide px-2 py-1 rounded-md ${item.status === "proven" ? "bg-status-proven/10 text-status-proven" : item.status === "partial" ? "bg-status-partial/10 text-status-partial" : "bg-status-claimed/10 text-status-claimed"}`}>{item.status === "claimed" ? "CLAIMED-ONLY" : item.status.toUpperCase()}</span></div><div><p className="text-xs font-semibold text-muted-text">Candidate evidence</p><p className="text-sm text-muted-text leading-6 mt-2">{item.evidence_summary || "No evidence explanation was stored."}</p>{item.matched_repos?.length ? <div className="flex flex-wrap gap-2 mt-3">{item.matched_repos.map((repo: { name: string; url: string }) => <a key={repo.url} href={repo.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-deep-green border border-border px-2.5 py-1.5 rounded-md hover:bg-warm-ivory"><FolderGit2 className="w-3.5 h-3.5" />{repo.name}<ExternalLink className="w-3 h-3" /></a>)}</div> : null}</div><p className="text-sm font-semibold text-muted-text">{Math.round(Number(item.confidence_score) * 100)}%</p></div>)}</div>}
      </section>

      <section>
        <div className="mb-4"><p className="text-sm font-semibold text-deep-green">Code and evidence audit</p><h2 className="font-heading text-2xl font-bold mt-1">Scanned repositories</h2><p className="text-sm text-muted-text mt-1">Only signals recorded by the GitHub scanner are shown here.</p></div>
        {!repositories?.length ? <div className="border-y border-border py-8 text-sm text-muted-text">No repositories have been scanned for this candidate.</div> : <div className="border-y border-border bg-paper divide-y divide-border">{repositories.map((repo) => { const languages = Object.keys((repo.languages_breakdown as Record<string, number> | null) || {}); const dependencies = (repo.detected_dependencies as string[] | null) || []; return <div key={repo.id} className="p-5"><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><a href={repo.repo_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 font-heading font-bold hover:text-deep-green">{repo.repo_name}<ExternalLink className="w-3.5 h-3.5" /></a><p className="text-xs text-muted-text mt-1">{repo.last_commit_at ? `Last activity ${new Date(repo.last_commit_at).toLocaleDateString()}` : "Activity unavailable"}</p></div><div className="flex items-center gap-3 text-xs text-muted-text"><span>{repo.has_tests ? <Check className="inline w-3.5 h-3.5 text-status-proven" /> : <X className="inline w-3.5 h-3.5 text-status-claimed" />} Tests</span><span>{repo.has_docker ? <Check className="inline w-3.5 h-3.5 text-status-proven" /> : <X className="inline w-3.5 h-3.5 text-status-claimed" />} Docker</span></div></div><div className="grid md:grid-cols-3 gap-4 mt-4 text-sm"><div><p className="text-xs text-muted-text mb-2">Languages</p><p>{languages.length ? languages.join(" · ") : "No language data"}</p></div><div><p className="text-xs text-muted-text mb-2">Dependencies</p><p>{dependencies.length ? dependencies.slice(0, 8).join(" · ") : "No dependencies detected"}</p></div><div><p className="text-xs text-muted-text mb-2">Scanner signals</p><p>{repo.has_tests ? "Tests detected" : "No tests detected"} · {repo.has_docker ? "Docker detected" : "No Docker detected"}</p></div></div></div>; })}</div>}
      </section>
    </div>
  );
}
