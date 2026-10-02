import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center font-medium rounded-lg text-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-deep-green focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
  {
    variants: {
      variant: {
        primary:
          "bg-deep-green text-white hover:bg-deep-green/90 shadow-subtle active:scale-[0.99]",
        secondary:
          "bg-white border border-border text-ink hover:bg-soft-surface hover:border-muted-text/30 active:scale-[0.99]",
        outline:
          "border border-deep-green text-deep-green bg-transparent hover:bg-deep-green/5",
        ghost:
          "text-ink hover:bg-soft-surface hover:text-deep-green",
        destructive:
          "bg-status-error text-white hover:bg-status-error/90 active:scale-[0.99]",
      },
      size: {
        sm: "h-8 px-3 text-xs gap-1.5",
        md: "h-10 px-4 py-2 gap-2",
        lg: "h-11 px-6 text-base gap-2.5",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={loading || disabled}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";