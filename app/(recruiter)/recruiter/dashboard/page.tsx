import Link from "next/link";
import { BriefcaseBusiness } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CandidateTable } from "@/components/recruiter/candidate-table";
import { BulkResumeImport } from "@/components/recruiter/bulk-resume-import";

type Candidate = {
  id: string;
  full_name: string | null;
  github_username: string | null;
  avatar_url: string | null;
  bio: string | null;
  github_repositories: { id: string; repo_name: string; primary_language: string | null; has_tests: boolean }[];
  skill_evidence: { id: string; skill_name: string; status: "proven" | "partial" | "claimed"; confidence_score: number }[];
};

export default async function RecruiterDashboardPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("id, full_name, github_username, avatar_url, bio, role, github_repositories (id, repo_name, primary_language, has_tests), skill_evidence (id, skill_name, status, confidence_score)").eq("role", "candidate").order("created_at", { ascending: false });
  const candidates = (data || []) as Candidate[];

  return <div className="space-y-8 page-enter"><header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-7 border-b border-border"><div><p className="text-sm font-semibold text-deep-green mb-3">Evidence review workspace</p><h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-[-0.04em]">Find evidence, not keywords.</h1><p className="text-sm text-muted-text mt-2 max-w-xl">Review candidate claims against the work they have actually published.</p></div><Link href="/recruiter/jobs" className="inline-flex items-center justify-center gap-2 rounded-[9px] bg-deep-green text-white px-4 py-2.5 text-sm font-semibold hover:bg-ink transition-colors"><BriefcaseBusiness className="w-4 h-4" />Create Job</Link></header><BulkResumeImport /><div className="flex items-center justify-between"><p className="text-sm text-muted-text"><span className="font-semibold text-ink">{candidates.length}</span> candidates with public evidence</p><Link href="/recruiter/dashboard" className="text-sm font-semibold text-deep-green">View candidates</Link></div><CandidateTable candidates={candidates} /></div>;
}
