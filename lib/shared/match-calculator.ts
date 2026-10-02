export interface CandidateSkillInput {
  skill_name: string;
  status: "proven" | "partial" | "claimed";
  confidence_score?: number;
  evidence_summary?: string | null;
}

export interface ParsedJobRequirement {
  skill_name: string;
  importance: "required" | "preferred";
  minimum_tier?: "proven" | "partial" | "claimed";
}

export interface MatchScoreResult {
  overall_score: number;
  matching_skills: string[];
  missing_skills: string[];
  partial_skills: string[];
  summary: string;
  recommendations: string[];
}

export interface JobMatchResult {
  match_score: number;
  summary: string;
  matching_skills: string[];
  missing_skills: string[];
  partial_skills: string[];
  recommendations: string[];
}

/**
 * Calculates a match score deterministically between parsed job requirements and candidate evidence.
 */
export function calculateMatchScore(
  requirements: ParsedJobRequirement[],
  candidateSkills: CandidateSkillInput[]
): MatchScoreResult {
  if (!requirements || requirements.length === 0) {
    return {
      overall_score: 0,
      matching_skills: [],
      missing_skills: [],
      partial_skills: [],
      summary: "No job requirements provided for evaluation.",
      recommendations: ["Supply job requirements to compute match score."],
    };
  }

  const skillLookup = new Map<string, CandidateSkillInput>();
  candidateSkills.forEach((s) => {
    skillLookup.set(s.skill_name.toLowerCase().trim(), s);
  });

  const matching: string[] = [];
  const partial: string[] = [];
  const missing: string[] = [];

  let earnedPoints = 0;
  let totalPoints = 0;

  for (const req of requirements) {
    const weight = req.importance === "required" ? 3 : 1;
    totalPoints += weight;

    const matched = skillLookup.get(req.skill_name.toLowerCase().trim());

    if (!matched) {
      missing.push(req.skill_name);
    } else if (matched.status === "proven") {
      earnedPoints += weight;
      matching.push(req.skill_name);
    } else if (matched.status === "partial") {
      earnedPoints += weight * 0.5;
      partial.push(req.skill_name);
    } else {
      earnedPoints += weight * 0.2;
      partial.push(req.skill_name);
    }
  }

  const rawScore = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
  const overall_score = Math.round(Math.min(100, Math.max(0, rawScore)));

  const recommendations: string[] = [];
  if (missing.length > 0) {
    recommendations.push(`Complete verification tasks for missing competencies: ${missing.slice(0, 3).join(", ")}.`);
  }
  if (partial.length > 0) {
    recommendations.push(`Promote partial evidence to proven code via test suites for: ${partial.slice(0, 3).join(", ")}.`);
  }

  return {
    overall_score,
    matching_skills: matching,
    missing_skills: missing,
    partial_skills: partial,
    summary: `Candidate matches ${matching.length} of ${requirements.length} target job criteria with an overall score of ${overall_score}%.`,
    recommendations,
  };
}
