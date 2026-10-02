"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface MatchComparison {
  skill: string;
  status: "proven" | "partial" | "claimed" | "missing";
  confidence_score: number;
  evidence_summary: string;
}

interface MatchReport {
  role_title: string;
  match_percentage: number;
  required_count: number;
  provenMatches: MatchComparison[];
  partialMatches: MatchComparison[];
  missingSkills: MatchComparison[];
}

export default function JobMatchPage() {
  const [roleTitle, setRoleTitle] = useState("");
  const [jdText, setJdText] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<MatchReport | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jdText.trim()) return;

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/jobs/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role_title: roleTitle, jd_text: jdText }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to analyze job posting");

      setReport(data.report);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Job match error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="pb-6 border-b border-border">
        <Link
          href="/dashboard"
          className="text-xs text-muted-text hover:text-ink flex items-center gap-1 mb-2 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold font-heading text-ink flex items-center gap-2.5">
          <Briefcase className="w-7 h-7 text-deep-green" />
            How does your experience fit this job?
        </h1>
        <p className="text-xs sm:text-sm text-muted-text mt-1">
          Paste a job description and compare its requirements with your verified skills and evidence.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-status-error/10 border border-status-error/20 rounded-xl text-status-error text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Input Box */}
      <div className="bg-white border border-border rounded-xl p-6 shadow-subtle">
        <form onSubmit={handleMatch} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
              Job title (Optional)
            </label>
            <input
              type="text"
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
              placeholder="e.g. Backend Engineer (Python / FastAPI)"
              className="w-full px-3.5 py-2.5 bg-soft-surface/50 border border-border rounded-lg text-xs focus:outline-none focus:border-deep-green text-ink"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
              Job description
            </label>
            <textarea
              rows={6}
              required
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste the job description..."
              className="w-full p-3.5 bg-soft-surface/50 border border-border rounded-lg text-xs focus:outline-none focus:border-deep-green text-ink font-mono leading-relaxed"
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" loading={loading} className="gap-2">
              <Sparkles className="w-4 h-4" />
              Analyze Job
            </Button>
          </div>
        </form>
      </div>

      {/* Results View */}
      {report && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Summary Metric Score */}
          <div className="bg-white border border-border rounded-xl p-6 sm:p-8 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <span className="text-xs font-semibold text-muted-text uppercase tracking-wider">
                Target Role
              </span>
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-ink mt-0.5">
                {report.role_title}
              </h2>
              <p className="text-xs text-muted-text mt-1">
                Audited against {report.required_count} core technical requirements.
              </p>
            </div>

            <div className="flex items-center gap-4 border-t sm:border-t-0 pt-4 sm:pt-0 border-border">
              <div className="text-right">
                <span className="text-[10px] text-muted-text uppercase font-semibold block">
                  Job Match
                </span>
                <span className="text-3xl font-bold font-heading text-deep-green">
                  {report.match_percentage}%
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-deep-green/10 flex items-center justify-center text-deep-green">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Breakdown Grid: Proven vs Partial vs Gaps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Proven Matches */}
            <div className="bg-white border border-border rounded-xl p-5 shadow-subtle space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <span className="text-xs font-bold text-status-proven uppercase flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Proven In Code ({report.provenMatches.length})
                </span>
              </div>
              {report.provenMatches.length === 0 ? (
                <p className="text-xs text-muted-text py-2">No required skills proven in your public repositories yet.</p>
              ) : (
                <div className="space-y-2">
                  {report.provenMatches.map((m, idx) => (
                    <div key={idx} className="p-2.5 bg-status-proven/5 border border-status-proven/20 rounded-lg text-xs">
                      <p className="font-bold text-ink">{m.skill}</p>
                      <p className="text-[11px] text-muted-text mt-0.5">{m.evidence_summary}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Partial Matches */}
            <div className="bg-white border border-border rounded-xl p-5 shadow-subtle space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <span className="text-xs font-bold text-status-partial uppercase flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> Needs Testing ({report.partialMatches.length})
                </span>
              </div>
              {report.partialMatches.length === 0 ? (
                <p className="text-xs text-muted-text py-2">No partial requirements identified.</p>
              ) : (
                <div className="space-y-2">
                  {report.partialMatches.map((m, idx) => (
                    <div key={idx} className="p-2.5 bg-status-partial/5 border border-status-partial/20 rounded-lg text-xs">
                      <p className="font-bold text-ink">{m.skill}</p>
                      <p className="text-[11px] text-muted-text mt-0.5">{m.evidence_summary}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Missing or Unverified Gaps */}
            <div className="bg-white border border-border rounded-xl p-5 shadow-subtle space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <span className="text-xs font-bold text-status-claimed uppercase flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> Evidence Gaps ({report.missingSkills.length})
                </span>
              </div>
              {report.missingSkills.length === 0 ? (
                <p className="text-xs text-muted-text py-2">Zero gaps detected! All requirements backed by code.</p>
              ) : (
                <div className="space-y-2">
                  {report.missingSkills.map((m, idx) => (
                    <div key={idx} className="p-2.5 bg-status-claimed/5 border border-status-claimed/20 rounded-lg text-xs">
                      <p className="font-bold text-ink">{m.skill}</p>
                      <p className="text-[11px] text-muted-text mt-0.5">{m.evidence_summary}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Micro-Task Generation CTA */}
          <div className="p-6 bg-white border border-border rounded-xl shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-deep-green/10 flex items-center justify-center text-deep-green shrink-0 mt-0.5">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink">
                  Skills to strengthen
                </h3>
                <p className="text-xs text-muted-text mt-0.5 max-w-xl">
                  Turn missing or partial skills into proven GitHub evidence with tailored 1–2 hour micro-tasks.
                </p>
              </div>
            </div>

            <Link
              href="/dashboard"
              className="px-4 py-2 bg-deep-green text-white text-xs font-semibold rounded-lg hover:bg-deep-green/90 transition-colors shrink-0 flex items-center gap-1.5"
            >
              Generate Micro-Tasks <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}