import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { CandidateTable } from "@/components/recruiter/candidate-table";
import { Plus, Users, ShieldCheck, Star, Briefcase, Search, Filter, ArrowRight } from "lucide-react";

export default async function RecruiterDashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. Fetch active jobs created by this recruiter
  const { data: dbJobs } = await supabase
    .from("jobs")
    .select("id, title, required_skills, status, share_slug, created_at")
    .eq("recruiter_id", user?.id || "")
    .order("created_at", { ascending: false });

  // 2. Fetch real submitted job applications with candidate profiles explicitly using the new FK
  // We use the admin client because candidate profiles might have RLS (is_public=false) preventing recruiters from seeing them
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const jobIds = dbJobs?.map((j) => j.id) || [];
  
  const { data: realApplications, error: appError } = jobIds.length > 0 
    ? await supabaseAdmin
        .from("job_applications")
        .select(`
          id,
          status,
          created_at,
      candidate:profiles!job_applications_candidate_id_fkey (
        id,
        full_name,
        target_role,
        github_username
      ),
      job:jobs!job_applications_job_id_fkey (
        id,
        title,
        required_skills
      )
    `)
    .in("job_id", jobIds)
    .order("created_at", { ascending: false })
  : { data: [], error: null };

  if (appError) console.error("Application Join Error:", appError.message);

  const candidateIds = (realApplications || [])
    .map((app: any) => app.candidate?.id)
    .filter(Boolean);

  // 3. Query real evidence records for these applicants
  const { data: evidenceRows } = candidateIds.length > 0
    ? await supabase
      .from("skill_evidence")
      .select("user_id, skill_name, status")
      .in("user_id", candidateIds)
    : { data: [] };

  // 4. Map strictly from real data
  const candidateRows = (realApplications || [])
    .filter((app: any) => app.candidate) // Exclude applications where profile join failed
    .map((app: any) => {
      const candidateEvidence = (evidenceRows || []).filter(
        (e: any) => e.user_id === app.candidate.id
      );

      const provenCount = candidateEvidence.filter((e: any) => e.status === "proven").length;
      const totalCount = candidateEvidence.length;

      // Calculate Job Match against required skills
      const requiredList: string[] = app.job?.required_skills || [];
      let matchPercent = 0;
      if (requiredList.length > 0) {
        const provenSkillNames = new Set(
          candidateEvidence
            .filter((e: any) => e.status === "proven")
            .map((e: any) => e.skill_name.toLowerCase().trim())
        );
        const matches = requiredList.filter((r) =>
          provenSkillNames.has(r.toLowerCase().trim())
        ).length;
        matchPercent = Math.round((matches / requiredList.length) * 100);
      }

      return {
        id: app.candidate.id,
        application_id: app.id,
        full_name: app.candidate.full_name || "Candidate",
        target_role: app.job?.title || app.candidate.target_role || "Software Engineer",
        github_username: app.candidate.github_username,
        evidence_score: `${provenCount} / ${totalCount}`,
        job_match: matchPercent,
        status: app.status === "shortlisted" ? "Shortlisted" : "Verified",
      };
    });

  // Calculate real metrics
  const totalAnalyzed = candidateRows.length;
  const verifiedCount = candidateRows.filter(
    (c) => parseInt(c.evidence_score.split("/")[0]) > 0
  ).length;
  const strongMatches = candidateRows.filter((c) => c.job_match >= 75).length;
  const shortlistedCount = candidateRows.filter((c) => c.status === "Shortlisted").length;

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-300 py-4">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold font-heading text-zinc-100 tracking-tight">
            Find candidates whose skills are <span className="text-emerald-400">actually proven.</span>
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 mt-3 leading-relaxed">
            SkillProof connects what candidates claim on their resume with cryptographic evidence from the code they've actually built and tested.
          </p>
        </div>
        <Link
          href="/recruiter/jobs/create"
          className="shrink-0 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 text-sm font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create Job Posting
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Applicants Evaluated", value: totalAnalyzed, icon: Users, color: "text-blue-400", border: "border-blue-500/20" },
          { label: "Verified Evidence", value: verifiedCount, icon: ShieldCheck, color: "text-emerald-400", border: "border-emerald-500/20" },
          { label: "Strong Matches", value: strongMatches, icon: Briefcase, color: "text-cyan-400", border: "border-cyan-500/20" },
          { label: "Shortlisted", value: shortlistedCount, icon: Star, color: "text-amber-400", border: "border-amber-500/20" },
        ].map((stat, i) => (
          <div key={i} className={`p-5 rounded-2xl border ${stat.border} bg-zinc-900/50 flex flex-col justify-between`}>
            <div className={`w-8 h-8 rounded-lg ${stat.color.replace('text-', 'bg-').replace('400', '500/10')} ${stat.color} flex items-center justify-center mb-3`}>
              <stat.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-100 font-mono">{stat.value}</p>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-widest">Active Jobs</h2>
          <Link href="/recruiter/jobs" className="text-xs font-semibold text-emerald-400 hover:underline">
            Manage Jobs →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(!dbJobs || dbJobs.length === 0) ? (
            <div className="col-span-1 md:col-span-2 p-8 border border-dashed border-zinc-800 rounded-2xl text-center bg-zinc-900/30">
              <p className="text-sm text-zinc-400">No active jobs. Create a post to start receiving applicants.</p>
            </div>
          ) : (
            dbJobs.slice(0, 2).map((job: any) => (
              <div key={job.id} className="p-5 border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/80 transition-colors rounded-2xl flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-bold text-zinc-100">{job.title}</h3>
                    <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold">ACTIVE</span>
                  </div>
                  <p className="text-xs font-mono text-zinc-400">
                    {job.required_skills?.slice(0, 4).join(" · ")}
                  </p>
                </div>
                <Link href={`/recruiter/jobs`} className="mt-5 text-xs font-bold text-emerald-400 flex items-center gap-1.5 transition-all hover:gap-2">
                  View pipeline <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-end justify-between border-b border-zinc-800 pb-3">
          <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-widest">Candidate Applications ({candidateRows.length})</h2>
        </div>

        <div className="p-1 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-3 border-b border-zinc-800 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search candidates by name, skill, or repository..."
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500/50 rounded-xl pl-9 pr-4 py-2 text-sm text-zinc-200 outline-none transition-all"
              />
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-medium text-zinc-300 flex items-center gap-2 hover:bg-zinc-800 transition-colors">
                <Filter className="w-3.5 h-3.5" /> Evidence
              </button>
            </div>
          </div>

          {candidateRows.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-zinc-500 text-sm">No candidates have applied to your active jobs yet.</p>
            </div>
          ) : (
            <CandidateTable candidates={candidateRows} />
          )}
        </div>
      </div>
    </div>
  );
}