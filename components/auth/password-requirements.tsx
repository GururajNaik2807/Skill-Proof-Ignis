"use client";

import { useMemo } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Rule {
  id: string;
  label: string;
  test: (pw: string) => boolean;
}

const RULES: Rule[] = [
  { id: "length", label: "At least 8 characters", test: (p) => p.length >= 8 },
  { id: "upper", label: "One uppercase letter (A-Z)", test: (p) => /[A-Z]/.test(p) },
  { id: "number", label: "One number (0-9)", test: (p) => /\d/.test(p) },
  { id: "special", label: "One special character (!@#$%^&*)", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

interface PasswordRequirementsProps {
  value: string;
  className?: string;
}

export function PasswordRequirements({ value, className }: PasswordRequirementsProps) {
  const ruleResults = useMemo(() => {
    return RULES.map((r) => ({
      ...r,
      passed: r.test(value),
    }));
  }, [value]);

  const passedCount = ruleResults.filter((r) => r.passed).length;
  const strengthColor =
    passedCount === 4
      ? "bg-status-proven"
      : passedCount >= 2
      ? "bg-status-partial"
      : "bg-status-claimed";

  return (
    <div
      className={cn(
        "p-3.5 bg-soft-surface/60 border border-border rounded-xl space-y-2.5 transition-all text-xs",
        className
      )}
    >
      {/* Strength indicator bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-center text-[11px] font-medium text-muted-text">
          <span>Password strength</span>
          <span className="font-semibold text-ink">
            {passedCount === 4
              ? "Strong"
              : passedCount >= 2
              ? "Moderate"
              : value.length > 0
              ? "Weak"
              : "Not entered"}
          </span>
        </div>
        <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
          <div
            className={cn("h-full transition-all duration-300", strengthColor)}
            style={{ width: `${(passedCount / RULES.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Rules list */}
      <ul className="space-y-1.5 pt-1">
        {ruleResults.map((r) => (
          <li
            key={r.id}
            className={cn(
              "flex items-center gap-2 transition-colors",
              r.passed ? "text-status-proven" : "text-muted-text"
            )}
          >
            <span
              className={cn(
                "w-4 h-4 rounded-full flex items-center justify-center shrink-0 border transition-all",
                r.passed
                  ? "bg-status-proven/10 border-status-proven/30 text-status-proven"
                  : "border-border text-muted-text/40 bg-white"
              )}
            >
              {r.passed ? (
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              ) : (
                <X className="w-2.5 h-2.5 stroke-[2]" />
              )}
            </span>
            <span className={cn(r.passed && "text-ink font-medium")}>{r.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function isPasswordValid(password: string): boolean {
  return RULES.every((r) => r.test(password));
}