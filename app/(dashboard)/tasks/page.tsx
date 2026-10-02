"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Layers,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Check,
  Circle,
  AlertCircle,
  Loader2,
  Target,
} from "lucide-react";
import { useDashboard } from "@/context/dashboard-context";

interface MicroTask {
  id: string;
  skill_name: string;
  title: string;
  description?: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimated_time: string;
  deliverables?: string[];
  verification_target?: string;
  status: "todo" | "in_progress" | "completed";
}

export default function MicroTasksPage() {
  const { tasks, loading, refreshData, updateTaskLocally } = useDashboard();
  const [isGenerating, setIsGenerating] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

const handleGenerateTasks = async () => {
    setIsGenerating(true);
    setNotice(null);

    try {
      const res = await fetch("/api/tasks/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error(
          `Server returned status ${res.status}. Check API route configuration.`
        );
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate tasks");

      setNotice({
        type: "success",
        message: `Generated ${data.tasksGenerated || 0} tailored coding tasks to convert your unverified skills into proven code.`,
      });
      await refreshData();
    } catch (err: unknown) {
      setNotice({
        type: "error",
        message: err instanceof Error ? err.message : "Task generation failed",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleStatus = async (taskId: string, currentStatus: MicroTask["status"]) => {
    const nextStatus =
      currentStatus === "todo"
        ? "in_progress"
        : currentStatus === "in_progress"
        ? "completed"
        : "todo";

    // Instant optimistic update across all views
    updateTaskLocally(taskId, nextStatus);

    try {
      const res = await fetch("/api/tasks/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, status: nextStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
    } catch (err) {
      console.error("Failed to update status:", err);
      await refreshData(); // Revert on error
    }
  };

  const completedCount = tasks.filter((t) => t.status === "completed").length;

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3 text-muted-text text-sm">
          <Loader2 className="w-5 h-5 animate-spin text-deep-green" />
          Loading your micro-tasks...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <Link
            href="/dashboard"
            prefetch={false}
            className="text-xs text-muted-text hover:text-ink flex items-center gap-1 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-ink flex items-center gap-2.5">
            <Layers className="w-7 h-7 text-deep-green" />
            Turn skill gaps into evidence
          </h1>
          <p className="text-xs sm:text-sm text-muted-text mt-1">
            Practical tasks based on the skills your evidence report says need work.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGenerateTasks}
          disabled={isGenerating}
          className="px-4 py-2 bg-deep-green text-white text-xs font-semibold rounded-lg hover:bg-deep-green/90 transition-colors flex items-center gap-1.5 shadow-subtle cursor-pointer disabled:opacity-50 w-fit"
        >
          {isGenerating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          Generate a task
        </button>
      </div>

      {/* Global Status Banner */}
      {notice && (
        <div
          role="status"
          className={`flex items-center justify-between rounded-xl border p-4 text-xs ${
            notice.type === "success"
              ? "bg-status-proven/10 border-status-proven/20 text-status-proven"
              : "bg-status-error/10 border-status-error/20 text-status-error"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notice.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span className="font-medium">{notice.message}</span>
          </div>
          <button
            onClick={() => setNotice(null)}
            className="font-semibold hover:underline text-[11px] ml-4 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Progress Metric Card */}
      <div className="p-5 bg-white border border-border rounded-xl shadow-subtle flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-muted-text uppercase tracking-wider block">
            Evidence-building progress
          </span>
          <p className="text-xl font-bold font-heading text-ink mt-0.5">
            {completedCount} of {tasks.length} Completed
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/matrix"
            prefetch={false}
            className="px-3.5 py-1.5 border border-border rounded-lg text-xs font-medium hover:bg-soft-surface transition-colors"
          >
            View Evidence Matrix
          </Link>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {tasks.length === 0 ? (
          <div className="p-12 bg-white border border-dashed border-border rounded-xl text-center">
            <Layers className="w-10 h-10 text-muted-text/40 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-ink">No evidence-building task yet</h3>
            <p className="text-xs text-muted-text max-w-sm mx-auto mt-1">
              Generate a task from your partial or claimed-only skills. Each task should create a concrete GitHub artifact.
            </p>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`p-6 bg-white border rounded-xl shadow-subtle space-y-4 transition-all ${
                task.status === "completed"
                  ? "border-status-proven/30 bg-status-proven/5"
                  : "border-border hover:border-deep-green/30"
              }`}
            >
              {/* Task Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(task.id, task.status)}
                    className="cursor-pointer text-muted-text hover:text-deep-green transition-colors"
                    title="Click to cycle status"
                  >
                    {task.status === "completed" ? (
                      <CheckCircle2 className="w-5 h-5 text-status-proven" />
                    ) : task.status === "in_progress" ? (
                      <Clock className="w-5 h-5 text-status-partial" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-text" />
                    )}
                  </button>

                  <div>
                    <h3 className={`text-base font-bold ${task.status === "completed" ? "line-through text-muted-text" : "text-ink"}`}>
                      {task.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-soft-surface border border-border text-ink">
                        {task.skill_name}
                      </span>
                      <span className="text-[11px] text-muted-text capitalize">
                        • {task.difficulty}
                      </span>
                      <span className="text-[11px] text-muted-text">
                        • {task.estimated_time}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleStatus(task.id, task.status)}
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md cursor-pointer border ${
                    task.status === "completed"
                      ? "bg-status-proven/10 text-status-proven border-status-proven/20"
                      : task.status === "in_progress"
                      ? "bg-status-partial/10 text-status-partial border-status-partial/20"
                      : "bg-soft-surface text-muted-text border-border"
                  }`}
                >
                  Status: {task.status.replace("_", " ")}
                </button>
              </div>

              {/* Task Description */}
              {task.description && (
                <p className="text-xs text-muted-text leading-relaxed">
                  {task.description}
                </p>
              )}

              {/* Deliverables List */}
              {task.deliverables && task.deliverables.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-ink uppercase tracking-wider block">
                    Evidence created
                  </span>
                  <div className="space-y-1">
                    {task.deliverables.map((d, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-muted-text">
                        <Check className="w-3.5 h-3.5 text-deep-green shrink-0" />
                        <span>{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Verification Signal Target */}
              {task.verification_target && (
                <div className="p-3 bg-soft-surface/50 border border-border rounded-lg flex items-center gap-2 text-xs">
                  <Target className="w-4 h-4 text-deep-green shrink-0" />
                  <span className="text-muted-text">
                    <strong className="text-ink">Goal:</strong> {task.verification_target}
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}