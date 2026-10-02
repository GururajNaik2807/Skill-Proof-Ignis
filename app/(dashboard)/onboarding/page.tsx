"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import {
  Check,
  User,
  GitBranch,
  FileUp,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  FileCheck,
} from "lucide-react";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const router = useRouter();
  const supabase = createClient();

  // Step 1: Profile State
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");

  // Step 2: GitHub State
  const [githubUsername, setGithubUsername] = useState("");
  const [isValidatingGithub, setIsValidatingGithub] = useState(false);
  const [githubProfile, setGithubProfile] = useState<{
    name: string;
    avatarUrl: string;
    publicRepos: number;
  } | null>(null);

  // Step 3: Resume State
  const [file, setFile] = useState<File | null>(null);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [resumeUploaded, setResumeUploaded] = useState(false);

  // General error handling
  const [errorMsg, setErrorMsg] = useState("");

  // Handler: Validate GitHub
  const handleValidateGithub = async () => {
    if (!githubUsername.trim()) return;
    setIsValidatingGithub(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/github/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: githubUsername.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "GitHub account not found");
        setGithubProfile(null);
      } else {
        setGithubProfile({
          name: data.name || data.username,
          avatarUrl: data.avatarUrl,
          publicRepos: data.publicRepos,
        });
      }
    } catch {
      setErrorMsg("Failed to connect to verification server");
    } finally {
      setIsValidatingGithub(false);
    }
  };

  // Handler: Resume Upload
  const handleUploadResume = async () => {
    if (!file) return;
    setIsUploadingResume(true);
    setErrorMsg("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/resume/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Upload failed");
      } else {
        setResumeUploaded(true);
        setStep(4);
      }
    } catch {
      setErrorMsg("Failed to upload file");
    } finally {
      setIsUploadingResume(false);
    }
  };

  // Handler: Finish Onboarding & Save Profile
  const handleFinishOnboarding = async () => {
    setErrorMsg("");
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          bio: bio,
          github_username: githubUsername,
          avatar_url: githubProfile?.avatarUrl,
        })
        .eq("id", user.id);
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      {/* Progress Steps Header */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-border">
        {[
          { num: 1, label: "Profile", icon: User },
          { num: 2, label: "GitHub", icon: GitBranch },
          { num: 3, label: "Resume", icon: FileUp },
          { num: 4, label: "Analysis", icon: Sparkles },
        ].map((s) => {
          const Icon = s.icon;
          const isDone = step > s.num;
          const isCurrent = step === s.num;
          return (
            <div key={s.num} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                  isDone
                    ? "bg-deep-green text-white"
                    : isCurrent
                    ? "border-2 border-deep-green text-deep-green bg-white"
                    : "border border-border text-muted-text bg-soft-surface"
                }`}
              >
                {isDone ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <span
                className={`text-xs font-medium hidden sm:inline ${
                  isCurrent ? "text-ink font-semibold" : "text-muted-text"
                }`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {errorMsg && (
        <div className="mb-6 p-3 rounded-lg bg-status-error/10 border border-status-error/20 text-status-error text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Step 1: Basic Profile */}
      {step === 1 && (
        <div className="bg-white border border-border rounded-xl p-6 shadow-subtle space-y-4">
          <div>
            <h2 className="text-xl font-bold font-heading">Candidate Profile</h2>
            <p className="text-xs text-muted-text mt-1">
              Confirm your name and engineering objectives.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Alex Morgan"
              className="w-full px-3.5 py-2.5 bg-warm-ivory/50 border border-border rounded-lg text-sm focus:outline-none focus:border-deep-green"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
              Short Bio or Target Role
            </label>
            <input
              type="text"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g. Full-Stack Engineer / Distributed Systems"
              className="w-full px-3.5 py-2.5 bg-warm-ivory/50 border border-border rounded-lg text-sm focus:outline-none focus:border-deep-green"
            />
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={() => {
                if (!fullName.trim()) {
                  setErrorMsg("Please provide your name.");
                  return;
                }
                setErrorMsg("");
                setStep(2);
              }}
              className="px-5 py-2.5 bg-deep-green text-white text-sm font-medium rounded-lg hover:bg-deep-green/90 transition-colors flex items-center gap-2 cursor-pointer"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: GitHub Account Connection */}
      {step === 2 && (
        <div className="bg-white border border-border rounded-xl p-6 shadow-subtle space-y-4">
          <div>
            <h2 className="text-xl font-bold font-heading">Connect GitHub</h2>
            <p className="text-xs text-muted-text mt-1">
              We inspect public commits, repositories, tests, and dependencies.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
              GitHub Username
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={githubUsername}
                onChange={(e) => setGithubUsername(e.target.value)}
                placeholder="e.g. torvalds"
                className="flex-1 px-3.5 py-2.5 bg-warm-ivory/50 border border-border rounded-lg text-sm focus:outline-none focus:border-deep-green"
              />
              <button
                type="button"
                onClick={handleValidateGithub}
                disabled={isValidatingGithub || !githubUsername}
                className="px-4 py-2 bg-soft-surface text-ink text-sm font-medium rounded-lg border border-border hover:bg-border/60 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isValidatingGithub ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Verify"
                )}
              </button>
            </div>
          </div>

          {githubProfile && (
            <div className="p-4 bg-warm-ivory/50 border border-border rounded-lg flex items-center gap-3">
              <Image
                src={githubProfile.avatarUrl}
                alt={githubProfile.name}
                width={44}
                height={44}
                className="rounded-full border border-border"
              />
              <div className="flex-1">
                <h4 className="text-sm font-bold">{githubProfile.name}</h4>
                <p className="text-xs text-muted-text">
                  {githubProfile.publicRepos} public repositories available for evidence scanning
                </p>
              </div>
              <span className="px-2.5 py-1 rounded bg-status-proven/10 text-status-proven text-xs font-semibold">
                Verified
              </span>
            </div>
          )}

          <div className="pt-4 flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 border border-border text-sm font-medium rounded-lg hover:bg-soft-surface transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={() => {
                if (!githubProfile) {
                  setErrorMsg("Please verify your GitHub profile first.");
                  return;
                }
                setErrorMsg("");
                setStep(3);
              }}
              disabled={!githubProfile}
              className="px-5 py-2.5 bg-deep-green text-white text-sm font-medium rounded-lg hover:bg-deep-green/90 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Resume PDF Upload */}
      {step === 3 && (
        <div className="bg-white border border-border rounded-xl p-6 shadow-subtle space-y-4">
          <div>
            <h2 className="text-xl font-bold font-heading">Upload Resume (PDF)</h2>
            <p className="text-xs text-muted-text mt-1">
              Upload your engineering resume to extract technical claims.
            </p>
          </div>

          <div className="border-2 border-dashed border-border rounded-xl p-8 text-center bg-warm-ivory/30 hover:bg-warm-ivory/60 transition-colors">
            <input
              type="file"
              id="resume-file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                const selected = e.target.files?.[0];
                if (selected) {
                  setFile(selected);
                  setErrorMsg("");
                }
              }}
            />
            <label
              htmlFor="resume-file"
              className="cursor-pointer flex flex-col items-center justify-center"
            >
              <div className="w-12 h-12 rounded-full bg-soft-surface flex items-center justify-center text-deep-green mb-3">
                <FileUp className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-ink">
                {file ? file.name : "Click or drag your PDF resume here"}
              </p>
              <p className="text-xs text-muted-text mt-1">
                PDF only, max file size 5MB
              </p>
            </label>
          </div>

          <div className="pt-4 flex justify-between">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 border border-border text-sm font-medium rounded-lg hover:bg-soft-surface transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={handleUploadResume}
              disabled={!file || isUploadingResume}
              className="px-5 py-2.5 bg-deep-green text-white text-sm font-medium rounded-lg hover:bg-deep-green/90 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isUploadingResume ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Upload & Continue
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Ready for Analysis */}
      {step === 4 && (
        <div className="bg-white border border-border rounded-xl p-8 shadow-card text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-status-proven/10 text-status-proven flex items-center justify-center mx-auto">
            <FileCheck className="w-6 h-6" />
          </div>

          <h2 className="text-xl font-bold font-heading">
            Onboarding Configuration Complete
          </h2>
          <p className="text-sm text-muted-text max-w-md mx-auto">
            Your profile, GitHub handle (@{githubUsername}), and resume have been
            stored securely. Next, SkillProof will index your repositories and
            extract your skills.
          </p>

          <div className="pt-4 flex justify-center">
            <button
              onClick={handleFinishOnboarding}
              className="px-6 py-3 bg-deep-green text-white font-medium rounded-lg hover:bg-deep-green/90 transition-colors flex items-center gap-2 cursor-pointer shadow-subtle"
            >
              Enter Dashboard & Launch Evidence Scan
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}