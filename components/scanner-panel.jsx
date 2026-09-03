"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ImageUp, Loader2, RefreshCw, ScanLine, ShieldCheck } from "lucide-react";
import { scanFile, startCameraScanner } from "quadqr-js/browser";
import { Button } from "@/components/ui/button";
import ScanResultDialog from "@/components/scan-result-dialog";
import { classifyPayload } from "@/lib/payload";

export default function ScannerPanel() {
  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const cameraSessionRef = useRef(0);
  const cameraStartRef = useRef(null);
  const fileRef = useRef(null);
  const [cameraState, setCameraState] = useState("idle");
  const [error, setError] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [resultOpen, setResultOpen] = useState(false);
  const [imageScanning, setImageScanning] = useState(false);

  useEffect(() => () => stopScanner(), []);

  function stopScanner() {
    cameraSessionRef.current += 1;
    try { scannerRef.current?.stop?.(); } catch {}
    scannerRef.current = null;
    const stream = videoRef.current?.srcObject;
    if (stream?.getTracks) stream.getTracks().forEach((track) => track.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraState("idle");
  }

  function handleDecoded(decoded, cameFromCamera = Boolean(scannerRef.current)) {
    const text = decoded?.text ?? (decoded?.payload instanceof Uint8Array ? new TextDecoder().decode(decoded.payload) : decoded?.payload ?? "");
    const parsed = classifyPayload(text);
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
    const session = cameraSessionRef.current;
    setCameraState("starting");
    await new Promise((resolve) => requestAnimationFrame(resolve));

    const pendingStart = cameraStartRef.current;
    if (pendingStart) {
      try { await pendingStart; } catch {}
    }
    if (cameraSessionRef.current !== session) return;

    const video = videoRef.current;
    if (!video) return;

    const startPromise = startCameraScanner(video, {
      cameraWorker: true,
      onResult: (decoded) => {
        if (cameraSessionRef.current !== session) return;
        cameraSessionRef.current += 1;
        handleDecoded(decoded, true);
      }
    });
    cameraStartRef.current = startPromise;

    try {
      const scanner = await startPromise;
      if (cameraSessionRef.current !== session) {
        try { scanner.stop?.(); } catch {}
        return;
      }
      scannerRef.current = scanner;
      setCameraState("scanning");
    } catch (err) {
      if (cameraSessionRef.current !== session) return;
      setCameraState("idle");
      setError(err?.message?.toLowerCase().includes("permission")
        ? "Camera access was blocked. Allow camera access in your browser and try again."
        : "The camera could not be started. You can still scan an image instead.");
    } finally {
      if (cameraStartRef.current === startPromise) cameraStartRef.current = null;
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
