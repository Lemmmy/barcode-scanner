import { useRef, useState, useCallback } from "react";
import { List, Pause, Play, FileText } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import { playBeep } from "../lib/audio";
import { generateId } from "../lib/utils";
import ScannedCodesLog from "./ScannedCodesLog";
import { SettingsFlyout } from "./SettingsFlyout";
import { useShallow } from "zustand/react/shallow";
import { SendModeHeader } from "./SendModeHeader";
import { useCamera } from "../hooks/useCamera";
import { useBarcodeScanner } from "../hooks/useBarcodeScanner";
import { useSocketConnection } from "../hooks/useSocketConnection";
import { DebugConsole } from "./DebugConsole";
import { TemplateManagerFlyout } from "./TemplateSelectorFlyout";
import { DataEntryDialog } from "./DataEntryDialog";
import { TemplateImportDialog } from "./TemplateImportDialog";
import type { DataEntryTemplate } from "../types";
import clsx from "clsx";

export default function SendMode() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [showFlash, setShowFlash] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTemplateSelectorOpen, setIsTemplateSelectorOpen] = useState(false);
  const [pendingCode, setPendingCode] = useState<string | null>(null);

  const { isLogOpen, setLogOpen, reset, templates, activeTemplateId, connectionStatus } =
    useAppStore(
      useShallow((state) => ({
        isLogOpen: state.isLogOpen,
        setLogOpen: state.setLogOpen,
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

    console.log(
      "handleBarcodeDetected called, socketRef:",
      socketRef,
      "connected:",
      socketRef?.connected,
    );
    if (!socketRef?.connected) {
      console.log("Socket not connected, skipping");
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
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 750);
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
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 750);
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

  const handleShareTemplate = useCallback((template: DataEntryTemplate) => {
    const { socketRef } = useAppStore.getState();
    if (socketRef?.connected) {
      console.log("Sharing template with room:", template.name);
      socketRef.emit("shareTemplate", template);
    } else {
      console.warn("Cannot share template: not connected to room");
    }
  }, []);

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
        <SendModeHeader onSettingsClick={() => setIsSettingsOpen(true)} />

        <div className="flex-1" />

        <div className="space-y-3 p-4 flex flex-col items-center w-full">
          {lastScannedCode && (
            <div
              className={clsx(
                "overflow-hidden rounded-lg px-4 py-3 max-w-[360px] text-center font-mono text-sm font-semibold",
                "backdrop-blur-sm transition-colors",
                showFlash
                  ? "bg-green-500/20 text-green-200 opacity-100"
                  : "opacity-80 bg-black/50 text-white",
              )}
            >
              <div className="truncate whitespace-nowrap">{lastScannedCode}</div>
            </div>
          )}
          <div className="flex justify-center gap-3 w-full max-w-[360px]">
            <button
              onClick={() => setIsScanning(!isScanning)}
              className={clsx(
                "flex items-center gap-2 rounded-lg bg-white/10 px-4 py-3 font-semibold text-white",
                "backdrop-blur-sm transition-colors hover:bg-white/20 active:bg-white/30",
              )}
            >
              {isScanning ? (
                <>
                  <Pause className="h-5 w-5" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="h-5 w-5" />
                  <span>Resume</span>
                </>
              )}
            </button>
            <button
              onClick={() => setIsTemplateSelectorOpen(true)}
              className={clsx(
                "flex flex-col items-center rounded-lg px-4 py-3 font-semibold min-w-0",
                "backdrop-blur-sm transition-colors text-center",
                activeTemplateId
                  ? "bg-blue-500/80 text-white hover:bg-blue-500/90 active:bg-blue-600/90"
                  : "bg-white/10 text-white hover:bg-white/20 active:bg-white/30",
              )}
            >
              <span className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <span>Template</span>
              </span>
              {activeTemplateId && (
                <span className="text-center text-xs text-white/80 truncate w-full">
                  {templates.find((t) => t.id === activeTemplateId)?.name}
                </span>
              )}
            </button>
            <button
              onClick={() => setLogOpen(true)}
              className={clsx(
                "flex items-center gap-2 rounded-lg bg-white/10 px-4 py-3 font-semibold text-white",
                "backdrop-blur-sm transition-colors hover:bg-white/20 active:bg-white/30",
              )}
            >
              <List className="h-5 w-5" />
              <span>Log</span>
            </button>
          </div>
        </div>
      </div>

      <ScannedCodesLog isOpen={isLogOpen} onClose={() => setLogOpen(false)} />
      <SettingsFlyout isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <TemplateManagerFlyout
        isOpen={isTemplateSelectorOpen}
        onClose={() => setIsTemplateSelectorOpen(false)}
        mode="send"
        onShareTemplate={handleShareTemplate}
      />
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
      <DebugConsole />
    </div>
  );
}
