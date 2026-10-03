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
  AlertCircle,
  Loader2,
  GitPullRequest,
  Lock,
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
  const [submittingTaskId, setSubmittingTaskId] = useState<string | null>(null);
  const [prUrlInput, setPrUrlInput] = useState<{ [taskId: string]: string }>({});
  const [notice, setNotice] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // Strict Rule: Incomplete tasks cap (Max 2 Active / In-Progress)
  const activeTasks = (tasks || []).filter((t) => t.status === "todo" || t.status === "in_progress");
  const isCapped = activeTasks.length >= 2;

  const handleGenerateTask = async () => {
    if (isCapped) {
      setNotice({
        type: "info",
        message: "You have 2 pending micro-tasks. Complete or submit them to unlock new challenges.",
      });
      return;
    }

    setIsGenerating(true);
    setNotice(null);

    try {
      const res = await fetch("/api/tasks/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate task");
      }

      setNotice({
        type: "success",
        message: `Generated targeted challenge for "${data.task?.skill_name || "skill gap"}".`,
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

  const handleToggleComplete = async (taskId: string, isCurrentlyCompleted: boolean) => {
    const nextStatus: MicroTask["status"] = isCurrentlyCompleted ? "in_progress" : "completed";
    updateTaskLocally(taskId, nextStatus);

    try {
      const res = await fetch("/api/tasks/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, status: nextStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      await refreshData();
    } catch (err) {
      console.error(err);
      await refreshData();
    }
  };

  const handleSubmitProofLink = async (taskId: string) => {
    const prUrl = (prUrlInput[taskId] || "").trim();
    if (!prUrl) return;

    updateTaskLocally(taskId, "completed");
    setSubmittingTaskId(null);

    try {
      const res = await fetch("/api/tasks/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, status: "completed", pr_url: prUrl }),
      });
      if (!res.ok) throw new Error("Failed to submit PR link");

      setNotice({
        type: "success",
        message: "Proof artifact linked and task marked as completed.",
      });
      await refreshData();
    } catch (err) {
      console.error(err);
      await refreshData();
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-2.5 text-[#8A8F98] text-xs font-mono">
          <Loader2 className="w-4 h-4 animate-spin text-[#00E5FF]" />
          Synchronizing micro-tasks...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter text-[#EDEDED] font-sans pb-16 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/dashboard"
              prefetch={false}
              className="inline-flex items-center gap-1 text-xs text-[#8A8F98] hover:text-[#EDEDED] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </Link>
            <span className="text-white/20">/</span>
            <span className="text-xs text-[#00E5FF] font-mono">Proof Builder</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#EDEDED] flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-[#00E5FF]" /> Active Micro-Tasks
          </h1>
          <p className="text-xs text-[#8A8F98] mt-1">
            Concrete coding deliverables designed to convert resume gaps into audit-ready GitHub commits.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGenerateTask}
          disabled={isGenerating || isCapped}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
            isCapped
              ? "bg-white/[0.04] text-[#8A8F98] border border-white/[0.08] cursor-not-allowed opacity-60"
              : "bg-[#EDEDED] text-[#050507] hover:bg-white shadow-[0_0_20px_rgba(255,255,255,0.15)] active:scale-95"
          }`}
        >
          {isGenerating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : isCapped ? (
            <Lock className="w-3.5 h-3.5 text-[#8A8F98]" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-[#00E5FF]" />
          )}
          {isCapped ? "Task Limit Reached (2/2)" : "Generate Task"}
        </button>
      </div>

      {/* Notice / Status Banners */}
      {isCapped && !notice && (
        <div className="p-3.5 rounded-xl border border-white/[0.08] bg-[#0E0E12] text-xs text-[#8A8F98] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>You have 2 pending micro-tasks. Complete or submit them to unlock new challenges.</span>
          </div>
          <span className="font-mono text-[11px] text-amber-400 font-semibold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
            2/2 Active
          </span>
        </div>
      )}

      {notice && (
        <div
          role="status"
          className={`flex items-center justify-between rounded-xl border p-3.5 text-xs ${
            notice.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
              : notice.type === "info"
              ? "bg-[#00E5FF]/10 border-[#00E5FF]/20 text-[#00E5FF]"
              : "bg-[#F05D5E]/10 border-[#F05D5E]/20 text-[#F05D5E]"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notice.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span className="font-medium">{notice.message}</span>
          </div>
          <button
            onClick={() => setNotice(null)}
            className="font-mono text-[11px] underline opacity-80 hover:opacity-100 cursor-pointer ml-3"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Single-Column Focus View */}
      <div className="space-y-4">
        {activeTasks.length === 0 ? (
          <div className="p-12 rounded-2xl border border-dashed border-white/[0.08] bg-[#0A0A0C] text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[#8A8F98]">
              <Layers className="w-5 h-5 text-[#00E5FF]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-[#EDEDED]">No active tasks</h3>
              <p className="text-xs text-[#8A8F98] max-w-sm mx-auto">
                Generate a targeted challenge based on identified resume gaps. Each task produces a direct code artifact.
              </p>
            </div>
            <button
              type="button"
              onClick={handleGenerateTask}
              disabled={isGenerating}
              className="mt-2 px-3.5 py-2 bg-[#EDEDED] text-[#050507] hover:bg-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#00E5FF]" />
              Generate First Task
            </button>
          </div>
        ) : (
          activeTasks.slice(0, 2).map((task, index) => {
            const isCompleted = task.status === "completed";
            const isSubmitting = submittingTaskId === task.id;

            return (
              <div
                key={task.id}
                className="p-6 bg-[#0A0A0C] border border-white/[0.08] rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.6)] space-y-4 transition-all relative overflow-hidden"
              >
                {/* Accent Highlight Indicator */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00E5FF]" />

                {/* Card Header: Gap Pill & Time Estimate */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-[#00E5FF] bg-[#00E5FF]/10 border border-[#00E5FF]/20 px-2.5 py-0.5 rounded-md">
                      {task.skill_name}
                    </span>
                    <span className="text-[11px] font-mono text-[#8A8F98]">
                      • {task.difficulty || "Intermediate"}
                    </span>
                    <span className="text-[11px] font-mono text-[#8A8F98]">
                      • ~{task.estimated_time || "1-2 hours"}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                    Active Challenge {index + 1}
                  </span>
                </div>

                {/* Objective Title */}
                <div>
                  <h2 className="text-base font-semibold text-[#EDEDED] tracking-tight">
                    {task.title}
                  </h2>
                  {task.description && (
                    <p className="text-xs text-[#8A8F98] mt-1.5 leading-relaxed">
                      {task.description}
                    </p>
                  )}
                </div>

                {/* Acceptance Criteria / Expected Output (Max 3 Bullets) */}
                {task.deliverables && task.deliverables.length > 0 && (
                  <div className="p-3.5 rounded-xl border border-white/[0.06] bg-[#050507] space-y-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#8A8F98] block">
                      Acceptance Criteria (Deliverables)
                    </span>
                    <div className="space-y-1.5">
                      {task.deliverables.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs text-[#D1D5DB] font-mono">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="leading-tight">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Submission Drawer (PR / Repo Link Input) */}
                {isSubmitting && (
                  <div className="p-3.5 rounded-xl border border-[#00E5FF]/30 bg-[#0E0E12] space-y-2.5 animate-in fade-in duration-200">
                    <label className="block text-[11px] font-mono text-[#EDEDED]">
                      GitHub Pull Request / Commit URL:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="https://github.com/username/repo/pull/1"
                        value={prUrlInput[task.id] || ""}
                        onChange={(e) =>
                          setPrUrlInput({ ...prUrlInput, [task.id]: e.target.value })
                        }
                        className="flex-1 bg-[#050507] border border-white/[0.1] rounded-lg px-3 py-1.5 text-xs text-[#EDEDED] font-mono outline-none focus:border-[#00E5FF]"
                      />
                      <button
                        type="button"
                        onClick={() => handleSubmitProofLink(task.id)}
                        className="px-3 py-1.5 bg-[#EDEDED] text-[#050507] hover:bg-white text-xs font-semibold rounded-lg cursor-pointer"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => setSubmittingTaskId(null)}
                        className="px-2.5 py-1.5 text-xs text-[#8A8F98] hover:text-[#EDEDED] cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Actions Row */}
                <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => setSubmittingTaskId(isSubmitting ? null : task.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#00E5FF] hover:underline cursor-pointer font-mono"
                  >
                    <GitPullRequest className="w-3.5 h-3.5" />
                    {isSubmitting ? "Close input" : "Submit PR / Repo Link"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleComplete(task.id, isCompleted)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-[#EDEDED] transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Mark Completed
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Completed History Footnote */}
      {tasks.some((t) => t.status === "completed") && (
        <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-[#8A8F98]">
          <span>
            {tasks.filter((t) => t.status === "completed").length} verified challenges archived.
          </span>
          <Link href="/matrix" prefetch={false} className="text-[#00E5FF] hover:underline font-mono">
            View in Evidence Matrix →
          </Link>
        </div>
      )}
    </div>
  );
}
