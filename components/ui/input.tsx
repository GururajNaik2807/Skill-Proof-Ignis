import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-ink uppercase tracking-wider"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          ref={ref}
          className={cn(
            "w-full px-3.5 py-2.5 bg-paper border border-border rounded-[9px] text-sm text-ink placeholder:text-muted-text/50 focus:outline-none focus:border-deep-green focus:ring-1 focus:ring-deep-green transition-colors",
            error && "border-status-error focus:border-status-error focus:ring-status-error",
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-status-error flex items-center gap-1">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";