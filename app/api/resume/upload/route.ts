import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractSkills, ExtractedSkill } from "@/lib/gemini/extractor";

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

    // 4. Extract structured skills with Gemini
    const extracted: ExtractedSkill[] = await extractSkills(parsedText);

    if (extracted.length > 0) {
      const skillsToInsert = extracted.map((s: ExtractedSkill) => ({
        user_id: user.id,
        resume_id: resumeRecord.id,
        skill_name: s.skill_name,
        category: s.category,
        claimed_context: s.claimed_context,
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
      skills: extracted.map((e: ExtractedSkill) => e.skill_name),
    });
  } catch (err: unknown) {
    console.error("Resume upload & parse error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}