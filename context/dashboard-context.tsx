"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface Repository {
  id: string;
  repo_name: string;
  repo_url: string;
  primary_language: string | null;
  has_tests: boolean;
  has_docker: boolean;
  last_commit_at: string | null;
}

interface ResumeSkill {
  id: string;
  skill_name: string;
  claimed_context: string | null;
}

interface SkillEvidence {
  id: string;
  skill_name: string;
  status: "proven" | "partial" | "claimed";
  confidence_score: number;
  evidence_summary: string | null;
}

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

interface Profile {
  id: string;
  full_name: string | null;
  github_username: string | null;
  target_role: string | null;
  share_slug: string | null;
  last_scan_at: string | null;
  last_parse_at: string | null;
}

interface DashboardContextType {
  profile: Profile | null;
  repositories: Repository[];
  resumeSkills: ResumeSkill[];
  evidenceList: SkillEvidence[];
  tasks: MicroTask[];
  loading: boolean;
  refreshData: () => Promise<void>;
  updateTaskLocally: (taskId: string, nextStatus: MicroTask["status"]) => void;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

const STORAGE_KEY = "skillproof_global_cache";

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [resumeSkills, setResumeSkills] = useState<ResumeSkill[]>([]);
  const [evidenceList, setEvidenceList] = useState<SkillEvidence[]>([]);
  const [tasks, setTasks] = useState<MicroTask[]>([]);
  const [loading, setLoading] = useState(true);

  const isFetchingRef = useRef(false);

  const fetchFromDb = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        isFetchingRef.current = false;
        return;
      }

      // Single concurrent request batch across the application
      const [
        { data: prof },
        { data: repos },
        { data: skills },
        { data: ev },
        { data: taskData },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, github_username, target_role, share_slug, last_scan_at, last_parse_at")
          .eq("id", user.id)
          .single(),
        supabase
          .from("github_repositories")
          .select("id, repo_name, repo_url, primary_language, has_tests, has_docker, last_commit_at")
          .eq("user_id", user.id)
          .order("last_commit_at", { ascending: false }),
        supabase
          .from("resume_skills")
          .select("id, skill_name, claimed_context")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("skill_evidence")
          .select("id, skill_name, status, confidence_score, evidence_summary")
          .eq("user_id", user.id)
          .order("confidence_score", { ascending: false }),
        supabase
          .from("micro_tasks")
          .select("id, skill_name, title, description, difficulty, estimated_time, deliverables, verification_target, status")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      const statePayload = {
        profile: prof || null,
        repositories: repos || [],
        resumeSkills: skills || [],
        evidenceList: ev || [],
        tasks: taskData || [],
        timestamp: Date.now(),
      };

      setProfile(statePayload.profile as Profile);
      setRepositories(statePayload.repositories as Repository[]);
      setResumeSkills(statePayload.resumeSkills as ResumeSkill[]);
      setEvidenceList(statePayload.evidenceList as SkillEvidence[]);
      setTasks(statePayload.tasks as MicroTask[]);

      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(statePayload));
      } catch (err) {
        console.warn("Storage sync failed:", err);
      }
    } catch (err) {
      console.error("Dashboard Provider error:", err);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    // 1. Try reading from memory/sessionStorage first
    try {
      const cached = sessionStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        // Valid for 10 minutes unless invalidated
        if (Date.now() - parsed.timestamp < 10 * 60 * 1000) {
          setProfile(parsed.profile);
          setRepositories(parsed.repositories);
          setResumeSkills(parsed.resumeSkills);
          setEvidenceList(parsed.evidenceList);
          setTasks(parsed.tasks);
          setLoading(false);
          return;
        }
      }
    } catch {
      // Fall through to initial fetch
    }

    fetchFromDb();
  }, []);

  const refreshData = async () => {
    sessionStorage.removeItem(STORAGE_KEY);
    await fetchFromDb();
  };

  const updateTaskLocally = (taskId: string, nextStatus: MicroTask["status"]) => {
    setTasks((prev) => {
      const next = prev.map((t) => (t.id === taskId ? { ...t, status: nextStatus } : t));
      try {
        const cached = sessionStorage.getItem(STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          parsed.tasks = next;
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        }
      } catch {}
      return next;
    });
  };

  return (
    <DashboardContext.Provider
      value={{
        profile,
        repositories,
        resumeSkills,
        evidenceList,
        tasks,
        loading,
        refreshData,
        updateTaskLocally,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}