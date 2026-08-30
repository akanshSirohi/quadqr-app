"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Download, ImagePlus, Loader2, Sparkles, X } from "lucide-react";
import { encodeText, renderToSVG } from "quadqr-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PAYLOAD_TYPES, buildPayload } from "@/lib/payload";
import { cn } from "@/lib/utils";

const STYLES = [
  { id: "classic", label: "Classic" },
  { id: "depth", label: "Depth" },
  { id: "soft", label: "Soft" },
  { id: "inset", label: "Inset" }
];

function FieldLabel({ children }) {
  return <label className="mb-2 block text-sm font-semibold text-slate-800">{children}</label>;
}

function PayloadFields({ type, values, setValues }) {
  const set = (key) => (event) => setValues((current) => ({ ...current, [key]: event.target.value }));
  if (type === "link") return <div><FieldLabel>Website URL</FieldLabel><Input value={values.url} onChange={set("url")} placeholder="example.com" inputMode="url" /></div>;
  if (type === "text") return <div><FieldLabel>Text</FieldLabel><Textarea value={values.text} onChange={set("text")} placeholder="Write anything you want to share" /></div>;
  if (type === "email") return (
    <div className="space-y-4">
      <div><FieldLabel>Email address</FieldLabel><Input value={values.email} onChange={set("email")} placeholder="hello@example.com" inputMode="email" /></div>
      <div><FieldLabel>Subject</FieldLabel><Input value={values.subject} onChange={set("subject")} placeholder="Optional subject" /></div>
      <div><FieldLabel>Message</FieldLabel><Textarea className="min-h-24" value={values.message} onChange={set("message")} placeholder="Optional message" /></div>
    </div>
  );
  if (type === "sms") return (
    <div className="space-y-4">
      <div><FieldLabel>Phone number</FieldLabel><Input value={values.phone} onChange={set("phone")} placeholder="+91 98765 43210" inputMode="tel" /></div>
      <div><FieldLabel>Message</FieldLabel><Textarea className="min-h-24" value={values.smsMessage} onChange={set("smsMessage")} placeholder="Optional message" /></div>
    </div>
  );
  return <div><FieldLabel>Phone number</FieldLabel><Input value={values.phone} onChange={set("phone")} placeholder="+91 98765 43210" inputMode="tel" /></div>;
}


export default function GeneratorPanel() {
  const [type, setType] = useState("link");
  const [values, setValues] = useState({ url: "", text: "", email: "", subject: "", message: "", phone: "", smsMessage: "" });
  const [style, setStyle] = useState("classic");
  const [highDensity, setHighDensity] = useState(false);
  const [outputMode, setOutputMode] = useState("screen");
  const [clearLogoBackground, setClearLogoBackground] = useState(true);
  const [logoDataUrl, setLogoDataUrl] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [svg, setSvg] = useState("");
  const [error, setError] = useState("");
  const [rendering, setRendering] = useState(false);
  const renderToken = useRef(0);

  const payload = useMemo(() => {
    try { return buildPayload(type, values); } catch { return ""; }
  }, [type, values]);

  useEffect(() => {
    const token = ++renderToken.current;
    const timer = window.setTimeout(() => {
      if (!payload) { setSvg(""); return; }
      setRendering(true);
      try {
        const code = encodeText(payload, {
          ecc: "M",
          highDensity,
          compression: "auto"
        });
        const nextSvg = renderToSVG(code, {
          imageSize: 900,
          quietZone: 2,
          style,
          mode: outputMode,
          ...(logoDataUrl ? {
            logo: {
              source: logoDataUrl,
              size: "auto",
              clearBackground: clearLogoBackground
            }
          } : {})
        });
        if (token === renderToken.current) {
          setSvg(nextSvg);
          setError("");
        }
      } catch (err) {
        if (token === renderToken.current) {
          setSvg("");
          setError(err?.message || "This content could not be turned into a QuadQR.");
        }
      } finally {
        if (token === renderToken.current) setRendering(false);
      }
    }, 120);
    return () => window.clearTimeout(timer);
  }, [payload, style, highDensity, outputMode, logoDataUrl, clearLogoBackground]);

  function chooseLogo(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogoDataUrl(String(reader.result));
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  function downloadSvg() {
    if (!svg) return;
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, "quadqr.svg", true);
  }

  function triggerDownload(url, filename, revoke = false) {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    if (revoke) window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function downloadPng() {
    if (!svg) return;
    const svgBlob = new Blob([svg], { type: "image/svg+xml" });
    const svgUrl = URL.createObjectURL(svgBlob);
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 1200;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(svgUrl);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const pngUrl = URL.createObjectURL(blob);
        triggerDownload(pngUrl, "quadqr.png", true);
      }, "image/png");
    };
    image.src = svgUrl;
  }

  const previewSrc = svg ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}` : "";

  return (
    <div className="grid gap-5 lg:grid-cols-[1.05fr_.95fr]">
      <section className="soft-card rounded-3xl p-4 sm:p-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-slate-400">Create</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">What do you want to share?</h2>
        </div>

        <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
          {PAYLOAD_TYPES.map((item) => (
            <button
              key={item.id}
              onClick={() => setType(item.id)}
              className={cn("shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition", type === item.id ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-6"><PayloadFields type={type} values={values} setValues={setValues} /></div>

        <div className="mt-7">
          <FieldLabel>Style</FieldLabel>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {STYLES.map((item) => (
              <button
                key={item.id}
                onClick={() => setStyle(item.id)}
                className={cn("rounded-xl border px-3 py-3 text-sm font-semibold transition", style === item.id ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300")}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-7">
          <FieldLabel>Logo</FieldLabel>
          {!logoDataUrl ? (
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:bg-slate-100">
              <ImagePlus className="size-4" /> Add a logo
              <input type="file" accept="image/*" className="hidden" onChange={chooseLogo} />
            </label>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="checker-bg flex size-12 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                <img src={logoDataUrl} alt="Selected logo" className="h-full w-full object-contain" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">Logo added</p>
                <p className="text-xs text-slate-500">Size is chosen automatically</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setLogoDataUrl("")} aria-label="Remove logo"><X className="size-4" /></Button>
            </div>
          )}
          {logoDataUrl ? (
            <label className="mt-3 flex items-center justify-between gap-4 rounded-xl px-1 py-2">
              <span><span className="block text-sm font-semibold text-slate-800">Clear background</span><span className="text-xs text-slate-500">Keeps the logo easy to see</span></span>
              <Switch checked={clearLogoBackground} onCheckedChange={setClearLogoBackground} />
            </label>
          ) : null}
        </div>

        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen} className="mt-6 border-t border-slate-200 pt-5">
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-xl py-2 text-left text-sm font-semibold text-slate-800">
            Advanced settings
            <ChevronDown className={cn("size-4 transition-transform", advancedOpen && "rotate-180")} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <div className="space-y-4 rounded-2xl bg-slate-50 p-4">
              <label className="flex items-center justify-between gap-4">
                <span><span className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">High density <Sparkles className="size-3.5" /></span><span className="mt-0.5 block text-xs leading-5 text-slate-500">Fits more data into the code. Best for sharp screens and good cameras.</span></span>
                <Switch checked={highDensity} onCheckedChange={setHighDensity} />
              </label>
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-900">Output</p>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setOutputMode("screen")} className={cn("rounded-xl border px-3 py-2.5 text-sm font-semibold", outputMode === "screen" ? "border-slate-950 bg-white text-slate-950" : "border-transparent bg-slate-100 text-slate-500")}>Screen</button>
                  <button onClick={() => setOutputMode("print")} className={cn("rounded-xl border px-3 py-2.5 text-sm font-semibold", outputMode === "print" ? "border-slate-950 bg-white text-slate-950" : "border-transparent bg-slate-100 text-slate-500")}>Print</button>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </section>

      <aside className="soft-card lg:sticky lg:top-6 lg:h-fit rounded-3xl p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-slate-400">Preview</p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">Your QuadQR</h2>
          </div>
          {rendering ? <Loader2 className="size-4 animate-spin text-slate-400" /> : null}
        </div>

        <div className="checker-bg mt-5 flex aspect-square items-center justify-center overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 sm:p-8">
          {previewSrc ? <img src={previewSrc} alt="Generated QuadQR preview" className="h-full w-full object-contain" /> : <div className="max-w-xs text-center text-sm leading-6 text-slate-400">Add content to see your QuadQR.</div>}
        </div>
        {error ? <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button onClick={downloadPng} disabled={!svg}><Download className="size-4" />PNG</Button>
          <Button onClick={downloadSvg} disabled={!svg} variant="outline"><Download className="size-4" />SVG</Button>
        </div>
        <p className="mt-3 text-center text-xs leading-5 text-slate-400">Optimized automatically with compression and a fixed quiet area.</p>
      </aside>
    </div>
  );
}
