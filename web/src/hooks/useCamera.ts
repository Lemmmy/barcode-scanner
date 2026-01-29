import { useEffect, useState } from "react";

interface UseCameraOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

export function useCamera({ videoRef }: UseCameraOptions) {
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Camera error:", error);
        setCameraError("Failed to access camera. Please grant camera permissions.");
      }
    };

    void initCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [videoRef]);

  return { cameraError };
}
