import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseJobDescription, calculateMatchScore } from "@/lib/gemini/job-matcher";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jd_text, role_title } = await request.json();

    if (!jd_text || jd_text.trim().length < 20) {
      return NextResponse.json(
        { error: "Please paste a realistic job description with technical requirements." },
        { status: 400 }
      );
    }

    // 1. Fetch user's existing skill evidence
    const { data: evidence, error: evError } = await supabase
      .from("skill_evidence")
      .select("skill_name, status, confidence_score, evidence_summary")
      .eq("user_id", user.id);

    if (evError) {
      return NextResponse.json({ error: evError.message }, { status: 500 });
    }

    // 2. Parse required skills from JD using Gemini
    const parsedJob = await parseJobDescription(jd_text);

    // 3. Deterministically compare against candidate evidence
    const matchReport = calculateMatchScore(parsedJob, evidence || []);

    // 4. Save parsed job record into job_descriptions table
    const { data: jobRecord } = await supabase
      .from("job_descriptions")
      .insert({
        user_id: user.id,
        role_title: role_title || "Evaluated Job",
        raw_text: jd_text,
        extracted_skills: parsedJob.map((p) => p.skill_name),
        match_score: matchReport.overall_score,
      })
      .select()
      .single();

    return NextResponse.json({
      success: true,
      jobId: jobRecord?.id,
      report: matchReport,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Job match evaluation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
