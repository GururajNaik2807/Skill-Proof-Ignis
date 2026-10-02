export interface ScannedRepoRecord {
  id: string;
  repo_name: string;
  repo_url: string;
  primary_language: string | null;
  languages_breakdown: Record<string, number> | null;
  last_commit_at: string | null;
  has_tests: boolean;
  has_docker: boolean;
}

export interface EvaluatedEvidence {
  skill_name: string;
  status: "proven" | "partial" | "claimed";
  confidence_score: number;
  evidence_summary: string;
  matched_repos: {
    name: string;
    url: string;
    has_tests: boolean;
    last_commit_at: string | null;
  }[];
}

// Maps skills to related languages, file manifests, and runtime keywords
const SKILL_ALIAS_MAP: Record<string, string[]> = {
  JavaScript: ["javascript", "js", "node", "react", "next.js", "express"],
  TypeScript: ["typescript", "ts", "react", "next.js", "angular"],
  Python: ["python", "fastapi", "flask", "django", "pytest"],
  React: ["react", "javascript", "typescript", "jsx", "tsx"],
  "Next.js": ["next", "react", "typescript", "javascript"],
  FastAPI: ["fastapi", "python", "uvicorn", "pydantic"],
  Flask: ["flask", "python", "jinja"],
  Docker: ["docker", "dockerfile", "container"],
  Git: ["git", "github"],
  PostgreSQL: ["postgres", "postgresql", "sql", "supabase", "prisma"],
  MongoDB: ["mongodb", "mongo", "mongoose"],
  Redis: ["redis"],
  Rust: ["rust", "cargo"],
  Go: ["go", "golang"],
};

export function evaluateSkillAgainstRepos(
  skillName: string,
  repos: ScannedRepoRecord[]
): EvaluatedEvidence {
  const cleanSkill = skillName.trim();
  const searchKeywords = (SKILL_ALIAS_MAP[cleanSkill] || [cleanSkill.toLowerCase()]).map(
    (k) => k.toLowerCase()
  );

  const matchedRepos: EvaluatedEvidence["matched_repos"] = [];

  for (const repo of repos) {
    const repoNameLower = repo.repo_name.toLowerCase();
    const primaryLangLower = (repo.primary_language || "").toLowerCase();
    const allLangs = Object.keys(repo.languages_breakdown || {}).map((l) =>
      l.toLowerCase()
    );

    // Check if skill matches primary language, language distribution, or repo naming
    const matchesLang =
      searchKeywords.includes(primaryLangLower) ||
      searchKeywords.some((kw) => allLangs.includes(kw));

    const matchesName = searchKeywords.some((kw) => repoNameLower.includes(kw));

    if (matchesLang || matchesName) {
      matchedRepos.push({
        name: repo.repo_name,
        url: repo.repo_url,
        has_tests: repo.has_tests,
        last_commit_at: repo.last_commit_at,
      });
    }
  }

  // 1. If 0 repositories matched -> Claimed-Only
  if (matchedRepos.length === 0) {
    return {
      skill_name: cleanSkill,
      status: "claimed",
      confidence_score: 0.2,
      evidence_summary:
        "Stated on resume, but no matching source code or repository languages were found on GitHub.",
      matched_repos: [],
    };
  }

  // 2. Inspect matched repos for unit tests and commit recency
  const hasTestedRepo = matchedRepos.some((r) => r.has_tests);

  const now = new Date().getTime();
  const oneYearMs = 365 * 24 * 60 * 60 * 1000;
  const hasRecentCommit = matchedRepos.some((r) => {
    if (!r.last_commit_at) return false;
    return now - new Date(r.last_commit_at).getTime() < oneYearMs;
  });

  // 3. Proven: Matched + Tested + Recent commits
  if (hasTestedRepo && hasRecentCommit) {
    return {
      skill_name: cleanSkill,
      status: "proven",
      confidence_score: 0.95,
      evidence_summary: `Verified across ${matchedRepos.length} repository (${matchedRepos
        .map((r) => r.name)
        .slice(0, 2)
        .join(", ")}) with automated test suites and recent commits.`,
      matched_repos: matchedRepos,
    };
  }

  // 4. Partial: Matched, but lacks tests or has dated activity
  const partialReason = !hasTestedRepo
    ? "Detected in source repositories, but missing automated unit or integration tests."
    : "Verified code present, but repository has been inactive for over 12 months.";

  return {
    skill_name: cleanSkill,
    status: "partial",
    confidence_score: 0.65,
    evidence_summary: partialReason,
    matched_repos: matchedRepos,
  };
}