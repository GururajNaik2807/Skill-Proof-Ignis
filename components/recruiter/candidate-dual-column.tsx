"use client";

import { useState } from "react";
import { Plus, CheckCircle2, AlertCircle, Github, GitBranch, Terminal } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function CandidateDualColumn({ 
  resumeSkills, 
  evidence, 
  repositories,
  candidateId 
}: { 
  resumeSkills: any[]; 
  evidence: any[]; 
  repositories: any[];
  candidateId: string;
}) {
  const supabase = createClient();
  const [skills, setSkills] = useState(resumeSkills);
  const [newSkill, setNewSkill] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    setIsAdding(true);

    try {
      // Mock inserting a new resume skill, in reality you'd call a dedicated endpoint
      // and re-trigger EvidenceEvaluateApi
      const newSkillObj = {
        user_id: candidateId,
        skill_name: newSkill,
        category: "Manual Entry",
        claimed_context: "Added by recruiter",
      };

      const { data, error } = await supabase.from("resume_skills").insert(newSkillObj).select().single();
      
      if (!error && data) {
        setSkills([...skills, data]);
      }
      setNewSkill("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6 mt-8">
      {/* Left Column: Claimed Skills */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col h-[600px]">
        <div className="p-5 border-b border-zinc-800 bg-zinc-950/50">
          <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-400" /> Parsed Resume Skills
          </h3>
          <p className="text-sm text-zinc-400 mt-1">Skills extracted via local Ollama parsing.</p>
        </div>
        
        <div className="p-5 flex-1 overflow-y-auto space-y-3">
          {skills.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-10">No skills parsed.</p>
          ) : (
            skills.map((skill) => {
              const hasEvidence = evidence.some(e => e.skill_name.toLowerCase() === skill.skill_name.toLowerCase() && e.status !== "claimed");
              return (
                <div key={skill.id || skill.skill_name} className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center justify-between group">
                  <span className="text-sm font-bold text-zinc-200">{skill.skill_name}</span>
                  {hasEvidence ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="p-5 border-t border-zinc-800 bg-zinc-950/80">
          <form onSubmit={handleAddSkill} className="flex gap-2">
            <input 
              type="text" 
              placeholder="Manually add a skill..." 
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
            />
            <button 
              type="submit" 
              disabled={isAdding || !newSkill.trim()}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 text-sm font-bold rounded-lg transition-colors flex items-center justify-center"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Right Column: GitHub Evidence */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col h-[600px]">
        <div className="p-5 border-b border-zinc-800 bg-zinc-950/50">
          <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <Github className="w-5 h-5 text-emerald-400" /> GitHub Evidence Map
          </h3>
          <p className="text-sm text-zinc-400 mt-1">Cross-referenced signals from GitHub Scanner.</p>
        </div>

        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {evidence.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-10">No evidence found.</p>
          ) : (
            evidence.map(ev => {
              const matchedRepos = ev.matched_repos || [];
              const isVerified = ev.status === "proven";
              const isPartial = ev.status === "partial";

              return (
                <div key={ev.id} className={`p-4 rounded-xl border ${isVerified ? "border-emerald-500/30 bg-emerald-500/5" : isPartial ? "border-amber-500/30 bg-amber-500/5" : "border-zinc-800 bg-zinc-950"}`}>
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-base font-bold text-zinc-100">{ev.skill_name}</h4>
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${isVerified ? "bg-emerald-500/20 text-emerald-400" : isPartial ? "bg-amber-500/20 text-amber-400" : "bg-zinc-800 text-zinc-500"}`}>
                      {ev.status}
                    </span>
                  </div>
                  
                  {matchedRepos.length > 0 ? (
                    <div className="space-y-2 mt-3">
                      {matchedRepos.map((repo: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-zinc-300">
                          <GitBranch className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                          <span className="truncate">{repo.name}</span>
                          <span className="text-xs text-zinc-500 font-mono ml-auto shrink-0">
                            AST Match
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500 italic mt-2">No direct repository links found.</p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
