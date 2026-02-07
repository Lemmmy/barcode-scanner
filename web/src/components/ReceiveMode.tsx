import { FileText, Settings as SettingsIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useShallow } from "zustand/react/shallow";
import { createSocket, TypedSocket } from "../lib/socket";
import { generateId } from "../lib/utils";
import { useAppStore } from "../store/useAppStore";
import type { DataEntryTemplate } from "../types";
import { AppHeader } from "./AppHeader";
import AutoTypeSettings from "./AutoTypeSettings";
import { ReceiveModeLanding } from "./ReceiveModeLanding";
import RoomCodeDisplay from "./RoomCodeDisplay";
import ScannedCodesLog from "./ScannedCodesLog";
import { SettingsFlyout } from "./SettingsFlyout";
import { TemplateImportDialog } from "./TemplateImportDialog";
import { TemplateManagerFlyout } from "./TemplateSelectorFlyout";

export interface RoomCodeForm {
  roomCode: string;
}

export default function ReceiveMode() {
  const socketRef = useRef<TypedSocket | null>(null);
  const [hasJoined, setHasJoined] = useState(false);
  const [isElectron, setIsElectron] = useState(!!window.electronAPI);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false);
  const [incomingTemplate, setIncomingTemplate] = useState<DataEntryTemplate | null>(null);

  const roomCodeForm = useForm<RoomCodeForm>({
    mode: "onSubmit",
    defaultValues: {
      roomCode: "",
    },
  });

  const roomCode = roomCodeForm.watch("roomCode");

  const {
    setMode,
    connectionStatus,
    setConnectionStatus,
    addScannedCode,
    autoTypeSettings,
    settings,
    reset,
    templates,
  } = useAppStore(
    useShallow((state) => ({
      setMode: state.setMode,
      connectionStatus: state.connectionStatus,
      setConnectionStatus: state.setConnectionStatus,
      addScannedCode: state.addScannedCode,
      autoTypeSettings: state.autoTypeSettings,
      settings: state.settings,
      reset: state.reset,
      templates: state.templates,
    })),
  );

  // Check if running in Electron
  useEffect(() => {
    if (window.electronAPI) {
      setIsElectron(true);
    }
  }, []);

  useEffect(() => {
    if (!hasJoined) return;

    const socket = createSocket(settings.relayServerUrl);
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnectionStatus({ connected: true, roomCode });
      socket.emit("joinRoom", roomCode);
    });

    socket.on("disconnect", () => {
      setConnectionStatus({ connected: false, roomCode });
    });

    socket.on(
      "barcodeScanned",
      async (data: {
        code: string;
        timestamp: number;
        templateData?: Record<string, unknown>;
        fieldOrder?: string[];
      }) => {
        console.log("Barcode received:", data.code, data.templateData ? "with template data" : "");

        void addScannedCode({
          id: generateId(),
          code: data.code,
          timestamp: data.timestamp,
          templateData: data.templateData,
          fieldOrder: data.fieldOrder,
        });

        // Auto-type if in desktop mode
        if (window.electronAPI && autoTypeSettings.enabled) {
          try {
            await window.electronAPI.autoType(
              data.code,
              autoTypeSettings,
              data.templateData,
              data.fieldOrder,
            );
          } catch (error) {
            console.error("Auto-type failed:", error);
          }
        }
      },
    );

    socket.on("error", (message) => {
      console.error("Socket error:", message);
      alert(`Error: ${message}`);
    });

    socket.on("templateShared", (template) => {
      console.log("Received shared template:", template.name);
      setIncomingTemplate(template);
    });

    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, [
    hasJoined,
    roomCode,
    addScannedCode,
    setConnectionStatus,
    settings.relayServerUrl,
    autoTypeSettings,
  ]);

  const handleBack = () => {
    reset();
    setMode("landing");
  };

  const _handleChangeCode = () => {
    const newCode = prompt("Enter a 4-digit room code:", roomCode);
    if (newCode && /^\d{4}$/.test(newCode)) {
      socketRef.current?.disconnect();
      socketRef.current?.emit("joinRoom", newCode);
      setConnectionStatus({ connected: connectionStatus.connected, roomCode: newCode });
    }
  };

  const handleShareTemplate = useCallback((template: DataEntryTemplate) => {
    if (socketRef.current?.connected) {
      console.log("Sharing template with room:", template.name);
      socketRef.current.emit("shareTemplate", template);
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

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <AppHeader
        title="Receive Mode"
        onBack={handleBack}
        extra={
          <div className="flex items-center gap-2">
            <div className="flex items-center flex-1">
              {hasJoined && (
                <div className="flex items-center flex-1">
                  <RoomCodeDisplay
                    code={connectionStatus.roomCode}
                    connected={connectionStatus.connected}
                    onChangeCode={_handleChangeCode}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Auto-type settings */}
              {isElectron && <AutoTypeSettings />}

              {/* Templates */}
              <button
                onClick={() => setIsTemplateManagerOpen(true)}
                className="rounded-lg p-2 text-gray-700 transition-colors hover:bg-gray-100 active:bg-gray-200"
                aria-label="Templates"
              >
                <FileText className="h-5 w-5" />
              </button>

              {/* Settings */}
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="rounded-lg p-2 text-gray-700 transition-colors hover:bg-gray-100 active:bg-gray-200"
                aria-label="Settings"
              >
                <SettingsIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        }
      />

      {!hasJoined ? (
        // Room code landing page
        <FormProvider {...roomCodeForm}>
          <ReceiveModeLanding setHasJoined={setHasJoined} />
        </FormProvider>
      ) : (
        <>
          {/* Receive mode proper */}
          <div className="flex-1 overflow-hidden">
            <ScannedCodesLog isOpen={true} onClose={() => {}} fullscreen />
          </div>

          <SettingsFlyout isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
          <TemplateManagerFlyout
            isOpen={isTemplateManagerOpen}
            onClose={() => setIsTemplateManagerOpen(false)}
            mode="receive"
            onShareTemplate={handleShareTemplate}
          />
          {incomingTemplate && (
            <TemplateImportDialog
              open={true}
              onOpenChange={(open) => !open && setIncomingTemplate(null)}
              template={incomingTemplate}
              existingTemplate={templates.find((t) => t.name === incomingTemplate.name)}
              onConfirm={handleImportTemplate}
            />
          )}
        </>
      )}
    </div>
  );
}
