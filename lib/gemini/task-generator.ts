import { generateGeminiJson } from "@/lib/gemini/client";

export interface SkillGapTarget {
  skill_name: string;
  status: "partial" | "claimed";
  claimed_context?: string | null;
}

export interface GeneratedMicroTask {
  skill_name: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimated_time: string;
  deliverables: string[];
  evidence_created: string;
  verification_target: string;
}

export async function generateMicroTasks(
  gaps: SkillGapTarget[],
  targetRole?: string
): Promise<GeneratedMicroTask[]> {
  if (gaps.length === 0) {
    return [];
  }

  const prompt = `
You are a lead software engineer designing verifiable coding tasks.
Create 1 to 3 targeted micro-tasks (1-2 hours each) for the candidate's unverified skill gaps.
Each task must produce tangible GitHub artifacts (commits, unit tests, or container configs) that our scanner can verify.

Target Role: "${targetRole || "Software Engineer"}"

Skill Gaps to Address:
${JSON.stringify(gaps, null, 2)}

TASK REQUIREMENTS:
- title: Action-oriented title (e.g., "Implement Unit Test Suite for FastAPI Authentication")
- description: Clear implementation details and problem scope
- difficulty: "beginner" | "intermediate" | "advanced"
- estimated_time: e.g. "1.5 hours"
- deliverables: Array of 2-3 specific code files or features to push
- evidence_created: Summary of the evidence produced (e.g., "Passing test suite and modular service structure")
- verification_target: The exact pattern the scanner looks for (e.g., "pytest test runner execution with >= 80% branch coverage")

Return a JSON array of objects adhering strictly to this schema:
[
  {
    "skill_name": "string",
    "title": "string",
    "description": "string",
    "difficulty": "beginner" | "intermediate" | "advanced",
    "estimated_time": "string",
    "deliverables": ["string"],
    "evidence_created": "string",
    "verification_target": "string"
  }
]
`;

  try {
    const { text } = await generateGeminiJson(prompt, {
      responseMimeType: "application/json",
      temperature: 0.2,
    });
    const parsed = JSON.parse(text);

    if (!Array.isArray(parsed)) return [];

    return parsed.map((item) => ({
      skill_name: String(item.skill_name || "General"),
      title: String(item.title || "Code Verification Task"),
      description: String(item.description || "Implement and push code artifact."),
      difficulty: (["beginner", "intermediate", "advanced"].includes(item.difficulty)
        ? item.difficulty
        : "intermediate") as "beginner" | "intermediate" | "advanced",
      estimated_time: String(item.estimated_time || "1.5 hours"),
      deliverables: Array.isArray(item.deliverables)
        ? item.deliverables.map(String)
        : ["Passing unit tests", "Modular implementation commit"],
      evidence_created: String(
        item.evidence_created || `Verified implementation artifact for ${item.skill_name}`
      ),
      verification_target: String(
        item.verification_target || `Passing tests and active commit for ${item.skill_name}`
      ),
    }));
  } catch (err) {
    console.error("Task generator execution error:", err);

    return gaps.slice(0, 3).map((gap) => ({
      skill_name: gap.skill_name,
      title: `Build Test Suite & Modular Service for ${gap.skill_name}`,
      description: `Create an isolated public repository module implementing standard design patterns for ${gap.skill_name}, accompanied by unit test assertions.`,
      difficulty: "intermediate",
      estimated_time: "1.5 hours",
      deliverables: [
        `Configured ${gap.skill_name} test runner with passing assertions`,
        `Public Git repository commit demonstrating modular architecture`,
      ],
      evidence_created: `Unit tests and modular architecture artifact for ${gap.skill_name}`,
      verification_target: `Detect passing tests and recent commit signal for ${gap.skill_name}`,
    }));
  }
}