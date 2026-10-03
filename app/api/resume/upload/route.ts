import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  // Safe import for pdf-parse in Next.js / TypeScript
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse");

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("resume") as File | null;

    if (!file || file.type !== "application/pdf") {
      return NextResponse.json({ error: "Valid PDF file required" }, { status: 400 });
    }

    // 1. Convert File buffer to Node Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let parsedText = "";
    try {
      const pdfData = await pdfParse(buffer);
      parsedText = pdfData?.text || "";
    } catch (parseErr) {
      console.error("PDF text extraction error:", parseErr);
      return NextResponse.json(
        { error: "Could not read text from PDF. Ensure the file contains selectable text and is not an image scan." },
        { status: 400 }
      );
    }

    if (!parsedText.trim()) {
      return NextResponse.json(
        { error: "PDF has no parseable text. Please upload a standard text PDF resume." },
        { status: 400 }
      );
    }

    // 2. Clear old resume data (1-resume rule)
    await supabase.from("resumes").delete().eq("user_id", user.id);
    await supabase.from("resume_skills").delete().eq("user_id", user.id);

    // 3. Insert record for new resume
    const { data: resumeRecord, error: resumeInsertErr } = await supabase
      .from("resumes")
      .insert({
        user_id: user.id,
        file_name: file.name,
        raw_text: parsedText.slice(0, 100000),
      })
      .select("id")
      .single();

    if (resumeInsertErr || !resumeRecord) {
      throw new Error(resumeInsertErr?.message || "Failed to save resume record");
    }

    // 4. Extract structured skills with local Ollama
    const prompt = `You are a strict data extraction AI. Extract skills, experience, and education from the following resume text.
Return ONLY a valid JSON object with the following structure:
{
  "skills": [
    { "skill_name": "string", "category": "string", "claimed_context": "string" }
  ],
  "experience": [],
  "education": []
}
Resume Text:
${parsedText.slice(0, 15000)}`;

    const ollamaRes = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3",
        prompt: prompt,
        stream: false,
        format: "json",
      }),
    });

    if (!ollamaRes.ok) {
      throw new Error(`Ollama API error: ${ollamaRes.statusText}`);
    }

    const ollamaData = await ollamaRes.json();
    let extracted: any[] = [];
    try {
      const parsed = JSON.parse(ollamaData.response);
      extracted = parsed.skills || [];
    } catch (e) {
      console.error("Failed to parse Ollama JSON:", e);
      extracted = [];
    }

    if (extracted.length > 0) {
      const skillsToInsert = extracted.map((s: any) => ({
        user_id: user.id,
        resume_id: resumeRecord.id,
        skill_name: s.skill_name || "Unknown Skill",
        category: s.category || "General",
        claimed_context: s.claimed_context || null,
      }));

      const { error: skillsInsertErr } = await supabase
        .from("resume_skills")
        .insert(skillsToInsert);

      if (skillsInsertErr) {
        console.error("Error inserting resume skills:", skillsInsertErr);
      }
    }

    return NextResponse.json({
      success: true,
      fileName: file.name,
      skillsExtracted: extracted.length,
      skills: extracted.map((e: any) => e.skill_name),
    });
  } catch (err: unknown) {
    console.error("Resume upload & parse error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}