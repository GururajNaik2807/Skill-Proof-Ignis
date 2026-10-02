import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export interface ExtractedSkill {
  skill_name: string;
  category: "language" | "framework" | "database" | "tooling" | "devops" | "cloud" | "core_cs";
  claimed_context: string;
}

const CANONICAL_SKILL_MAP: Record<string, string> = {
  git: "Git",
  github: "GitHub",
  gitlab: "GitLab",
  html: "HTML",
  html5: "HTML",
  css: "CSS",
  css3: "CSS",
  js: "JavaScript",
  javascript: "JavaScript",
  ts: "TypeScript",
  typescript: "TypeScript",
  react: "React",
  reactjs: "React",
  "react.js": "React",
  next: "Next.js",
  nextjs: "Next.js",
  "next.js": "Next.js",
  python: "Python",
  python3: "Python",
  node: "Node.js",
  nodejs: "Node.js",
  "node.js": "Node.js",
  docker: "Docker",
  sql: "SQL",
  postgresql: "PostgreSQL",
  postgres: "PostgreSQL",
  mongodb: "MongoDB",
  tailwind: "Tailwind CSS",
  tailwindcss: "Tailwind CSS",
  fastapi: "FastAPI",
  flask: "Flask",
};

export async function extractSkills(resumeText: string): Promise<ExtractedSkill[]> {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not defined.");
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1,
    },
  });

  const prompt = `
You are a technical qualification evaluator and resume auditor.
Extract all technical skills, programming languages, markup formats, developer tools, libraries, and frameworks mentioned or directly implied in the candidate's resume.

EXTRACTION RULES:
1. Always include foundational technical tools: "Git", "HTML", "CSS", "Bash", "Docker", "REST API", "SQL", etc.
2. Exclude soft skills (e.g. "Leadership", "Communication", "Teamwork", "Agile").
3. Map technology names to standard industry casing (e.g. "React", "Python", "FastAPI").
4. For each item, extract a 1-sentence "claimed_context" describing where and how the candidate applied it.
5. Classify each skill strictly into: 'language', 'framework', 'database', 'tooling', 'devops', 'cloud', or 'core_cs'.

Return a JSON array of objects adhering strictly to this schema:
[
  {
    "skill_name": "string",
    "category": "language" | "framework" | "database" | "tooling" | "devops" | "cloud" | "core_cs",
    "claimed_context": "string"
  }
]

Resume text:
"""
${resumeText.slice(0, 30000)}
"""
`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  let rawList: ExtractedSkill[] = [];
  try {
    rawList = JSON.parse(responseText);
  } catch (err) {
    console.error("Gemini parse failure in extractor:", responseText, err);
    return [];
  }

  const unique = new Map<string, ExtractedSkill>();

  for (const item of rawList) {
    if (!item?.skill_name || typeof item.skill_name !== "string") continue;

    const lower = item.skill_name.trim().toLowerCase();
    const canonical = CANONICAL_SKILL_MAP[lower] || item.skill_name.trim();

    if (!unique.has(canonical.toLowerCase())) {
      unique.set(canonical.toLowerCase(), {
        skill_name: canonical,
        category: item.category || "tooling",
        claimed_context: item.claimed_context || "Identified from candidate resume summary.",
      });
    }
  }

  return Array.from(unique.values());
}