"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

export const Tabs = TabsPrimitive.Root;
export const TabsContent = TabsPrimitive.Content;

export function TabsList({ className, ...props }) {
  return <TabsPrimitive.List data-slot="tabs-list" className={cn("grid grid-cols-2 rounded-2xl bg-muted p-1 text-muted-foreground", className)} {...props} />;
}

export function TabsTrigger({ className, ...props }) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn("rounded-xl px-4 py-2.5 text-sm font-semibold text-muted-foreground transition outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm", className)}
      {...props}
    />
  );
}
