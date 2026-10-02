import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SkillProof — Your resume says it. Your work proves it.",
  description:
    "SkillProof connects resume claims with actual GitHub evidence to verify developer skills, identify real gaps, and generate actionable micro-tasks.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable}`}>
      <body className="bg-warm-ivory text-ink font-sans antialiased min-h-screen selection:bg-emerald/20 selection:text-ink">
        {children}
      </body>
    </html>
  );
}