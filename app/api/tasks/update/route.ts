import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId, status } = await request.json();

    if (!taskId || !["todo", "in_progress", "completed"].includes(status)) {
      return NextResponse.json({ error: "Invalid task update parameters" }, { status: 400 });
    }

    const { error } = await supabase
      .from("micro_tasks")
      .update({ status })
      .eq("id", taskId)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, taskId, status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update task";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}