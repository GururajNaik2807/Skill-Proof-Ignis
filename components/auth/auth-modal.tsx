"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { normalizeRole, workspaceForRole } from "@/lib/auth/roles";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Code2,
  Loader2,
  ShieldCheck,
  X,
  Eye,
  EyeOff,
  Check,
  Circle,
} from "lucide-react";

export type AuthMode = "login" | "candidate" | "recruiter" | "signup";

function checkPasswordStrength(password: string) {
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}

export function AuthModal({
  mode: initialMode,
  onClose,
}: {
  mode: AuthMode;
  onClose: () => void;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [currentMode, setCurrentMode] = useState<"login" | "signup">(
    initialMode === "login" ? "login" : "signup"
  );

  const [role, setRole] = useState<"candidate" | "recruiter">(
    initialMode === "recruiter" ? "recruiter" : "candidate"
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [accountExists, setAccountExists] = useState(false);

  const isLogin = currentMode === "login";

  const pStrength = checkPasswordStrength(password);
  const isPasswordValid = Object.values(pStrength).every(Boolean);
  const strengthScore = Object.values(pStrength).filter(Boolean).length;

  const getReturnUrl = () => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("returnTo");
    }
    return null;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setAccountExists(false);
    setLoading(true);

    try {
      const returnUrl = getReturnUrl();

      if (isLogin) {
        const { data, error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (loginError) throw loginError;

        if (returnUrl) {
          router.push(returnUrl);
          router.refresh();
          onClose();
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .maybeSingle();

        const resolvedRole =
          normalizeRole(profile?.role) || normalizeRole(data.user.user_metadata?.role);

        if (!resolvedRole)
          throw new Error("Your account is missing a valid SkillProof role.");

        router.push(workspaceForRole(resolvedRole));
        router.refresh();
        onClose();
        return;
      }

      if (!isPasswordValid)
        throw new Error("Please satisfy all password security requirements.");
      if (role === "recruiter" && !companyName.trim())
        throw new Error("Company or team name is required for recruiters.");

      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role,
            company_name: role === "recruiter" ? companyName.trim() : null,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      const isExistingUser =
        signupError?.message?.toLowerCase().includes("already registered") ||
        signupError?.message?.toLowerCase().includes("already exists") ||
        (data?.user && data.user.identities && data.user.identities.length === 0);

      if (isExistingUser) {
        setAccountExists(true);
        throw new Error("An account with this email already exists. You can sign in below.");
      }

      if (signupError) throw signupError;

      if (data.session) {
        if (returnUrl) {
          router.push(returnUrl);
        } else {
          router.push(role === "recruiter" ? "/recruiter/dashboard" : "/onboarding");
        }
        router.refresh();
        onClose();
      } else {
        setSuccess("Account created! Check your email to verify your address.");
      }
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Authentication failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!email) {
      setError("Enter your email address first.");
      return;
    }
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
    });
    if (resetError) setError(resetError.message);
    else setSuccess("Check your email for a password reset link.");
  };

  return (
    <div
      className="!fixed !inset-0 !z-[9999] !flex !items-center !justify-center p-4 overflow-y-auto font-sans"
      style={{ display: "flex", visibility: "visible", opacity: 1 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="!fixed !inset-0 bg-black/80 backdrop-blur-sm pointer-events-none !z-[9998]"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        role="dialog"
        aria-modal="true"
        className="!relative w-full max-w-[420px] border border-zinc-800 rounded-2xl bg-zinc-950 p-7 shadow-2xl !z-[10000] overflow-hidden text-zinc-100"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-5 top-5 p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-800 border border-transparent hover:border-zinc-700 hover:text-white transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800 w-fit mb-6 mx-auto">
          <button
            type="button"
            onClick={() => {
              setCurrentMode("login");
              setError("");
              setSuccess("");
              setAccountExists(false);
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              isLogin
                ? "bg-zinc-800 text-white shadow-sm border border-zinc-700"
                : "text-zinc-400 hover:text-white border border-transparent"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setCurrentMode("signup");
              setError("");
              setSuccess("");
              setAccountExists(false);
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              !isLogin
                ? "bg-zinc-800 text-white shadow-sm border border-zinc-700"
                : "text-zinc-400 hover:text-white border border-transparent"
            }`}
          >
            Create Account
          </button>
        </div>

        <div className="text-center mb-6">
          <div className="mx-auto w-10 h-10 rounded-xl border border-emerald-500/20 bg-emerald-500/10 flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {isLogin ? "Sign in to SkillProof" : "Create your account"}
          </h2>
        </div>

        {!isLogin && (
          <div className="grid grid-cols-2 gap-2 mb-5 p-1 bg-zinc-900 rounded-xl border border-zinc-800">
            <button
              type="button"
              onClick={() => {
                setRole("candidate");
                setError("");
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                role === "candidate"
                  ? "bg-zinc-800 text-white border border-zinc-700 shadow-sm"
                  : "border border-transparent text-zinc-400 hover:text-white"
              }`}
            >
              <Code2 className="w-3.5 h-3.5 text-cyan-400" /> Candidate
            </button>
            <button
              type="button"
              onClick={() => {
                setRole("recruiter");
                setError("");
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                role === "recruiter"
                  ? "bg-zinc-800 text-white border border-zinc-700 shadow-sm"
                  : "border border-transparent text-zinc-400 hover:text-white"
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-purple-400" /> Recruiter
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            <div className="flex-1">
              <span className="block leading-relaxed font-medium">{error}</span>
              {accountExists && (
                <button
                  type="button"
                  onClick={() => {
                    setCurrentMode("login");
                    setError("");
                    setAccountExists(false);
                  }}
                  className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-semibold transition-colors cursor-pointer border border-zinc-700"
                >
                  Switch to Sign In <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-2.5 text-[11px] text-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={submit} className="space-y-3.5">
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Full Name
              </label>
              <input
                required
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Alex Morgan"
                style={{ backgroundColor: "#18181b", color: "#ffffff" }}
                className="!bg-zinc-900 !text-white w-full rounded-xl border border-zinc-800 px-3.5 py-2.5 text-sm placeholder-zinc-500 outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/60 transition-all"
              />
            </div>
          )}

          {!isLogin && role === "recruiter" && (
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Company Name
              </label>
              <input
                required
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
                placeholder="Acme Inc"
                style={{ backgroundColor: "#18181b", color: "#ffffff" }}
                className="!bg-zinc-900 !text-white w-full rounded-xl border border-zinc-800 px-3.5 py-2.5 text-sm placeholder-zinc-500 outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/60 transition-all"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Email Address
            </label>
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@domain.com"
              style={{ backgroundColor: "#18181b", color: "#ffffff" }}
              className="!bg-zinc-900 !text-white w-full rounded-xl border border-zinc-800 px-3.5 py-2.5 text-sm placeholder-zinc-500 outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/60 transition-all"
            />
          </div>

          <div className="space-y-1.5 relative">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Password
              </label>
              {isLogin && (
                <button
                  type="button"
                  onClick={resetPassword}
                  className="text-[11px] font-medium text-zinc-400 hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <input
                required
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                style={{ backgroundColor: "#18181b", color: "#ffffff" }}
                className="!bg-zinc-900 !text-white w-full rounded-xl border border-zinc-800 px-3.5 py-2.5 pr-11 text-sm placeholder-zinc-500 outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/60 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors cursor-pointer z-10"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {!isLogin && password.length > 0 && (
              <div className="pt-1.5 space-y-2">
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4].map((idx) => (
                    <div
                      key={idx}
                      className={`h-1 flex-1 rounded-full transition-all ${
                        idx <= strengthScore
                          ? strengthScore === 4
                            ? "bg-emerald-400"
                            : strengthScore >= 3
                            ? "bg-emerald-400/80"
                            : "bg-amber-400"
                          : "bg-zinc-800"
                      }`}
                    />
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 text-[10px] font-mono">
                  <div className={`flex items-center gap-1.5 ${pStrength.length ? "text-emerald-400" : "text-zinc-500"}`}>
                    {pStrength.length ? <Check className="w-3 h-3" /> : <Circle className="w-3 h-3" />} 8+ chars
                  </div>
                  <div className={`flex items-center gap-1.5 ${pStrength.uppercase ? "text-emerald-400" : "text-zinc-500"}`}>
                    {pStrength.uppercase ? <Check className="w-3 h-3" /> : <Circle className="w-3 h-3" />} Uppercase
                  </div>
                  <div className={`flex items-center gap-1.5 ${pStrength.number ? "text-emerald-400" : "text-zinc-500"}`}>
                    {pStrength.number ? <Check className="w-3 h-3" /> : <Circle className="w-3 h-3" />} Number
                  </div>
                  <div className={`flex items-center gap-1.5 ${pStrength.special ? "text-emerald-400" : "text-zinc-500"}`}>
                    {pStrength.special ? <Check className="w-3 h-3" /> : <Circle className="w-3 h-3" />} Symbol
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            disabled={loading || (!isLogin && !isPasswordValid)}
            type="submit"
            style={{ 
              backgroundColor: "#ffffff", 
              color: "#09090b",
              opacity: loading || (!isLogin && !isPasswordValid) ? 0.4 : 1 
            }}
            className="!bg-white !text-black flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all cursor-pointer mt-4 shadow-[0_0_20px_rgba(255,255,255,0.15)] active:scale-[0.99] disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
            ) : isLogin ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div className="mt-6 flex flex-col items-center gap-3 border-t border-zinc-800 pt-4">
          {isLogin ? (
            <p className="text-xs text-zinc-400">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setCurrentMode("signup");
                  setError("");
                  setAccountExists(false);
                }}
                className="font-bold text-cyan-400 hover:underline cursor-pointer transition-colors"
              >
                Sign up
              </button>
            </p>
          ) : (
            <p className="text-xs text-zinc-400">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setCurrentMode("login");
                  setError("");
                  setAccountExists(false);
                }}
                className="font-bold text-cyan-400 hover:underline cursor-pointer transition-colors"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}