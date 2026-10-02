import { generateGeminiJson } from "@/lib/gemini/client";

import { 
  CandidateSkillInput, 
  ParsedJobRequirement, 
  MatchScoreResult, 
  JobMatchResult, 
  calculateMatchScore 
} from "@/lib/shared/match-calculator";

export type { CandidateSkillInput, ParsedJobRequirement, MatchScoreResult, JobMatchResult };
export { calculateMatchScore };

/**
 * Parses raw job descriptions into structured skill requirements using Gemini.
 */
export async function parseJobDescription(jobDescription: string): Promise<ParsedJobRequirement[]> {
  const prompt = `
You are a technical recruiter parsing technical job requirements.
Extract all required and preferred technical skills, languages, frameworks, databases, and tools from this job description.

Job Description:
"""
${jobDescription.slice(0, 10000)}
"""

Return a JSON array of objects with this schema:
[
  {
    "skill_name": "string",
    "importance": "required" | "preferred"
  }
]
`;

  try {
    const { text } = await generateGeminiJson(prompt, {
      responseMimeType: "application/json",
      temperature: 0.1,
    });
    const parsed: unknown = JSON.parse(text);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((item: unknown) => {
      const record = item as Record<string, unknown>;
      return {
        skill_name: String(record.skill_name || "").trim(),
        importance: (record.importance === "preferred" ? "preferred" : "required") as "required" | "preferred",
      };
    }).filter((item) => item.skill_name.length > 0);
  } catch (err) {
    console.warn("Job description parsing unavailable; using deterministic fallback:", err);
    return deterministicJobFallback(jobDescription);
  }
}

function deterministicJobFallback(jobDescription: string): ParsedJobRequirement[] {
  const skills = ["TypeScript", "JavaScript", "React", "Next.js", "Python", "FastAPI", "Node.js", "PostgreSQL", "MongoDB", "Docker", "AWS", "Kubernetes", "Redis", "SQL", "Git"];
  const lowerDescription = jobDescription.toLowerCase();
  return skills.filter((skill) => lowerDescription.includes(skill.toLowerCase())).map((skill) => ({ skill_name: skill, importance: "required" as const }));
}



/**
 * End-to-end evaluation using Gemini directly.
 */
export async function matchCandidateToJob(
  jobTitle: string,
  jobDescription: string,
  candidateSkills: CandidateSkillInput[]
): Promise<JobMatchResult> {
  const requirements = await parseJobDescription(jobDescription);
  const result = calculateMatchScore(requirements, candidateSkills);

  return {
    match_score: result.overall_score,
    summary: result.summary,
    matching_skills: result.matching_skills,
    missing_skills: result.missing_skills,
    partial_skills: result.partial_skills,
    recommendations: result.recommendations,
  };
}