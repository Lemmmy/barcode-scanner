import { useEffect, useState, useRef } from "react";

interface UseCameraOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  key?: string | number | null; // Optional key to force reinitialization
}

export function useCamera({ videoRef, key }: UseCameraOptions) {
  const [cameraError, setCameraError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastKeyRef = useRef<string | number | null | undefined>(undefined);

  useEffect(() => {
    // Reinitialize if key changes
    const shouldReinitialize = key !== undefined && key !== lastKeyRef.current;
    if (!shouldReinitialize && streamRef.current) return;

    lastKeyRef.current = key;

    let mounted = true;

    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1920, min: 1280 },
            height: { ideal: 1080, min: 720 },
            aspectRatio: { ideal: 16 / 9 },
          },
        });

        if (!mounted) {
          // Component unmounted during async operation, clean up immediately
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        if (mounted) {
          console.error("Camera error:", error);
          setCameraError("Failed to access camera. Please grant camera permissions.");
        }
      }
    };

    void initCamera();

    return () => {
      mounted = false;

      // Stop all tracks from the stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
          console.log("Camera track stopped:", track.kind);
        });
        streamRef.current = null;
      }

      // Clear video element
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [videoRef, key]);

  return { cameraError };
}
