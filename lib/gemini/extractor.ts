import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

export interface ExtractedSkill {
  name: string;
  category: "language" | "framework" | "database" | "tool" | "cloud";
  claimed_context: string;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Deterministic fallback dictionary in case of temporary 503 upstream outages
const COMMON_SKILL_PATTERNS: { name: string; category: ExtractedSkill["category"]; regex: RegExp }[] = [
  { name: "TypeScript", category: "language", regex: /\b(typescript|ts)\b/i },
  { name: "JavaScript", category: "language", regex: /\b(javascript|js|es6)\b/i },
  { name: "Python", category: "language", regex: /\bpython\b/i },
  { name: "Go", category: "language", regex: /\bgolang|go\b/i },
  { name: "Rust", category: "language", regex: /\brust\b/i },
  { name: "React", category: "framework", regex: /\breact(\.js)?\b/i },
  { name: "Next.js", category: "framework", regex: /\bnext(\.js)?\b/i },
  { name: "Node.js", category: "framework", regex: /\bnode(\.js)?\b/i },
  { name: "FastAPI", category: "framework", regex: /\bfastapi\b/i },
  { name: "Flask", category: "framework", regex: /\bflask\b/i },
  { name: "Express", category: "framework", regex: /\bexpress(\.js)?\b/i },
  { name: "Tailwind CSS", category: "framework", regex: /\btailwind(\s*css)?\b/i },
  { name: "PostgreSQL", category: "database", regex: /\bpostgres(ql)?\b/i },
  { name: "MongoDB", category: "database", regex: /\bmongodb|mongo\b/i },
  { name: "Redis", category: "database", regex: /\bredis\b/i },
  { name: "Supabase", category: "database", regex: /\bsupabase\b/i },
  { name: "Docker", category: "tool", regex: /\bdocker\b/i },
  { name: "Git", category: "tool", regex: /\bgit(hub)?\b/i },
  { name: "Linux", category: "tool", regex: /\blinux\b/i },
  { name: "AWS", category: "cloud", regex: /\baws|amazon web services\b/i },
  { name: "Vercel", category: "cloud", regex: /\bvercel\b/i },
];

function fallbackSkillExtractor(text: string): ExtractedSkill[] {
  const detected: ExtractedSkill[] = [];
  for (const item of COMMON_SKILL_PATTERNS) {
    if (item.regex.test(text)) {
      detected.push({
        name: item.name,
        category: item.category,
        claimed_context: "Identified from candidate resume summary.",
      });
    }
  }
  return detected;
}

export async function extractSkillsFromResume(resumeText: string): Promise<ExtractedSkill[]> {
  if (!process.env.GEMINI_API_KEY) {
    return fallbackSkillExtractor(resumeText);
  }

  const prompt = `
Extract all technical skills, programming languages, frameworks, libraries, databases, developer tools, and cloud platforms explicitly mentioned in the resume below.

Return a strictly valid JSON array of objects with no Markdown backticks, no code block wrapping, and no commentary.
Format each item exactly like this:
[
  {
    "name": "Canonical name (e.g. TypeScript, React, PostgreSQL, Docker, AWS)",
    "category": "language" | "framework" | "database" | "tool" | "cloud",
    "claimed_context": "Short 1-sentence excerpt of how the user claims to have used it"
  }
]

Resume text:
"""
${resumeText.slice(0, 8000)}
"""
`;

  // Try gemini-3.8-flash with 3 retry attempts for 503 load spikes
  for (let attempt = 1; attempt <= 3; attempt++) {
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
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (err: unknown) {
      console.warn(`[Gemini Attempt ${attempt}] Failed with:`, err);
      if (attempt < 3) {
        // Exponential backoff: 1.5s, then 3s
        await sleep(attempt * 1500);
      }
    }
  }

  // Graceful fallback to prevent blocking the user
  console.info("[SkillProof] Falling back to rule-based resume skill extractor.");
  const fallbackResults = fallbackSkillExtractor(resumeText);
  if (fallbackResults.length > 0) {
    return fallbackResults;
  }

  throw new Error("Unable to extract technical skills from resume text.");
}