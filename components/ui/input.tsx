import * as React from "react";

import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "flex h-11 w-full rounded-2xl border border-white/20 bg-white/60 px-4 py-2 text-sm shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring dark:bg-white/5",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
