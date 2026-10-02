"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ArrowRight, ShieldCheck } from "lucide-react";

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
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-lg bg-deep-green flex items-center justify-center text-white">
            <ShieldCheck className="w-5 h-5 text-emerald" />
          </div>
          <span className="text-xl font-bold tracking-tight text-ink font-heading">SkillProof</span>
        </Link>
        <div className="bg-white border border-border rounded-xl p-8 shadow-card">
          <h1 className="text-2xl font-bold text-ink mb-1">Set a new password</h1>
          <p className="text-sm text-muted-text mb-6">Choose a new password for your SkillProof account.</p>
          {error && <div className="mb-5 p-3 rounded-lg bg-status-error/10 border border-status-error/20 text-status-error text-sm">{error}</div>}
          {message && <div className="mb-5 p-3 rounded-lg bg-status-proven/10 border border-status-proven/20 text-status-proven text-sm">{message}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="New password" className="w-full px-3.5 py-2.5 bg-warm-ivory/50 border border-border rounded-lg text-sm text-ink" />
            <input type="password" required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm new password" className="w-full px-3.5 py-2.5 bg-warm-ivory/50 border border-border rounded-lg text-sm text-ink" />
            <button type="submit" disabled={loading} className="w-full py-2.5 px-4 bg-deep-green text-white font-medium rounded-lg text-sm flex items-center justify-center gap-2 disabled:opacity-70">
              {loading ? "Updating..." : "Update Password"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}