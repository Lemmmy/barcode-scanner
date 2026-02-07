import clsx from "clsx";
import { memo, useEffect, useRef } from "react";

interface FpsCounterProps {
  scanFpsRef: React.RefObject<number>;
  detectionFpsRef: React.RefObject<number>;
  detectTimeRef: React.RefObject<number>;
  videoFetchTimeRef: React.RefObject<number>;
}

export const FpsCounter = memo(function FpsCounter({
  scanFpsRef,
  detectionFpsRef,
  detectTimeRef,
  videoFetchTimeRef,
}: FpsCounterProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Update display every 500ms
    const interval = setInterval(() => {
      const scanFps = scanFpsRef.current || 0;
      const detectionFps = detectionFpsRef.current || 0;
      const detectTime = detectTimeRef.current || 0;
      const videoFetchTime = videoFetchTimeRef.current || 0;

      // Direct DOM manipulation - no React re-renders
      container.textContent = `Scan: ${scanFps.toFixed(1)} FPS | Detect: ${detectionFps.toFixed(1)} FPS | detect(): ${detectTime.toFixed(1)}ms | video: ${videoFetchTime.toFixed(1)}ms`;
    }, 500);

    return () => clearInterval(interval);
  }, [scanFpsRef, detectionFpsRef, detectTimeRef, videoFetchTimeRef]);

  return (
    <div
      ref={containerRef}
      className={clsx(
        "pointer-events-none fixed bottom-2 right-2 z-50 select-none rounded bg-black/60 px-2 py-1",
        "font-mono text-xs text-white backdrop-blur-sm max-w-[240px] text-right",
      )}
      style={{
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      Scan: 0.0 FPS | Detect: 0.0 FPS | detect(): 0.0ms | video: 0.0ms
    </div>
  );
});
