import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { parseResumeWithOllama } from "@/lib/ollama-parser";

export async function POST(req: Request) {
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
          let extracted: any;
          try {
            extracted = await parseResumeWithOllama(Buffer.from(arrayBuffer));
          } catch (ollamaErr: any) {
            console.error("Parsing failed:", ollamaErr);
            return { fileName: file.name, success: false, error: ollamaErr.message || "Parsing failed" };
          }
          
          // Generate a fake candidate UUID based on filename hash or random
          const shadowEmail = `${crypto.randomUUID().slice(0, 8)}@shadow.candidate.local`;
          const candidateName = extracted?.fullName || file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");

          const supabaseAdmin = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          );

          const { data: authUser, error: authCreateErr } = await supabaseAdmin.auth.admin.createUser({
            email: shadowEmail,
            email_confirm: true,
            password: crypto.randomUUID(),
          });

          if (authCreateErr || !authUser.user) {
            return { fileName: file.name, success: false, error: "Failed to create shadow auth user" };
          }

          const shadowId = authUser.user.id;

          const { error: profileErr } = await supabaseAdmin.from("profiles").upsert({
            id: shadowId,
            full_name: candidateName,
            role: "candidate",
            parsed_experience: extracted?.experience,
            education: extracted?.education,
          });
          
          if (profileErr) {
            console.error("Profile Error:", profileErr);
            return { fileName: file.name, success: false, error: "Failed to create shadow profile: " + profileErr.message };
          }

          const { data: resumeRecord, error: resumeInsertErr } = await supabase
            .from("resumes")
            .insert({
              user_id: shadowId,
              file_name: file.name,
              file_url: "batch-upload",
              parsed_text: JSON.stringify(extracted).slice(0, 100000),
            })
            .select("id")
            .single();

          if (resumeInsertErr || !resumeRecord) {
            return { fileName: file.name, success: false, error: "Failed to save resume" };
          }

          const skillsList: string[] = Array.isArray(extracted?.skills) ? extracted.skills : [];
          
          if (skillsList.length > 0) {
            const skillsToInsert = skillsList.map((skill: string) => ({
              user_id: shadowId,
              resume_id: resumeRecord.id,
              skill_name: skill,
              category: "Extracted",
              claimed_context: "Parsed by Ollama",
            }));
            await supabase.from("resume_skills").insert(skillsToInsert);
          }

          return { 
            fileName: file.name, 
            success: true, 
            skillsExtracted: skillsList.length,
            profile: {
              id: shadowId,
              full_name: candidateName,
              skills: skillsList,
              experience: extracted?.experience,
              education: extracted?.education
            }
          };
        } catch (e: any) {
          return { fileName: file.name, success: false, error: e.message };
        }
      });
      
      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);
    }

    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    console.error("Batch upload error:", err);
    return NextResponse.json({ error: "Parsing failed", details: err.message }, { status: 500 });
  }
}
