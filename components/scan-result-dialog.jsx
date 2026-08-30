"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, Mail, MessageSquare, Phone, Type } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const icons = {
  link: ExternalLink,
  email: Mail,
  sms: MessageSquare,
  phone: Phone,
  text: Type
};

export default function ScanResultDialog({ result, open, onOpenChange, onScanAgain }) {
  const [copied, setCopied] = useState(false);
  if (!result) return null;
  const Icon = icons[result.type] || Type;

  async function copy() {
    await navigator.clipboard.writeText(result.copyValue || result.display || "");
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Icon className="size-5" />
          </div>
          <div className="min-w-0 flex-1 pr-2">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-muted-foreground">{result.label}</p>
            <DialogTitle className="mt-1 text-xl font-bold text-foreground">{result.title}</DialogTitle>
            <DialogDescription className="sr-only">Actions for the scanned QuadQR result.</DialogDescription>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-border bg-muted/50 p-4">
          <p className="max-h-36 overflow-auto break-words text-sm font-medium leading-6 text-foreground">{result.display || "Empty result"}</p>
          {result.detail ? <p className="mt-2 max-h-28 whitespace-pre-wrap overflow-auto break-words text-sm leading-6 text-muted-foreground">{result.detail}</p> : null}
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {result.actionHref ? (
            <Button onClick={() => {
              if (result.type === "link") window.open(result.actionHref, "_blank", "noopener,noreferrer");
              else window.location.href = result.actionHref;
            }}>
              <ExternalLink className="size-4" />
              {result.actionLabel}
            </Button>
          ) : null}
          <Button variant="outline" onClick={copy} className={!result.actionHref ? "sm:col-span-2" : ""}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
        <Button variant="secondary" onClick={onScanAgain} className="mt-2 w-full">Scan another</Button>
      </DialogContent>
    </Dialog>
  );
}
