import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useCallback, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useBarcodeScanner } from "../hooks/useBarcodeScanner";
import { useCamera } from "../hooks/useCamera";
import { useSocketConnection } from "../hooks/useSocketConnection";
import { playBeep } from "../lib/audio";
import { generateId } from "../lib/utils";
import { useAppStore } from "../store/useAppStore";
import { DataEntryDialog } from "./DataEntryDialog";
import { DebugConsole } from "./DebugConsole";
import { SendModeControls } from "./SendModeControls";
import { SendModeHeader } from "./SendModeHeader";
import { TemplateImportDialog } from "./TemplateImportDialog";

export default function SendMode() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [pendingCode, setPendingCode] = useState<string | null>(null);

  const isDesktop = useMediaQuery("(min-width: 512px)");

  const { reset, templates, activeTemplateId, connectionStatus } = useAppStore(
    useShallow((state) => ({
      reset: state.reset,
      templates: state.templates,
      activeTemplateId: state.activeTemplateId,
      connectionStatus: state.connectionStatus,
    })),
  );

  const { cameraError } = useCamera({ videoRef, key: connectionStatus.roomCode });
  const { incomingTemplate, setIncomingTemplate } = useSocketConnection();

  // Stable callback that accesses store state directly
  const handleBarcodeDetected = useCallback((code: string) => {
    const { socketRef, isMuted, addScannedCode, templates, activeTemplateId } =
      useAppStore.getState();

    if (!socketRef?.connected) {
      console.warn("Socket not connected, skipping detected barcode");
      return;
    }

    // Check if template is active
    const activeTemplate = templates.find((t) => t.id === activeTemplateId);
    if (activeTemplate) {
      // Show data entry dialog
      setPendingCode(code);
      if (!isMuted) {
        playBeep();
      }
      setLastScannedCode(code);
      return;
    }

    console.log("Sending barcode to server:", code);
    socketRef.emit("scanBarcode", { code });

    if (!isMuted) {
      playBeep();
    }

    void addScannedCode({
      id: generateId(),
      code,
      timestamp: Date.now(),
    });

    // Update last scanned code and trigger flash animation
    setLastScannedCode(code);
  }, []);

  const handleDataEntrySubmit = useCallback(
    (data: Record<string, unknown>) => {
      if (!pendingCode) return;

      const { socketRef, addScannedCode } = useAppStore.getState();

      // Extract field order from data
      const fieldOrder = data.__fieldOrder as string[] | undefined;
      const { __fieldOrder, ...templateData } = data;

      console.log(
        "Sending barcode with template data:",
        pendingCode,
        templateData,
        "fieldOrder:",
        fieldOrder,
      );
      if (socketRef?.connected) {
        socketRef.emit("scanBarcode", {
          code: pendingCode,
          templateData,
          fieldOrder,
        });
      }

      void addScannedCode({
        id: generateId(),
        code: pendingCode,
        timestamp: Date.now(),
        templateData,
        fieldOrder,
      });

      setPendingCode(null);
    },
    [pendingCode],
  );

  const handleImportTemplate = useCallback(() => {
    if (!incomingTemplate) return;
    const { addTemplate, updateTemplate, templates } = useAppStore.getState();

    const existing = templates.find((t) => t.name === incomingTemplate.name);
    if (existing) {
      void updateTemplate(existing.id, incomingTemplate);
    } else {
      void addTemplate({
        ...incomingTemplate,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    setIncomingTemplate(null);
  }, [incomingTemplate]);

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

  const sendModeControls = (
    <SendModeControls
      lastScannedCode={lastScannedCode}
      isScanning={isScanning}
      setIsScanning={setIsScanning}
    />
  );

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
        <SendModeHeader />

        {/* Controls: at the top for mobile, bottom for desktop */}
        {!isDesktop && sendModeControls}

        {/* Spacer */}
        <div className="flex-1" />

        {isDesktop && sendModeControls}
      </div>

      {pendingCode && activeTemplateId && (
        <DataEntryDialog
          open={true}
          onOpenChange={(open) => !open && setPendingCode(null)}
          template={templates.find((t) => t.id === activeTemplateId)!}
          scannedCode={pendingCode}
          onSubmit={handleDataEntrySubmit}
        />
      )}
      {incomingTemplate && (
        <TemplateImportDialog
          open={true}
          onOpenChange={(open) => !open && setIncomingTemplate(null)}
          template={incomingTemplate}
          existingTemplate={templates.find((t) => t.name === incomingTemplate.name)}
          onConfirm={handleImportTemplate}
        />
      )}
      {import.meta.env.DEV && <DebugConsole />}
    </div>
  );
}
