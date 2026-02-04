import { useEffect, useRef, useState, useCallback } from "react";
import { ArrowLeft, Settings as SettingsIcon, FileText } from "lucide-react";
import { useForm } from "react-hook-form";
import { useAppStore } from "../store/useAppStore";
import { createSocket, TypedSocket } from "../lib/socket";
import { generateId } from "../lib/utils";
import RoomCodeDisplay from "./RoomCodeDisplay";
import ScannedCodesLog from "./ScannedCodesLog";
import AutoTypeSettings from "./AutoTypeSettings";
import { AdvancedSettings } from "./AdvancedSettings";
import { SettingsFlyout } from "./SettingsFlyout";
import { TemplateManagerFlyout } from "./TemplateSelectorFlyout";
import { TemplateImportDialog } from "./TemplateImportDialog";
import { RoomDiscovery } from "./RoomDiscovery";
import type { DataEntryTemplate } from "../types";
import { Label } from "./ui/Label";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";
import { FormError } from "./ui/FormError";
import { useShallow } from "zustand/react/shallow";

interface RoomCodeForm {
  roomCode: string;
}

export default function ReceiveMode() {
  const socketRef = useRef<TypedSocket | null>(null);
  const [hasJoined, setHasJoined] = useState(false);
  const [isElectron, setIsElectron] = useState(!!window.electronAPI);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false);
  const [incomingTemplate, setIncomingTemplate] = useState<DataEntryTemplate | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RoomCodeForm>({
    mode: "onSubmit",
    defaultValues: {
      roomCode: "",
    },
  });

  const roomCode = watch("roomCode");

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

  const onSubmit = () => {
    setHasJoined(true);
  };

  const handleRoomSelect = (code: string) => {
    // Set the room code using react-hook-form and auto-submit
    setValue("roomCode", code, { shouldValidate: true });
    setHasJoined(true);
  };

  const handleChangeCode = () => {
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

  if (!hasJoined) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <div className="flex items-center border-b border-gray-200 bg-white p-4">
          <button
            onClick={handleBack}
            className="rounded-lg p-2 text-gray-700 transition-colors hover:bg-gray-100 active:bg-gray-200"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="ml-4 text-xl font-semibold text-gray-900">Receive Mode</h1>
        </div>

        <div className="flex flex-1 items-center justify-center p-6">
          <form
            onSubmit={(e) => void handleSubmit(onSubmit)(e)}
            className="w-full max-w-sm space-y-6"
          >
            <div>
              <Label htmlFor="roomCode">Enter Room Code</Label>
              <Input
                type="text"
                id="roomCode"
                placeholder="0000"
                maxLength={4}
                variant="code"
                className="mt-2"
                {...register("roomCode", {
                  required: "Room code is required",
                  pattern: {
                    value: /^\d{4}$/,
                    message: "Room code must be exactly 4 digits",
                  },
                })}
              />
              <FormError message={errors.roomCode?.message} className="mt-2" />
            </div>

            <Button type="submit" size="large" fullWidth>
              Join Room
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-gray-50 px-2 text-gray-500">or</span>
              </div>
            </div>

            <RoomDiscovery
              onRoomSelect={handleRoomSelect}
              autoDiscover={settings.autoDiscoverRooms}
            />

            <AdvancedSettings />
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white p-4">
        {!isElectron ? (
          <button
            onClick={handleBack}
            className="rounded-lg p-2 text-gray-700 transition-colors hover:bg-gray-100 active:bg-gray-200"
            aria-label="Back to landing"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        ) : (
          <div className="w-10" />
        )}

        <div className="flex items-center gap-3">
          <RoomCodeDisplay
            code={roomCode}
            connected={connectionStatus.connected}
            onChangeCode={handleChangeCode}
          />
        </div>

        <div className="flex items-center gap-2">
          {isElectron && <AutoTypeSettings />}
          <button
            onClick={() => setIsTemplateManagerOpen(true)}
            className="rounded-lg p-2 text-gray-700 transition-colors hover:bg-gray-100 active:bg-gray-200"
            title="Templates"
          >
            <FileText className="h-6 w-6" />
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="rounded-lg p-2 text-gray-700 transition-colors hover:bg-gray-100 active:bg-gray-200"
            title="Settings"
          >
            <SettingsIcon className="h-6 w-6" />
          </button>
        </div>
      </div>

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
    </div>
  );
}
