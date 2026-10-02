import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  GitBranch,
  ExternalLink,
  FolderGit2,
  Check,
} from "lucide-react";

interface PublicMatchedRepo {
  name: string;
  url: string;
  has_tests?: boolean;
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function PublicProofPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // 1. Fetch Candidate Profile by share_slug or ID
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .or(`share_slug.eq.${slug},id.eq.${slug}`)
    .single();

  if (!profile) {
    notFound();
  }

  const { data: { user } } = await supabase.auth.getUser();

  // 2. Fetch their public evidence
  const { data: evidence } = await supabase
    .from("skill_evidence")
    .select("*")
    .eq("user_id", profile.id)
    .order("confidence_score", { ascending: false });

  const proven = evidence?.filter((e) => e.status === "proven") || [];
  const partial = evidence?.filter((e) => e.status === "partial") || [];

  return (
    <div className="min-h-screen bg-warm-ivory text-ink flex flex-col justify-between">
      {/* Top Banner */}
      <header className="border-b border-border bg-white px-6 py-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-deep-green flex items-center justify-center text-white">
                <ShieldCheck className="w-5 h-5 text-emerald" />
              </div>
              <span className="font-bold text-base font-heading">SkillProof</span>
            </Link>
            <span className="text-[11px] font-mono bg-soft-surface px-2.5 py-1 rounded border border-border text-muted-text hidden sm:inline-block">
              Verified Audit Report
            </span>
          </div>

          {/* User Actions */}
          {user && (
            <div className="flex items-center gap-3">
              <Link 
                href="/dashboard"
                className="text-xs font-semibold px-3 py-1.5 rounded border border-border hover:bg-soft-surface text-ink transition-colors"
              >
                Dashboard
              </Link>
              <form action="/auth/signout" method="POST">
                <button
                  type="submit"
                  className="text-xs font-semibold px-3 py-1.5 rounded border border-red-200 hover:bg-red-50 text-red-600 transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </form>
            </div>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl w-full mx-auto px-6 py-10 flex-1 space-y-8">
        {/* Candidate Profile Card */}
        <div className="bg-white border border-border rounded-xl p-6 sm:p-8 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.full_name || "Candidate"}
                width={72}
                height={72}
                className="rounded-full border border-border"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-soft-surface border border-border flex items-center justify-center text-deep-green font-bold text-2xl font-heading">
                {(profile.full_name || "D").charAt(0).toUpperCase()}
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold font-heading text-ink">
                  {profile.full_name}
                </h1>
                <span className="px-2 py-0.5 rounded bg-status-proven/10 text-status-proven text-[10px] font-bold uppercase tracking-wider">
                  Verified
                </span>
              </div>
              {profile.github_username && (
                <a
                  href={`https://github.com/${profile.github_username}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-mono text-muted-text hover:text-deep-green flex items-center gap-1 mt-1 transition-colors"
                >
                  <GitBranch className="w-3.5 h-3.5" /> @{profile.github_username}
                  <ExternalLink className="w-3 h-3 opacity-40" />
                </a>
              )}
              <p className="text-xs text-muted-text mt-2 max-w-lg leading-relaxed">
                {profile.bio || "Technical skillset audited directly against public GitHub source repositories, unit test suites, and commit logs."}
              </p>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 border-t sm:border-t-0 pt-4 sm:pt-0 border-border">
            <span className="text-[10px] text-muted-text uppercase font-semibold">
              Evidence Breakdown
            </span>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-status-proven/10 text-status-proven text-xs font-bold font-mono rounded">
                {proven.length} Proven
              </span>
              <span className="px-2.5 py-1 bg-status-partial/10 text-status-partial text-xs font-bold font-mono rounded">
                {partial.length} Partial
              </span>
            </div>
          </div>
        </div>

        {/* Audited Skill Evidence Matrix */}
        <div className="bg-white border border-border rounded-xl p-6 sm:p-8 shadow-card space-y-6">
          <div className="border-b border-border pb-4">
            <h2 className="text-lg font-bold font-heading flex items-center gap-2 text-ink">
              <CheckCircle2 className="w-5 h-5 text-status-proven" />
              Verified Technical Evidence
            </h2>
            <p className="text-xs text-muted-text mt-0.5">
              Every skill listed below has been verified using deterministic codebase signals.
            </p>
          </div>

          {!evidence || evidence.length === 0 ? (
            <p className="text-xs text-muted-text py-4 text-center">
              No evidence records are publicly published for this profile.
            </p>
          ) : (
            <div className="space-y-4">
              {evidence.map((item) => {
                const repos = (item.matched_repos as PublicMatchedRepo[] | null) || [];
                return (
                  <div
                    key={item.id}
                    className="p-4 bg-warm-ivory/30 border border-border rounded-lg space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-sm text-ink">{item.skill_name}</span>
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
                      <span className="font-mono text-xs font-bold text-muted-text">
                        {Math.round(Number(item.confidence_score) * 100)}% Confidence
                      </span>
                    </div>

                    <p className="text-xs text-muted-text leading-relaxed">
                      {item.evidence_summary}
                    </p>

                    {repos.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {repos.map((r, idx) => (
                          <a
                            key={idx}
                            href={r.url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 rounded bg-white border border-border text-[11px] font-medium text-ink hover:text-deep-green flex items-center gap-1.5 transition-colors"
                          >
                            <FolderGit2 className="w-3 h-3 text-deep-green" />
                            {r.name}
                            {r.has_tests && (
                              <Check className="w-3 h-3 text-status-proven stroke-[2.5]" />
                            )}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-white py-6 text-center text-xs text-muted-text">
        Verified with{" "}
        <Link href="/" className="font-semibold text-deep-green hover:underline">
          SkillProof
        </Link>{" "}
        — Deterministic codebase verification for engineers.
      </footer>
    </div>
  );
}