import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, type, ...props }) {
  return (
    <input
      data-slot="input"
      type={type}
      className={cn("h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground shadow-xs outline-none transition placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-50", className)}
      {...props}
    />
  );
}
