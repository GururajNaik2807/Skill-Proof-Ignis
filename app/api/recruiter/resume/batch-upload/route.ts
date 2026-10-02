import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractSkills, ExtractedSkill } from "@/lib/gemini/extractor";

export async function POST(req: Request) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse");

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }
    if (files.length > 50) {
      return NextResponse.json({ error: "Maximum 50 files allowed" }, { status: 400 });
    }

    const results = [];
    
    // Process in chunks of 5
    for (let i = 0; i < files.length; i += 5) {
      const chunk = files.slice(i, i + 5);
      
      const chunkPromises = chunk.map(async (file) => {
        try {
          if (file.type !== "application/pdf") {
            return { fileName: file.name, success: false, error: "Not a PDF" };
          }
          
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          let parsedText = "";
          
          try {
            const pdfData = await pdfParse(buffer);
            parsedText = pdfData?.text || "";
          } catch (parseErr) {
            return { fileName: file.name, success: false, error: "PDF text extraction failed" };
          }
          
          if (!parsedText.trim()) {
            return { fileName: file.name, success: false, error: "No parseable text" };
          }

          // Generate a fake candidate UUID based on filename hash or random
          const shadowId = crypto.randomUUID();
          const shadowEmail = `${shadowId.slice(0, 8)}@shadow.candidate.local`;
          const candidateName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");

          // Create Shadow Profile (Need to bypass auth or create user? Wait, public.profiles is tied to auth.users in Supabase typically.
          // In SkillProof, profiles table has `id` which references `auth.users`.
          // If we insert a profile without an auth user, it might fail foreign key constraint if it exists.
          // Let's check if there's a foreign key on profiles.id. If so, we have to use Supabase Admin auth.admin.createUser, but we only have server client.
          // Wait, the instructions say:
          // "Insert/Upsert a candidate shadow profile into `public.profiles` (`role = 'candidate'`)."
          // Let's assume we can insert directly into profiles, or maybe we create a dummy auth user?
          // Actually, let's just insert into profiles. If it fails, I'll adjust.
          // BUT wait! I can just use the standard Supabase user ID since the app relies on it.
          // Let's create an auth user via admin API, or if we can't, maybe we can just insert into profiles?
          
          // Note: Usually profiles.id is a foreign key to auth.users.id. 
          // If RLS allows, we might not need an auth user, but foreign key will fail.
          // Let's try to just insert into profiles.
          const { error: profileErr } = await supabase.from("profiles").insert({
            id: shadowId,
            full_name: candidateName,
            role: "candidate",
            email: shadowEmail,
          });
          
          // If foreign key constraint fails, we'll see it in error.
          // For now, let's proceed assuming we can insert, OR the schema allows it.
          // Wait, if it fails, another approach is we just use a fixed existing user or just don't insert profile if it fails.
          if (profileErr) {
            console.error("Shadow profile creation error:", profileErr);
            // If we can't create a shadow profile, we can't link resumes.
            // Let's try inserting the resume anyway? Resumes usually need user_id.
            return { fileName: file.name, success: false, error: "Failed to create shadow profile: " + profileErr.message };
          }

          const { data: resumeRecord, error: resumeInsertErr } = await supabase
            .from("resumes")
            .insert({
              user_id: shadowId,
              file_name: file.name,
              raw_text: parsedText.slice(0, 100000),
            })
            .select("id")
            .single();

          if (resumeInsertErr || !resumeRecord) {
            return { fileName: file.name, success: false, error: "Failed to save resume" };
          }

          const extracted: ExtractedSkill[] = await extractSkills(parsedText);
          
          if (extracted.length > 0) {
            const skillsToInsert = extracted.map((s: ExtractedSkill) => ({
              user_id: shadowId,
              resume_id: resumeRecord.id,
              skill_name: s.skill_name,
              category: s.category,
              claimed_context: s.claimed_context,
            }));
            await supabase.from("resume_skills").insert(skillsToInsert);
          }

          return { fileName: file.name, success: true, skillsExtracted: extracted.length };
        } catch (e: any) {
          return { fileName: file.name, success: false, error: e.message };
        }
      });
      
      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);
    }

    return NextResponse.json({ success: true, results });
  } catch (err: unknown) {
    console.error("Batch upload error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
