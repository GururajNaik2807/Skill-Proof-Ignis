"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ShieldCheck, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PasswordRequirements, isPasswordValid } from "@/components/auth/password-requirements";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
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

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    } else {
      if (data?.session) {
        router.push("/dashboard");
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
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8 group">
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
              Create your account
            </h1>
            <p className="text-sm text-muted-text">
              Back your technical claims with verifiable GitHub evidence.
            </p>
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
              label="Full Name"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Alex Morgan"
            />

            <Input
              label="Email"
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

            {/* Interactive Password Requirements Box */}
            {password.length > 0 && (
              <PasswordRequirements value={password} />
            )}

            <Button
              type="submit"
              loading={loading}
              className="w-full mt-2"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-text mt-6">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-deep-green hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}