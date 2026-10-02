"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FolderGit2,
  GitBranch,
  RefreshCw,
  Search,
  Filter,
  ExternalLink,
  Check,
  X,
  Loader2,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useDashboard } from "@/context/dashboard-context";

export default function GitHubPage() {
  const { profile, repositories, loading, refreshData } = useDashboard();
  const [repoSearch, setRepoSearch] = useState("");
  const [filterWithTests, setFilterWithTests] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleScanRepos = async () => {
    if (profile?.last_scan_at && Date.now() - new Date(profile.last_scan_at).getTime() < 60000) {
      setNotice({
        type: "error",
        message: "Please wait 60 seconds before scanning again to avoid API limits.",
      });
      return;
    }

    setIsScanning(true);
    setNotice(null);

    try {
      const res = await fetch("/api/github/scan", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "GitHub scan failed");

      setNotice({
        type: "success",
        message: `Indexed ${data.scannedCount || 0} public repositories.`,
      });
      await refreshData();
    } catch (err: unknown) {
      setNotice({
        type: "error",
        message: err instanceof Error ? err.message : "GitHub scan failed",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const filteredRepos = repositories.filter((repo) => {
    const matchesSearch =
      repo.repo_name.toLowerCase().includes(repoSearch.toLowerCase()) ||
      (repo.primary_language || "").toLowerCase().includes(repoSearch.toLowerCase());
    const matchesTest = filterWithTests ? repo.has_tests : true;
    return matchesSearch && matchesTest;
  });

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3 text-muted-text text-sm">
          <Loader2 className="w-5 h-5 animate-spin text-deep-green" />
          Loading GitHub repositories...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-ink flex items-center gap-2.5">
            <FolderGit2 className="w-7 h-7 text-deep-green" />
            GitHub Codebase Signals
          </h1>
          <p className="text-xs sm:text-sm text-muted-text mt-1">
            Connected to handle{" "}
            <span className="font-mono font-semibold text-ink">
              @{profile?.github_username || "not connected"}
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={handleScanRepos}
          disabled={isScanning || !profile?.github_username}
          className="px-4 py-2 bg-deep-green text-white text-xs font-semibold rounded-lg hover:bg-deep-green/90 transition-colors flex items-center gap-2 cursor-pointer shadow-subtle disabled:opacity-50 w-fit"
        >
          {isScanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Re-scan Repositories
        </button>
      </div>

      {notice && (
        <div
          role="status"
          className={`flex items-center justify-between rounded-xl border p-4 text-xs ${
            notice.type === "success"
              ? "bg-status-proven/10 border-status-proven/20 text-status-proven"
              : "bg-status-error/10 border-status-error/20 text-status-error"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notice.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span className="font-medium">{notice.message}</span>
          </div>
          <button onClick={() => setNotice(null)} className="font-semibold hover:underline text-[11px] ml-4 cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {repositories.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-text" />
            <input
              type="text"
              placeholder="Search repository or language..."
              value={repoSearch}
              onChange={(e) => setRepoSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-border rounded-lg text-xs focus:outline-none focus:border-deep-green text-ink"
            />
          </div>
          <button
            type="button"
            onClick={() => setFilterWithTests(!filterWithTests)}
            className={`px-3.5 py-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer w-full sm:w-auto justify-center ${
              filterWithTests
                ? "bg-deep-green/10 border-deep-green text-deep-green"
                : "bg-white border-border text-muted-text hover:text-ink"
            }`}
          >
            <Filter className="w-3 h-3" /> Only Tested Repos
          </button>
        </div>
      )}

      {repositories.length === 0 ? (
        <div className="p-12 border border-dashed border-border rounded-xl text-center bg-white">
          <GitBranch className="w-10 h-10 text-muted-text/50 mx-auto mb-3" />
          <h3 className="text-base font-bold text-ink">No repositories indexed</h3>
          <p className="text-xs text-muted-text mt-1 max-w-sm mx-auto">
            Set your GitHub username in the Profile & Resume tab or click Re-scan above.
          </p>
          <Link href="/profile" className="inline-flex items-center gap-1.5 mt-4 text-xs font-semibold text-deep-green hover:underline">
            Configure username <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto border border-border rounded-xl bg-white shadow-subtle">
          <table className="w-full text-left text-xs">
            <thead className="bg-soft-surface text-muted-text uppercase font-semibold border-b border-border">
              <tr>
                <th className="py-3 px-4">Repository</th>
                <th className="py-3 px-4">Primary Language</th>
                <th className="py-3 px-4 text-center">Unit Tests</th>
                <th className="py-3 px-4 text-center">Docker / Compose</th>
                <th className="py-3 px-4">Last Commit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRepos.map((repo) => (
                <tr key={repo.id} className="hover:bg-warm-ivory/30 transition-colors">
                  <td className="py-3 px-4">
                    <a
                      href={repo.repo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-ink hover:text-deep-green flex items-center gap-1.5 group"
                    >
                      {repo.repo_name}
                      <ExternalLink className="w-3 h-3 opacity-40 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono px-2 py-0.5 rounded bg-soft-surface border border-border text-[11px]">
                      {repo.primary_language || "Config / Docs"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {repo.has_tests ? (
                      <span className="inline-flex items-center gap-1 text-status-proven font-semibold">
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Detected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-muted-text">
                        <X className="w-3.5 h-3.5" /> None
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {repo.has_docker ? (
                      <span className="inline-flex items-center gap-1 text-status-proven font-semibold">
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Configured
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-muted-text">
                        <X className="w-3.5 h-3.5" /> None
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-muted-text">
                    {repo.last_commit_at
                      ? new Date(repo.last_commit_at).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}