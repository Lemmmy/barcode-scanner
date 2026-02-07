import { useRef } from "react";
import { useBarcodeScanner } from "../hooks/useBarcodeScanner";
import { useCamera } from "../hooks/useCamera";
import { useAppStore } from "@/store/useAppStore";
import { useShallow } from "zustand/react/shallow";
import { HoldToScanButton } from "./HoldToScanButton";

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

  const holdToScan = useAppStore(useShallow((state) => state.settings.holdToScan));

  const isScanningLockedByNotHeldRef = useRef(holdToScan);

  const { cameraError } = useCamera({ videoRef, key: roomCode });

  useBarcodeScanner({
    videoRef,
    canvasRef,
    isScanningEnabled,
    isScanningLockedByDataEntry,
    isScanningLockedByNotHeldRef,
    onBarcodeDetected,
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
