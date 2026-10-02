
"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  GitBranch,
  ShieldCheck,
  Search,
  Code,
  FileCode2,
  TerminalSquare,
  Briefcase,
  Users,
  Check,
  Minus,
  Activity,
  Layers,
  Terminal,
  GitCommit,
  CheckCircle2,
  FileCode,
  ShieldAlert
} from "lucide-react";

// --- CSS for custom animations ---
const styles = `
  @keyframes marquee-left {
    0% { transform: translateX(0%); }
    100% { transform: translateX(-50%); }
  }
  @keyframes marquee-right {
    0% { transform: translateX(-50%); }
    100% { transform: translateX(0%); }
  }
  .animate-marquee-l { animation: marquee-left 40s linear infinite; }
  .animate-marquee-r { animation: marquee-right 40s linear infinite; }
  .pause-hover:hover { animation-play-state: paused; }
  
  .reveal { opacity: 0; transform: translateY(40px); transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
  .reveal.active { opacity: 1; transform: translateY(0); }
  
  .hide-scrollbar::-webkit-scrollbar { display: none; }
  .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
`;

// --- Utility Components ---
const Reveal = ({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              if (ref.current) ref.current.classList.add("active");
            }, delay);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [delay]);

  return <div ref={ref} className={`reveal ${className}`}>{children}</div>;
};

// --- Main Page Component ---
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-[#EDEDED] selection:bg-[#00E5FF]/30 font-sans overflow-x-hidden">
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      {/* --- NAVIGATION --- */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-[#0A0A0A]/90 backdrop-blur-md border-b border-white/10 py-3" : "bg-transparent py-6"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#00E5FF]/10 border border-[#00E5FF]/30 rounded flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-[#00E5FF]" />
            </div>
            <span className="font-bold text-lg tracking-tight">SkillProof</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#8A8F98]">
            <Link href="#how-it-works" className="hover:text-[#EDEDED] transition-colors">How it works</Link>
            <Link href="#candidates" className="hover:text-[#EDEDED] transition-colors">For Candidates</Link>
            <Link href="#recruiters" className="hover:text-[#EDEDED] transition-colors">For Recruiters</Link>
          </div>

          <div className="flex items-center gap-4 text-sm font-medium">
            <Link href="/login" className="text-[#8A8F98] hover:text-[#EDEDED] transition-colors hidden sm:block">
              Log in
            </Link>
            <Link
              href="/signup"
              className="bg-[#EDEDED] text-[#050505] px-4 py-2 rounded-md transition-transform hover:scale-105"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* --- 1. HERO SECTION --- */}
        <section className="relative min-h-screen flex items-center pt-24 pb-20 overflow-hidden">
          {/* Background Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-[#00E5FF]/10 rounded-full blur-[120px] pointer-events-none opacity-50" />

          <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10 grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Column: Copy & CTA */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="max-w-xl"
            >
              
              
              <h1 className="text-5xl lg:text-7xl font-semibold tracking-tight leading-[1.05] mb-6">
                Your resume says it. <br />
                <span className="text-[#8A8F98]">Your commits prove it.</span>
              </h1>
              
              <p className="text-lg text-[#8A8F98] leading-relaxed mb-10">
                Stop relying on self-reported skill lists. SkillProof connects the technologies candidates claim directly to the code, containers, and architecture they've actually deployed in public.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/signup" className="group relative inline-flex items-center justify-center gap-2 bg-[#EDEDED] text-[#050505] px-6 py-3.5 rounded-lg font-medium transition-transform hover:scale-[1.02] active:scale-95">
                  Connect GitHub
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  <div className="absolute inset-0 rounded-lg shadow-[0_0_20px_rgba(255,255,255,0.3)] opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
                <Link href="/signup?role=recruiter" className="inline-flex items-center justify-center gap-2 bg-[#0A0A0A] border border-white/10 text-[#EDEDED] px-6 py-3.5 rounded-lg font-medium hover:bg-white/5 transition-colors">
                  Explore Recruiter View
                </Link>
              </div>
            </motion.div>

            {/* Right Column: Interactive Evidence Mockup */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full aspect-[4/3] rounded-xl border border-white/10 bg-[#0A0A0A] shadow-[0_24px_80px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.05)] overflow-hidden flex flex-col hidden lg:flex"
            >
              {/* Mac/IDE Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#0A0A0A]/80 backdrop-blur-md">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-white/20" />
                  <div className="w-3 h-3 rounded-full bg-white/20" />
                  <div className="w-3 h-3 rounded-full bg-white/20" />
                </div>
                <div className="text-xs font-mono text-[#8A8F98] flex items-center gap-2">
                  <GitBranch className="w-3 h-3" /> main
                </div>
              </div>

              {/* Split View Content */}
              <div className="flex flex-1 overflow-hidden relative">
                
                {/* Animated Scanline Overlay */}
                <motion.div 
                  animate={{ top: ["-10%", "110%"] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                  className="absolute left-0 right-0 h-32 bg-gradient-to-b from-transparent via-[#00E5FF]/10 to-transparent w-full z-20 pointer-events-none"
                />

                {/* Left Pane: Resume Parse */}
                <div className="w-2/5 border-r border-white/10 bg-[#050505] p-5 flex flex-col gap-4 relative">
                  <h3 className="text-[10px] font-mono tracking-widest text-[#8A8F98] uppercase">Extracted Claims</h3>
                  
                  <div className="space-y-3 relative z-10">
                    <div className="px-3 py-2.5 rounded border border-white/5 bg-white/5 flex items-center justify-between">
                      <span className="text-sm font-medium">React</span>
                      <CheckCircle2 className="w-4 h-4 text-[#00E599]" />
                    </div>
                    
                    {/* Active connecting element */}
                    <div className="px-3 py-2.5 rounded border border-[#00E5FF]/30 bg-[#00E5FF]/5 flex items-center justify-between relative shadow-[0_0_15px_rgba(0,229,255,0.1)]">
                      <span className="text-sm font-medium text-[#00E5FF]">Docker</span>
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                      >
                        <Terminal className="w-4 h-4 text-[#00E5FF]" />
                      </motion.div>
                      {/* Connection Line */}
                      <div className="absolute top-1/2 -right-6 w-6 h-[1px] bg-[#00E5FF]/50" />
                    </div>

                    <div className="px-3 py-2.5 rounded border border-white/5 bg-white/5 flex items-center justify-between opacity-50">
                      <span className="text-sm font-medium">AWS ECS</span>
                      <ShieldAlert className="w-4 h-4 text-[#F59E0B]" />
                    </div>
                  </div>
                </div>

                {/* Right Pane: GitHub Evidence */}
                <div className="w-3/5 p-5 bg-[#0A0A0A] flex flex-col gap-4 relative">
                  <h3 className="text-[10px] font-mono tracking-widest text-[#8A8F98] uppercase flex items-center gap-2">
                    <GitCommit className="w-3 h-3" /> Evidence Discovered
                  </h3>
                  
                  <div className="flex-1 rounded border border-white/10 bg-[#050505] p-4 font-mono text-xs overflow-hidden relative">
                    
                    {/* Repo Context Breadcrumb */}
                    <div className="flex items-center gap-2 text-[#8A8F98] mb-4 pb-3 border-b border-white/10">
                      <span className="text-white">api-gateway</span>
                      <span>/</span>
                      <FileCode className="w-3 h-3" />
                      <span className="text-[#00E5FF]">Dockerfile</span>
                    </div>

                    {/* Code Snippet */}
                    <div className="space-y-1.5 text-[#8A8F98]">
                      <p><span className="text-[#8B5CF6]">FROM</span> node:18-alpine <span className="text-[#8A8F98]/50">AS builder</span></p>
                      <p><span className="text-[#8B5CF6]">WORKDIR</span> /app</p>
                      <p><span className="text-[#8B5CF6]">COPY</span> package*.json ./</p>
                      <p><span className="text-[#8B5CF6]">RUN</span> npm ci --only=production</p>
                      <motion.p 
                        initial={{ backgroundColor: "transparent" }}
                        animate={{ backgroundColor: "rgba(0, 229, 153, 0.15)" }}
                        transition={{ repeat: Infinity, repeatType: "reverse", duration: 1.5 }}
                        className="text-[#EDEDED] py-0.5 -mx-2 px-2 border-l-2 border-[#00E599]"
                      >
                        <span className="text-[#8B5CF6]">EXPOSE</span> 3000
                      </motion.p>
                      <p><span className="text-[#8B5CF6]">CMD</span> ["npm", "start"]</p>
                    </div>

                    {/* Floating Status Badge */}
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 1, type: "spring" }}
                      className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#00E599]/10 border border-[#00E599]/20 shadow-[0_0_12px_rgba(0,229,153,0.2)] backdrop-blur-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00E599]" />
                      <span className="text-[10px] font-bold text-[#00E599] tracking-wider">PROVEN</span>
                    </motion.div>
                  </div>
                  
                  {/* Meta data row */}
                  <div className="flex items-center justify-between text-[10px] text-[#8A8F98] font-mono">
                    <span>Commit: <span className="text-[#EDEDED]">a7f9c2b</span></span>
                    <span>Detected: 2 mins ago</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* --- 2 & 3. SCROLL TRANSITION / PROBLEM SECTION --- */}
        <section className="py-32 bg-[#050505] relative border-t border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <Reveal>
              <h2 className="text-4xl sm:text-5xl font-semibold mb-6 tracking-tight">
                Anyone can write a skill on a resume.
              </h2>
            </Reveal>
            <Reveal delay={200}>
              <h2 className="text-4xl sm:text-5xl font-semibold mb-6 text-[#8A8F98] tracking-tight">
                But evidence is harder to fake.
              </h2>
            </Reveal>
            <Reveal delay={400}>
              <div className="w-16 h-1 bg-[#00E5FF] mx-auto mb-8 mt-12 shadow-[0_0_15px_rgba(0,229,255,0.5)]" />
              <p className="text-xl text-[#EDEDED] font-medium">
                SkillProof checks the difference.
              </p>
            </Reveal>
          </div>
        </section>

        {/* --- 4. MARQUEE SECTION --- */}
        <section className="py-10 bg-[#0A0A0A] border-y border-white/10 overflow-hidden flex flex-col gap-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          <div className="w-full relative whitespace-nowrap flex group pause-hover">
            <div className="animate-marquee-l inline-flex gap-8 items-center text-[#8A8F98] font-mono text-sm tracking-widest uppercase">
              <span>Resume Claims</span> <span className="text-[#00E5FF]">•</span>
              <span>GitHub Evidence</span> <span className="text-[#00E5FF]">•</span>
              <span>Repositories</span> <span className="text-[#00E5FF]">•</span>
              <span>Commits</span> <span className="text-[#00E5FF]">•</span>
              <span>Tests</span> <span className="text-[#00E5FF]">•</span>
              <span>Dependencies</span> <span className="text-[#00E5FF]">•</span>
              <span>Contributions</span> <span className="text-[#00E5FF]">•</span>
              {/* Duplicate for infinite effect */}
              <span>Resume Claims</span> <span className="text-[#00E5FF]">•</span>
              <span>GitHub Evidence</span> <span className="text-[#00E5FF]">•</span>
              <span>Repositories</span> <span className="text-[#00E5FF]">•</span>
              <span>Commits</span> <span className="text-[#00E5FF]">•</span>
              <span>Tests</span> <span className="text-[#00E5FF]">•</span>
              <span>Dependencies</span> <span className="text-[#00E5FF]">•</span>
              <span>Contributions</span> <span className="text-[#00E5FF]">•</span>
            </div>
          </div>
          <div className="w-full relative whitespace-nowrap flex group pause-hover">
            <div className="animate-marquee-r inline-flex gap-8 items-center font-bold text-lg tracking-wider text-white/5">
              <span className="text-[#00E599]/40">PROVEN</span> <span>/</span>
              <span className="text-[#F59E0B]/40">PARTIAL</span> <span>/</span>
              <span className="text-[#8A8F98]/40">NEEDS REVIEW</span> <span>/</span>
              <span>EVIDENCE</span> <span>/</span>
              <span>SKILLS</span> <span>/</span>
              <span>ACTIVITY</span> <span>/</span>
              {/* Duplicate */}
              <span className="text-[#00E599]/40">PROVEN</span> <span>/</span>
              <span className="text-[#F59E0B]/40">PARTIAL</span> <span>/</span>
              <span className="text-[#8A8F98]/40">NEEDS REVIEW</span> <span>/</span>
              <span>EVIDENCE</span> <span>/</span>
              <span>SKILLS</span> <span>/</span>
              <span>ACTIVITY</span> <span>/</span>
            </div>
          </div>
        </section>

        {/* --- 5 & 6. CLAIM -> PROOF & EVIDENCE ANALYSIS --- */}
        <section id="how-it-works" className="py-32 bg-[#050505] relative">
          <div className="max-w-7xl mx-auto px-6 sm:px-8">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              
              <div>
                <Reveal>
                  <h2 className="text-4xl font-semibold tracking-tight mb-4">
                    Don't just list the skill.
                    <br />
                    <span className="text-[#00E5FF]">Show the work behind it.</span>
                  </h2>
                </Reveal>
                <Reveal delay={200}>
                  <p className="text-lg text-[#8A8F98] leading-relaxed mb-8">
                    When you link your GitHub, SkillProof scans your public repositories, searching for files, dependencies, test coverage, and recent commits that substantiate your resume claims.
                  </p>
                </Reveal>
                <Reveal delay={300}>
                  <ul className="space-y-6">
                    <li className="flex gap-4 items-start">
                      <div className="w-8 h-8 rounded-full bg-[#0A0A0A] border border-white/10 flex items-center justify-center shrink-0 mt-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                        <Search className="w-4 h-4 text-[#00E5FF]" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-[#EDEDED]">Detect Context</h4>
                        <p className="text-sm text-[#8A8F98] mt-1">Identifies languages, frameworks, and tools used across your public work.</p>
                      </div>
                    </li>
                    <li className="flex gap-4 items-start">
                      <div className="w-8 h-8 rounded-full bg-[#0A0A0A] border border-white/10 flex items-center justify-center shrink-0 mt-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                        <Activity className="w-4 h-4 text-[#00E5FF]" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-[#EDEDED]">Measure Activity</h4>
                        <p className="text-sm text-[#8A8F98] mt-1">Verifies recency and frequency of commits to distinguish past exposure from active proficiency.</p>
                      </div>
                    </li>
                  </ul>
                </Reveal>
              </div>

              {/* Animated Repo Panel Visual */}
              <Reveal delay={400}>
                <div className="bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)] relative">
                  <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3 bg-[#050505]">
                    {/* <Box className="w-5 h-5 text-[#8A8F98]" /> */}
                    <span className="font-mono text-sm font-medium text-[#EDEDED]">expense-dashboard</span>
                    <span className="ml-auto text-[10px] uppercase tracking-wider text-[#00E5FF] font-bold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse shadow-[0_0_8px_#00E5FF]"></span> Analyzing
                    </span>
                  </div>
                  
                  <div className="p-5 font-mono text-sm space-y-4">
                    <div className="flex items-center gap-3 text-[#8A8F98]">
                      <FileCode2 className="w-4 h-4" /> <span>package.json</span>
                      <span className="ml-auto text-[#00E599] text-xs">Dependency found: react</span>
                    </div>
                    <div className="flex items-center gap-3 text-[#8A8F98]">
                      <FileCode2 className="w-4 h-4" /> <span>src/components/App.tsx</span>
                      <span className="ml-auto text-[#00E599] text-xs">Component detected</span>
                    </div>
                    <div className="flex items-center gap-3 text-[#8A8F98]">
                      <FileCode2 className="w-4 h-4" /> <span>tests/App.test.tsx</span>
                      <span className="ml-auto text-[#00E599] text-xs">Test suite found</span>
                    </div>
                    <div className="flex items-center gap-3 text-[#8A8F98]">
                      <TerminalSquare className="w-4 h-4" /> <span>git log</span>
                      <span className="ml-auto text-[#00E599] text-xs">14 commits (last 30 days)</span>
                    </div>
                    
                    <div className="pt-4 border-t border-white/10 mt-4 flex items-center justify-between bg-white/5 p-4 rounded-lg">
                      <div>
                        <span className="block text-xs text-[#8A8F98] mb-1 uppercase tracking-wider">Skill Evaluated</span>
                        <span className="font-bold text-lg text-[#EDEDED]">React</span>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-3 py-1 bg-[#00E599]/10 text-[#00E599] border border-[#00E599]/20 font-bold text-sm rounded shadow-[0_0_12px_rgba(0,229,153,0.2)]">
                          PROVEN
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>

            </div>
          </div>
        </section>

        {/* --- 7. EVIDENCE STATUS SECTION --- */}
        <section className="py-24 bg-[#0A0A0A] border-y border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          <div className="max-w-7xl mx-auto px-6 sm:px-8">
            <Reveal>
              <div className="grid md:grid-cols-3 gap-8">
                {/* Proven */}
                <div className="p-8 border border-white/10 bg-[#050505] rounded-xl relative overflow-hidden group hover:border-[#00E599]/30 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                  <div className="absolute top-0 left-0 w-full h-1 bg-[#00E599]" />
                  <h3 className="text-2xl font-bold text-[#00E599] mb-4 drop-shadow-[0_0_8px_rgba(0,229,153,0.5)]">PROVEN</h3>
                  <p className="text-[#8A8F98] text-sm leading-relaxed">
                    Strong public evidence supports the claim. Repositories contain relevant code, valid dependencies, recent commit activity, and testing.
                  </p>
                </div>

                {/* Partial */}
                <div className="p-8 border border-white/10 bg-[#050505] rounded-xl relative overflow-hidden group hover:border-[#F59E0B]/30 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                  <div className="absolute top-0 left-0 w-full h-1 bg-[#F59E0B]" />
                  <h3 className="text-2xl font-bold text-[#F59E0B] mb-4">PARTIAL</h3>
                  <p className="text-[#8A8F98] text-sm leading-relaxed">
                    Some supporting evidence exists, but it may be limited in scope, lacking test coverage, or represent outdated activity.
                  </p>
                </div>

                {/* Needs Review */}
                <div className="p-8 border border-white/10 bg-[#050505] rounded-xl relative overflow-hidden group hover:border-[#8A8F98]/30 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                  <div className="absolute top-0 left-0 w-full h-1 bg-[#8A8F98]" />
                  <h3 className="text-2xl font-bold text-[#8A8F98] mb-4">NEEDS REVIEW</h3>
                  <p className="text-[#8A8F98] text-sm leading-relaxed">
                    No sufficient public supporting evidence was found. The skill relies entirely on the resume claim and requires further human verification.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* --- 8. GITHUB / CODE SECTION --- */}
        <section id="candidates" className="py-32 bg-[#050505]">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 text-center mb-16">
            <Reveal>
              <h2 className="text-4xl font-semibold tracking-tight mb-6">Your code already tells a story.</h2>
              <p className="text-lg text-[#8A8F98] max-w-2xl mx-auto">
                SkillProof looks beyond the technology list and examines the real public evidence behind it, building a verifiable profile you can share with confidence.
              </p>
            </Reveal>
          </div>
          
          <div className="max-w-4xl mx-auto px-6">
            <Reveal delay={200}>
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[28px] md:before:ml-[50%] before:-translate-x-px md:before:translate-x-[-50%] before:w-[1px] before:bg-white/10">
                
                {/* Repo item 1 */}
                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                  <div className="flex items-center justify-center w-14 h-14 rounded-full border-4 border-[#050505] bg-[#0A0A0A] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] text-[#00E5FF] z-10 shrink-0 md:group-odd:-ml-7 md:group-even:-mr-7">
                    <Code className="w-5 h-5" />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-5 rounded-xl border border-white/10 bg-[#0A0A0A] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] text-left">
                    <h4 className="font-mono font-bold text-[#EDEDED] mb-2 flex items-center gap-2">
                      analytics-dashboard
                    </h4>
                    <div className="flex flex-wrap gap-2 text-xs font-medium text-[#8A8F98]">
                      <span className="px-2 py-1 bg-white/5 rounded border border-white/10">TypeScript</span>
                      <span className="px-2 py-1 bg-white/5 rounded border border-white/10">React</span>
                      <span className="px-2 py-1 bg-[#00E599]/10 rounded border border-[#00E599]/20 text-[#00E599]">Tests Verified</span>
                    </div>
                  </div>
                </div>

                {/* Repo item 2 */}
                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                  <div className="flex items-center justify-center w-14 h-14 rounded-full border-4 border-[#050505] bg-[#0A0A0A] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] text-[#00E5FF] z-10 shrink-0 md:group-odd:-ml-7 md:group-even:-mr-7">
                    <TerminalSquare className="w-5 h-5" />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-5 rounded-xl border border-white/10 bg-[#0A0A0A] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] text-left">
                    <h4 className="font-mono font-bold text-[#EDEDED] mb-2">automation-tool</h4>
                    <div className="flex flex-wrap gap-2 text-xs font-medium text-[#8A8F98]">
                      <span className="px-2 py-1 bg-white/5 rounded border border-white/10">Python</span>
                      <span className="px-2 py-1 bg-white/5 rounded border border-white/10">Docker</span>
                      <span className="px-2 py-1 bg-[#00E5FF]/10 rounded border border-[#00E5FF]/20 text-[#00E5FF]">Recent Activity</span>
                    </div>
                  </div>
                </div>

              </div>
              <div className="text-center mt-12">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#00E599]/10 text-[#00E599] font-bold text-sm rounded-full border border-[#00E599]/20 shadow-[0_0_12px_rgba(0,229,153,0.2)]">
                  <Check className="w-4 h-4" /> Evidence assembled.
                </span>
              </div>
            </Reveal>
          </div>
        </section>

        {/* --- 9. RECRUITER / COMPARISON SECTION --- */}
        <section id="recruiters" className="py-32 bg-[#0A0A0A] border-y border-white/10 relative overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          {/* Subtle bg glow */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#8B5CF6]/10 rounded-full blur-[150px] pointer-events-none" />

          <div className="max-w-7xl mx-auto px-6 sm:px-8">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <Reveal>
                <div className="w-12 h-12 bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
                  <Users className="w-6 h-6 text-[#8B5CF6]" />
                </div>
                <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-6">
                  Ten resumes. One evidence view.
                </h2>
                <p className="text-lg text-[#8A8F98]">
                  Stop guessing based on bullet points. Compare candidates side-by-side using hard data drawn from their verified public work.
                </p>
              </Reveal>
            </div>

            <Reveal delay={200}>
              <div className="max-w-4xl mx-auto bg-[#050505] rounded-2xl border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.05)] overflow-hidden">
                <div className="px-6 py-4 border-b border-white/10 bg-[#0A0A0A] flex items-center justify-between">
                  <span className="font-bold text-sm tracking-wide text-[#EDEDED]">CANDIDATE COMPARISON</span>
                  <span className="text-xs font-mono text-[#8A8F98]">Compare the evidence. Make the decision.</span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="p-5 font-medium text-sm text-[#8A8F98]">Skill Requirement</th>
                        <th className="p-5 font-medium text-sm text-[#EDEDED] border-l border-white/10 bg-white/5">Candidate A</th>
                        <th className="p-5 font-medium text-sm text-[#EDEDED] border-l border-white/10">Candidate B</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      <tr className="border-b border-white/10">
                        <td className="p-5 font-medium">React</td>
                        <td className="p-5 border-l border-white/10 bg-white/5">
                          <span className="inline-flex items-center gap-2 text-[#00E599] font-bold text-xs bg-[#00E599]/10 border border-[#00E599]/20 px-2 py-1 rounded">
                            <Check className="w-3 h-3" /> PROVEN
                          </span>
                        </td>
                        <td className="p-5 border-l border-white/10">
                          <span className="inline-flex items-center gap-2 text-[#00E599] font-bold text-xs bg-[#00E599]/10 border border-[#00E599]/20 px-2 py-1 rounded">
                            <Check className="w-3 h-3" /> PROVEN
                          </span>
                        </td>
                      </tr>
                      <tr className="border-b border-white/10">
                        <td className="p-5 font-medium">TypeScript</td>
                        <td className="p-5 border-l border-white/10 bg-white/5">
                          <span className="inline-flex items-center gap-2 text-[#00E599] font-bold text-xs bg-[#00E599]/10 border border-[#00E599]/20 px-2 py-1 rounded">
                            <Check className="w-3 h-3" /> PROVEN
                          </span>
                        </td>
                        <td className="p-5 border-l border-white/10">
                          <span className="inline-flex items-center gap-2 text-[#00E599] font-bold text-xs bg-[#00E599]/10 border border-[#00E599]/20 px-2 py-1 rounded">
                            <Check className="w-3 h-3" /> PROVEN
                          </span>
                        </td>
                      </tr>
                      <tr className="border-b border-white/10">
                        <td className="p-5 font-medium">Docker</td>
                        <td className="p-5 border-l border-white/10 bg-white/5">
                          <span className="inline-flex items-center gap-2 text-[#00E599] font-bold text-xs bg-[#00E599]/10 border border-[#00E599]/20 px-2 py-1 rounded">
                            <Check className="w-3 h-3" /> PROVEN
                          </span>
                        </td>
                        <td className="p-5 border-l border-white/10">
                          <span className="inline-flex items-center gap-2 text-[#8A8F98] font-bold text-xs px-2 py-1">
                            <Minus className="w-3 h-3" /> NO EVIDENCE
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="p-5 font-medium">AWS</td>
                        <td className="p-5 border-l border-white/10 bg-white/5">
                          <span className="inline-flex items-center gap-2 text-[#8A8F98] font-bold text-xs px-2 py-1">
                            <Minus className="w-3 h-3" /> NO EVIDENCE
                          </span>
                        </td>
                        <td className="p-5 border-l border-white/10">
                          <span className="inline-flex items-center gap-2 text-[#8A8F98] font-bold text-xs bg-white/5 border border-white/10 px-2 py-1 rounded">
                            <Search className="w-3 h-3" /> NEEDS REVIEW
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* --- 10 & 11. JOB MATCH & MICRO-TASKS --- */}
        <section className="py-32 bg-[#050505]">
          <div className="max-w-7xl mx-auto px-6 sm:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              
              <div className="order-2 lg:order-1">
                <Reveal>
                  <div className="bg-[#0A0A0A] border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] rounded-xl p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#F59E0B]/10 rounded-bl-full pointer-events-none" />
                    <h4 className="text-[#F59E0B] font-bold text-sm tracking-widest uppercase mb-4 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">Skill Gap Detected</h4>
                    <p className="text-xl font-bold mb-2 text-[#EDEDED]">Docker</p>
                    <p className="text-[#8A8F98] text-sm mb-6">No public evidence found matching job requirement.</p>
                    
                    <div className="p-5 border border-white/10 bg-[#050505] rounded-lg">
                      <div className="flex items-center gap-3 mb-3">
                        <Layers className="w-5 h-5 text-[#00E5FF]" />
                        <h5 className="font-bold text-sm text-[#EDEDED]">Actionable Task</h5>
                      </div>
                      <p className="text-sm text-[#EDEDED] font-medium mb-1">&quot;Containerize an existing project.&quot;</p>
                      <p className="text-xs text-[#8A8F98] mb-4">Estimated time: 1–2 hours • Output: Dockerfile + documentation</p>
                      <button className="text-xs font-bold text-[#050505] bg-[#EDEDED] px-4 py-2 rounded transition-transform hover:scale-105 w-full sm:w-auto">
                        Complete Task
                      </button>
                    </div>
                  </div>
                </Reveal>
              </div>

              <div className="order-1 lg:order-2">
                <Reveal delay={200}>
                  <h2 className="text-4xl font-semibold tracking-tight mb-6">
                    Know the gap.
                    <br />
                    <span className="text-[#F59E0B]">Build the proof.</span>
                  </h2>
                  <p className="text-lg text-[#8A8F98] leading-relaxed mb-6">
                    When evidence is missing, SkillProof doesn't just reject. It identifies exactly what's missing and provides specific, actionable micro-tasks.
                  </p>
                  <p className="text-lg text-[#8A8F98] leading-relaxed">
                    Turn the gaps into something actionable, giving candidates a fair chance to prove their capabilities.
                  </p>
                </Reveal>
              </div>

            </div>
          </div>
        </section>

        {/* --- 12. LARGE TYPOGRAPHIC SECTION --- */}
        <section className="py-40 bg-[#0A0A0A] border-y border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] flex items-center justify-center overflow-hidden">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <Reveal>
              <h2 className="text-5xl sm:text-7xl font-extrabold tracking-tighter text-[#8A8F98]/20 uppercase">
                Claims are information.
              </h2>
            </Reveal>
            <Reveal delay={300}>
              <h2 className="text-5xl sm:text-7xl font-extrabold tracking-tighter text-[#EDEDED] uppercase mt-2 drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]">
                Evidence is confidence.
              </h2>
            </Reveal>
            <Reveal delay={600}>
              <p className="text-xl sm:text-2xl text-[#00E5FF] font-mono mt-8 tracking-wide">
                SkillProof connects the two.
              </p>
            </Reveal>
          </div>
        </section>

        {/* --- 13. FINAL CTA --- */}
        <section className="py-32 bg-[#050505]">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <Reveal>
              <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                <Briefcase className="w-8 h-8 text-[#EDEDED]" />
              </div>
              <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-6">
                Ready to prove the work behind your skills?
              </h2>
              <p className="text-lg text-[#8A8F98] mb-10 max-w-2xl mx-auto">
                Turn your resume claims into evidence a recruiter can inspect. Stop relying on buzzwords and start leading with proof.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/signup"
                  className="group relative inline-flex items-center justify-center gap-2 bg-[#EDEDED] text-[#050505] px-8 py-4 rounded-lg font-bold transition-transform hover:scale-[1.02] active:scale-95 text-lg"
                >
                  Build Your SkillProof <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  <div className="absolute inset-0 rounded-lg shadow-[0_0_20px_rgba(255,255,255,0.3)] opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
                <Link
                  href="/signup?role=recruiter"
                  className="inline-flex items-center justify-center gap-2 bg-[#0A0A0A] border border-white/10 hover:bg-white/5 text-[#EDEDED] px-8 py-4 rounded-lg font-bold transition-colors text-lg"
                >
                  For Recruiters
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      {/* --- FOOTER --- */}
      <footer className="border-t border-white/10 bg-[#050505] py-12">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#00E5FF]" />
            <span className="font-bold text-[#EDEDED]">SkillProof</span>
          </div>
          <p className="text-sm text-[#8A8F98]">
            © {new Date().getFullYear()} SkillProof. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm font-medium text-[#8A8F98]">
            <Link href="#" className="hover:text-[#EDEDED]">Privacy</Link>
            <Link href="#" className="hover:text-[#EDEDED]">Terms</Link>
            <Link href="/login" className="hover:text-[#EDEDED]">Log In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
