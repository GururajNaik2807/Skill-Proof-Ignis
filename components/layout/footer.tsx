import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-soft-surface/50 text-xs text-muted-text">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-deep-green flex items-center justify-center text-white">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald" />
              </div>
              <span className="font-bold text-ink text-sm font-heading">
                SkillProof
              </span>
            </Link>
            <p className="text-muted-text max-w-sm leading-relaxed">
              Verifying technical claims against public GitHub repositories, commit
              recency, unit test presence, and package manifests.
            </p>
            <p className="text-[11px] font-medium text-deep-green">
              &ldquo;Your resume says it. Your work proves it.&rdquo;
            </p>
          </div>

          {/* Product links */}
          <div>
            <h4 className="font-semibold text-ink uppercase tracking-wider text-[11px] mb-3">
              Product
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/#evidence" className="hover:text-ink transition-colors">
                  Evidence Engine
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="hover:text-ink transition-colors">
                  Verification Pipeline
                </Link>
              </li>
              <li>
                <Link href="/#example" className="hover:text-ink transition-colors">
                  Live Sample Audit
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="hover:text-ink transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal / Policy links */}
          <div>
            <h4 className="font-semibold text-ink uppercase tracking-wider text-[11px] mb-3">
              Trust & Legal
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="hover:text-ink transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-ink transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-ink transition-colors">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-status-proven"></span>
            <span>All systems operational • Public GitHub verification active</span>
          </div>
          <div>
            © {new Date().getFullYear()} SkillProof. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}