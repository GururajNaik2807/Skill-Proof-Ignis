import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Check, ExternalLink, GitBranch, X, Star } from "lucide-react";
import { revalidatePath } from "next/cache";
import { CandidateDualColumn } from "@/components/recruiter/candidate-dual-column";
import { calculateMatchScore, ParsedJobRequirement, CandidateSkillInput } from "@/lib/shared/match-calculator";

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

  const [{ data: repositories }, { data: evidence }, { data: resumeSkills }] = await Promise.all([
    supabase.from("github_repositories").select("id, repo_name, repo_url, primary_language, languages_breakdown, detected_dependencies, has_tests, has_docker, last_commit_at").eq("user_id", id).order("last_commit_at", { ascending: false }),
    supabase.from("skill_evidence").select("id, skill_name, status, confidence_score, evidence_summary, matched_repos").eq("user_id", id).order("confidence_score", { ascending: false }),
    supabase.from("resume_skills").select("*").eq("user_id", id),
  ]);

  const proven = evidence?.filter((item) => item.status === "proven").length || 0;
  const partial = evidence?.filter((item) => item.status === "partial").length || 0;

  let jobMatch: any = null;
  let application: any = null;
  
  if (jobId) {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: job } = await supabase
      .from("jobs")
      .select("id, title, required_skills")
      .eq("id", jobId)
      .eq("recruiter_id", user?.id || "")
      .single();
      
    if (job) {
      const requiredList = job.required_skills || [];
      const requirements: ParsedJobRequirement[] = requiredList.map((skill_name: string) => ({
        skill_name,
        importance: "required" as const
      }));

      const candidateSkillsInput: CandidateSkillInput[] = (evidence || []).map((e: any) => ({
        skill_name: e.skill_name,
        status: e.status
      }));

      const matchReport = calculateMatchScore(requirements, candidateSkillsInput);
      
      jobMatch = {
        title: job.title,
        report: {
          match_percentage: matchReport.overall_score,
          provenMatches: matchReport.matching_skills.map(s => ({ skill: s })),
          partialMatches: matchReport.partial_skills.map(s => ({ skill: s })),
          missingSkills: matchReport.missing_skills.map(s => ({ skill: s }))
        }
      };

      const { data: appData } = await supabase
        .from("job_applications")
        .select("id, status")
        .eq("job_id", jobId)
        .eq("candidate_id", id)
        .maybeSingle();
      
      if (appData) application = appData;
    }
  }

  async function handleShortlist() {
    "use server";
    if (!application) return;
    const sb = await createClient();
    await sb.from("job_applications").update({ status: "shortlisted" }).eq("id", application.id);
    revalidatePath(`/recruiter/candidate/${id}`);
  }

  return (
    <div className="space-y-8 page-enter">
      <Link href="/recruiter/dashboard" className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-100 transition-colors"><ArrowLeft className="w-4 h-4" />Back to candidates</Link>
      <header className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-7 border-b border-zinc-800">
        <div className="flex items-start gap-4">
          {profile.avatar_url ? <Image src={profile.avatar_url} alt={profile.full_name || "Candidate"} width={64} height={64} className="rounded-full border border-zinc-700" /> : <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-heading text-2xl font-bold">{(profile.full_name || "C").charAt(0).toUpperCase()}</div>}
          <div>
            <p className="text-sm font-semibold text-emerald-400 mb-2">Candidate evidence profile</p>
            <h1 className="font-heading text-3xl font-bold tracking-[-0.04em] text-zinc-100">{profile.full_name || "Anonymous Engineer"}</h1>
            {profile.target_role && <p className="text-sm text-zinc-400 mt-1">{profile.target_role}</p>}
            {profile.github_username && <a href={`https://github.com/${profile.github_username}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-emerald-400 mt-2"><GitBranch className="w-4 h-4" />@{profile.github_username}<ExternalLink className="w-3 h-3" /></a>}
            <p className="text-sm text-zinc-400 mt-3 max-w-xl">{profile.bio || "No resume summary provided."}</p>
          </div>
        </div>
        <div className="flex gap-6 items-center">
          <div><p className="text-xs text-zinc-500">Analyzed skills</p><p className="font-heading text-2xl font-bold mt-1 text-zinc-200">{evidence?.length || 0}</p></div>
          <div><p className="text-xs text-zinc-500">Proven</p><p className="font-heading text-2xl font-bold mt-1 text-emerald-400">{proven}</p></div>
          <div><p className="text-xs text-zinc-500">Partial</p><p className="font-heading text-2xl font-bold mt-1 text-amber-400">{partial}</p></div>
          {application && (
            <div className="ml-4 pl-4 border-l border-zinc-800">
              {application.status === "shortlisted" ? (
                <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500/10 text-emerald-400 font-bold rounded-lg text-sm border border-emerald-500/20">
                  <Star className="w-4 h-4" /> Shortlisted
                </span>
              ) : (
                <form action={handleShortlist}>
                  <button type="submit" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold rounded-lg text-sm transition-colors shadow-lg cursor-pointer">
                    Shortlist Candidate
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </header>

      <section className="border border-zinc-800 bg-zinc-900/50 p-5 sm:p-7 rounded-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-emerald-400">Job-specific match</p>
            {jobMatch ? (
              <>
                <h2 className="font-heading text-xl font-bold mt-1 text-zinc-100">{jobMatch.title} · {jobMatch.report.match_percentage}%</h2>
                <p className="text-sm text-zinc-400 mt-1">Proven matches, partial evidence, and missing requirements are shown below.</p>
              </>
            ) : (
              <>
                <h2 className="font-heading text-xl font-bold mt-1 text-zinc-100">No job selected</h2>
                <p className="text-sm text-zinc-400 mt-1">Select a job from the dashboard to compare this candidate.</p>
              </>
            )}
          </div>
        </div>
        {jobMatch && (
          <div className="grid md:grid-cols-3 gap-4 mt-6">
            <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800">
              <p className="text-xs font-semibold text-emerald-400">Proven matches</p>
              {jobMatch.report.provenMatches.map((item: any) => <p key={item.skill} className="text-sm mt-2 text-zinc-300">{item.skill}</p>)}
            </div>
            <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800">
              <p className="text-xs font-semibold text-amber-400">Partial matches</p>
              {jobMatch.report.partialMatches.map((item: any) => <p key={item.skill} className="text-sm mt-2 text-zinc-300">{item.skill}</p>)}
            </div>
            <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800">
              <p className="text-xs font-semibold text-zinc-500">Missing or claimed</p>
              {jobMatch.report.missingSkills.map((item: any) => <p key={item.skill} className="text-sm mt-2 text-zinc-400">{item.skill}</p>)}
            </div>
          </div>
        )}
      </section>

      <section>
        <div className="mb-4"><p className="text-sm font-semibold text-emerald-400">Required skill evidence</p><h2 className="font-heading text-2xl font-bold mt-1 text-zinc-100">Code mapped to Resume</h2></div>
        <CandidateDualColumn 
          resumeSkills={resumeSkills || []} 
          evidence={evidence || []} 
          repositories={repositories || []} 
          candidateId={id} 
        />
      </section>

      <section>
        <div className="mb-4"><p className="text-sm font-semibold text-emerald-400">Code and evidence audit</p><h2 className="font-heading text-2xl font-bold mt-1 text-zinc-100">Scanned repositories</h2><p className="text-sm text-zinc-400 mt-1">Only signals recorded by the GitHub scanner are shown here.</p></div>
        {!repositories?.length ? <div className="border-y border-zinc-800 py-8 text-sm text-zinc-400">No repositories have been scanned for this candidate.</div> : <div className="border-y border-zinc-800 bg-zinc-900/40 divide-y divide-zinc-800/50">{repositories.map((repo) => { const languages = Object.keys((repo.languages_breakdown as Record<string, number> | null) || {}); const dependencies = (repo.detected_dependencies as string[] | null) || []; return <div key={repo.id} className="p-5"><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><a href={repo.repo_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 font-heading font-bold text-zinc-200 hover:text-emerald-400">{repo.repo_name}<ExternalLink className="w-3.5 h-3.5" /></a><p className="text-xs text-zinc-500 mt-1">{repo.last_commit_at ? `Last activity ${new Date(repo.last_commit_at).toLocaleDateString()}` : "Activity unavailable"}</p></div><div className="flex items-center gap-3 text-xs text-zinc-400"><span>{repo.has_tests ? <Check className="inline w-3.5 h-3.5 text-emerald-400" /> : <X className="inline w-3.5 h-3.5 text-zinc-600" />} Tests</span><span>{repo.has_docker ? <Check className="inline w-3.5 h-3.5 text-emerald-400" /> : <X className="inline w-3.5 h-3.5 text-zinc-600" />} Docker</span></div></div><div className="grid md:grid-cols-3 gap-4 mt-4 text-sm"><div><p className="text-xs text-zinc-500 mb-2">Languages</p><p className="text-zinc-300">{languages.length ? languages.join(" · ") : "No language data"}</p></div><div><p className="text-xs text-zinc-500 mb-2">Dependencies</p><p className="text-zinc-300">{dependencies.length ? dependencies.slice(0, 8).join(" · ") : "No dependencies detected"}</p></div><div><p className="text-xs text-zinc-500 mb-2">Scanner signals</p><p className="text-zinc-300">{repo.has_tests ? "Tests detected" : "No tests detected"} · {repo.has_docker ? "Docker detected" : "No Docker detected"}</p></div></div></div>; })}</div>}
      </section>
    </div>
  );
}
