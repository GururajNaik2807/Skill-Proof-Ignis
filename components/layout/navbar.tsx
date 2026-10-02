"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck, Menu, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  userEmail?: string | null;
}

export function Navbar({ userEmail }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-warm-ivory/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-deep-green flex items-center justify-center text-white transition-transform group-hover:scale-105">
            <ShieldCheck className="w-5 h-5 text-emerald" />
          </div>
          <span className="text-lg font-bold tracking-tight font-heading text-ink">
            SkillProof
          </span>
        </Link>

        {/* Desktop Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm text-muted-text font-medium">
          <Link href="/#how-it-works" className="hover:text-ink transition-colors">
            How It Works
          </Link>
          <Link href="/#evidence" className="hover:text-ink transition-colors">
            Evidence Engine
          </Link>
          <Link href="/#example" className="hover:text-ink transition-colors">
            Sample Audit
          </Link>
          <Link href="/#faq" className="hover:text-ink transition-colors">
            FAQ
          </Link>
        </nav>

        {/* Action Controls */}
        <div className="hidden md:flex items-center gap-3">
          {userEmail ? (
            <Link href="/dashboard">
              <Button size="sm">
                Dashboard
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Log In
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">
                  Verify Skills
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-ink hover:bg-soft-surface transition-colors"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-warm-ivory px-4 py-4 space-y-3">
          <Link
            href="/#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-1.5 text-sm font-medium text-ink"
          >
            How It Works
          </Link>
          <Link
            href="/#evidence"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-1.5 text-sm font-medium text-ink"
          >
            Evidence Engine
          </Link>
          <Link
            href="/#example"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-1.5 text-sm font-medium text-ink"
          >
            Sample Audit
          </Link>
          <Link
            href="/#faq"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-1.5 text-sm font-medium text-ink"
          >
            FAQ
          </Link>
          <div className="pt-3 border-t border-border flex flex-col gap-2">
            {userEmail ? (
              <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full">Go to Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="secondary" className="w-full">
                    Log In
                  </Button>
                </Link>
                <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full">Verify Skills</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}