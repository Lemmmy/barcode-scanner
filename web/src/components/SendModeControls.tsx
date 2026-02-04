import { useAppStore } from "@/store/useAppStore";
import { DataEntryTemplate } from "@/types";
import clsx from "clsx";
import { FileText, List, Pause, Play } from "lucide-react";
import { useCallback, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { LastScannedCode } from "./LastScannedCode";
import ScannedCodesLog from "./ScannedCodesLog";
import { TemplateManagerFlyout } from "./TemplateSelectorFlyout";

interface SendModeControlsProps {
  lastScannedCode: string | null;
  isScanning: boolean;
  setIsScanning: (isScanning: boolean) => void;
}

export function SendModeControls({
  lastScannedCode,
  isScanning,
  setIsScanning,
}: SendModeControlsProps) {
  const [isTemplateSelectorOpen, setIsTemplateSelectorOpen] = useState(false);
  const [isLogOpen, setIsLogOpen] = useState(false);

  const { activeTemplateId, activeTemplateName } = useAppStore(
    useShallow((state) => ({
      activeTemplateId: state.activeTemplateId,
      activeTemplateName: state.templates.find((t) => t.id === state.activeTemplateId)?.name,
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
      <div className="space-y-2 px-4 xs:py-4 flex flex-col items-center w-full">
        <LastScannedCode code={lastScannedCode} />

        <div className="flex justify-center gap-3 w-full xs:max-w-[360px] md:max-w-[480px]">
          {/* Pause Button */}
          <button
            onClick={() => setIsScanning(!isScanning)}
            className={clsx(
              "flex items-center gap-2 rounded-lg bg-white/10 px-4 py-3 font-semibold text-white",
              "backdrop-blur-sm transition-colors hover:bg-white/20 active:bg-white/30",
            )}
            aria-label={isScanning ? "Pause Scanning" : "Resume Scanning"}
            title={isScanning ? "Pause Scanning" : "Resume Scanning"}
          >
            {isScanning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>

          {/* Template Button */}
          <button
            onClick={() => setIsTemplateSelectorOpen(true)}
            className={clsx(
              "flex flex-1 flex-col items-center rounded-lg px-4 py-3 font-semibold min-w-0",
              "backdrop-blur-sm transition-colors text-center",
              activeTemplateId
                ? "bg-blue-500/80 text-white hover:bg-blue-500/90 active:bg-blue-600/90"
                : "bg-white/10 text-white hover:bg-white/20 active:bg-white/30",
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
          </button>

          {/* Log Button */}
          <button
            onClick={() => setIsLogOpen(true)}
            className={clsx(
              "flex items-center gap-2 rounded-lg bg-white/10 px-4 py-3 font-semibold text-white",
              "backdrop-blur-sm transition-colors hover:bg-white/20 active:bg-white/30",
            )}
            aria-label="Log"
            title="Log"
          >
            <List className="h-5 w-5" />
          </button>
        </div>
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
