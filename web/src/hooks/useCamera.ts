import { useEffect, useState, useRef } from "react";

interface UseCameraOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  key?: string | number | null; // Optional key to force reinitialization
}

interface CameraError {
  friendlyString: string;
  error: string;
}

export function useCamera({ videoRef, key }: UseCameraOptions) {
  const [cameraError, setCameraError] = useState<CameraError | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastKeyRef = useRef<string | number | null | undefined>(undefined);

  useEffect(() => {
    console.log(
      "[useCamera] Effect triggered - key:",
      key,
      "lastKey:",
      lastKeyRef.current,
      "hasStream:",
      !!streamRef.current,
    );

    // Skip if we already have a stream and key hasn't changed
    if (streamRef.current && key === lastKeyRef.current) {
      console.log("[useCamera] Skipping - stream exists and key unchanged");
      return;
    }

    // Stop existing stream before requesting new one
    if (streamRef.current) {
      console.log("[useCamera] Stopping existing stream before reinit");
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
        console.log("Camera track stopped before reinit:", track.kind);
      });
      streamRef.current = null;
    }

    lastKeyRef.current = key;

    let mounted = true;

    const initCamera = async () => {
      console.log("[useCamera] Requesting camera access...");
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
          console.log("[useCamera] Component unmounted during init, cleaning up");
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        console.log("[useCamera] Camera access granted, stream obtained");
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          console.log("[useCamera] Stream attached to video element");
        } else {
          console.warn("[useCamera] Video ref is null, cannot attach stream");
        }
      } catch (error) {
        if (mounted) {
          console.error("[useCamera] Camera error:", error);
          setCameraError({
            friendlyString: "Failed to access camera. Please grant camera permissions.",
            error: String(error),
          });
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
