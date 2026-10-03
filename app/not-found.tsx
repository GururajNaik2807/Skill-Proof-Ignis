"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Terminal, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-6 text-[#EDEDED] font-sans relative overflow-hidden">
      
      {/* Decorative ambient background glow */}
      <div className="absolute inset-0 pointer-events-none -z-10 flex items-center justify-center">
        <div className="w-[30rem] h-[30rem] bg-[#00E5FF]/[0.03] rounded-full blur-3xl" />
      </div>

      <div className="max-w-md w-full text-center flex flex-col items-center relative z-10">
        
        {/* Animated Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-16 h-16 rounded-2xl bg-[#00E5FF]/10 border border-[#00E5FF]/30 flex items-center justify-center mb-8 shadow-[0_0_20px_rgba(0,229,255,0.15)] relative"
        >
          <SearchX className="w-8 h-8 text-[#00E5FF]" />
        </motion.div>

        {/* 404 Text with Pulse Effect */}
        <motion.h1
          animate={{
            textShadow: [
              "0px 0px 8px rgba(0,229,255,0.3)",
              "0px 0px 20px rgba(0,229,255,0.7)",
              "0px 0px 8px rgba(0,229,255,0.3)",
            ],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="text-7xl sm:text-8xl font-black tracking-tighter text-[#EDEDED] mb-4 font-mono"
        >
          404
        </motion.h1>

        {/* Fade up content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
          <h2 className="text-xl sm:text-2xl font-bold mb-3 tracking-tight text-[#EDEDED]">
            Skill not found.
          </h2>
          <p className="text-[#8A8F98] text-sm mb-10 max-w-[280px] leading-relaxed">
            Looks like this route hasn't been deployed yet, or the evidence was lost in the pipeline.
          </p>

          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#00E5FF]/10 text-[#00E5FF] font-semibold text-sm rounded-xl border border-[#00E5FF]/30 hover:bg-[#00E5FF]/20 hover:border-[#00E5FF]/50 transition-all duration-300 shadow-[0_0_12px_rgba(0,229,255,0.15)] hover:shadow-[0_0_24px_rgba(0,229,255,0.25)]"
          >
            <Terminal className="w-4 h-4" />
            Return to Dashboard
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
