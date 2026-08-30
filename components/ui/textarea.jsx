import * as React from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }) {
  return (
    <textarea
      data-slot="textarea"
      className={cn("min-h-32 w-full resize-y rounded-xl border border-input bg-background px-3.5 py-3 text-sm text-foreground shadow-xs outline-none transition placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-50", className)}
      {...props}
    />
  );
}
