"use client";

import { useEffect, useState } from "react";
import { Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

function isStandalone() {
  return typeof window !== "undefined" && (window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone === true);
}

export default function InstallButton() {
  const [promptEvent, setPromptEvent] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());
    const onBeforeInstall = (event) => {
      event.preventDefault();
      setPromptEvent(event);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  async function install() {
    if (promptEvent) {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice?.outcome === "accepted") setPromptEvent(null);
      return;
    }
    setShowHelp(true);
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={install} className="bg-background/70 px-3">
        <Download className="size-3.5" />
        <span className="hidden min-[360px]:inline">Install app</span>
        <span className="min-[360px]:hidden">Install</span>
      </Button>
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent>
          <div className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-muted">
            <Share2 className="size-5" />
          </div>
          <DialogTitle className="text-xl font-bold text-foreground">Add QuadQR to your home screen</DialogTitle>
          <DialogDescription className="mt-2 text-sm leading-6 text-muted-foreground">
            Open your browser menu and choose <strong className="font-semibold text-foreground">Add to Home Screen</strong> or <strong className="font-semibold text-foreground">Install app</strong>. On iPhone or iPad, use Share, then Add to Home Screen.
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </>
  );
}
