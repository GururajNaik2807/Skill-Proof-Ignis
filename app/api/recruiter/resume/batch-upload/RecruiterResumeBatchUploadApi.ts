import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { extractSkills, ExtractedSkill } from "@/lib/gemini/extractor";

export async function POST(req: Request) {
  try {
    // Polyfills for pdf-parse (pdfjs-dist) in Node environment
    if (typeof globalThis.DOMMatrix === "undefined") {
      (globalThis as any).DOMMatrix = class DOMMatrix {
        constructor() {}
      };
    }
    if (typeof globalThis.ImageData === "undefined") {
      (globalThis as any).ImageData = class ImageData {
        constructor() {}
      };
    }
    if (typeof globalThis.Path2D === "undefined") {
      (globalThis as any).Path2D = class Path2D {
        constructor() {}
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParseModule = require("pdf-parse");
    const pdfParse = pdfParseModule.default || pdfParseModule;
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
          } catch (parseErr: any) {
            console.error("PDF parse error:", parseErr);
            return { fileName: file.name, success: false, error: "PDF extraction failed: " + parseErr.message };
          }
          
          if (!parsedText.trim()) {
            return { fileName: file.name, success: false, error: "No parseable text" };
          }

          // Generate a fake candidate UUID based on filename hash or random
          const shadowEmail = `${crypto.randomUUID().slice(0, 8)}@shadow.candidate.local`;
          const candidateName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");

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
            console.error("Shadow auth creation error:", authCreateErr);
            return { fileName: file.name, success: false, error: "Failed to create shadow auth user: " + authCreateErr?.message };
          }

          const shadowId = authUser.user.id;

          const { error: profileErr } = await supabaseAdmin.from("profiles").insert({
            id: shadowId,
            full_name: candidateName,
            role: "candidate",
            email: shadowEmail,
          });
          
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
              file_url: "batch-upload",
              parsed_text: parsedText.slice(0, 100000),
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
  } catch (err: any) {
    console.error("Batch upload error:", err);
    return NextResponse.json({ error: "Parsing failed", details: err.message }, { status: 500 });
  }
}
