"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ShieldCheck, ArrowRight, Loader2 } from "lucide-react";

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
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-lg bg-deep-green flex items-center justify-center text-white">
            <ShieldCheck className="w-5 h-5 text-emerald" />
          </div>
          <span className="text-xl font-bold tracking-tight text-ink font-heading">
            SkillProof
          </span>
        </div>

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
            <div className="mb-5 p-3 rounded-lg bg-status-error/10 border border-status-error/20 text-status-error text-sm">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3 rounded-lg bg-status-proven/10 border border-status-proven/20 text-status-proven text-sm">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ada Lovelace"
                className="w-full px-3.5 py-2.5 bg-warm-ivory/50 border border-border rounded-lg text-sm text-ink placeholder:text-muted-text/60 focus:outline-none focus:border-deep-green focus:ring-1 focus:ring-deep-green transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full px-3.5 py-2.5 bg-warm-ivory/50 border border-border rounded-lg text-sm text-ink placeholder:text-muted-text/60 focus:outline-none focus:border-deep-green focus:ring-1 focus:ring-deep-green transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-3.5 py-2.5 bg-warm-ivory/50 border border-border rounded-lg text-sm text-ink placeholder:text-muted-text/60 focus:outline-none focus:border-deep-green focus:ring-1 focus:ring-deep-green transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-deep-green text-white font-medium rounded-lg text-sm hover:bg-deep-green/90 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
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