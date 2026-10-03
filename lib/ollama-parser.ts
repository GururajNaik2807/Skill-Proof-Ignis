import { extractText } from "unpdf";

export async function parseResumeWithOllama(pdfBuffer: Buffer | ArrayBuffer) {
  let rawText = "";
  try {
    const uint8Array = new Uint8Array(pdfBuffer);
    const pdfData = await extractText(uint8Array);
    
    // Safely extract string, handling unpdf's object/array response gracefully
    if (typeof pdfData === "string") {
      rawText = pdfData;
    } else if (pdfData && typeof pdfData.text === "string") {
      rawText = pdfData.text;
    } else if (pdfData && Array.isArray(pdfData.text)) {
      rawText = pdfData.text.join("\n");
    }
  } catch (error: any) {
    console.error("PDF Parsing Error Inner:", error);
    throw new Error(`Failed to extract text from PDF: ${error.message || error}`);
  }

  if (!rawText || typeof rawText.trim !== "function" || !rawText.trim()) {
    throw new Error("Failed to extract readable text from the provided PDF.");
  }

  const cleanedText = rawText.trim();

  const prompt = `You are an accurate resume parser. Extract candidate details and return strictly valid JSON matching this schema: { "fullName": string, "email": string, "skills": string[], "experience": [{ "role": string, "company": string, "duration": string, "highlights": string[] }], "education": [{ "degree": string, "institution": string, "year": string }] }.\n\nText:\n${cleanedText}`;

  let response;
  try {
    response = await fetch("http://127.0.0.1:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3.2:1b",
        prompt,
        stream: false,
        format: "json",
      }),
    });
  } catch (error: any) {
    if (error.cause?.code === "ECONNREFUSED" || error.code === "ECONNREFUSED" || error.message.includes("fetch failed")) {
      throw new Error("Local Ollama server is not running on port 11434. Please run 'ollama serve' in your terminal.");
    }
    throw new Error(`Failed to communicate with Ollama: ${error.message}`);
  }

  if (!response.ok) {
    throw new Error(`Ollama API returned ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  try {
    return JSON.parse(data.response);
  } catch (err) {
    throw new Error("Model failed to produce valid JSON.");
  }
}
