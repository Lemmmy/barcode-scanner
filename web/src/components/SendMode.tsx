import { useRef, useState, useCallback } from "react";
import { List, Pause, Play } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import { playBeep } from "../lib/audio";
import { generateId } from "../lib/utils";
import ScannedCodesLog from "./ScannedCodesLog";
import { SettingsFlyout } from "./SettingsFlyout";
import { useShallow } from "zustand/react/shallow";
import { SendModeHeader } from "./SendModeHeader";
import { useCamera } from "../hooks/useCamera";
import { useBarcodeScanner } from "../hooks/useBarcodeScanner";
import { useSocketConnection } from "../hooks/useSocketConnection";
import { DebugConsole } from "./DebugConsole";
import clsx from "clsx";

export default function SendMode() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [showFlash, setShowFlash] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const { isLogOpen, setLogOpen, reset } = useAppStore(
    useShallow((state) => ({
      isLogOpen: state.isLogOpen,
      setLogOpen: state.setLogOpen,
      reset: state.reset,
    })),
  );

  const { cameraError } = useCamera({ videoRef });
  useSocketConnection();

  // Stable callback that accesses store state directly
  const handleBarcodeDetected = useCallback((code: string) => {
    const { socketRef, isMuted, addScannedCode } = useAppStore.getState();

    console.log(
      "handleBarcodeDetected called, socketRef:",
      socketRef,
      "connected:",
      socketRef?.connected,
    );
    if (!socketRef?.connected) {
      console.log("Socket not connected, skipping");
      return;
    }

    console.log("Sending barcode to server:", code);
    socketRef.emit("scanBarcode", code);

    if (!isMuted) {
      playBeep();
    }

    addScannedCode({
      id: generateId(),
      code,
      timestamp: Date.now(),
    });

    // Update last scanned code and trigger flash animation
    setLastScannedCode(code);
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 750);
  }, []);

  useBarcodeScanner({
    videoRef,
    canvasRef,
    isScanning,
    onBarcodeDetected: handleBarcodeDetected,
  });

  if (cameraError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 p-6 text-white">
        <p className="mb-4 text-center text-lg">{cameraError}</p>
        <button
          onClick={reset}
          className="rounded-lg bg-white px-6 py-3 font-semibold text-gray-900 transition-colors hover:bg-gray-100"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 h-full w-full object-cover"
      />

      <canvas ref={canvasRef} className="hidden" />

      <div className="absolute inset-0 flex flex-col">
        <SendModeHeader onSettingsClick={() => setIsSettingsOpen(true)} />

        <div className="flex-1" />

        <div className="space-y-3 p-4">
          {lastScannedCode && (
            <div
              className={clsx(
                "overflow-hidden rounded-lg px-4 py-3 text-center font-mono text-sm font-semibold backdrop-blur-sm transition-colors",
                showFlash
                  ? "bg-green-500/20 text-green-200 opacity-100"
                  : "opacity-80 bg-black/50 text-white",
              )}
            >
              <div className="truncate whitespace-nowrap">{lastScannedCode}</div>
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => setIsScanning(!isScanning)}
              className={clsx(
                "flex flex-1 items-center justify-center gap-2 rounded-lg px-6 py-4 font-semibold text-white backdrop-blur-sm transition-colors",
                isScanning
                  ? "bg-black/50 hover:bg-black/60 active:bg-black/70"
                  : "bg-yellow-500/20 hover:bg-yellow-500/30 active:bg-yellow-500/40",
              )}
            >
              {isScanning ? (
                <>
                  <Pause className="h-5 w-5" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="h-5 w-5" />
                  <span>Resume</span>
                </>
              )}
            </button>
            <button
              onClick={() => setLogOpen(true)}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-black/50 px-6 py-4 font-semibold text-white backdrop-blur-sm transition-colors hover:bg-black/60 active:bg-black/70"
            >
              <List className="h-5 w-5" />
              <span>Log</span>
            </button>
          </div>
        </div>
      </div>

      <ScannedCodesLog isOpen={isLogOpen} onClose={() => setLogOpen(false)} />
      <SettingsFlyout isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <DebugConsole />
    </div>
  );
}
