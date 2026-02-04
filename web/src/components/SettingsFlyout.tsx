import { X } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import { useShallow } from "zustand/react/shallow";
import { Label } from "./ui/Label";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";
import { cn } from "../lib/utils";

interface SettingsFlyoutProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsFlyout({ isOpen, onClose }: SettingsFlyoutProps) {
  const { settings, setSettings } = useAppStore(
    useShallow((state) => ({
      settings: state.settings,
      setSettings: state.setSettings,
    })),
  );

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({
      ...settings,
      relayServerUrl: e.target.value,
    });
  };

  const handleAutoDiscoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({
      ...settings,
      autoDiscoverRooms: e.target.checked,
    });
  };

  const handleIgnoreTildePrefixChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({
      ...settings,
      ignoreTildePrefix: e.target.checked,
    });
  };

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

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="settingsRelayServerUrl">Relay Server URL</Label>
              <Input
                id="settingsRelayServerUrl"
                type="url"
                value={settings.relayServerUrl}
                onChange={handleUrlChange}
                placeholder="https://bs.lem.sh"
                className="mt-2"
              />
              <p className="mt-1 text-xs text-gray-500">
                The WebSocket server URL for barcode relay. Changes take effect on next connection.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="autoDiscoverRooms"
                type="checkbox"
                checked={settings.autoDiscoverRooms}
                onChange={handleAutoDiscoverChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="autoDiscoverRooms" className="font-normal">
                Auto-discover nearby rooms
              </Label>
            </div>
            <p className="text-xs text-gray-500">
              Automatically refresh the list of nearby rooms every 10 seconds
            </p>

            <div className="flex items-center gap-2">
              <input
                id="ignoreTildePrefix"
                type="checkbox"
                checked={settings.ignoreTildePrefix}
                onChange={handleIgnoreTildePrefixChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="ignoreTildePrefix" className="font-normal">
                Ignore tilde (~) prefix in barcodes
              </Label>
            </div>
            <p className="text-xs text-gray-500">
              Strip leading tilde characters from scanned barcodes (Send Mode only)
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 p-4">
          <Button onClick={onClose} fullWidth>
            Done
          </Button>
        </div>
      </div>
    </>
  );
}
