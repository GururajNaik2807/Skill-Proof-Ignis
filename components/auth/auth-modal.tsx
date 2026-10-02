"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { normalizeRole, workspaceForRole } from "@/lib/auth/roles";
import { AlertCircle, ArrowRight, Building2, CheckCircle2, Code2, Loader2, ShieldCheck, X } from "lucide-react";
import { isPasswordValid, PasswordRequirements } from "@/components/auth/password-requirements";

export type AuthMode = "login" | "candidate" | "recruiter" | "signup";

export function AuthModal({ mode: initialMode, onClose }: { mode: AuthMode; onClose: () => void }) {
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
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const isLogin = currentMode === "login";

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      if (isLogin) {
        const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        if (loginError) throw loginError;
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
        const resolvedRole = normalizeRole(profile?.role) || normalizeRole(data.user.user_metadata?.role);
        if (!resolvedRole) throw new Error("Your account is missing a valid SkillProof role.");
        router.push(workspaceForRole(resolvedRole));
        router.refresh();
        return;
      }

      if (!isPasswordValid(password)) throw new Error("Please satisfy all password security requirements.");
      if (role === "recruiter" && !companyName.trim()) throw new Error("Company or team name is required for recruiters.");
      
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName.trim(), role, company_name: role === "recruiter" ? companyName.trim() : null },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (signupError) throw signupError;
      if (data.session) {
        router.push(role === "recruiter" ? "/recruiter/dashboard" : "/onboarding");
        router.refresh();
      } else {
        setSuccess("Account created. Check your email to verify your address.");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!email) {
      setError("Enter your email address first.");
      return;
    }
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password` });
    if (resetError) setError(resetError.message);
    else setSuccess("Check your email for a password reset link.");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto font-sans" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      {/* Backdrop Blur */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-md pointer-events-none"
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
        role="dialog" 
        aria-modal="true" 
        className="relative w-full max-w-md border border-white/10 rounded-2xl bg-[#0A0A0A] p-6 sm:p-8 shadow-[0_24px_80px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.08)] z-10 overflow-hidden"
      >
        {/* Top ambient radial light */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 bg-[#00E5FF]/15 blur-3xl pointer-events-none" />
        
        <button type="button" onClick={onClose} aria-label="Close authentication dialog" className="absolute right-5 top-5 p-1.5 rounded-lg text-[#8A8F98] hover:bg-white/5 border border-transparent hover:border-white/10 hover:text-[#EDEDED] transition-all cursor-pointer">
          <X className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-lg border border-[#00E5FF]/30 bg-[#00E5FF]/10 flex items-center justify-center shadow-[0_0_12px_rgba(0,229,255,0.15)]">
            <ShieldCheck className="w-5 h-5 text-[#00E5FF]" />
          </div>
          <div>
            <p className="font-semibold text-[#EDEDED] tracking-tight">SkillProof</p>
            <p className="text-[11px] text-[#8A8F98] font-mono tracking-wide">Secure Access</p>
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-[#EDEDED] tracking-tight">{isLogin ? "Welcome back" : "Create an account"}</h2>
        <p className="mt-2 text-sm text-[#8A8F98]">{isLogin ? "Log in to your evidence workspace." : "How will you use SkillProof?"}</p>
        
        {!isLogin && (
          <div className="grid grid-cols-2 gap-2 mt-6 p-1.5 bg-[#050505] rounded-xl border border-white/10">
            <button 
              type="button" 
              onClick={() => { setRole("candidate"); setError(""); }} 
              className={`flex items-center justify-center gap-2 py-2.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${role === "candidate" ? "bg-[#00E5FF]/10 text-[#EDEDED] border border-[#00E5FF]/30 shadow-[0_0_12px_rgba(0,229,255,0.15)]" : "border border-transparent text-[#8A8F98] hover:text-[#EDEDED] hover:bg-white/5"}`}
            >
              <Code2 className={`w-3.5 h-3.5 ${role === "candidate" ? "text-[#00E5FF]" : ""}`} /> Candidate
            </button>
            <button 
              type="button" 
              onClick={() => { setRole("recruiter"); setError(""); }} 
              className={`flex items-center justify-center gap-2 py-2.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${role === "recruiter" ? "bg-[#8B5CF6]/10 text-[#EDEDED] border border-[#8B5CF6]/30 shadow-[0_0_12px_rgba(139,92,246,0.15)]" : "border border-transparent text-[#8A8F98] hover:text-[#EDEDED] hover:bg-white/5"}`}
            >
              <Building2 className={`w-3.5 h-3.5 ${role === "recruiter" ? "text-[#8B5CF6]" : ""}`} /> Recruiter
            </button>
          </div>
        )}
        
        {error && (
          <div className="mt-5 flex items-center gap-2 rounded-lg border border-[#F05D5E]/20 bg-[#F05D5E]/10 p-3 text-xs text-[#F05D5E]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        {success && (
          <div className="mt-5 flex items-center gap-2 rounded-lg border border-[#00E599]/20 bg-[#00E599]/10 p-3 text-xs text-[#00E599]">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}
        
        <form onSubmit={submit} className="mt-6 space-y-4">
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium text-[#8A8F98] uppercase tracking-wider">Full Name</label>
              <input required value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder={role === "candidate" ? "Alex Morgan" : "Sarah Jenkins"} className="w-full rounded-lg border border-white/10 bg-[#050505] px-3.5 py-2.5 text-sm text-[#EDEDED] outline-none placeholder:text-[#8A8F98]/50 focus:border-[#00E5FF]/60 transition-colors" />
            </div>
          )}
          
          {!isLogin && role === "recruiter" && (
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium text-[#8A8F98] uppercase tracking-wider">Company Name</label>
              <input required value={companyName} onChange={(event) => setCompanyName(event.target.value)} placeholder="Acme Tech" className="w-full rounded-lg border border-white/10 bg-[#050505] px-3.5 py-2.5 text-sm text-[#EDEDED] outline-none placeholder:text-[#8A8F98]/50 focus:border-[#00E5FF]/60 transition-colors" />
            </div>
          )}
          
          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium text-[#8A8F98] uppercase tracking-wider">Email Address</label>
            <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@domain.com" className="w-full rounded-lg border border-white/10 bg-[#050505] px-3.5 py-2.5 text-sm text-[#EDEDED] outline-none placeholder:text-[#8A8F98]/50 focus:border-[#00E5FF]/60 transition-colors" />
          </div>
          
          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium text-[#8A8F98] uppercase tracking-wider">Password</label>
            <input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder={isLogin ? "Enter your password" : "Create a strong password"} className="w-full rounded-lg border border-white/10 bg-[#050505] px-3.5 py-2.5 text-sm text-[#EDEDED] outline-none placeholder:text-[#8A8F98]/50 focus:border-[#00E5FF]/60 transition-colors" />
          </div>
          
          {!isLogin && password.length > 0 && <PasswordRequirements value={password} />}
          
          <button disabled={loading} type="submit" className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#EDEDED] px-4 py-3 text-sm font-semibold text-[#050505] hover:bg-white shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : isLogin ? "Log In" : "Create Account"}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-6 flex flex-col items-center gap-3">
          {isLogin ? (
            <>
              <button type="button" onClick={resetPassword} className="text-xs font-medium text-[#8A8F98] hover:text-[#00E5FF] transition-colors cursor-pointer">
                Forgot your password?
              </button>
              <p className="text-xs text-[#8A8F98]">
                Don't have an account?{" "}
                <button type="button" onClick={() => { setCurrentMode("signup"); setError(""); }} className="font-semibold text-[#00E5FF] hover:underline cursor-pointer">
                  Sign up
                </button>
              </p>
            </>
          ) : (
            <p className="text-xs text-[#8A8F98]">
              Already have an account?{" "}
              <button type="button" onClick={() => { setCurrentMode("login"); setError(""); }} className="font-semibold text-[#00E5FF] hover:underline cursor-pointer">
                Log in
              </button>
            </p>
          )}
        </div>

      </motion.div>
    </div>
  );
}