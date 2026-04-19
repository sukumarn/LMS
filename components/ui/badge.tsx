import type * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium tracking-wide",
  {
    variants: {
      variant: {
        default: "bg-primary/15 text-primary dark:bg-primary/20",
        secondary: "bg-white/70 text-foreground dark:bg-white/10",
        success: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
        warning: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
        outline: "border border-white/10 bg-transparent text-muted-foreground"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
