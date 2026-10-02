import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FolderGit2,
  ExternalLink,
  Check,
  X,
  Share2,
  ArrowLeft,
} from "lucide-react";

export default async function EvidenceMatrixPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id || "";

  // 1. Fetch Profile & Evidence Records
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  const { data: evidence } = await supabase
    .from("skill_evidence")
    .select("*")
    .eq("user_id", userId)
    .order("confidence_score", { ascending: false });

  const proven = evidence?.filter((e) => e.status === "proven") || [];
  const partial = evidence?.filter((e) => e.status === "partial") || [];
  const claimed = evidence?.filter((e) => e.status === "claimed") || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/dashboard"
              className="text-xs text-muted-text hover:text-ink flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-ink flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-deep-green" />
            Evidence Matrix
          </h1>
          <p className="text-xs sm:text-sm text-muted-text mt-1">
            Deterministic audit trail connecting claimed technical skills to physical GitHub repositories.
          </p>
        </div>

        {profile?.share_slug && (
          <Link
            href={`/v/${profile.share_slug}`}
            target="_blank"
            className="px-4 py-2 border border-border bg-white text-xs font-semibold rounded-lg hover:bg-soft-surface transition-colors flex items-center gap-1.5 shadow-subtle w-fit"
          >
            <Share2 className="w-3.5 h-3.5 text-deep-green" />
            View Public Proof Link
          </Link>
        )}
      </div>

      {/* Tiers Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-status-proven/5 border border-status-proven/20 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-status-proven/10 flex items-center justify-center text-status-proven">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-status-proven uppercase">Proven Tier</p>
              <p className="text-lg font-bold text-ink">{proven.length} Skills</p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-muted-text">Tested Code</span>
        </div>

        <div className="p-4 bg-status-partial/5 border border-status-partial/20 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-status-partial/10 flex items-center justify-center text-status-partial">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-status-partial uppercase">Partial Tier</p>
              <p className="text-lg font-bold text-ink">{partial.length} Skills</p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-muted-text">Config Only / Inactive</span>
        </div>

        <div className="p-4 bg-status-claimed/5 border border-status-claimed/20 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-status-claimed/10 flex items-center justify-center text-status-claimed">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-status-claimed uppercase">Claimed Tier</p>
              <p className="text-lg font-bold text-ink">{claimed.length} Skills</p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-muted-text">0 Code Found</span>
        </div>
      </div>

      {/* Evidence Cards by Tier */}
      <div className="space-y-6">
        {!evidence || evidence.length === 0 ? (
          <div className="p-12 bg-white border border-dashed border-border rounded-xl text-center">
            <ShieldCheck className="w-10 h-10 text-muted-text/40 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-ink">No skills evaluated yet</h3>
            <p className="text-xs text-muted-text max-w-sm mx-auto mt-1">
              Go to your Verification Hub and click &ldquo;Evaluate Evidence&rdquo; to cross-reference your resume against your GitHub profile.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 mt-4 text-xs font-semibold text-deep-green hover:underline"
            >
              Back to Dashboard
            </Link>
          </div>
        ) : (
          evidence.map((item) => {
            const matchedRepos = (item.matched_repos as any[]) || [];

            return (
              <div
                key={item.id}
                className="bg-white border border-border rounded-xl p-6 shadow-subtle space-y-4"
              >
                {/* Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
                  <div className="flex items-center gap-3">
                    <span className="text-base font-bold text-ink">{item.skill_name}</span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        item.status === "proven"
                          ? "bg-status-proven/10 text-status-proven"
                          : item.status === "partial"
                          ? "bg-status-partial/10 text-status-partial"
                          : "bg-status-claimed/10 text-status-claimed"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-text">Confidence Metric:</span>
                    <span className="font-mono font-bold text-xs text-ink">
                      {Math.round(Number(item.confidence_score) * 100)}%
                    </span>
                  </div>
                </div>

                {/* Evidence Summary Text */}
                <p className="text-xs text-muted-text leading-relaxed">
                  {item.evidence_summary}
                </p>

                {/* Matched Repositories Sub-Table */}
                {matchedRepos.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-[11px] font-semibold text-ink uppercase tracking-wider block">
                      Matched Source Repositories ({matchedRepos.length})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {matchedRepos.map((repo: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-3 bg-soft-surface/50 border border-border rounded-lg text-xs flex items-center justify-between gap-3"
                        >
                          <div className="truncate">
                            <a
                              href={repo.url}
                              target="_blank"
                              rel="noreferrer"
                              className="font-semibold text-ink hover:text-deep-green flex items-center gap-1.5 truncate group"
                            >
                              <FolderGit2 className="w-3.5 h-3.5 text-deep-green shrink-0" />
                              <span className="truncate">{repo.name}</span>
                              <ExternalLink className="w-3 h-3 opacity-40 group-hover:opacity-100 shrink-0" />
                            </a>
                            <p className="text-[10px] text-muted-text mt-0.5">
                              {repo.last_commit_at
                                ? `Active ${new Date(repo.last_commit_at).toLocaleDateString()}`
                                : "Commit date unavailable"}
                            </p>
                          </div>

                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded flex items-center gap-1 shrink-0 ${
                              repo.has_tests
                                ? "bg-status-proven/10 text-status-proven"
                                : "bg-soft-surface text-muted-text border border-border"
                            }`}
                          >
                            {repo.has_tests ? (
                              <>
                                <Check className="w-3 h-3 stroke-[2.5]" /> Tests
                              </>
                            ) : (
                              <>
                                <X className="w-3 h-3" /> No tests
                              </>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}