import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-heading">
          Verification Hub
        </h1>
        <p className="text-sm text-muted-text mt-1">
          Welcome back, {user?.email}. Complete the onboarding steps below to
          generate your evidence audit.
        </p>
      </div>

      {/* Next Steps / Onboarding Prompt */}
      <div className="p-6 bg-white border border-border rounded-xl shadow-card">
        <h2 className="text-lg font-bold font-heading mb-2">
          Step 1: Connect Resume & GitHub
        </h2>
        <p className="text-sm text-muted-text mb-4 max-w-2xl">
          Upload your latest PDF resume and provide your public GitHub username.
          SkillProof will extract skills and cross-reference real commits,
          dependencies, and repository architectures.
        </p>
        <Link
          href="/resume"
          className="inline-flex items-center gap-2 px-4 py-2 bg-deep-green text-white text-sm font-medium rounded-lg hover:bg-deep-green/90 transition-colors"
        >
          Begin Onboarding
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Stat Cards Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white border border-border rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-status-proven uppercase">
              Proven
            </span>
            <CheckCircle2 className="w-4 h-4 text-status-proven" />
          </div>
          <p className="text-2xl font-bold font-heading">0</p>
          <p className="text-xs text-muted-text mt-1">Skills with code proofs</p>
        </div>

        <div className="p-5 bg-white border border-border rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-status-partial uppercase">
              Partial
            </span>
            <Clock className="w-4 h-4 text-status-partial" />
          </div>
          <p className="text-2xl font-bold font-heading">0</p>
          <p className="text-xs text-muted-text mt-1">
            Configs without test suites
          </p>
        </div>

        <div className="p-5 bg-white border border-border rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-status-claimed uppercase">
              Claimed-only
            </span>
            <AlertTriangle className="w-4 h-4 text-status-claimed" />
          </div>
          <p className="text-2xl font-bold font-heading">0</p>
          <p className="text-xs text-muted-text mt-1">Resume-only claims</p>
        </div>
      </div>
    </div>
  );
}