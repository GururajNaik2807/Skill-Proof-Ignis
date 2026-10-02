import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateMicroTasks } from "@/lib/gemini/task-generator";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: existingTasks, error: taskQueryError } = await supabase
      .from("micro_tasks")
      .select("id, status, skill_name")
      .eq("user_id", user.id);

    if (taskQueryError) return NextResponse.json({ error: "Unable to read existing tasks." }, { status: 500 });

    const activeTasks = (existingTasks || []).filter((task) => task.status === "todo" || task.status === "in_progress");
    if (activeTasks.length >= 2) {
      return NextResponse.json({ error: "You have 2 pending micro-tasks. Complete or submit them to unlock new challenges.", activeCount: activeTasks.length }, { status: 400 });
    }

    const [{ data: resumeSkills }, { data: evidenceList }, { data: profile }] = await Promise.all([
      supabase.from("resume_skills").select("skill_name, claimed_context").eq("user_id", user.id),
      supabase.from("skill_evidence").select("skill_name, status, evidence_summary").eq("user_id", user.id),
      supabase.from("profiles").select("target_role").eq("id", user.id).maybeSingle(),
    ]);

    const activeSkillNames = new Set(activeTasks.map((task) => task.skill_name.toLowerCase()));
    const targetGaps = (resumeSkills || []).filter((claim) => {
      if (activeSkillNames.has(claim.skill_name.toLowerCase())) return false;
      const evidence = (evidenceList || []).find((item) => item.skill_name.toLowerCase() === claim.skill_name.toLowerCase());
      return !evidence || evidence.status === "claimed" || evidence.status === "partial";
    });

    if (targetGaps.length === 0) return NextResponse.json({ error: "No unverified resume skill gaps found to generate tasks for." }, { status: 400 });

    const generatedTasks = await generateMicroTasks(targetGaps.slice(0, 3).map((gap) => ({
      skill_name: gap.skill_name,
      status: ((evidenceList || []).find((item) => item.skill_name.toLowerCase() === gap.skill_name.toLowerCase())?.status || "claimed") as "partial" | "claimed",
      claimed_context: gap.claimed_context,
    })), profile?.target_role || undefined);

    const task = generatedTasks[0];
    if (!task) return NextResponse.json({ error: "No task could be generated from the available skill gaps." }, { status: 422 });

    const { data: insertedTask, error: insertError } = await supabase.from("micro_tasks").insert({
      user_id: user.id,
      skill_name: task.skill_name,
      title: task.title,
      description: task.description,
      difficulty: task.difficulty,
      estimated_time: task.estimated_time,
      deliverables: task.deliverables,
      verification_target: task.verification_target,
      status: "todo",
    }).select().single();

    if (insertError) return NextResponse.json({ error: "Task was generated but could not be saved." }, { status: 500 });
    return NextResponse.json({ success: true, task: insertedTask });
  } catch (error: unknown) {
    console.error("Task generation failed:", error);
    return NextResponse.json({ error: "We couldn't generate a task right now. Please try again shortly." }, { status: 503 });
  }
}
