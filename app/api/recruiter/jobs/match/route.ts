import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/auth/roles";
import { calculateMatchScore, parseJobDescription } from "@/lib/gemini/job-matcher";

type CandidateEvidence = {
  skill_name: string;
  status: "proven" | "partial" | "claimed";
  confidence_score: number;
  evidence_summary: string | null;
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || (await getUserRole(supabase, user)) !== "recruiter") {
      return NextResponse.json({ error: "Recruiter access required" }, { status: 403 });
    }

    const { job_title, company_name, jd_text } = await request.json();
    if (!jd_text || jd_text.trim().length < 20) {
      return NextResponse.json({ error: "Please provide a job description with technical requirements." }, { status: 400 });
    }

    const parsedJob = await parseJobDescription(jd_text);
    const { data: candidates, error: candidateError } = await supabase
      .from("profiles")
      .select("id, full_name, github_username, avatar_url, bio")
      .eq("role", "candidate")
      .order("created_at", { ascending: false });
    if (candidateError) throw candidateError;

    const candidateIds = (candidates || []).map((candidate) => candidate.id);
    const { data: evidence, error: evidenceError } = candidateIds.length
      ? await supabase.from("skill_evidence").select("user_id, skill_name, status, confidence_score, evidence_summary").in("user_id", candidateIds)
      : { data: [], error: null };
    if (evidenceError) throw evidenceError;

    const results = (candidates || []).map((candidate) => {
      const candidateEvidence = ((evidence || []).filter((item) => item.user_id === candidate.id) as CandidateEvidence[]);
      const report = calculateMatchScore(parsedJob, candidateEvidence);
      return { ...candidate, report };
    }).sort((a, b) => b.report.match_percentage - a.report.match_percentage);

    const { data: jobRecord } = await supabase.from("job_descriptions").insert({
      user_id: user.id,
      role_title: job_title || parsedJob.role_title,
      raw_text: jd_text,
      extracted_skills: parsedJob.required_skills,
      match_score: results[0]?.report.match_percentage || 0,
    }).select("id").single();

    return NextResponse.json({
      success: true,
      job: {
        id: jobRecord?.id || null,
        title: job_title || parsedJob.role_title,
        company_name: company_name || null,
        required_skills: parsedJob.required_skills,
        preferred_skills: parsedJob.preferred_skills,
      },
      candidates: results,
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Recruiter job match failed" }, { status: 500 });
  }
}
