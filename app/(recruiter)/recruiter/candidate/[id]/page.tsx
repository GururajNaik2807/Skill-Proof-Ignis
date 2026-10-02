import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  GitBranch,
  ExternalLink,
  ShieldCheck,
  FolderGit2,
  Check,
  X,
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CandidateAuditPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch candidate profile, repositories, and evidence
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (!profile) {
    notFound();
  }

  const { data: repositories } = await supabase
    .from("github_repositories")
    .select("*")
    .eq("user_id", id)
    .order("last_commit_at", { ascending: false });

  const { data: evidence } = await supabase
    .from("skill_evidence")
    .select("*")
    .eq("user_id", id)
    .order("confidence_score", { ascending: false });

  return (
    <div className="space-y-6">
      <Link
        href="/recruiter/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-text hover:text-ink transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Candidate Pool
      </Link>

      {/* Candidate Profile Header Card */}
      <div className="bg-white border border-border rounded-xl p-6 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.full_name || "Candidate"}
              width={64}
              height={64}
              className="rounded-full border border-border"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-soft-surface border border-border flex items-center justify-center text-deep-green font-bold text-xl">
              {(profile.full_name || "D").charAt(0).toUpperCase()}
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-heading">{profile.full_name}</h1>
              <span className="px-2 py-0.5 rounded bg-deep-green/10 text-deep-green text-[10px] font-bold uppercase tracking-wider">
                Audited Candidate
              </span>
            </div>
            {profile.github_username && (
              <a
                href={`https://github.com/${profile.github_username}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-mono text-muted-text hover:text-deep-green flex items-center gap-1 mt-1"
              >
                <GitBranch className="w-3 h-3" /> @{profile.github_username}
                <ExternalLink className="w-3 h-3 opacity-50" />
              </a>
            )}
            <p className="text-xs text-muted-text mt-1 max-w-xl">
              {profile.bio || "No summary provided."}
            </p>
          </div>
        </div>

        <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
          <span className="text-[10px] text-muted-text uppercase font-semibold">
            Overall Code Quality
          </span>
          <span className="px-3 py-1 bg-status-proven/10 text-status-proven font-bold rounded-lg text-xs font-mono">
            High Evidence Score
          </span>
        </div>
      </div>

      {/* Two Column Layout: Evidence Matrix & Repos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Audited Skills Evidence */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-border rounded-xl p-6 shadow-subtle">
            <h2 className="text-base font-bold font-heading flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-deep-green" />
              Audited Skill Matrix
            </h2>

            {!evidence || evidence.length === 0 ? (
              <p className="text-xs text-muted-text py-4">
                No evaluated skill signals yet for this candidate.
              </p>
            ) : (
              <div className="space-y-3">
                {evidence.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 bg-warm-ivory/40 border border-border rounded-lg flex items-start justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-ink">{item.skill_name}</span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
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
                      <p className="text-xs text-muted-text mt-1">
                        {item.evidence_summary || "Found across repositories."}
                      </p>
                    </div>

                    <span className="text-xs font-mono font-bold text-muted-text shrink-0">
                      {Math.round(Number(item.confidence_score) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Repositories & Tests */}
        <div className="space-y-4">
          <div className="bg-white border border-border rounded-xl p-6 shadow-subtle">
            <h2 className="text-base font-bold font-heading flex items-center gap-2 mb-4">
              <FolderGit2 className="w-5 h-5 text-deep-green" />
              Scanned Repositories
            </h2>

            {!repositories || repositories.length === 0 ? (
              <p className="text-xs text-muted-text">No repositories scanned yet.</p>
            ) : (
              <div className="space-y-3">
                {repositories.map((repo) => (
                  <div
                    key={repo.id}
                    className="p-3 border border-border rounded-lg text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <a
                        href={repo.repo_url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-ink hover:text-deep-green flex items-center gap-1"
                      >
                        {repo.repo_name}
                        <ExternalLink className="w-3 h-3 opacity-40" />
                      </a>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-soft-surface">
                        {repo.primary_language || "Config"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-muted-text pt-1">
                      <span className="flex items-center gap-1">
                        Tests:{" "}
                        {repo.has_tests ? (
                          <Check className="w-3.5 h-3.5 text-status-proven" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-status-claimed" />
                        )}
                      </span>
                      <span className="flex items-center gap-1">
                        Docker:{" "}
                        {repo.has_docker ? (
                          <Check className="w-3.5 h-3.5 text-status-proven" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-status-claimed" />
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}