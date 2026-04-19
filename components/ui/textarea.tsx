import * as React from "react";

import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-[120px] w-full rounded-2xl border border-white/20 bg-white/60 px-4 py-3 text-sm shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring dark:bg-white/5",
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";
