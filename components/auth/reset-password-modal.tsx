"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { ShieldCheck, ArrowRight, AlertCircle, CheckCircle2, X } from "lucide-react";

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin?: () => void;
}

export function ResetPasswordModal({
  isOpen,
  onClose,
  onSwitchToLogin,
}: ResetPasswordModalProps) {
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
      setTimeout(() => {
        onClose();
        if (onSwitchToLogin) {
          onSwitchToLogin();
        } else {
          router.push("/login");
        }
      }, 1200);
    }
    setLoading(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Floating Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
            className="relative w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-[0_24px_80px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.08)] z-10 overflow-hidden"
          >
            {/* Top ambient radial light */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 bg-[#00E5FF]/15 blur-3xl pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 text-[#8A8F98] hover:text-[#EDEDED] p-1 rounded-lg border border-transparent hover:border-white/10 hover:bg-white/5 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header / Brand */}
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-8 h-8 rounded-lg border border-[#00E5FF]/30 bg-[#00E5FF]/10 flex items-center justify-center text-white">
                <ShieldCheck className="w-4 h-4 text-[#00E5FF]" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-[#EDEDED]">
                  Set a new password
                </h2>
                <p className="text-xs text-[#8A8F98]">
                  Choose a new password for your account.
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg border border-[#F05D5E]/20 bg-[#F05D5E]/10 text-[#F05D5E] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {message && (
              <div className="mb-4 p-3 rounded-lg border border-[#00E599]/20 bg-[#00E599]/10 text-[#00E599] text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{message}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#8A8F98] mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full px-3.5 py-2.5 bg-[#050505] border border-white/10 rounded-lg text-sm text-[#EDEDED] placeholder-[#8A8F98]/50 focus:outline-none focus:border-[#00E5FF]/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8A8F98] mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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

            <p className="text-center text-xs text-[#8A8F98] mt-6">
              Remember your password?{" "}
              {onSwitchToLogin ? (
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="font-medium text-[#00E5FF] hover:underline"
                >
                  Log in
                </button>
              ) : (
                <a href="/login" className="font-medium text-[#00E5FF] hover:underline">
                  Log in
                </a>
              )}
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}