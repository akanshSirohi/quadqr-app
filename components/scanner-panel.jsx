"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ImageUp, Loader2, RefreshCw, ScanLine, ShieldCheck } from "lucide-react";
import { scanFile, startCameraScanner } from "quadqr-js/browser";
import { Button } from "@/components/ui/button";
import ScanResultDialog from "@/components/scan-result-dialog";
import { classifyPayload } from "@/lib/payload";

function fitCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const width = Math.max(1, Math.round(rect.width * dpr));
  const height = Math.max(1, Math.round(rect.height * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  return { width, height, dpr };
}

function drawFinderOverlay(canvas, event) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const { width, height, dpr } = fitCanvas(canvas);
  ctx.clearRect(0, 0, width, height);

  const finders = Array.isArray(event?.finders) ? event.finders.slice(0, 3) : [];
  const scanWidth = Number(event?.scanWidth) || 0;
  const scanHeight = Number(event?.scanHeight) || 0;
  if (!finders.length || !scanWidth || !scanHeight) return;

  const sx = width / scanWidth;
  const sy = height / scanHeight;
  const points = finders.map((finder) => ({
    x: Number(finder.x) * sx,
    y: Number(finder.y) * sy,
    size: Math.max(20 * dpr, Number(finder.moduleSize || 4) * 7 * ((sx + sy) / 2))
  })).filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));

  if (points.length >= 2) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    if (points.length === 3) ctx.closePath();
    ctx.lineWidth = Math.max(2, 2 * dpr);
    ctx.strokeStyle = "rgba(255,255,255,.92)";
    ctx.shadowColor = "rgba(15,23,42,.4)";
    ctx.shadowBlur = 5 * dpr;
    ctx.stroke();
  }

  ctx.shadowBlur = 4 * dpr;
  for (const point of points) {
    ctx.strokeStyle = "rgba(255,255,255,.98)";
    ctx.lineWidth = Math.max(2, 2.2 * dpr);
    const size = point.size;
    ctx.strokeRect(point.x - size / 2, point.y - size / 2, size, size);
  }
  ctx.shadowBlur = 0;
}

export default function ScannerPanel() {
  const videoRef = useRef(null);
  const overlayRef = useRef(null);
  const scannerRef = useRef(null);
  const fileRef = useRef(null);
  const [cameraState, setCameraState] = useState("idle");
  const [error, setError] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [resultOpen, setResultOpen] = useState(false);
  const [imageScanning, setImageScanning] = useState(false);

  useEffect(() => () => stopScanner(), []);

  function stopScanner() {
    try { scannerRef.current?.stop?.(); } catch {}
    scannerRef.current = null;
    const stream = videoRef.current?.srcObject;
    if (stream?.getTracks) stream.getTracks().forEach((track) => track.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraState("idle");
  }

  function handleDecoded(decoded) {
    const text = decoded?.text ?? (decoded?.payload instanceof Uint8Array ? new TextDecoder().decode(decoded.payload) : decoded?.payload ?? "");
    const parsed = classifyPayload(text);
    const cameFromCamera = Boolean(scannerRef.current);
    setScanResult(parsed);
    setResultOpen(true);
    try { scannerRef.current?.stop?.(); } catch {}
    scannerRef.current = null;
    setCameraState(cameFromCamera ? "found" : "idle");
  }

  async function startCamera() {
    setError("");
    setResultOpen(false);
    stopScanner();
    setCameraState("starting");
    await new Promise((resolve) => requestAnimationFrame(resolve));
    try {
      const scanner = await startCameraScanner(videoRef.current, {
        cameraWorker: true,
        onResult: handleDecoded,
        onDiagnostic(event) {
          if (event?.type === "frame" || event?.finders) drawFinderOverlay(overlayRef.current, event);
        }
      });
      scannerRef.current = scanner;
      setCameraState("scanning");
    } catch (err) {
      setCameraState("idle");
      setError(err?.message?.toLowerCase().includes("permission")
        ? "Camera access was blocked. Allow camera access in your browser and try again."
        : "The camera could not be started. You can still scan an image instead.");
    }
  }

  async function scanImage(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    setImageScanning(true);
    stopScanner();
    try {
      const result = await scanFile(file);
      handleDecoded(result);
    } catch {
      setError("No readable QuadQR was found in that image. Try a sharper or closer photo.");
    } finally {
      setImageScanning(false);
    }
  }

  function scanAgain() {
    setResultOpen(false);
    setScanResult(null);
    startCamera();
  }

  const isLive = cameraState === "scanning" || cameraState === "starting" || cameraState === "found";

  return (
    <>
      <section className="soft-card mx-auto min-w-0 max-w-4xl rounded-2xl p-3.5 sm:rounded-3xl sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-muted-foreground">Scan</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-foreground sm:text-2xl">Point your camera at a QuadQR</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Hold the code inside the camera view. The result opens automatically when it is found.</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"><ShieldCheck className="size-4 shrink-0" />Scanning stays on this device</div>
        </div>

        <div className="relative mt-5 aspect-[4/3] w-full overflow-hidden rounded-2xl bg-black sm:mt-6 sm:aspect-video sm:rounded-3xl">
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            autoPlay
            muted
            playsInline
          />
          <canvas ref={overlayRef} className="pointer-events-none absolute inset-0 h-full w-full" />
          {!isLive ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-white/10 text-white ring-1 ring-white/15 sm:size-16 sm:rounded-3xl">
                <ScanLine className="size-7" />
              </div>
              <p className="mt-4 text-base font-semibold text-white">Ready to scan</p>
              <p className="mt-1 max-w-sm text-sm leading-6 text-white/55">Use your camera, or choose an existing image from your device.</p>
            </div>
          ) : null}
          {cameraState === "starting" ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/25 backdrop-blur-[1px]"><Loader2 className="size-7 animate-spin text-white" /></div>
          ) : null}
        </div>

        {error ? <p className="mt-4 rounded-2xl bg-destructive/10 px-4 py-3 text-sm leading-6 text-destructive">{error}</p> : null}

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <Button size="lg" onClick={startCamera} disabled={cameraState === "starting"} className="text-sm sm:text-base">
            {cameraState === "scanning" ? <RefreshCw className="size-4" /> : <Camera className="size-4" />}
            {cameraState === "scanning" ? "Restart camera" : "Start camera"}
          </Button>
          <Button size="lg" variant="outline" onClick={() => fileRef.current?.click()} disabled={imageScanning} className="text-sm sm:text-base">
            {imageScanning ? <Loader2 className="size-4 animate-spin" /> : <ImageUp className="size-4" />}
            Scan an image
          </Button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={scanImage} />
        </div>
      </section>

      <ScanResultDialog
        result={scanResult}
        open={resultOpen}
        onOpenChange={setResultOpen}
        onScanAgain={scanAgain}
      />
    </>
  );
}
