"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { ArrowRight, ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react";

export default function ResetPasswordPage() {
  const supabase = createClient();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 8 || password !== confirmPassword) {
      setError("Use at least 8 characters and make both passwords match.");
      return;
    }

    setLoading(true);
    setError("");
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
    } else {
      setMessage("Your password has been updated. You can now log in.");
      setTimeout(() => router.push("/login"), 1200);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#EDEDED] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] bg-[#00E5FF]/10 rounded-full blur-[140px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <Link href="/" className="flex items-center justify-center gap-2 mb-8 group">
          <div className="w-9 h-9 rounded-lg border border-[#00E5FF]/30 bg-[#00E5FF]/10 flex items-center justify-center text-white transition-colors group-hover:bg-[#00E5FF]/20 shadow-[0_0_12px_rgba(0,229,255,0.15)]">
            <ShieldCheck className="w-5 h-5 text-[#00E5FF]" />
          </div>
          <span className="text-xl font-bold tracking-tight text-[#EDEDED]">SkillProof</span>
        </Link>

        <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-8 shadow-[0_24px_80px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.05)] relative overflow-hidden">
          <h1 className="text-2xl font-bold text-[#EDEDED] mb-1 tracking-tight">Set a new password</h1>
          <p className="text-sm text-[#8A8F98] mb-6">Choose a new password for your SkillProof account.</p>

          {error && (
            <div className="mb-5 p-3 rounded-lg border border-[#F05D5E]/20 bg-[#F05D5E]/10 text-[#F05D5E] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="mb-5 p-3 rounded-lg border border-[#00E599]/20 bg-[#00E599]/10 text-[#00E599] text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#8A8F98] mb-1.5">New Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                className="w-full px-3.5 py-2.5 bg-[#050505] border border-white/10 rounded-lg text-sm text-[#EDEDED] placeholder-[#8A8F98]/50 focus:outline-none focus:border-[#00E5FF]/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8A8F98] mb-1.5">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Repeat your new password"
                className="w-full px-3.5 py-2.5 bg-[#050505] border border-white/10 rounded-lg text-sm text-[#EDEDED] placeholder-[#8A8F98]/50 focus:outline-none focus:border-[#00E5FF]/50 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-[#EDEDED] text-[#050505] hover:bg-white font-medium rounded-lg text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all disabled:opacity-60"
            >
              {loading ? "Updating..." : "Update Password"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#8A8F98] mt-6">
          Remember your password?{" "}
          <Link href="/login" className="font-medium text-[#00E5FF] hover:underline">
            Log in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}