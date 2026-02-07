import { X } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./ui/Button";
import { SettingsContent } from "./SettingsContent";

interface SettingsFlyoutProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsFlyout({ isOpen, onClose }: SettingsFlyoutProps) {
  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity",
          isOpen ? "opacity-100" : "!pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />

      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 flex max-h-[70vh] flex-col bg-white transition-transform",
          "rounded-t-2xl shadow-2xl",
          isOpen ? "translate-y-0" : "translate-y-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h2 className="text-xl font-bold text-gray-900">Settings</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 active:bg-gray-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <SettingsContent />

        <div className="border-t border-gray-200 p-4">
          <Button onClick={onClose} fullWidth>
            Done
          </Button>
        </div>
      </div>
    </>
  );
}
