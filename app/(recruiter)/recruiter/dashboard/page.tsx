import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import {
  Users,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  GitBranch,
  ArrowRight,
  Filter,
} from "lucide-react";

export default async function RecruiterDashboardPage() {
  const supabase = await createClient();

  // Fetch candidates whose profiles have public access or active repositories
  const { data: candidates } = await supabase
    .from("profiles")
    .select(`
      id,
      full_name,
      github_username,
      avatar_url,
      bio,
      role,
      github_repositories (id, repo_name, primary_language, has_tests),
      skill_evidence (id, skill_name, status, confidence_score)
    `)
    .eq("role", "candidate")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold font-heading">
            Verified Talent Pool
          </h1>
          <p className="text-xs text-muted-text mt-1">
            Candidates with verified GitHub source code, active commits, and unit test presence.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/recruiter/jobs"
            className="px-4 py-2 bg-deep-green text-white text-xs font-medium rounded-lg hover:bg-deep-green/90 transition-colors flex items-center gap-1.5"
          >
            Match Candidates with JD <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Search / Filter Bar */}
      <div className="flex items-center gap-3 p-3 bg-white border border-border rounded-xl shadow-subtle">
        <Search className="w-4 h-4 text-muted-text ml-1" />
        <input
          type="text"
          placeholder="Filter by skill, framework, or candidate name..."
          className="flex-1 bg-transparent text-xs text-ink placeholder:text-muted-text focus:outline-none"
        />
        <button
          type="button"
          className="px-3 py-1.5 bg-soft-surface text-ink text-xs font-medium rounded-lg border border-border flex items-center gap-1.5 hover:bg-border/40 transition-colors"
        >
          <Filter className="w-3.5 h-3.5 text-muted-text" /> Filter
        </button>
      </div>

      {/* Candidate Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {!candidates || candidates.length === 0 ? (
          <div className="col-span-full p-12 bg-white border border-dashed border-border rounded-xl text-center">
            <Users className="w-10 h-10 text-muted-text/50 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-ink">No candidates indexed yet</h3>
            <p className="text-xs text-muted-text max-w-sm mx-auto mt-1">
              Once candidates sign up and complete their GitHub repository scans, their audited profiles will appear here.
            </p>
          </div>
        ) : (
          candidates.map((cand) => {
            const provenCount =
              cand.skill_evidence?.filter((e: any) => e.status === "proven").length || 0;
            const partialCount =
              cand.skill_evidence?.filter((e: any) => e.status === "partial").length || 0;
            const repoCount = cand.github_repositories?.length || 0;

            return (
              <div
                key={cand.id}
                className="bg-white border border-border rounded-xl p-5 shadow-subtle flex flex-col justify-between hover:border-deep-green/40 transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      {cand.avatar_url ? (
                        <Image
                          src={cand.avatar_url}
                          alt={cand.full_name || "Candidate"}
                          width={44}
                          height={44}
                          className="rounded-full border border-border"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-soft-surface border border-border flex items-center justify-center text-deep-green font-bold text-sm">
                          {(cand.full_name || "D").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h3 className="text-sm font-bold text-ink group-hover:text-deep-green transition-colors">
                          {cand.full_name || "Anonymous Engineer"}
                        </h3>
                        {cand.github_username && (
                          <p className="text-[11px] font-mono text-muted-text flex items-center gap-1">
                            <GitBranch className="w-3 h-3" /> @{cand.github_username}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-muted-text line-clamp-2 mb-4 leading-relaxed">
                    {cand.bio || "Full-stack engineer focusing on resilient backend architectures and frontend user experience."}
                  </p>

                  {/* Evidence Tally Chips */}
                  <div className="flex items-center gap-2 mb-4 text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-status-proven/10 text-status-proven font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> {provenCount} Proven
                    </span>
                    <span className="px-2 py-0.5 rounded bg-status-partial/10 text-status-partial font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {partialCount} Partial
                    </span>
                    <span className="text-muted-text ml-auto font-mono text-[10px]">
                      {repoCount} Repos
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <span className="text-[10px] text-muted-text uppercase font-semibold">
                    Code Audited
                  </span>
                  <Link
                    href={`/recruiter/candidate/${cand.id}`}
                    className="text-xs font-semibold text-deep-green hover:underline flex items-center gap-1"
                  >
                    View Audit Report <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}