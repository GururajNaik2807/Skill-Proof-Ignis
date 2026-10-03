import { createClient } from "@/lib/supabase/server";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { CompareTable } from "@/components/recruiter/compare-table";
import { calculateMatchScore, ParsedJobRequirement, CandidateSkillInput } from "@/lib/shared/match-calculator";

interface PageProps {
  searchParams: Promise<{ ids?: string }>;
}

export default async function CompareCandidatesPage({ searchParams }: PageProps) {
  const { ids: idsParam } = await searchParams;
  if (!idsParam) {
    return (
      <div className="p-8 text-center border border-zinc-800 rounded-xl bg-zinc-900/40 mt-10">
        <h2 className="text-xl font-bold text-zinc-100 mb-2">No candidates selected</h2>
        <p className="text-zinc-400 text-sm mb-6">Select candidates from the Candidates page to compare them.</p>
        <Link href="/recruiter/candidates" className="inline-flex items-center justify-center px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-sm font-semibold rounded-lg transition-colors">
          Back to Candidates
        </Link>
      </div>
    );
  }

  const ids = idsParam.split(",");
  
  if (ids.length < 2) {
    return (
      <div className="p-8 text-center border border-zinc-800 rounded-xl bg-zinc-900/40 mt-10">
        <h2 className="text-xl font-bold text-zinc-100 mb-2">Not enough candidates</h2>
        <p className="text-zinc-400 text-sm mb-6">Select at least two candidates from the Candidates page to compare them.</p>
        <Link href="/recruiter/candidates" className="inline-flex items-center justify-center px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-sm font-semibold rounded-lg transition-colors">
          Back to Candidates
        </Link>
      </div>
    );
  }

  const supabase = await createClient();

  // 1. Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return (
      <div className="p-8 text-center border border-zinc-800 rounded-xl bg-zinc-900/40">
        <h2 className="text-xl font-bold text-zinc-100">Unauthorized</h2>
      </div>
    );
  }

  // 2. Get recruiter's jobs to enforce authorization
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, title, required_skills")
    .eq("recruiter_id", user.id);

  if (!jobs || jobs.length === 0) {
    return (
      <div className="p-8 text-center border border-zinc-800 rounded-xl bg-zinc-900/40">
        <h2 className="text-xl font-bold text-zinc-100">No jobs found</h2>
      </div>
    );
  }

  const jobIds = jobs.map((j: any) => j.id);
  const jobMap = new Map(jobs.map((j: any) => [j.id, j]));

  // 3. Fetch applications ONLY for these given applications AND jobs owned by recruiter
  const { data: apps } = await supabase
    .from("job_applications")
    .select("candidate_id, status, id, created_at, job_id")
    .in("id", ids)
    .in("job_id", jobIds);

  if (!apps || apps.length === 0) {
    return (
      <div className="p-8 text-center border border-zinc-800 rounded-xl bg-zinc-900/40">
        <h2 className="text-xl font-bold text-zinc-100">Candidates not found or access denied</h2>
        <Link href="/recruiter/candidates" className="text-emerald-400 mt-2 block hover:underline text-sm">Return to pipeline</Link>
      </div>
    );
  }

  const validCandidateIds = apps.map((a: any) => a.candidate_id);

  const [{ data: profiles }, { data: evidence }, { data: repos }] = await Promise.all([
    supabase.from("profiles").select("*").in("id", validCandidateIds),
    supabase.from("skill_evidence").select("*").in("user_id", validCandidateIds),
    supabase.from("github_repositories").select("*").in("user_id", validCandidateIds)
  ]);

  if (!profiles || profiles.length === 0) {
    return (
      <div className="p-8 text-center border border-zinc-800 rounded-xl bg-zinc-900/40">
        <h2 className="text-xl font-bold text-zinc-100">Candidates not found</h2>
        <Link href="/recruiter/candidates" className="text-emerald-400 mt-2 block hover:underline text-sm">Return to pipeline</Link>
      </div>
    );
  }

  const handleShortlist = async (appId: string) => {
    "use server";
    if (!appId) return;
    const sb = await createClient();
    await sb.from("job_applications").update({ status: "shortlisted" }).eq("id", appId);
    revalidatePath("/recruiter/compare");
  };

  const candidatesData = apps.map((app: any) => {
    const p = profiles?.find((p: any) => p.id === app.candidate_id);
    
    const cEvidence = evidence?.filter((e: any) => e.user_id === app.candidate_id) || [];
    const proven = cEvidence.filter((e: any) => e.status === "proven");
    const partial = cEvidence.filter((e: any) => e.status === "partial");
    const claimed = cEvidence.filter((e: any) => e.status === "claimed");

    // Calculate real match score
    let matchScore = 0;
    if (app.job_id) {
      const job = jobMap.get(app.job_id);
      if (job) {
        const reqList: string[] = job.required_skills || [];
        const requirements: ParsedJobRequirement[] = reqList.map(skill_name => ({
          skill_name,
          importance: "required" as const
        }));

        const candidateSkills: CandidateSkillInput[] = cEvidence.map((e: any) => ({
          skill_name: e.skill_name,
          status: e.status
        }));

        matchScore = calculateMatchScore(requirements, candidateSkills).overall_score;
      }
    }

    // Attach to app for the UI
    const enrichedApp = { ...app, match_score: matchScore, job_title: jobMap.get(app.job_id)?.title };

    const cRepos = repos?.filter((r: any) => r.user_id === app.candidate_id) || [];
    const lastCommitRepo = [...cRepos].sort((a: any, b: any) => new Date(b.last_commit_at || 0).getTime() - new Date(a.last_commit_at || 0).getTime())[0];
    
    const reposWithTests = cRepos.filter(r => r.has_tests).length;

    return {
      id: app.id,
      profile: p || {},
      app: enrichedApp,
      proven,
      partial,
      claimed,
      lastCommitAt: lastCommitRepo?.last_commit_at,
      repoCount: cRepos.length,
      reposWithTests
    };
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300 py-4 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-2">
        <Link href="/recruiter/candidates" className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-400 transition-colors shadow-sm">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold font-heading text-zinc-100">Compare Candidates</h1>
          <p className="text-sm text-zinc-400 mt-0.5">Evaluate technical evidence across {candidatesData.length} candidate{candidatesData.length !== 1 && "s"}</p>
        </div>
      </div>

      <CompareTable initialData={candidatesData} shortlistAction={handleShortlist} />
    </div>
  );
}
