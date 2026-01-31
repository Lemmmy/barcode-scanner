import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import { useShallow } from "zustand/react/shallow";
import { Label } from "./ui/Label";
import { Input } from "./ui/Input";

export function AdvancedSettings() {
  const [isOpen, setIsOpen] = useState(false);
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

  return (
    <div className="mt-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-center gap-2 text-sm text-gray-600 transition-colors hover:text-gray-900"
      >
        <span>Advanced Settings</span>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {isOpen && (
        <div className="mt-4 space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div>
            <Label htmlFor="relayServerUrl">Relay Server URL</Label>
            <Input
              id="relayServerUrl"
              type="url"
              value={settings.relayServerUrl}
              onChange={handleUrlChange}
              placeholder="https://bs.lem.sh"
              className="mt-1"
            />
            <p className="mt-1 text-xs text-gray-500">The WebSocket server URL for barcode relay</p>
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
        </div>
      )}
    </div>
  );
}
