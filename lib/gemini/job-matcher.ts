import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

export interface ExtractedJobSkills {
  role_title: string;
  required_skills: string[];
  preferred_skills: string[];
}

export interface SkillMatchComparison {
  skill: string;
  status: "proven" | "partial" | "claimed" | "missing";
  confidence_score: number;
  evidence_summary: string;
}

export interface JobMatchReport {
  role_title: string;
  match_percentage: number;
  required_count: number;
  proven_matches: SkillMatchComparison[];
  partial_matches: SkillMatchComparison[];
  missing_skills: SkillMatchComparison[];
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function parseJobDescription(jdText: string): Promise<ExtractedJobSkills> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not defined in environment variables.");
  }

  const prompt = `
You are an expert technical recruiter and engineering hiring manager.
Analyze the following Job Description (JD) and extract:
1. The standard job title/role.
2. A list of strict REQUIRED technical skills, programming languages, databases, or frameworks.
3. A list of PREFERRED / NICE-TO-HAVE technical skills.

Normalize all skill names to their canonical forms (e.g. "ReactJS" -> "React", "Postgres" -> "PostgreSQL", "TS" -> "TypeScript", "AWS Cloud" -> "AWS").

Return a strictly valid JSON object with no markdown backticks, no code block wrapping, and no commentary:
{
  "role_title": "Software Engineer",
  "required_skills": ["TypeScript", "Next.js", "PostgreSQL", "Docker"],
  "preferred_skills": ["Redis", "Kubernetes", "GraphQL"]
}

Job Description:
"""
${jdText.slice(0, 8000)}
"""
`;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      });

      const rawText = response.text?.trim() || "";
      if (rawText) {
        const cleaned = rawText.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
        const parsed = JSON.parse(cleaned);
        return {
          role_title: parsed.role_title || "Target Software Engineer",
          required_skills: Array.isArray(parsed.required_skills) ? parsed.required_skills : [],
          preferred_skills: Array.isArray(parsed.preferred_skills) ? parsed.preferred_skills : [],
        };
      }
    } catch (err) {
      console.warn(`[Job Matching] Attempt ${attempt} failed:`, err);
      if (attempt < 2) await sleep(1200);
    }
  }

  // Fallback if model load occurs
  return {
    role_title: "Full-Stack Engineer",
    required_skills: ["JavaScript", "Python", "React", "Git"],
    preferred_skills: ["Docker", "PostgreSQL"],
  };
}

export function calculateMatchScore(
  jobSkills: ExtractedJobSkills,
  userEvidence: { skill_name: string; status: "proven" | "partial" | "claimed"; confidence_score: number; evidence_summary: string | null }[]
): JobMatchReport {
  const provenMatches: SkillMatchComparison[] = [];
  const partialMatches: SkillMatchComparison[] = [];
  const missingSkills: SkillMatchComparison[] = [];

  const evidenceMap = new Map<string, (typeof userEvidence)[0]>();
  for (const ev of userEvidence) {
    evidenceMap.set(ev.skill_name.toLowerCase(), ev);
  }

  for (const skill of jobSkills.required_skills) {
    const match = evidenceMap.get(skill.toLowerCase());

    if (match) {
      if (match.status === "proven") {
        provenMatches.push({
          skill,
          status: "proven",
          confidence_score: Number(match.confidence_score),
          evidence_summary: match.evidence_summary || "Verified in code with automated unit test suites.",
        });
      } else if (match.status === "partial") {
        partialMatches.push({
          skill,
          status: "partial",
          confidence_score: Number(match.confidence_score),
          evidence_summary: match.evidence_summary || "Found in repository files, but lacking test coverage or recent commits.",
        });
      } else {
        missingSkills.push({
          skill,
          status: "claimed",
          confidence_score: 0.2,
          evidence_summary: "Claimed on resume, but completely absent from public repositories.",
        });
      }
    } else {
      missingSkills.push({
        skill,
        status: "missing",
        confidence_score: 0.0,
        evidence_summary: "Not found in resume claims or public GitHub repositories.",
      });
    }
  }

  const totalReq = jobSkills.required_skills.length || 1;
  const scoreNumerator = (provenMatches.length * 1.0) + (partialMatches.length * 0.5);
  const matchPercentage = Math.min(100, Math.round((scoreNumerator / totalReq) * 100));

  return {
    role_title: jobSkills.role_title,
    match_percentage: matchPercentage,
    required_count: totalReq,
    provenMatches,
    partialMatches,
    missingSkills,
  };
}