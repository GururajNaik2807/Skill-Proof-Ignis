import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractSkillsFromResume } from "@/lib/gemini/extractor";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch latest uploaded resume for this user
    const { data: resume, error: resumeError } = await supabase
      .from("resumes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (resumeError || !resume || !resume.parsed_text) {
      return NextResponse.json(
        { error: "No resume text found. Please upload a resume first." },
        { status: 400 }
      );
    }

    // 2. Extract structured skills via Gemini
    const extractedSkills = await extractSkillsFromResume(resume.parsed_text);

    if (extractedSkills.length === 0) {
      return NextResponse.json(
        { error: "No skills could be identified in the uploaded document." },
        { status: 422 }
      );
    }

    // 3. Clear existing resume claims for freshness
    await supabase.from("resume_skills").delete().eq("user_id", user.id);

    // 4. Batch insert into resume_skills
    const insertPayload = extractedSkills.map((s) => ({
      resume_id: resume.id,
      user_id: user.id,
      skill_name: s.name,
      claimed_context: s.claimed_context,
    }));

    const { error: insertError } = await supabase
      .from("resume_skills")
      .insert(insertPayload);

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // 5. Also upsert canonical entries into public.skills catalog
    const catalogPayload = extractedSkills.map((s) => ({
      name: s.name,
      category: s.category,
    }));

    await supabase
      .from("skills")
      .upsert(catalogPayload, { onConflict: "name", ignoreDuplicates: true });

    return NextResponse.json({
      success: true,
      extractedCount: extractedSkills.length,
      skills: extractedSkills,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to extract skills";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}