"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { workspaceForRole, normalizeRole } from "@/lib/auth/roles";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [noticeMsg, setNoticeMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setNoticeMsg("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    } else {
      const role = normalizeRole(data.user?.user_metadata?.role);
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();
      const resolvedRole = normalizeRole(profile?.role) ?? role;

      if (!resolvedRole) {
        setErrorMsg("Your account is missing a valid SkillProof role. Please contact support.");
        setLoading(false);
        return;
      }

      router.push(workspaceForRole(resolvedRole));
      router.refresh();
    }
  };

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      setErrorMsg("Enter your email address first.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setNoticeMsg("Check your email for a password reset link.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-lg bg-deep-green flex items-center justify-center text-white">
            <ShieldCheck className="w-5 h-5 text-emerald" />
          </div>
          <span className="text-xl font-bold tracking-tight text-ink font-heading">
            SkillProof
          </span>
        </div>

        {/* Card */}
        <div className="bg-white border border-border rounded-xl p-8 shadow-card">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-ink mb-1">Welcome back</h1>
            <p className="text-sm text-muted-text">
              Log in to verify your skills and review candidate evidence.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3 rounded-lg bg-status-error/10 border border-status-error/20 text-status-error text-sm">
              {errorMsg}
            </div>
          )}

          {noticeMsg && (
            <div className="mb-5 p-3 rounded-lg bg-status-proven/10 border border-status-proven/20 text-status-proven text-sm">
              {noticeMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  disabled={loading}
                  className="text-[11px] font-medium text-deep-green hover:underline disabled:opacity-50"
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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
                  Log In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-text mt-6">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-deep-green hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}