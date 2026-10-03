import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { evaluateSkillAgainstRepos, ScannedRepoRecord } from "@/lib/evidence/classifier";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch user's claimed resume skills
    const { data: resumeSkills, error: skillsError } = await supabase
      .from("resume_skills")
      .select("skill_name")
      .eq("user_id", user.id);

    if (skillsError || !resumeSkills || resumeSkills.length === 0) {
      return NextResponse.json(
        { error: "No resume skills found. Please parse your resume first." },
        { status: 400 }
      );
    }

    // 2. Fetch user's scanned GitHub repositories
    const { data: repositories, error: reposError } = await supabase
      .from("github_repositories")
      .select("*")
      .eq("user_id", user.id);

    if (reposError || !repositories || repositories.length === 0) {
      return NextResponse.json(
        { error: "No GitHub repositories found. Please run a GitHub scan first." },
        { status: 400 }
      );
    }

    // 3. Clear previous evaluations for freshness
    await supabase.from("skill_evidence").delete().eq("user_id", user.id);

    // 4. Classify each claimed skill against repo signals
    const evaluationResults = resumeSkills.map((claim) =>
      evaluateSkillAgainstRepos(claim.skill_name, repositories as ScannedRepoRecord[])
    );

    // 5. Persist evaluations to public.skill_evidence
    const insertPayload = evaluationResults.map((result) => ({
      user_id: user.id,
      skill_name: result.skill_name,
      status: result.status,
      confidence_score: result.confidence_score,
      evidence_summary: result.evidence_summary,
      matched_repos: result.matched_repos,
    }));

    const { error: insertError } = await supabase
      .from("skill_evidence")
      .insert(insertPayload);

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    const provenTotal = evaluationResults.filter((r) => r.status === "proven").length;
    const partialTotal = evaluationResults.filter((r) => r.status === "partial").length;
    const claimedTotal = evaluationResults.filter((r) => r.status === "claimed").length;

    return NextResponse.json({
      success: true,
      evaluatedCount: evaluationResults.length,
      provenTotal,
      partialTotal,
      claimedTotal,
      results: evaluationResults,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Evidence evaluation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
