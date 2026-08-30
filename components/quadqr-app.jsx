"use client";

import { useEffect } from "react";
import { QrCode, ScanLine, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GeneratorPanel from "@/components/generator-panel";
import ScannerPanel from "@/components/scanner-panel";
import InstallButton from "@/components/install-button";
import ThemeToggle from "@/components/theme-toggle";
import { BASE_PATH } from "@/lib/base-path";

export default function QuadQRApp() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const onLoad = () => navigator.serviceWorker.register(`${BASE_PATH}/sw.js`, { scope: `${BASE_PATH}/` }).catch(() => {});
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return (
    <main className="min-h-screen overflow-x-hidden px-3 py-3 sm:px-5 sm:py-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3 px-0.5 sm:mb-7 sm:flex-nowrap">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary text-primary-foreground shadow-sm sm:size-11">
              <QrCode className="size-5" />
              <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-[#ef233c]" />
              <span className="absolute bottom-1.5 left-1.5 size-1.5 rounded-full bg-[#2563eb]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2"><h1 className="truncate text-base font-extrabold tracking-tight text-foreground sm:text-lg">QuadQR</h1><span className="hidden rounded-full bg-card px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground ring-1 ring-border sm:inline">Create & Scan</span></div>
              <p className="text-xs text-muted-foreground">Color QR, made simple.</p>
            </div>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <InstallButton />
          </div>
        </header>

        <Tabs defaultValue="create" className="w-full">
          <TabsList className="mb-4 w-full sm:mx-auto sm:mb-7 sm:max-w-sm">
            <TabsTrigger value="create" className="flex min-w-0 items-center justify-center gap-2"><Sparkles className="size-4 shrink-0" />Create</TabsTrigger>
            <TabsTrigger value="scan" className="flex min-w-0 items-center justify-center gap-2"><ScanLine className="size-4 shrink-0" />Scan</TabsTrigger>
          </TabsList>
          <TabsContent value="create" className="outline-none"><GeneratorPanel /></TabsContent>
          <TabsContent value="scan" className="outline-none"><ScannerPanel /></TabsContent>
        </Tabs>

        <footer className="safe-bottom mt-8 pb-4 text-center text-xs leading-5 text-muted-foreground">
          QuadQR runs locally in your browser. Camera and generated content stay on your device.
        </footer>
      </div>
    </main>
  );
}
