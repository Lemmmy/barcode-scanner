import { useRef } from "react";
import { useCamera } from "../hooks/useCamera";
import { useBarcodeScanner } from "../hooks/useBarcodeScanner";

interface SendModeCameraProps {
  roomCode: string | null;
  isScanning: boolean;
  onBarcodeDetected: (code: string) => void;
}

export function SendModeCamera({ roomCode, isScanning, onBarcodeDetected }: SendModeCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { cameraError } = useCamera({ videoRef, key: roomCode });

  useBarcodeScanner({
    videoRef,
    canvasRef,
    isScanning,
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
