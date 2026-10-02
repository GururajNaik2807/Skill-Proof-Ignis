import { GoogleGenerativeAI, type GenerativeModel, type GenerationConfig } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

const defaultModels = [
  "gemini-1.5-flash",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
];

function modelNames() {
  return (process.env.GEMINI_MODEL_FALLBACKS || defaultModels.join(","))
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean);
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientGeminiError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /429|500|502|503|504|unavailable|high demand|overloaded|rate.?limit|resource.?exhausted/i.test(message);
}

export async function generateGeminiJson(
  prompt: string,
  generationConfig: GenerationConfig,
  options: { attemptsPerModel?: number } = {}
) {
  if (!apiKey) throw new Error("GEMINI_API_KEY environment variable is not defined.");

  const attemptsPerModel = options.attemptsPerModel ?? 2;
  let lastError: unknown;

  for (const modelName of modelNames()) {
    const model: GenerativeModel = genAI.getGenerativeModel({ model: modelName, generationConfig });
    for (let attempt = 0; attempt < attemptsPerModel; attempt += 1) {
      try {
        const result = await model.generateContent(prompt);
        return { model: modelName, text: result.response.text() };
      } catch (error) {
        lastError = error;
        if (!isTransientGeminiError(error)) throw error;
        await wait(400 * 2 ** attempt);
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Gemini is temporarily unavailable. Please try again shortly.");
}
