"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Code2,
  Building2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  PasswordRequirements,
  isPasswordValid,
} from "@/components/auth/password-requirements";

export default function SignupPage() {
  const [role, setRole] = useState<"candidate" | "recruiter">("candidate");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordValid(password)) {
      setErrorMsg("Please satisfy all password security requirements.");
      return;
    }

    if (role === "recruiter" && !companyName.trim()) {
      setErrorMsg("Company or organization name is required for recruiters.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          role: role,
          company_name: role === "recruiter" ? companyName.trim() : null,
          company_website: role === "recruiter" ? companyWebsite.trim() : null,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    } else {
      if (data?.session) {
        if (role === "recruiter") {
          router.push("/recruiter/dashboard");
        } else {
          router.push("/onboarding");
        }
        router.refresh();
      } else {
        setSuccessMsg(
          "Account created! Please check your email to verify your address before logging in."
        );
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-warm-ivory flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand */}
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-8 group">
          <div className="w-9 h-9 rounded-lg bg-deep-green flex items-center justify-center text-white transition-transform group-hover:scale-105">
            <ShieldCheck className="w-5 h-5 text-emerald" />
          </div>
          <span className="text-xl font-bold tracking-tight text-ink font-heading">
            SkillProof
          </span>
        </Link>

        {/* Card */}
        <div className="bg-white border border-border rounded-xl p-8 shadow-card">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-ink mb-1">
              Create an account
            </h1>
            <p className="text-xs text-muted-text">
              How will you use SkillProof?
            </p>
          </div>

          {/* Role Segmented Selector */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-soft-surface rounded-lg mb-6 border border-border">
            <button
              type="button"
              onClick={() => {
                setRole("candidate");
                setErrorMsg("");
              }}
              className={`flex items-center justify-center gap-2 py-2 rounded-md text-xs font-semibold transition-all ${
                role === "candidate"
                  ? "bg-white text-ink shadow-subtle border border-border/60"
                  : "text-muted-text hover:text-ink"
              }`}
            >
              <Code2 className="w-4 h-4 text-deep-green" />
              I&apos;m proving my own skills
            </button>
            <button
              type="button"
              onClick={() => {
                setRole("recruiter");
                setErrorMsg("");
              }}
              className={`flex items-center justify-center gap-2 py-2 rounded-md text-xs font-semibold transition-all ${
                role === "recruiter"
                  ? "bg-white text-ink shadow-subtle border border-border/60"
                  : "text-muted-text hover:text-ink"
              }`}
            >
              <Building2 className="w-4 h-4 text-deep-green" />
              I&apos;m hiring / evaluating candidates
            </button>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3 rounded-lg bg-status-error/10 border border-status-error/20 text-status-error text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3 rounded-lg bg-status-proven/10 border border-status-proven/20 text-status-proven text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <Input
              label={role === "candidate" ? "Full Name" : "Hiring Manager / Recruiter Name"}
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={role === "candidate" ? "e.g. Alex Morgan" : "e.g. Sarah Jenkins"}
            />

            {role === "recruiter" && (
              <>
                <Input
                  label="Company / Team Name"
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Acme Tech"
                />
                <Input
                  label="Company Website (Optional)"
                  type="url"
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                  placeholder="https://acme.dev"
                />
              </>
            )}

            <Input
              label="Work Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
            />

            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password"
            />

            {password.length > 0 && <PasswordRequirements value={password} />}

            <Button type="submit" loading={loading} className="w-full mt-2">
              {role === "candidate" ? "Create Candidate Account" : "Access Recruiter Portal"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-text mt-6">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-deep-green hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}