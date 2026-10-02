"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { 
  Briefcase, CheckCircle2, ShieldCheck, Globe, 
  ArrowRight, Loader2, Code2, AlertCircle, FileText, UserCheck, LogIn 
} from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function PublicJobPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const supabase = createClient();
  
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [candidateProfile, setCandidateProfile] = useState<any>(null);
  const [candidateResume, setCandidateResume] = useState<any>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [notice, setNotice] = useState<{type: "success" | "error", text: string} | null>(null);

  const [applicationInfo, setApplicationInfo] = useState<any>(null);

  useEffect(() => {
    fetchJobAndUser();
  }, [resolvedParams.slug]);

  const fetchJobAndUser = async () => {
    setLoading(true);

    try {
      // 1. Fetch active job
      const { data: jobData, error: jobError } = await supabase
        .from("jobs")
        .select("*")
        .eq("share_slug", resolvedParams.slug)
        .eq("status", "active")
        .maybeSingle();

      if (jobError || !jobData) {
        setJob(null);
        setLoading(false);
        return;
      }

      // 2. Fetch company name
      let companyName = "Engineering Team";
      if (jobData.recruiter_id) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("company_name")
          .eq("id", jobData.recruiter_id)
          .maybeSingle();

        if (prof?.company_name) companyName = prof.company_name;
      }

      setJob({
        ...jobData,
        company_name: companyName,
      });

      // 3. Check authentication status
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (currentUser) {
        setUser(currentUser);

        // Fetch candidate profile, active resume, and application status in parallel
        const [profRes, resumeRes, appRes] = await Promise.all([
          supabase.from("profiles").select("id, full_name, github_username, role").eq("id", currentUser.id).single(),
          supabase.from("resumes").select("id, file_name, created_at").eq("user_id", currentUser.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
          supabase.from("job_applications").select("id, resume_id").eq("job_id", jobData.id).eq("candidate_id", currentUser.id).maybeSingle(),
        ]);

        if (profRes.data) setCandidateProfile(profRes.data);
        if (resumeRes.data) setCandidateResume(resumeRes.data);
        if (appRes.data) {
          setHasApplied(true);
          setApplicationInfo(appRes.data);
        }
      }
    } catch (err) {
      console.error("Error loading job:", err);
      setJob(null);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!user) {
      router.push(`/login?returnTo=/j/${resolvedParams.slug}`);
      return;
    }

    if (!candidateResume) {
      setNotice({ 
        type: "error", 
        text: "Please upload your resume in the Candidate Workspace before applying." 
      });
      return;
    }

    setIsApplying(true);
    setNotice(null);

    try {
      const { error } = await supabase.from("job_applications").insert({
        job_id: job.id,
        candidate_id: user.id,
        resume_id: candidateResume.id,
        status: "pending",
      });

      if (error) {
        if (error.code === '23505') throw new Error("You have already submitted an application for this role.");
        throw error;
      }

      setHasApplied(true);
      // We don't get the ID back immediately, but refresh or assume matching
      setApplicationInfo({ resume_id: candidateResume.id });
      setNotice({ type: "success", text: "Application and verified technical evidence submitted successfully!" });
    } catch (err: any) {
      setNotice({ type: "error", text: err.message || "Failed to submit application." });
    } finally {
      setIsApplying(false);
    }
  };

  const handleUpdateApplication = async () => {
    if (!applicationInfo?.id || !candidateResume) return;
    
    setIsApplying(true);
    setNotice(null);

    try {
      const { error } = await supabase.from("job_applications")
        .update({ resume_id: candidateResume.id, created_at: new Date().toISOString() })
        .eq("id", applicationInfo.id);

      if (error) throw error;

      setApplicationInfo({ ...applicationInfo, resume_id: candidateResume.id });
      setNotice({ type: "success", text: "Application updated with your latest resume!" });
    } catch (err: any) {
      setNotice({ type: "error", text: err.message || "Failed to update application." });
    } finally {
      setIsApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-center p-6">
        <AlertCircle className="w-12 h-12 text-zinc-600 mb-4" />
        <h1 className="text-2xl font-bold text-zinc-100 font-heading">Job post not found</h1>
        <p className="text-zinc-400 mt-2 text-sm">This position is closed or the share link has expired.</p>
        <Link href="/" className="mt-6 px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-800 text-xs">
          Return to SkillProof
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <header className="h-16 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md flex items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg font-heading tracking-tight">SkillProof</span>
        </Link>

        <div>
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-400 font-mono hidden sm:inline">
                Logged in as <strong className="text-zinc-200">{candidateProfile?.full_name || user.email}</strong>
              </span>
              <Link 
                href="/dashboard"
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-900 text-zinc-300 transition-colors"
              >
                Dashboard
              </Link>
              <form action="/auth/signout" method="POST">
                <button
                  type="submit"
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-900/50 hover:bg-red-900/20 text-red-400 transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </form>
            </div>
          ) : (
            <Link 
              href={`/login?returnTo=/j/${resolvedParams.slug}`}
              className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" /> Log in to Apply
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto p-6 md:py-12">
        {notice && (
          <div className={`mb-6 p-4 rounded-xl border flex items-center justify-between text-sm ${
            notice.type === "success" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}>
            <div className="flex items-center gap-2">
              {notice.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              {notice.text}
            </div>
          </div>
        )}

        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-8 shadow-2xl space-y-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold font-heading text-zinc-100">{job.title}</h1>
              <p className="text-zinc-400 mt-1 flex items-center gap-2 text-sm">
                <Briefcase className="w-4 h-4 text-emerald-400" /> 
                {job.company_name}
              </p>
            </div>
            <span className="px-3 py-1 bg-zinc-800 text-zinc-300 text-xs font-mono rounded-lg flex items-center gap-1.5 shrink-0">
              <Globe className="w-3.5 h-3.5" /> {job.job_type}
            </span>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <Code2 className="w-4 h-4 text-emerald-400" /> Target Technical Requirements
            </h3>
            <div className="flex flex-wrap gap-2">
              {job.required_skills?.map((skill: string) => (
                <span key={skill} className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm font-mono text-zinc-200">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Application Submission Box */}
          <div className="pt-6 border-t border-zinc-800/80">
            {hasApplied ? (
              <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-center space-y-4">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400 mx-auto">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-zinc-100">Application Submitted</h4>
                  <p className="text-xs text-zinc-400">
                    Your verified profile and attached resume are under review by {job.company_name}.
                  </p>
                </div>
                {candidateResume && applicationInfo?.resume_id !== candidateResume.id ? (
                  <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl text-left space-y-3 mt-4">
                    <p className="text-xs text-zinc-400">
                      We noticed you uploaded a newer resume (<span className="text-zinc-200">{candidateResume.file_name}</span>). Would you like to update your application with this resume?
                    </p>
                    <button
                      type="button"
                      onClick={handleUpdateApplication}
                      disabled={isApplying}
                      className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      {isApplying ? <Loader2 className="w-3 h-3 animate-spin" /> : "Update Application Resume"}
                    </button>
                  </div>
                ) : (
                  <div className="pt-2">
                    <Link href="/dashboard" className="text-xs font-semibold text-emerald-400 hover:underline">
                      View in Candidate Workspace →
                    </Link>
                  </div>
                )}
              </div>
            ) : user ? (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-zinc-100 font-heading border-b border-zinc-800 pb-2 mb-4">Application</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1.5">Full Name</label>
                    <input 
                      type="text" 
                      disabled
                      value={candidateProfile?.full_name || ""}
                      className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-500 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1.5">Email</label>
                    <input 
                      type="email" 
                      disabled
                      value={user.email || ""}
                      className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1.5">Resume [ Upload PDF ]</label>
                  {candidateResume ? (
                    <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm">
                      <span className="flex items-center gap-2"><FileText className="w-4 h-4" /> {candidateResume.file_name} attached</span>
                      <Link href="/profile" className="text-xs underline hover:text-emerald-300">Change</Link>
                    </div>
                  ) : (
                    <div className="p-4 border border-dashed border-zinc-800 bg-zinc-950 rounded-xl text-center">
                      <Link href="/profile" className="text-sm font-bold text-emerald-400 hover:underline">Upload Resume</Link>
                      <p className="text-xs text-zinc-500 mt-1">Required to apply</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1.5">Cover Letter [ Optional Text area ]</label>
                  <textarea 
                    placeholder="Why are you a good fit for this role?"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-zinc-100 outline-none h-24 resize-none"
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1.5">GitHub [ URL ]</label>
                    <input 
                      type="text" 
                      disabled
                      value={`github.com/${candidateProfile?.github_username || ""}`}
                      className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-500 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1.5">Portfolio [ Optional URL ]</label>
                    <input 
                      type="url" 
                      placeholder="https://"
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleApply}
                  disabled={isApplying || !candidateResume}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 text-sm font-bold rounded-xl transition-all shadow-sm disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isApplying ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Submit Application</>}
                </button>
              </div>
            ) : (
              <div className="text-center space-y-4 py-4">
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Log in or create a free Candidate profile to apply. Your public GitHub code will automatically verify against these requirements.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Link
                    href={`/login?returnTo=/j/${resolvedParams.slug}`}
                    className="px-5 py-2.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold rounded-lg transition-colors"
                  >
                    Log In
                  </Link>
                  <Link
                    href={`/signup?role=candidate&returnTo=/j/${resolvedParams.slug}`}
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 text-xs font-bold rounded-lg transition-colors shadow-sm"
                  >
                    Create Account & Apply
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}