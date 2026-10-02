import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    // 1. Fetch unverified / claimed skills or evidence gaps
    const [skillsRes, evidenceRes] = await Promise.all([
      supabase
        .from("resume_skills")
        .select("skill_name, claimed_context")
        .eq("user_id", user.id),
      supabase
        .from("skill_evidence")
        .select("skill_name, status")
        .eq("user_id", user.id),
    ]);

    const claimedSkills = skillsRes.data || [];
    const evidenceList = evidenceRes.data || [];

    // Prioritize skills that are claimed-only or partial
    const provenSet = new Set(
      evidenceList
        .filter((e) => e.status === "proven")
        .map((e) => e.skill_name.toLowerCase())
    );

    const targetSkills = claimedSkills.filter(
      (s) => !provenSet.has(s.skill_name.toLowerCase())
    );

    const skillsToTarget = targetSkills.length > 0 ? targetSkills : claimedSkills;

    if (skillsToTarget.length === 0) {
      return NextResponse.json(
        { error: "No skills found. Upload a resume first to extract skills." },
        { status: 400 }
      );
    }

    // Generate up to 3 micro-tasks
    const chosen = skillsToTarget.slice(0, 3);

    const newTasks = chosen.map((item) => {
      const evidenceSummary = `Unit tests and modular architecture artifact for ${item.skill_name}`;
      const deliverablesList = [
        `Configured ${item.skill_name} test runner with passing unit assertions`,
        `Commit demonstrating modular architecture in a public repo`,
      ];

      return {
        user_id: user.id,
        skill_name: item.skill_name,
        title: `Implement ${item.skill_name} Test Suite & Integration`,
        description: `Build an isolated module demonstrating production patterns for ${item.skill_name}, including unit tests and automated CI signals.`,
        difficulty: "intermediate",
        estimated_time: "1.5 hours",
        deliverables: deliverablesList,
        // Supplies the required NOT NULL column
        evidence_created: evidenceSummary,
        verification_target: `Detect passing tests and recent commit signal for ${item.skill_name}`,
        status: "todo",
      };
    });

    const { error: insertError } = await supabase.from("micro_tasks").insert(newTasks);

    if (insertError) {
      console.error("Failed to insert micro tasks:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      tasksGenerated: newTasks.length,
    });
  } catch (err: unknown) {
    console.error("Micro-task generation error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}