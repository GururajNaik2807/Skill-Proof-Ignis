import Link from "next/link";
import {
  CheckCircle2,
  AlertCircle,
  FileCode2,
  ArrowRight,
} from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-warm-ivory text-ink selection:bg-emerald/20 selection:text-ink">


      <Navbar />
      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-soft-surface border border-border text-xs font-semibold text-deep-green mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald"></span>
          Skill Verification for Serious Developers
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-ink font-heading max-w-4xl mx-auto leading-[1.15]">
          Turn technical skill claims into evidence.
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-muted-text max-w-2xl mx-auto leading-relaxed">
          SkillProof inspects the public code, commit histories, package
          configs, and test suites in your GitHub repositories to prove the
          technical claims on your resume.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/signup"
            className="w-full sm:w-auto px-6 py-3 bg-deep-green text-white font-medium rounded-lg hover:bg-deep-green/90 transition-all flex items-center justify-center gap-2 shadow-card"
          >
            Prove Your Skills
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="/signup?role=recruiter"
            className="w-full sm:w-auto px-6 py-3 bg-white border border-border text-ink font-medium rounded-lg hover:bg-soft-surface transition-colors"
          >
            For Recruiters
          </a>
        </div>
      </section>

      {/* Status Classification Engine Section */}
      <section id="evidence" className="py-12 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold font-heading">
            Traceable Verification Tiers
          </h2>
          <p className="text-sm sm:text-base text-muted-text mt-2 max-w-xl mx-auto">
            No synthetic AI stamps. Every skill rating is derived directly from
            concrete codebase artifacts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Proven */}
          <div className="bg-white border border-border rounded-xl p-6 shadow-subtle">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-3 h-3 rounded-full bg-status-proven"></span>
              <span className="font-bold text-sm text-status-proven uppercase tracking-wider">
                Proven
              </span>
            </div>
            <p className="text-sm text-muted-text mb-4">
              Supported by actual repository code, active commits, unit tests,
              and declared production dependencies.
            </p>
            <div className="bg-warm-ivory/60 border border-border/80 rounded-lg p-3 text-xs space-y-2">
              <div className="flex items-center gap-2 font-mono text-ink">
                <CheckCircle2 className="w-3.5 h-3.5 text-status-proven shrink-0" />
                <span>requirements.txt + pytest</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-ink">
                <CheckCircle2 className="w-3.5 h-3.5 text-status-proven shrink-0" />
                <span>42 commits across 3 repos</span>
              </div>
            </div>
          </div>

          {/* Partial */}
          <div className="bg-white border border-border rounded-xl p-6 shadow-subtle">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-3 h-3 rounded-full bg-status-partial"></span>
              <span className="font-bold text-sm text-status-partial uppercase tracking-wider">
                Partial
              </span>
            </div>
            <p className="text-sm text-muted-text mb-4">
              Detected in starter configs or small commits, but lacks test
              suites, production depth, or recent activity.
            </p>
            <div className="bg-warm-ivory/60 border border-border/80 rounded-lg p-3 text-xs space-y-2">
              <div className="flex items-center gap-2 font-mono text-ink">
                <CheckCircle2 className="w-3.5 h-3.5 text-status-partial shrink-0" />
                <span>package.json dependency</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-muted-text">
                <AlertCircle className="w-3.5 h-3.5 text-status-partial shrink-0" />
                <span>No unit tests / inactive 1yr</span>
              </div>
            </div>
          </div>

          {/* Claimed-only */}
          <div className="bg-white border border-border rounded-xl p-6 shadow-subtle">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-3 h-3 rounded-full bg-status-claimed"></span>
              <span className="font-bold text-sm text-status-claimed uppercase tracking-wider">
                Claimed-Only
              </span>
            </div>
            <p className="text-sm text-muted-text mb-4">
              Stated prominently on the resume, but zero matching repos, files,
              or dependencies exist on GitHub.
            </p>
            <div className="bg-warm-ivory/60 border border-border/80 rounded-lg p-3 text-xs space-y-2">
              <div className="flex items-center gap-2 font-mono text-ink">
                <FileCode2 className="w-3.5 h-3.5 text-muted-text shrink-0" />
                <span>Listed on Resume (PDF)</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-status-claimed">
                <AlertCircle className="w-3.5 h-3.5 text-status-claimed shrink-0" />
                <span>0 GitHub references found</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-16 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold font-heading">
            How SkillProof Works
          </h2>
          <p className="text-sm sm:text-base text-muted-text mt-2">
            A 4-step factual audit for career advancement.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-5 bg-white border border-border rounded-xl">
            <div className="w-8 h-8 rounded bg-soft-surface text-deep-green font-bold text-sm flex items-center justify-center mb-4">
              01
            </div>
            <h3 className="font-bold text-base mb-1">Upload Resume</h3>
            <p className="text-xs text-muted-text leading-relaxed">
              Upload your technical resume. Our parser isolates claimed skills,
              tools, and frameworks.
            </p>
          </div>

          <div className="p-5 bg-white border border-border rounded-xl">
            <div className="w-8 h-8 rounded bg-soft-surface text-deep-green font-bold text-sm flex items-center justify-center mb-4">
              02
            </div>
            <h3 className="font-bold text-base mb-1">Index GitHub</h3>
            <p className="text-xs text-muted-text leading-relaxed">
              We inspect language breakdowns, dependencies, commits, Dockerfiles,
              and test runners.
            </p>
          </div>

          <div className="p-5 bg-white border border-border rounded-xl">
            <div className="w-8 h-8 rounded bg-soft-surface text-deep-green font-bold text-sm flex items-center justify-center mb-4">
              03
            </div>
            <h3 className="font-bold text-base mb-1">Match Against Jobs</h3>
            <p className="text-xs text-muted-text leading-relaxed">
              Paste target job descriptions to identify the exact verified skills
              versus missing gaps.
            </p>
          </div>

          <div className="p-5 bg-white border border-border rounded-xl">
            <div className="w-8 h-8 rounded bg-soft-surface text-deep-green font-bold text-sm flex items-center justify-center mb-4">
              04
            </div>
            <h3 className="font-bold text-base mb-1">Micro-Tasks</h3>
            <p className="text-xs text-muted-text leading-relaxed">
              Generate actionable mini-projects to convert &quot;Claimed-only&quot;
              skills into &quot;Proven&quot; commits.
            </p>
          </div>
        </div>
      </section>

      {/* Example Audit Component */}
      <section id="example" className="py-12 px-4 sm:px-6 max-w-4xl mx-auto">
        <div className="bg-white border border-border rounded-2xl p-6 sm:p-8 shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border gap-4">
            <div>
              <span className="text-xs font-semibold text-deep-green uppercase tracking-wider">
                Live Sample Audit
              </span>
              <h3 className="text-xl font-bold font-heading mt-1">
                Candidate: Alex Rivers (@alexrivers)
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-soft-surface text-xs font-medium rounded-full border border-border">
                14 Skills Evaluated
              </span>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {/* Item 1 */}
            <div className="p-4 rounded-xl border border-border bg-warm-ivory/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-base">Python</span>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded bg-status-proven/10 text-status-proven border border-status-proven/20">
                    Proven
                  </span>
                </div>
                <p className="text-xs text-muted-text mt-1">
                  12 repos, pyproject.toml, 184 commits, pytest fixtures in
                  api-gateway
                </p>
              </div>
              <Link
                href="/signup"
                className="text-xs font-medium text-deep-green hover:underline flex items-center gap-1"
              >
                Inspect signals <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Item 2 */}
            <div className="p-4 rounded-xl border border-border bg-warm-ivory/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-base">Docker</span>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded bg-status-partial/10 text-status-partial border border-status-partial/20">
                    Partial
                  </span>
                </div>
                <p className="text-xs text-muted-text mt-1">
                  Dockerfile present in 1 repo; no multi-stage builds or compose
                  deployments
                </p>
              </div>
              <Link
                href="/signup"
                className="text-xs font-medium text-deep-green hover:underline flex items-center gap-1"
              >
                Inspect signals <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Item 3 */}
            <div className="p-4 rounded-xl border border-border bg-warm-ivory/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-base">Kubernetes</span>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded bg-status-claimed/10 text-status-claimed border border-status-claimed/20">
                    Claimed-only
                  </span>
                </div>
                <p className="text-xs text-muted-text mt-1">
                  Listed under &apos;DevOps Skills&apos; in resume; zero manifests or Helm
                  charts found
                </p>
              </div>
              <span className="text-xs font-medium text-status-partial bg-status-partial/10 px-2.5 py-1 rounded">
                Micro-task available
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 px-4 sm:px-6 max-w-3xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold font-heading text-center mb-8">
          Frequently Answered Questions
        </h2>
        <div className="space-y-4">
          <div className="bg-white border border-border rounded-xl p-5">
            <h3 className="font-semibold text-base mb-1">
              Does SkillProof verify private repositories?
            </h3>
            <p className="text-sm text-muted-text leading-relaxed">
              By default, SkillProof only queries public GitHub data to protect
              your proprietary work. Private organization verification is not
              conducted without explicit OAuth authorization.
            </p>
          </div>

          <div className="bg-white border border-border rounded-xl p-5">
            <h3 className="font-semibold text-base mb-1">
              What if I learned a skill without committing code publicly?
            </h3>
            <p className="text-sm text-muted-text leading-relaxed">
              That skill is catalogued as &quot;Claimed-only&quot;. SkillProof will
              generate a 1-to-2 hour practical micro-task so you can commit real
              evidence to your public GitHub profile and convert it to &quot;Proven&quot;.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}