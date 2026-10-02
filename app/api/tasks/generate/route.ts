import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenAI, Type, Schema } from "@google/genai";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Strict Server-Side Guardrail: Check active (uncompleted) task count
    const { data: existingTasks, error: taskQueryError } = await supabase
      .from("micro_tasks")
      .select("id, status, skill_name")
      .eq("user_id", user.id);

    if (taskQueryError) {
      return NextResponse.json({ error: taskQueryError.message }, { status: 500 });
    }

    const activeTasks = (existingTasks || []).filter(
      (t) => t.status === "todo" || t.status === "in_progress"
    );

    if (activeTasks.length >= 2) {
      return NextResponse.json(
        {
          error: "You have 2 pending micro-tasks. Complete or submit them to unlock new challenges.",
          activeCount: activeTasks.length,
        },
        { status: 400 }
      );
    }

    // 2. Query Candidate's Unverified Claims & Partial Skills
    const [{ data: resumeSkills }, { data: evidenceList }] = await Promise.all([
      supabase.from("resume_skills").select("skill_name, claimed_context").eq("user_id", user.id),
      supabase.from("skill_evidence").select("skill_name, status, evidence_summary").eq("user_id", user.id),
    ]);

    const activeSkillNames = new Set(activeTasks.map((t) => t.skill_name.toLowerCase()));

    // Find skills needing evidence (claimed or partial, not already active in pending tasks)
    const targetGaps = (resumeSkills || []).filter((claim) => {
      if (activeSkillNames.has(claim.skill_name.toLowerCase())) return false;
      const ev = (evidenceList || []).find(
        (e) => e.skill_name.toLowerCase() === claim.skill_name.toLowerCase()
      );
      return !ev || ev.status === "claimed" || ev.status === "partial";
    });

    if (targetGaps.length === 0) {
      return NextResponse.json(
        { error: "No unverified resume skill gaps found to generate tasks for." },
        { status: 400 }
      );
    }

    // Select the primary gap
    const chosenGap = targetGaps[0];

    // 3. Configure Gemini with Strict Structured Outputs
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not configured" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const taskSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        skill: { type: Type.STRING },
        title: { type: Type.STRING, description: "Concrete, single-sentence objective title" },
        description: { type: Type.STRING, description: "Short technical context and business use case" },
        acceptanceCriteria: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Exactly 3 actionable, verifiable deliverables (e.g. specific test file, config path, or PR branch artifact)",
        },
        difficulty: { type: Type.STRING, enum: ["Intermediate", "Advanced"] },
        estimatedTime: { type: Type.STRING, description: "e.g., '1 - 2 hours'" },
      },
      required: ["skill", "title", "description", "acceptanceCriteria", "difficulty", "estimatedTime"],
    };

    const prompt = `You are a Principal Software Engineer designing a realistic portfolio micro-task for a developer.
The developer claimed proficiency in: "${chosenGap.skill_name}".
Context from resume: "${chosenGap.claimed_context || "General competency"}".

CRITICAL QUALITY RULES:
1. NEVER output passive or trivial assignments (DO NOT say "Read docs", "Add a comment", or "Learn basics").
2. The task MUST require writing code, integration tests, or architectural configuration in a repository.
3. Deliverables must be exact files that would serve as proof during an audit (e.g., Dockerfile multi-stage build, pytest test file with mock assertions, GitHub Actions workflow yaml).
4. Provide exactly 3 concise acceptance criteria specifying expected files/outcomes.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: taskSchema,
        temperature: 0.2,
      },
    });

    const parsedTask = JSON.parse(response.text || "{}");

    // 4. Insert into Supabase micro_tasks table
    const { data: insertedTask, error: insertError } = await supabase
      .from("micro_tasks")
      .insert({
        user_id: user.id,
        skill_name: parsedTask.skill || chosenGap.skill_name,
        title: parsedTask.title,
        description: parsedTask.description,
        difficulty: parsedTask.difficulty?.toLowerCase() || "intermediate",
        estimated_time: parsedTask.estimatedTime || "1-2 hours",
        deliverables: parsedTask.acceptanceCriteria || [],
        verification_target: parsedTask.acceptanceCriteria?.[0] || "Pass test suite in PR",
        status: "todo",
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      task: insertedTask,
    });
  } catch (error: unknown) {
    console.error("Task generation failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}