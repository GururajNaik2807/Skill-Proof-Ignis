import { createClient } from "@/lib/supabase/server";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { CompareTable } from "@/components/recruiter/compare-table";

interface PageProps {
  searchParams: Promise<{ ids?: string }>;
}

export default async function CompareCandidatesPage({ searchParams }: PageProps) {
  const { ids: idsParam } = await searchParams;
  if (!idsParam) {
    return (
      <div className="p-8 text-center border border-zinc-800 rounded-xl bg-zinc-900/40">
        <h2 className="text-xl font-bold text-zinc-100">No candidates selected</h2>
        <Link href="/recruiter/candidates" className="text-emerald-400 mt-2 block hover:underline text-sm">Return to pipeline</Link>
      </div>
    );
  }

  const ids = idsParam.split(",");
  const supabase = await createClient();

  const [{ data: profiles }, { data: evidence }, { data: repos }, { data: apps }] = await Promise.all([
    supabase.from("profiles").select("*").in("id", ids),
    supabase.from("skill_evidence").select("*").in("user_id", ids),
    supabase.from("github_repositories").select("*").in("user_id", ids),
    supabase.from("job_applications").select("candidate_id, match_score, status, id").in("candidate_id", ids)
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

  const candidatesData = profiles.map((p: any) => {
    const cApps = apps?.filter((a: any) => a.candidate_id === p.id) || [];
    const topApp = cApps.sort((a: any, b: any) => (b.match_score || 0) - (a.match_score || 0))[0] || {};
    
    const cEvidence = evidence?.filter((e: any) => e.user_id === p.id) || [];
    const proven = cEvidence.filter((e: any) => e.status === "proven");
    const partial = cEvidence.filter((e: any) => e.status === "partial");
    const claimed = cEvidence.filter((e: any) => e.status === "claimed");

    const cRepos = repos?.filter((r: any) => r.user_id === p.id) || [];
    const lastCommitRepo = [...cRepos].sort((a: any, b: any) => new Date(b.last_commit_at || 0).getTime() - new Date(a.last_commit_at || 0).getTime())[0];
    
    const reposWithTests = cRepos.filter(r => r.has_tests).length;

    return {
      profile: p,
      app: topApp,
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
