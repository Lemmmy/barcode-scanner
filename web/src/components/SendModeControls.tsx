import { useAppStore } from "@/store/useAppStore";
import { DataEntryTemplate } from "@/types";
import clsx from "clsx";
import { Camera, FileText, Keyboard, List, Pause, Play } from "lucide-react";
import { ButtonHTMLAttributes, ReactNode, useCallback, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import ScannedCodesLog from "./ScannedCodesLog";
import { TemplateManagerFlyout } from "./TemplateSelectorFlyout";

interface SendModeControlsProps {
  isScanning: boolean;
  setIsScanning: (isScanning: boolean) => void;
}

export function SendModeControls({ isScanning, setIsScanning }: SendModeControlsProps) {
  const [isTemplateSelectorOpen, setIsTemplateSelectorOpen] = useState(false);
  const [isLogOpen, setIsLogOpen] = useState(false);

  const { activeTemplateId, activeTemplateName, scanMode, setScanMode } = useAppStore(
    useShallow((state) => ({
      activeTemplateId: state.activeTemplateId,
      activeTemplateName: state.templates.find((t) => t.id === state.activeTemplateId)?.name,
      scanMode: state.scanMode,
      setScanMode: state.setScanMode,
    })),
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

  return (
    <>
      <div className="flex justify-center gap-2 w-full xs:max-w-[360px] md:max-w-[480px]">
        {/* Mode Toggle Button */}
        <SendControlButton
          onClick={() => setScanMode(scanMode === "camera" ? "keyboard" : "camera")}
          aria-label={scanMode === "camera" ? "Switch to Keyboard" : "Switch to Camera"}
          title={scanMode === "camera" ? "Switch to Keyboard" : "Switch to Camera"}
        >
          {scanMode === "camera" ? (
            <Keyboard className="h-5 w-5" />
          ) : (
            <Camera className="h-5 w-5" />
          )}
        </SendControlButton>

        {/* Pause Button */}
        <SendControlButton
          onClick={() => setIsScanning(!isScanning)}
          aria-label={isScanning ? "Pause Scanning" : "Resume Scanning"}
          title={isScanning ? "Pause Scanning" : "Resume Scanning"}
        >
          {isScanning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </SendControlButton>

        {/* Template Button */}
        <SendControlButton
          onClick={() => setIsTemplateSelectorOpen(true)}
          className={clsx(
            "flex-1",
            activeTemplateId
              ? "!bg-blue-500/80 !text-white active:!bg-blue-600/90 hover:!bg-blue-500/90"
              : "!bg-white/10 !text-white active:!bg-white/30 hover:!bg-white/20",
          )}
          aria-label={activeTemplateId ? `Template: ${activeTemplateName}` : "No Template"}
          title={activeTemplateId ? `Template: ${activeTemplateName}` : "No Template"}
        >
          <span className="flex justify-center items-center gap-2 w-full">
            <FileText className="h-5 w-5" />
            {activeTemplateId ? (
              <span className="text-center text-xs text-white/80 truncate">
                {activeTemplateName}
              </span>
            ) : (
              <span className="text-center">Templates</span>
            )}
          </span>
        </SendControlButton>

        {/* Log Button */}
        <SendControlButton onClick={() => setIsLogOpen(true)} aria-label="Log" title="Log">
          <List className="h-5 w-5" />
        </SendControlButton>
      </div>

      <ScannedCodesLog isOpen={isLogOpen} onClose={() => setIsLogOpen(false)} />

      <TemplateManagerFlyout
        isOpen={isTemplateSelectorOpen}
        onClose={() => setIsTemplateSelectorOpen(false)}
        mode="send"
        onShareTemplate={handleShareTemplate}
      />
    </>
  );
}

interface SendControlButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  children: ReactNode;
}

function SendControlButton({ className, children, ...props }: SendControlButtonProps) {
  return (
    <button
      {...props}
      className={clsx(
        "flex items-center gap-2 rounded-lg bg-white/10 p-3 font-semibold text-white",
        "backdrop-blur-sm transition-colors hover:bg-white/20 active:bg-white/30",
        className,
      )}
      aria-label="Log"
      title="Log"
    >
      {children}
    </button>
  );
}
