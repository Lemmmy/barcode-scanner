import { BarcodeDetector } from "barcode-detector";
import { useCallback, useEffect, useRef } from "react";

export const SCAN_INTERVAL_MS = 250;
export const SCAN_COOLDOWN_MS = 5000;

interface UseBarcodeScannerOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isScanningEnabled: boolean;
  isScanningLockedByDataEntry: boolean;
  isScanningLockedByNotHeldRef: React.RefObject<boolean>;
  onBarcodeDetected: (code: string) => void;
  scanFpsRef?: React.RefObject<number>;
  detectionFpsRef?: React.RefObject<number>;
  detectTimeRef?: React.RefObject<number>;
  videoFetchTimeRef?: React.RefObject<number>;
}

export function useBarcodeScanner({
  videoRef,
  canvasRef,
  isScanningEnabled,
  isScanningLockedByDataEntry,
  isScanningLockedByNotHeldRef,
  onBarcodeDetected,
  scanFpsRef,
  detectionFpsRef,
  detectTimeRef,
  videoFetchTimeRef,
}: UseBarcodeScannerOptions) {
  const barcodeDetectorRef = useRef<BarcodeDetector | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastScanTimeRef = useRef<number>(0);
  const pendingCodeRef = useRef<string | null>(null);
  const verificationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScannedCodeRef = useRef<string | null>(null);
  const lastScannedTimeRef = useRef<number>(0);

  // FPS tracking
  const scanTimestampsRef = useRef<number[]>([]);
  const detectionTimestampsRef = useRef<number[]>([]);

  const isScanningEnabledRef = useRef(isScanningEnabled);
  const isScanningLockedByDataEntryRef = useRef(isScanningLockedByDataEntry);
  const onBarcodeDetectedRef = useRef(onBarcodeDetected);

  useEffect(() => {
    isScanningEnabledRef.current = isScanningEnabled;
    isScanningLockedByDataEntryRef.current = isScanningLockedByDataEntry;
    onBarcodeDetectedRef.current = onBarcodeDetected;
  }, [isScanningEnabled, isScanningLockedByDataEntry, onBarcodeDetected]);

  const verifyAndSendBarcode = useCallback(
    async (codeToVerify: string) => {
      if (!videoRef.current || !canvasRef.current || !barcodeDetectorRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });

      if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      try {
        const barcodes = await barcodeDetectorRef.current.detect(canvas);
        if (barcodes.length > 0) {
          const verifiedCode = barcodes[0].rawValue;
          // console.log("Verification scan:", verifiedCode, "expected:", codeToVerify);
          if (verifiedCode === codeToVerify) {
            // Check cooldown: if same code was scanned less than 5s ago, skip
            const now = Date.now();
            if (
              lastScannedCodeRef.current === verifiedCode &&
              now - lastScannedTimeRef.current < SCAN_COOLDOWN_MS
            ) {
              // console.log("Scan cooldown active, skipping");
              pendingCodeRef.current = null;
              return;
            }

            // console.log("Code verified, sending:", verifiedCode);
            lastScannedCodeRef.current = verifiedCode;
            lastScannedTimeRef.current = now;
            onBarcodeDetectedRef.current(verifiedCode);
            pendingCodeRef.current = null;
          } else {
            console.log("Code changed during verification, discarding");
            pendingCodeRef.current = null;
          }
        } else {
          console.log("No code detected during verification, discarding");
          pendingCodeRef.current = null;
        }
      } catch (error) {
        console.error("Barcode verification error:", error);
        pendingCodeRef.current = null;
      }
    },
    [videoRef, canvasRef],
  );

  const scanBarcode = useCallback(async () => {
    if (
      !isScanningEnabledRef.current ||
      isScanningLockedByDataEntryRef.current ||
      isScanningLockedByNotHeldRef.current ||
      !videoRef.current ||
      !canvasRef.current ||
      !barcodeDetectorRef.current
    ) {
      // Even if we're not scanning, continue to queue animation frames in case scanning is re-enabled later
      animationFrameRef.current = requestAnimationFrame(() => void scanBarcode());
      return;
    }

    const now = Date.now();
    const timeSinceLastScan = now - lastScanTimeRef.current;

    if (timeSinceLastScan < SCAN_INTERVAL_MS) {
      animationFrameRef.current = requestAnimationFrame(() => void scanBarcode());
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(() => void scanBarcode());
      return;
    }

    lastScanTimeRef.current = now;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Track video fetch/draw time
    const videoFetchStart = performance.now();
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const videoFetchEnd = performance.now();
    if (videoFetchTimeRef) {
      videoFetchTimeRef.current = videoFetchEnd - videoFetchStart;
    }

    // Track scan FPS (rate of scanBarcode calls that reach detection)
    if (scanFpsRef) {
      scanTimestampsRef.current.push(now);
      // Keep only timestamps from the last second
      scanTimestampsRef.current = scanTimestampsRef.current.filter((t) => now - t < 1000);
      scanFpsRef.current = scanTimestampsRef.current.length;
    }

    try {
      // Track detect() call time
      const detectStart = performance.now();
      const barcodes = await barcodeDetectorRef.current.detect(canvas);
      const detectEnd = performance.now();
      if (detectTimeRef) {
        detectTimeRef.current = detectEnd - detectStart;
      }

      // Track detection FPS (rate of actual barcode.detect() calls)
      if (detectionFpsRef) {
        detectionTimestampsRef.current.push(Date.now());
        const detectionNow = Date.now();
        detectionTimestampsRef.current = detectionTimestampsRef.current.filter(
          (t) => detectionNow - t < 1000,
        );
        detectionFpsRef.current = detectionTimestampsRef.current.length;
      }
      if (barcodes.length > 0) {
        const code = barcodes[0].rawValue;
        // console.log(
        //   "Barcode detected:",
        //   code,
        //   "format:",
        //   barcodes[0].format,
        //   "pending:",
        //   pendingCodeRef.current,
        // );

        if (code && code !== pendingCodeRef.current) {
          // console.log("New code detected, scheduling verification in", SCAN_INTERVAL_MS / 2, "ms");
          pendingCodeRef.current = code;

          if (verificationTimeoutRef.current) {
            clearTimeout(verificationTimeoutRef.current);
          }

          verificationTimeoutRef.current = setTimeout(() => {
            void verifyAndSendBarcode(code);
          }, SCAN_INTERVAL_MS / 2);
        }
      } else if (pendingCodeRef.current) {
        console.log("Code disappeared, clearing pending");
        pendingCodeRef.current = null;
        if (verificationTimeoutRef.current) {
          clearTimeout(verificationTimeoutRef.current);
          verificationTimeoutRef.current = null;
        }
      }
    } catch (error) {
      console.error("Barcode detection error:", error);
    }

    animationFrameRef.current = requestAnimationFrame(() => void scanBarcode());
  }, [videoRef, canvasRef, verifyAndSendBarcode]);

  useEffect(() => {
    let mounted = true;

    const initBarcodeDetector = async () => {
      if (!mounted) return;

      try {
        console.log("Initializing BarcodeDetector...");
        console.log("BarcodeDetector available:", typeof BarcodeDetector !== "undefined");
        barcodeDetectorRef.current = new BarcodeDetector();
        console.log("BarcodeDetector initialized successfully");

        // Log supported formats
        try {
          const formats = await BarcodeDetector.getSupportedFormats();
          console.log("Supported barcode formats:", formats);
        } catch (e) {
          console.log("Could not get supported formats:", e);
        }
      } catch (error) {
        console.error("BarcodeDetector initialization error:", error);
        throw new Error("Barcode detection is not supported in this browser.");
      }
    };

    void initBarcodeDetector();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;

    if (video && barcodeDetectorRef.current) {
      const handleLoadedData = () => {
        console.log("Video loaded, starting barcode scanning loop");
        console.log(
          "Video dimensions:",
          videoRef.current?.videoWidth,
          "x",
          videoRef.current?.videoHeight,
        );
        animationFrameRef.current = requestAnimationFrame(() => void scanBarcode());
      };

      video.addEventListener("loadeddata", handleLoadedData);

      return () => {
        // Remove event listener
        video.removeEventListener("loadeddata", handleLoadedData);

        // Cancel animation frame
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }

        // Clear verification timeout
        if (verificationTimeoutRef.current) {
          clearTimeout(verificationTimeoutRef.current);
          verificationTimeoutRef.current = null;
        }

        console.log("Barcode scanner cleanup complete");
      };
    }

    return () => {
      // Cleanup even if video wasn't ready
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (verificationTimeoutRef.current) {
        clearTimeout(verificationTimeoutRef.current);
        verificationTimeoutRef.current = null;
      }
    };
  }, [scanBarcode, videoRef]);
}
