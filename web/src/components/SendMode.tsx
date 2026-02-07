import { useMediaQuery } from "@/hooks/useMediaQuery";
import dayjs from "dayjs";
import { useCallback, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useSocketConnection } from "../hooks/useSocketConnection";
import { playBeep } from "../lib/audio";
import { generateId } from "../lib/utils";
import { useAppStore } from "../store/useAppStore";
import type { ScannedCodeInfo } from "../types";
import { DataEntryDialog } from "./DataEntryDialog";
import { DebugConsole } from "./DebugConsole";
import { LastScannedCode } from "./LastScannedCode";
import { SendModeCamera } from "./SendModeCamera";
import { SendModeControls } from "./SendModeControls";
import { SendModeHeader } from "./SendModeHeader";
import { SendModeKeyboard } from "./SendModeKeyboard";
import { TemplateImportDialog } from "./TemplateImportDialog";

export default function SendMode() {
  const [isScanning, setIsScanning] = useState(true);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const pendingCodeRef = useRef<string | null>(null);
  const [prePopulatedData, setPrePopulatedData] = useState<Record<string, unknown> | null>(null);

  const isDesktop = useMediaQuery("(min-width: 512px)");

  const {
    activeTemplate,
    connectionStatus,
    incomingTemplate,
    existingTemplate,
    setIncomingTemplate,
    scanMode,
    settings,
  } = useAppStore(
    useShallow((state) => ({
      activeTemplate: state.templates.find((t) => t.id === state.activeTemplateId),
      connectionStatus: state.connectionStatus,
      incomingTemplate: state.incomingTemplate,
      existingTemplate: state.incomingTemplate
        ? state.templates.find((t) => t.name === state.incomingTemplate!.name)
        : undefined,
      setIncomingTemplate: state.setIncomingTemplate,
      scanMode: state.scanMode,
      settings: state.settings,
    })),
  );

  useSocketConnection();

  // Stable callback that accesses store state directly
  const handleBarcodeDetected = useCallback((code: string) => {
    const { socketRef, isMuted, addScannedCode, templates, activeTemplateId, settings } =
      useAppStore.getState();

    if (!socketRef?.connected) {
      console.warn("Socket not connected, skipping detected barcode");
      return;
    }

    // Strip leading tildes if setting is enabled
    let processedCode = code;
    if (settings.ignoreTildePrefix) {
      processedCode = code.replace(/^~+/, "");
    }

    function submitScannedCode(code: string) {
      console.log("Sending barcode to server:", code);
      socketRef?.emit("scanBarcode", { code });

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
    }

    function showDataEntryDialog(formData: Record<string, unknown> | null, code: string) {
      if (!activeTemplate?.fields.length) {
        console.log("Template set but has no fields, submitting normally");
        submitScannedCode(code);
      } else if (pendingCodeRef.current) {
        console.log(
          "Skipping detected barcode, already prompting for data entry for:",
          pendingCodeRef.current,
        );
        return;
      } else {
        setPrePopulatedData(formData);
        setPendingCode(code);
        pendingCodeRef.current = code;
        if (!isMuted) {
          playBeep();
        }
        setLastScannedCode(code);
      }
    }

    // Check if template is active
    const activeTemplate = templates.find((t) => t.id === activeTemplateId);
    if (activeTemplate) {
      // Execute post-scan script if present and JS execution is enabled
      if (activeTemplate.postScanScript && !settings.disableJavaScriptExecution) {
        try {
          // Create initial form data with default values using field names
          const formDataRaw: Record<string, unknown> = {};
          const validFieldNames = new Set<string>();

          activeTemplate.fields.forEach((field) => {
            validFieldNames.add(field.name);
            if (field.type === "checkbox") {
              formDataRaw[field.name] = false;
            } else if (field.type === "date") {
              formDataRaw[field.name] = dayjs().format(field.dateFormat || "YYYY-MM-DD");
            } else {
              formDataRaw[field.name] = "";
            }
          });

          // Wrap formData in a Proxy to warn on writes to non-existent fields
          const formData = new Proxy(formDataRaw, {
            set(target, property, value) {
              if (typeof property === "string" && !validFieldNames.has(property)) {
                console.warn(
                  `Warning: Setting field "${property}" which does not exist in template. ` +
                    `Valid field names: ${Array.from(validFieldNames).join(", ")}`,
                );
              }
              target[property as string] = value;
              return true;
            },
          });

          // Create scanned code info
          const info: ScannedCodeInfo = {
            code: processedCode,
            timestamp: Date.now(),
            format: undefined, // Could be populated if barcode format detection is added
          };

          // Execute the script
          const scriptFunction = new Function(
            "code",
            "info",
            "formData",
            `return (async () => { ${activeTemplate.postScanScript} })();`,
          );

          // Run the script and handle the promise
          Promise.resolve(scriptFunction(processedCode, info, formData))
            .then(() => {
              // Script executed successfully, use modified formData
              // Convert from field names back to field IDs for internal use
              const formDataById: Record<string, unknown> = {};
              activeTemplate.fields.forEach((field) => {
                if (field.name in formDataRaw) {
                  formDataById[field.id] = formDataRaw[field.name];
                }
              });
              showDataEntryDialog(formDataById, processedCode);
            })
            .catch((error) => {
              console.error("Post-scan script error:", error);
              alert(`Script execution error: ${error.message}`);
              // Still show dialog with default values
              showDataEntryDialog(null, processedCode);
            });
        } catch (error) {
          console.error("Post-scan script compilation error:", error);
          alert(
            `Script compilation error: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
          // Still show dialog with default values
          showDataEntryDialog(null, processedCode);
        }
      } else {
        // No script or JS disabled, show dialog normally
        showDataEntryDialog(null, processedCode);
      }
      return;
    }

    // No template configured at all, submit normally
    submitScannedCode(processedCode);
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
      setPrePopulatedData(null);
    },
    [pendingCode, setPrePopulatedData],
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

  const sendModeControls = (
    <SendModeControls isScanning={isScanning} setIsScanning={setIsScanning} />
  );

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      {scanMode === "camera" ? (
        <SendModeCamera
          roomCode={connectionStatus.roomCode}
          onBarcodeDetected={handleBarcodeDetected}
          isScanning={isScanning}
        />
      ) : (
        <SendModeKeyboard onBarcodeDetected={handleBarcodeDetected} />
      )}

      <div className="absolute inset-0 flex flex-col pointer-events-none [&_*]:pointer-events-auto">
        <SendModeHeader />

        {/* Controls: at the top for mobile, bottom for desktop */}
        {!isDesktop && (
          <div className="space-y-2 px-4 xs:py-4 flex flex-col items-center w-full pointer-events-auto">
            {sendModeControls}
            <LastScannedCode code={lastScannedCode} />
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1 !pointer-events-none" />

        {isDesktop && (
          <div className="space-y-2 px-4 xs:py-4 flex flex-col items-center w-full pointer-events-auto">
            <LastScannedCode code={lastScannedCode} />
            {sendModeControls}
          </div>
        )}
      </div>

      {/* Data entry dialog */}
      {pendingCode && activeTemplate && (
        <DataEntryDialog
          open={!!pendingCode && !!activeTemplate}
          onOpenChange={(open) => {
            if (!open) {
              setPendingCode(null);
              pendingCodeRef.current = null;
              setPrePopulatedData(null);
            }
          }}
          template={activeTemplate}
          scannedCode={pendingCode || ""}
          onSubmit={handleDataEntrySubmit}
          prePopulatedData={prePopulatedData}
        />
      )}

      {/* Template import dialog */}
      {incomingTemplate && (
        <TemplateImportDialog
          open={true}
          onOpenChange={(open) => !open && setIncomingTemplate(null)}
          template={incomingTemplate}
          existingTemplate={existingTemplate}
          onConfirm={handleImportTemplate}
        />
      )}

      {/* Debug console button */}
      {(import.meta.env.DEV || settings.showDebugConsole) && <DebugConsole />}
    </div>
  );
}
