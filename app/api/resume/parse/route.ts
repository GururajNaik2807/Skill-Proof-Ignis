import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractSkills, ExtractedSkill } from "@/lib/gemini/extractor";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: resume } = await supabase
      .from("resumes")
      .select("id, raw_text")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!resume || !resume.raw_text) {
      return NextResponse.json({ error: "No active resume found to re-parse" }, { status: 400 });
    }

    const extracted: ExtractedSkill[] = await extractSkills(resume.raw_text);

    await supabase.from("resume_skills").delete().eq("user_id", user.id);

    if (extracted.length > 0) {
      const toInsert = extracted.map((s: ExtractedSkill) => ({
        user_id: user.id,
        resume_id: resume.id,
        skill_name: s.skill_name,
        category: s.category,
        claimed_context: s.claimed_context,
      }));

      await supabase.from("resume_skills").insert(toInsert);
    }

    await supabase
      .from("profiles")
      .update({ last_parse_at: new Date().toISOString() })
      .eq("id", user.id);

    return NextResponse.json({
      success: true,
      extractedCount: extracted.length,
    });
  } catch (err: unknown) {
    console.error("Resume re-parse error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to parse skills" },
      { status: 500 }
    );
  }
}