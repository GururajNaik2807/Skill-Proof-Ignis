import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

export interface GeneratedTask {
  skill_name: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimated_time: string;
  deliverables: string[];
  verification_target: string;
}

export async function generateMicroTasksForSkills(
  targetSkills: { name: string; status: string; reason?: string }[],
  repositories: { name: string; primary_language: string | null; has_tests: boolean; has_docker: boolean }[]
): Promise<GeneratedTask[]> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not defined in environment variables.");
  }

  const prompt = `
You are a senior engineering staff mentor. 
Generate targeted, highly realistic 1-2 hour coding micro-tasks for a developer to prove their technical skills in their public GitHub repositories.

Target Skills to Verify:
${JSON.stringify(targetSkills, null, 2)}

Candidate Existing Repositories:
${JSON.stringify(repositories.slice(0, 5), null, 2)}

Requirements for each micro-task:
1. Practical & scoped to 60-120 minutes max.
2. Focus on physical codebase artifacts: unit test suites, Dockerfiles, GitHub Actions workflows, or modular API endpoints.
3. Explicitly state the verification target (what file or signal SkillProof will detect on the next scan).

Return a strictly valid JSON array of objects with no markdown backticks, no code block wrapping, and no commentary:
[
  {
    "skill_name": "Docker",
    "title": "Add Multi-Stage Dockerfile & Healthcheck",
    "description": "Containerize your existing service using a multi-stage build to keep production image size under 150MB.",
    "difficulty": "intermediate",
    "estimated_time": "90 mins",
    "deliverables": ["Dockerfile in root with build & run stages", "docker-compose.yml testing local ports"],
    "verification_target": "Dockerfile and docker-compose.yml in default branch"
  }
]
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const rawText = response.text?.trim() || "";
    if (rawText) {
      const cleaned = rawText.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("[Task Generator] AI call failed, generating standard fallback tasks:", err);
  }

  // Deterministic fallback if model endpoint is experiencing load spikes
  return targetSkills.slice(0, 3).map((s) => ({
    skill_name: s.name,
    title: `Implement automated test suite for ${s.name}`,
    description: `Configure an automated unit test suite using standard test runners (e.g. Jest, PyTest, or Vitest) to achieve test coverage on core endpoints.`,
    difficulty: "intermediate",
    estimated_time: "90 mins",
    deliverables: [
      `Create tests/ directory with at least 3 unit test cases`,
      `Add test command script to package manifest`,
    ],
    verification_target: "tests/ directory and test script detected in repository root",
  }));
}