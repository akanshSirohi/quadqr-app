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

const QR_SIZE_OPTIONS = [512, 720, 900, 1200, 1600];

const STYLES = [
  { id: "classic", label: "Classic" },
  { id: "depth", label: "Depth" },
  { id: "soft", label: "Soft" },
  { id: "inset", label: "Inset" }
];

function FieldLabel({ children }) {
  return <label className="mb-2 block text-sm font-semibold text-foreground">{children}</label>;
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
  const [imageSize, setImageSize] = useState(720);
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
          imageSize,
          quietZone: 2,
          mode: outputMode,
          ...(!highDensity ? { style } : {}),
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
  }, [payload, style, imageSize, highDensity, outputMode, logoDataUrl, clearLogoBackground]);

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
      canvas.width = imageSize;
      canvas.height = imageSize;
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

  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-[1.05fr_.95fr] lg:gap-5">
      <section className="soft-card min-w-0 rounded-2xl p-3.5 sm:rounded-3xl sm:p-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-muted-foreground">Create</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-foreground sm:text-2xl">What do you want to share?</h2>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 sm:mt-6 sm:grid-cols-5">
          {PAYLOAD_TYPES.map((item) => (
            <button
              key={item.id}
              onClick={() => setType(item.id)}
              className={cn("min-h-10 rounded-xl px-2 py-2 text-sm font-semibold transition sm:px-4 sm:py-2.5", type === item.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground")}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-5 sm:mt-6"><PayloadFields type={type} values={values} setValues={setValues} /></div>

        {!highDensity ? (
          <div className="mt-6 sm:mt-7">
            <FieldLabel>Style</FieldLabel>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {STYLES.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setStyle(item.id)}
                  className={cn("min-h-11 rounded-xl border px-3 py-2.5 text-sm font-semibold transition sm:py-3", style === item.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground hover:border-border")}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-6 sm:mt-7">
          <FieldLabel>Logo</FieldLabel>
          {!logoDataUrl ? (
            <label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-muted/50 px-4 py-4 text-sm font-semibold text-muted-foreground transition hover:border-ring hover:bg-muted sm:py-5">
              <ImagePlus className="size-4" /> Add a logo
              <input type="file" accept="image/*" className="hidden" onChange={chooseLogo} />
            </label>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/50 p-3">
              <div className="checker-bg flex size-12 items-center justify-center overflow-hidden rounded-xl border border-border bg-background">
                <img src={logoDataUrl} alt="Selected logo" className="h-full w-full object-contain" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">Logo added</p>
                <p className="text-xs text-muted-foreground">Size is chosen automatically</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setLogoDataUrl("")} aria-label="Remove logo"><X className="size-4" /></Button>
            </div>
          )}
          {logoDataUrl ? (
            <label className="mt-3 flex items-center justify-between gap-4 rounded-xl px-1 py-2">
              <span><span className="block text-sm font-semibold text-foreground">Clear background</span><span className="text-xs text-muted-foreground">Keeps the logo easy to see</span></span>
              <Switch checked={clearLogoBackground} onCheckedChange={setClearLogoBackground} />
            </label>
          ) : null}
        </div>

        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen} className="mt-6 border-t border-border pt-5">
          <CollapsibleTrigger className="flex min-h-11 w-full items-center justify-between rounded-xl py-2 text-left text-sm font-semibold text-foreground">
            Advanced settings
            <ChevronDown className={cn("size-4 transition-transform", advancedOpen && "rotate-180")} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <div className="space-y-4 rounded-2xl bg-muted/50 p-4">
              <label className="flex items-center justify-between gap-4">
                <span><span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">High density <Sparkles className="size-3.5" /></span><span className="mt-0.5 block text-xs leading-5 text-muted-foreground">Fits more data into the code. Best for sharp screens and good cameras.</span></span>
                <Switch checked={highDensity} onCheckedChange={setHighDensity} />
              </label>
              <div>
                <p className="mb-2 text-sm font-semibold text-foreground">QR size</p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {QR_SIZE_OPTIONS.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setImageSize(size)}
                      className={cn("rounded-xl border px-2 py-2.5 text-sm font-semibold", imageSize === size ? "border-primary bg-background text-foreground" : "border-transparent bg-muted text-muted-foreground hover:text-foreground")}
                    >
                      {size}px
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-foreground">Output</p>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setOutputMode("screen")} className={cn("rounded-xl border px-3 py-2.5 text-sm font-semibold", outputMode === "screen" ? "border-primary bg-background text-foreground" : "border-transparent bg-muted text-muted-foreground hover:text-foreground")}>Screen</button>
                  <button onClick={() => setOutputMode("print")} className={cn("rounded-xl border px-3 py-2.5 text-sm font-semibold", outputMode === "print" ? "border-primary bg-background text-foreground" : "border-transparent bg-muted text-muted-foreground hover:text-foreground")}>Print</button>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </section>

      <aside className="soft-card min-w-0 rounded-2xl p-3.5 sm:rounded-3xl sm:p-6 lg:sticky lg:top-6 lg:h-fit">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-muted-foreground">Preview</p>
            <h2 className="mt-1 text-lg font-bold text-foreground sm:text-xl">Your QuadQR</h2>
          </div>
          {rendering ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : null}
        </div>

        <div className="checker-bg mx-auto mt-4 flex aspect-square w-full max-w-[22rem] items-center justify-center overflow-hidden rounded-2xl border border-border bg-background p-4 sm:mt-5 sm:max-w-none sm:rounded-3xl sm:p-8">
          {svg ? (
            <div
              aria-label="Generated QuadQR preview"
              className="quadqr-preview-svg h-full w-full"
              role="img"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          ) : (
            <div className="max-w-xs text-center text-sm leading-6 text-muted-foreground">Add content to see your QuadQR.</div>
          )}
        </div>
        {error ? <p className="mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}

        <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-5">
          <Button onClick={downloadPng} disabled={!svg}><Download className="size-4" />PNG</Button>
          <Button onClick={downloadSvg} disabled={!svg} variant="outline"><Download className="size-4" />SVG</Button>
        </div>
        <p className="mt-3 text-center text-xs leading-5 text-muted-foreground">Exports at {imageSize}px with compression and a fixed 2-module quiet area.</p>
      </aside>
    </div>
  );
}
