import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  FileText,
  GitBranch,
  Search,
  ShieldCheck,
} from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

const evidenceRows = [
  { skill: "Python", status: "PROVEN", tone: "proven", evidence: "5 repositories", activity: "Recent commits", detail: "Python dependencies · Tests detected" },
  { skill: "React", status: "PROVEN", tone: "proven", evidence: "3 repositories", activity: "Recent commits", detail: "TypeScript · Component tests" },
  { skill: "Docker", status: "PARTIAL", tone: "partial", evidence: "1 repository", activity: "4 months ago", detail: "Dockerfile detected · No test suite" },
  { skill: "AWS", status: "CLAIMED-ONLY", tone: "claimed", evidence: "No supporting evidence", activity: "—", detail: "Resume claim · No repository signal" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-warm-ivory text-ink selection:bg-emerald/20">
      <Navbar />
      <main>
        <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-16 sm:pt-24 pb-20">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-14 lg:gap-20 items-center">
            <div className="page-enter">
              <div className="flex items-center gap-2 text-sm text-deep-green font-medium mb-7"><span className="w-7 h-px bg-emerald" />Technical verification for working engineers</div>
              <h1 className="font-heading text-5xl sm:text-6xl lg:text-[4.5rem] leading-[1.02] font-extrabold tracking-[-0.055em] max-w-xl">Your resume says it.<br /><span className="text-deep-green">Your work proves it.</span></h1>
              <p className="mt-7 text-lg leading-8 text-muted-text max-w-lg">SkillProof connects the skills you claim with evidence from the work you&apos;ve actually built.</p>
              <div className="mt-9 flex flex-col sm:flex-row gap-3">
                <Link href="/signup" className="inline-flex items-center justify-center gap-2 rounded-[9px] bg-deep-green px-5 py-3.5 text-sm font-semibold text-white hover:bg-ink transition-colors">Prove Your Skills <ArrowRight className="w-4 h-4" /></Link>
                <Link href="/signup?role=recruiter" className="inline-flex items-center justify-center gap-2 rounded-[9px] border border-border bg-paper px-5 py-3.5 text-sm font-semibold text-ink hover:border-deep-green hover:text-deep-green transition-colors">Explore for Recruiters <ChevronRight className="w-4 h-4" /></Link>
              </div>
              <div className="mt-10 flex flex-wrap items-center gap-5 text-xs text-muted-text"><span className="inline-flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald" />GitHub-backed signals</span><span className="inline-flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald" />Shareable proof</span></div>
            </div>
            <div className="relative page-enter [animation-delay:100ms]"><div className="absolute -inset-4 bg-deep-green/5 -z-10 rounded-2xl" /><div className="bg-paper border border-border rounded-xl shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-[8px] bg-deep-green flex items-center justify-center text-white"><ShieldCheck className="w-5 h-5" /></div><div><p className="font-heading font-bold text-sm">Evidence report</p><p className="text-xs text-muted-text">Alex Morgan · Software Engineer</p></div></div><span className="text-xs text-emerald font-semibold">LIVE AUDIT</span></div>
              <div className="px-5 py-5 bg-warm-ivory/60 border-b border-border grid grid-cols-3 gap-4"><div><p className="text-xs text-muted-text">Skills checked</p><p className="font-heading text-2xl font-bold mt-1">14</p></div><div><p className="text-xs text-muted-text">Proven</p><p className="font-heading text-2xl font-bold mt-1 text-emerald">08</p></div><div><p className="text-xs text-muted-text">Repositories</p><p className="font-heading text-2xl font-bold mt-1">05</p></div></div>
              <div className="p-5"><div className="grid grid-cols-[1fr_auto_1fr] gap-3 px-2 pb-3 text-[11px] font-semibold text-muted-text border-b border-border"><span>Skill</span><span>Status</span><span>Evidence</span></div>{evidenceRows.map((row) => <div key={row.skill} className="grid grid-cols-[1fr_auto_1fr] gap-3 items-start py-4 px-2 border-b border-border last:border-0"><div><p className="font-semibold text-sm">{row.skill}</p><p className="text-[11px] text-muted-text mt-1">{row.detail}</p></div><span className={`text-[10px] tracking-wide font-bold px-2 py-1 rounded-md ${row.tone === "proven" ? "text-status-proven bg-status-proven/10" : row.tone === "partial" ? "text-status-partial bg-status-partial/10" : "text-status-claimed bg-status-claimed/10"}`}>{row.status}</span><div className="text-right"><p className="text-xs font-medium">{row.evidence}</p><p className="text-[11px] text-muted-text mt-1">{row.activity}</p></div></div>)}<Link href="/signup" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-deep-green hover:text-ink transition-colors">View repository evidence <ArrowRight className="w-3.5 h-3.5" /></Link></div>
            </div></div>
          </div>
        </section>
        <section id="how-it-works" className="border-y border-border bg-paper"><div className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-20"><div className="max-w-xl mb-12"><p className="text-sm font-semibold text-deep-green mb-3">A clearer signal</p><h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-[-0.035em]">From claim to confidence.</h2><p className="mt-4 text-muted-text leading-7">A technical audit that follows the evidence, not the adjectives.</p></div><div className="grid md:grid-cols-4 gap-0 border-y border-border">{[{ icon: FileText, title: "Resume claim", text: "Extract the skills you say you use." }, { icon: GitBranch, title: "GitHub evidence", text: "Trace claims to repositories, files, and commits." }, { icon: Search, title: "Skill evaluation", text: "Classify each signal as proven, partial, or claimed." }, { icon: CheckCircle2, title: "Job match", text: "See where your evidence aligns with the role." }].map((step, index) => { const Icon = step.icon; return <div key={step.title} className="relative py-7 md:px-6 first:pl-0 last:pr-0 border-b md:border-b-0 md:border-r last:border-r-0 border-border"><span className="font-mono text-xs text-muted-text">0{index + 1}</span><Icon className="w-5 h-5 text-deep-green mt-7 mb-5" /><h3 className="font-heading font-bold text-lg">{step.title}</h3><p className="text-sm text-muted-text leading-6 mt-2 max-w-[220px]">{step.text}</p></div>; })}</div></div></section>
        <section id="evidence" className="max-w-6xl mx-auto px-5 sm:px-8 py-20"><div className="grid lg:grid-cols-[0.7fr_1.3fr] gap-12 items-start"><div><p className="text-sm font-semibold text-deep-green mb-3">Built for scrutiny</p><h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-[-0.035em]">Evidence you can point to.</h2><p className="mt-4 text-muted-text leading-7">Every status comes with a trail back to the work: repositories, dependencies, tests, and recent activity.</p><Link href="/signup" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-deep-green hover:text-ink transition-colors">Build your report <ArrowRight className="w-4 h-4" /></Link></div><div className="border-t border-border"><div className="grid grid-cols-[1fr_auto] gap-4 py-5 border-b border-border"><span className="font-heading font-bold">PROVEN</span><span className="text-sm text-muted-text text-right">Code, dependencies, tests, and active work align.</span></div><div className="grid grid-cols-[1fr_auto] gap-4 py-5 border-b border-border"><span className="font-heading font-bold">PARTIAL</span><span className="text-sm text-muted-text text-right">A signal exists, but depth or recency is limited.</span></div><div className="grid grid-cols-[1fr_auto] gap-4 py-5 border-b border-border"><span className="font-heading font-bold">CLAIMED-ONLY</span><span className="text-sm text-muted-text text-right">The resume says it. The public work has not shown it yet.</span></div></div></div></section>
      </main><Footer />
    </div>
  );
}
