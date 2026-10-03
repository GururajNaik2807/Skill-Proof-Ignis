"use client";

import { useState } from "react";
import { UploadCloud, Loader2, GitBranch, ArrowRight, FileText } from "lucide-react";
import { useRouter } from "next/navigation";

export function QuickParseDropzone() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [githubHandle, setGithubHandle] = useState("");
  const [showGithubPrompt, setShowGithubPrompt] = useState(false);
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parsedProfile, setParsedProfile] = useState<any>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.type !== "application/pdf") {
      setError("Only standard text PDF files are supported.");
      return;
    }
    
    setFile(selected);
    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("files", selected); // Batch API expects "files"

      const res = await fetch("/api/recruiter/resume/batch-upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload resume.");
      
      const result = data.results?.[0];
      if (!result?.success) throw new Error(result?.error || "Parsing failed");

      if (result.profile) {
        setParsedProfile(result.profile);
      }
      
      setShowGithubPrompt(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleGithubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubHandle) return;
    
    // In a real app we'd attach this to the candidate profile we just created.
    // For now, we'll route to the candidates pipeline so they can review the new candidate.
    router.push(`/recruiter/candidates`);
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 mb-8">
      <h2 className="text-xl font-bold text-zinc-100 mb-2 flex items-center gap-2">
        <FileText className="w-5 h-5 text-cyan-400" /> Quick Parse & Compare
      </h2>
      <p className="text-sm text-zinc-400 mb-6">
        Upload a candidate's resume PDF. We'll use local Llama 3.2 to parse skills and map them to GitHub evidence.
      </p>

      {!showGithubPrompt ? (
        <div className="relative">
          <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all ${isUploading ? 'border-cyan-500 bg-cyan-500/5 shadow-[0_0_12px_rgba(0,229,255,0.15)]' : 'border-zinc-700 bg-zinc-950/50 hover:bg-zinc-900'}`}>
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {isUploading ? (
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-2" />
              ) : (
                <UploadCloud className="w-8 h-8 text-zinc-500 mb-2" />
              )}
              <p className={`mb-2 text-sm font-semibold ${isUploading ? 'text-cyan-400' : 'text-zinc-400'}`}>
                {isUploading ? "Parsing resume locally with Llama 3.2..." : <><span className="text-cyan-400">Click to upload</span> or drag and drop</>}
              </p>
              <p className="text-xs text-zinc-500">PDF (MAX. 10MB)</p>
            </div>
            <input type="file" className="hidden" accept="application/pdf" onChange={handleFileChange} disabled={isUploading} />
          </label>
          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in duration-300">
          {parsedProfile && (
            <div className="p-4 rounded-xl bg-[#0D0D0D] border border-white/10 shadow-lg">
              <h3 className="text-lg font-bold text-zinc-100">{parsedProfile.full_name}</h3>
              {parsedProfile.skills?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {parsedProfile.skills.slice(0, 8).map((s: string) => (
                    <span key={s} className="px-2 py-1 text-[10px] font-mono rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                      {s}
                    </span>
                  ))}
                  {parsedProfile.skills.length > 8 && (
                    <span className="px-2 py-1 text-[10px] font-mono rounded-md bg-zinc-800 text-zinc-400">+{parsedProfile.skills.length - 8} more</span>
                  )}
                </div>
              )}
              {parsedProfile.experience?.[0] && (
                <p className="text-xs text-zinc-400 mt-3 truncate">
                  <span className="font-semibold text-zinc-300">Latest Role:</span> {parsedProfile.experience[0].role} at {parsedProfile.experience[0].company}
                </p>
              )}
            </div>
          )}
          <form onSubmit={handleGithubSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Candidate's GitHub Handle (e.g. torvalds)"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              value={githubHandle}
              onChange={(e) => setGithubHandle(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="shrink-0 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-600 shadow-[0_0_12px_rgba(0,229,255,0.15)] text-zinc-950 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2">
            Cross-Reference <ArrowRight className="w-4 h-4" />
          </button>
        </form>
        </div>
      )}
    </div>
  );
}
