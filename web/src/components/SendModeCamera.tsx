import { useRef } from "react";
import { useBarcodeScanner } from "../hooks/useBarcodeScanner";
import { useCamera } from "../hooks/useCamera";
import { useAppStore } from "@/store/useAppStore";
import { useShallow } from "zustand/react/shallow";
import { HoldToScanButton } from "./HoldToScanButton";
import { FpsCounter } from "./FpsCounter";

interface SendModeCameraProps {
  roomCode: string | null;
  isScanningEnabled: boolean;
  isScanningLockedByDataEntry: boolean;
  onBarcodeDetected: (code: string) => void;
}

export function SendModeCamera({
  roomCode,
  isScanningEnabled,
  isScanningLockedByDataEntry,
  onBarcodeDetected,
}: SendModeCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { holdToScan, showFpsCounter } = useAppStore(
    useShallow((state) => ({
      holdToScan: state.settings.holdToScan,
      showFpsCounter: state.settings.showFpsCounter,
    })),
  );

  const isScanningLockedByNotHeldRef = useRef(holdToScan);

  // FPS tracking refs
  const scanFpsRef = useRef<number>(0);
  const detectionFpsRef = useRef<number>(0);
  const detectTimeRef = useRef<number>(0);
  const videoFetchTimeRef = useRef<number>(0);

  const { cameraError } = useCamera({ videoRef, key: roomCode });

  useBarcodeScanner({
    videoRef,
    canvasRef,
    isScanningEnabled,
    isScanningLockedByDataEntry,
    isScanningLockedByNotHeldRef,
    onBarcodeDetected,
    scanFpsRef: showFpsCounter ? scanFpsRef : undefined,
    detectionFpsRef: showFpsCounter ? detectionFpsRef : undefined,
    detectTimeRef: showFpsCounter ? detectTimeRef : undefined,
    videoFetchTimeRef: showFpsCounter ? videoFetchTimeRef : undefined,
  });

  return (
    <>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 h-full w-full object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />

      {holdToScan && (
        <HoldToScanButton isScanningLockedByNotHeldRef={isScanningLockedByNotHeldRef} />
      )}

      {showFpsCounter && (
        <FpsCounter
          scanFpsRef={scanFpsRef}
          detectionFpsRef={detectionFpsRef}
          detectTimeRef={detectTimeRef}
          videoFetchTimeRef={videoFetchTimeRef}
        />
      )}

      {cameraError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4">
          <div className="rounded-lg bg-red-500/90 p-6 text-center text-white backdrop-blur-sm">
            <p className="text-lg font-semibold">{cameraError}</p>
          </div>
        </div>
      )}
    </>
  );
}
