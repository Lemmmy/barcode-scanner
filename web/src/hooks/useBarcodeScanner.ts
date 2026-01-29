import { useEffect, useRef, useCallback } from "react";
import { BarcodeDetector } from "barcode-detector";

export const SCAN_INTERVAL_MS = 100;
export const SCAN_COOLDOWN_MS = 5000;

interface UseBarcodeScannerOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isScanning: boolean;
  onBarcodeDetected: (code: string) => void;
}

export function useBarcodeScanner({
  videoRef,
  canvasRef,
  isScanning,
  onBarcodeDetected,
}: UseBarcodeScannerOptions) {
  const barcodeDetectorRef = useRef<BarcodeDetector | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastScanTimeRef = useRef<number>(0);
  const pendingCodeRef = useRef<string | null>(null);
  const verificationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScannedCodeRef = useRef<string | null>(null);
  const lastScannedTimeRef = useRef<number>(0);
  const onBarcodeDetectedRef = useRef(onBarcodeDetected);

  // Always keep the ref updated with the latest callback
  useEffect(() => {
    onBarcodeDetectedRef.current = onBarcodeDetected;
  }, [onBarcodeDetected]);

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
          console.log("Verification scan:", verifiedCode, "expected:", codeToVerify);
          if (verifiedCode === codeToVerify) {
            // Check cooldown: if same code was scanned less than 5s ago, skip
            const now = Date.now();
            if (
              lastScannedCodeRef.current === verifiedCode &&
              now - lastScannedTimeRef.current < SCAN_COOLDOWN_MS
            ) {
              console.log("Scan cooldown active, skipping");
              pendingCodeRef.current = null;
              return;
            }

            console.log("Code verified, sending:", verifiedCode);
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
    if (!isScanning || !videoRef.current || !canvasRef.current || !barcodeDetectorRef.current)
      return;

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
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      const barcodes = await barcodeDetectorRef.current.detect(canvas);
      if (barcodes.length > 0) {
        const code = barcodes[0].rawValue;
        console.log(
          "Barcode detected:",
          code,
          "format:",
          barcodes[0].format,
          "pending:",
          pendingCodeRef.current,
        );

        if (code && code !== pendingCodeRef.current) {
          console.log("New code detected, scheduling verification in", SCAN_INTERVAL_MS / 2, "ms");
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
  }, [isScanning, videoRef, canvasRef, verifyAndSendBarcode]);

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
    if (videoRef.current && barcodeDetectorRef.current) {
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
      videoRef.current.addEventListener("loadeddata", handleLoadedData);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (verificationTimeoutRef.current) {
        clearTimeout(verificationTimeoutRef.current);
      }
    };
  }, [scanBarcode, videoRef]);
}
