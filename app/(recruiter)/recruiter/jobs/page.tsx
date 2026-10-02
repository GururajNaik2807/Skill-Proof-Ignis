"use client";

import { useState } from "react";
import {
  Briefcase,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RecruiterJobsPage() {
  const [jobTitle, setJobTitle] = useState("");
  const [jdText, setJdText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [matchResults, setMatchResults] = useState<{
    requiredSkills: string[];
    candidates: {
      id: string;
      name: string;
      score: number;
      provenMatches: string[];
      missingSkills: string[];
    }[];
  } | null>(null);

  const handleAnalyzeJD = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jdText.trim()) return;

    setIsAnalyzing(true);

    // Simulated parsing delay (hooked to Gemini / matching engine in Stage 7)
    setTimeout(() => {
      setMatchResults({
        requiredSkills: ["TypeScript", "Next.js", "PostgreSQL", "Docker", "Jest / Vitest"],
        candidates: [
          {
            id: "1",
            name: "Gururaj Naik",
            score: 92,
            provenMatches: ["TypeScript", "Next.js", "PostgreSQL", "Docker"],
            missingSkills: ["Jest / Vitest"],
          },
          {
            id: "2",
            name: "Alex Morgan",
            score: 68,
            provenMatches: ["TypeScript", "Next.js"],
            missingSkills: ["PostgreSQL", "Docker", "Jest / Vitest"],
          },
        ],
      });
      setIsAnalyzing(false);
    }, 1200);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-border">
        <h1 className="text-2xl font-bold font-heading flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-deep-green" />
          Job Description Matcher
        </h1>
        <p className="text-xs text-muted-text mt-1">
          Paste any software engineering JD to parse required tech stacks and run automated evidence-backed candidate matching.
        </p>
      </div>

      {/* Ingestion Box */}
      <div className="bg-white border border-border rounded-xl p-6 shadow-subtle">
        <form onSubmit={handleAnalyzeJD} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
              Position Title & Team
            </label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Senior Full-Stack Engineer (Platform Team)"
              className="w-full px-3.5 py-2.5 bg-warm-ivory/50 border border-border rounded-lg text-xs focus:outline-none focus:border-deep-green"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
              Paste Raw Job Description
            </label>
            <textarea
              rows={6}
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste responsibilities, requirements, and tech stack details here..."
              className="w-full p-3.5 bg-warm-ivory/50 border border-border rounded-lg text-xs focus:outline-none focus:border-deep-green font-mono leading-relaxed"
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" loading={isAnalyzing} className="gap-2">
              <Sparkles className="w-4 h-4" />
              Analyze Requirements & Match Pool
            </Button>
          </div>
        </form>
      </div>

      {/* Analysis Results */}
      {matchResults && (
        <div className="space-y-6">
          <div className="bg-white border border-border rounded-xl p-6 shadow-subtle">
            <h2 className="text-sm font-bold font-heading mb-3">
              Extracted Technical Requirements
            </h2>
            <div className="flex flex-wrap gap-2">
              {matchResults.requiredSkills.map((s) => (
                <span
                  key={s}
                  className="px-2.5 py-1 rounded-md bg-soft-surface border border-border text-xs font-medium font-mono text-ink"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Ranked Candidates */}
          <div className="bg-white border border-border rounded-xl p-6 shadow-subtle space-y-4">
            <h2 className="text-sm font-bold font-heading">
              Ranked Candidate Matches
            </h2>

            <div className="space-y-3">
              {matchResults.candidates.map((cand) => (
                <div
                  key={cand.id}
                  className="p-4 bg-warm-ivory/40 border border-border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <h4 className="text-sm font-bold text-ink">{cand.name}</h4>
                      <span className="px-2 py-0.5 rounded bg-status-proven/10 text-status-proven text-xs font-bold font-mono">
                        {cand.score}% Evidence Match
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px]">
                      <span className="text-muted-text">Proven Code:</span>
                      {cand.provenMatches.map((skill) => (
                        <span
                          key={skill}
                          className="text-status-proven font-semibold flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" /> {skill}
                        </span>
                      ))}

                      {cand.missingSkills.length > 0 && (
                        <>
                          <span className="text-muted-text ml-2">Unverified / Missing:</span>
                          {cand.missingSkills.map((skill) => (
                            <span
                              key={skill}
                              className="text-status-claimed font-semibold flex items-center gap-1"
                            >
                              <AlertCircle className="w-3 h-3" /> {skill}
                            </span>
                          ))}
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="px-3.5 py-2 border border-border text-xs font-semibold rounded-lg hover:bg-white transition-colors shrink-0"
                  >
                    View Audit Proof
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}