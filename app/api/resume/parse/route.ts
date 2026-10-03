import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseResumeWithOllama } from "@/lib/ollama-parser";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let parsedData;
    
    try {
      parsedData = await parseResumeWithOllama(buffer);
    } catch (ollamaErr: any) {
      return NextResponse.json({ success: false, error: ollamaErr.message }, { status: 500 });
    }

    // Insert Resume Record
    const { data: resume } = await supabase
      .from("resumes")
      .insert({
        user_id: user.id,
        file_name: file.name,
        file_url: "local-upload",
        parsed_text: JSON.stringify(parsedData)
      })
      .select("id")
      .single();

    if (resume && parsedData.skills && parsedData.skills.length > 0) {
      // Clear old skills
      await supabase.from("resume_skills").delete().eq("user_id", user.id);
      
      const toInsert = parsedData.skills.map((skill: string) => ({
        user_id: user.id,
        resume_id: resume.id,
        skill_name: skill,
        category: "Extracted",
        claimed_context: "Parsed by Ollama",
      }));
      await supabase.from("resume_skills").insert(toInsert);
    }

    // Update Profile
    await supabase.from("profiles").update({
      full_name: parsedData.fullName || undefined,
      parsed_experience: parsedData.experience,
      education: parsedData.education,
      updated_at: new Date().toISOString(),
      last_parse_at: new Date().toISOString()
    }).eq("id", user.id);

    return NextResponse.json({
      success: true,
      profile: parsedData
    });
  } catch (err: unknown) {
    console.error("Resume parse error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}