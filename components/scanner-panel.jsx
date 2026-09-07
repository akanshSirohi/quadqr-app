"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ImageUp, Loader2, RefreshCw, ScanLine, ShieldCheck, X } from "lucide-react";
import { initWasm, scanFile, startCameraScanner } from "quadqr-js/browser";
import { Button } from "@/components/ui/button";
import ScanResultDialog from "@/components/scan-result-dialog";
import { classifyPayload } from "@/lib/payload";

let wasmWarmupPromise = null;

function warmScannerWasm() {
  if (!wasmWarmupPromise) wasmWarmupPromise = initWasm().catch(() => null);
  return wasmWarmupPromise;
}

export default function ScannerPanel() {
  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const cameraSessionRef = useRef(0);
  const cameraAbortRef = useRef(null);
  const cameraStateRef = useRef("idle");
  const resultHandledRef = useRef(false);
  const mountedRef = useRef(true);
  const fileRef = useRef(null);
  const [cameraState, setCameraState] = useState("idle");
  const [error, setError] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [resultOpen, setResultOpen] = useState(false);
  const [imageScanning, setImageScanning] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    warmScannerWasm();
    return () => {
      mountedRef.current = false;
      disposeCamera(false);
    };
  }, []);

  function setCameraStateSafe(nextState) {
    cameraStateRef.current = nextState;
    if (mountedRef.current) setCameraState(nextState);
  }

  function disposeCamera(updateState = true) {
    cameraSessionRef.current += 1;
    resultHandledRef.current = false;

    const abortController = cameraAbortRef.current;
    cameraAbortRef.current = null;
    try { abortController?.abort(); } catch {}

    const scanner = scannerRef.current;
    scannerRef.current = null;
    try { scanner?.stop?.(); } catch {}

    // startCameraScanner owns its MediaStream once it is running. This is a
    // fallback for an aborted/failed startup that attached a stream before the
    // scanner object became available to us.
    const video = videoRef.current;
    const stream = video?.srcObject;
    if (stream?.getTracks) {
      stream.getTracks().forEach((track) => {
        try { track.stop(); } catch {}
      });
    }
    if (video) video.srcObject = null;

    if (updateState) setCameraStateSafe("idle");
  }

  function handleDecoded(decoded) {
    const text = decoded?.text
      ?? (decoded?.payload instanceof Uint8Array
        ? new TextDecoder().decode(decoded.payload)
        : decoded?.payload ?? "");
    setScanResult(classifyPayload(text));
    setResultOpen(true);
  }

  function pauseForResult(decoded, session) {
    if (cameraSessionRef.current !== session || resultHandledRef.current) return;
    resultHandledRef.current = true;

    // Keep the camera stream alive. Reusing it is much more reliable than
    // tearing down and reacquiring getUserMedia after every successful scan.
    try { scannerRef.current?.pause?.(); } catch {}
    handleDecoded(decoded);
    setCameraStateSafe("found");
  }

  async function startCamera({ forceRestart = false } = {}) {
    setError("");
    setResultOpen(false);

    // A completed scan leaves the scanner paused with the stream alive.
    // Resume it instantly unless the user explicitly asked for a hard restart.
    if (!forceRestart && scannerRef.current && cameraState === "found") {
      resultHandledRef.current = false;
      try {
        scannerRef.current.resume?.();
        setCameraStateSafe("scanning");
        return;
      } catch {
        // Fall through to a clean restart if the old stream can no longer resume.
      }
    }

    disposeCamera(false);
    const session = cameraSessionRef.current;
    const abortController = new AbortController();
    cameraAbortRef.current = abortController;
    resultHandledRef.current = false;
    setCameraStateSafe("starting");

    // Give React one paint so the video element and loading state are settled.
    await new Promise((resolve) => requestAnimationFrame(resolve));
    if (cameraSessionRef.current !== session || abortController.signal.aborted) return;

    const video = videoRef.current;
    if (!video) {
      if (cameraAbortRef.current === abortController) cameraAbortRef.current = null;
      setCameraStateSafe("idle");
      return;
    }

    let resultArrivedBeforeReady = false;

    try {
      const scanner = await startCameraScanner(video, {
        cameraWorker: true,
        continuous: true,
        signal: abortController.signal,
        onResult: (decoded) => {
          if (cameraSessionRef.current !== session || abortController.signal.aborted) return;
          if (!scannerRef.current) resultArrivedBeforeReady = true;
          pauseForResult(decoded, session);
        },
        onCameraState: (event) => {
          if (cameraSessionRef.current !== session || abortController.signal.aborted) return;
          if (event?.state === "ended") {
            scannerRef.current = null;
            setCameraStateSafe("idle");
            setError("The camera stopped unexpectedly. Start it again to continue scanning.");
            return;
          }
          if (event?.state === "stopped" && cameraStateRef.current === "scanning") {
            scannerRef.current = null;
            setCameraStateSafe("idle");
          }
        }
      });

      if (cameraSessionRef.current !== session || abortController.signal.aborted) {
        try { scanner.stop?.(); } catch {}
        return;
      }

      scannerRef.current = scanner;

      if (resultArrivedBeforeReady || resultHandledRef.current) {
        try { scanner.pause?.(); } catch {}
        setCameraStateSafe("found");
      } else {
        setCameraStateSafe("scanning");
      }
    } catch (err) {
      if (cameraSessionRef.current !== session || abortController.signal.aborted) return;
      if (cameraAbortRef.current === abortController) cameraAbortRef.current = null;

      // Ensure a partially-opened browser stream cannot keep the camera locked.
      const stream = video.srcObject;
      if (stream?.getTracks) {
        stream.getTracks().forEach((track) => {
          try { track.stop(); } catch {}
        });
      }
      video.srcObject = null;
      setCameraStateSafe("idle");

      const message = String(err?.message || "").toLowerCase();
      setError(message.includes("permission") || message.includes("notallowed")
        ? "Camera access was blocked. Allow camera access in your browser and try again."
        : message.includes("notfound") || message.includes("device")
          ? "No usable camera was found on this device. You can still scan an image instead."
          : "The camera could not be started. You can still scan an image instead.");
    }
  }

  function cancelCameraStart() {
    disposeCamera();
  }

  async function scanImage(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError("");
    setImageScanning(true);
    disposeCamera();
    const imageSession = cameraSessionRef.current;

    try {
      const result = await scanFile(file);
      if (!mountedRef.current || cameraSessionRef.current !== imageSession) return;
      handleDecoded(result);
    } catch {
      if (!mountedRef.current || cameraSessionRef.current !== imageSession) return;
      setError("No readable QuadQR was found in that image. Try a sharper or closer photo.");
    } finally {
      if (mountedRef.current) setImageScanning(false);
    }
  }

  function scanAgain() {
    setResultOpen(false);
    setScanResult(null);
    startCamera();
  }

  function handlePrimaryCameraAction() {
    if (cameraState === "starting") {
      cancelCameraStart();
      return;
    }
    if (cameraState === "scanning") {
      startCamera({ forceRestart: true });
      return;
    }
    startCamera();
  }

  const isLive = cameraState === "scanning" || cameraState === "starting" || cameraState === "found";
  const cameraButtonLabel = cameraState === "starting"
    ? "Cancel camera"
    : cameraState === "scanning"
      ? "Restart camera"
      : cameraState === "found"
        ? "Resume camera"
        : "Start camera";

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
          <Button size="lg" onClick={handlePrimaryCameraAction} className="text-sm sm:text-base">
            {cameraState === "starting"
              ? <X className="size-4" />
              : cameraState === "scanning"
                ? <RefreshCw className="size-4" />
                : <Camera className="size-4" />}
            {cameraButtonLabel}
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
