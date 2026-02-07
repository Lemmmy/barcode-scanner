import { useShallow } from "zustand/react/shallow";
import { useAppStore } from "../store/useAppStore";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";

export function SettingsContent() {
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

  const handleDisableJavaScriptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({
      ...settings,
      disableJavaScriptExecution: e.target.checked,
    });
  };

  const handleShowDebugConsoleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({
      ...settings,
      showDebugConsole: e.target.checked,
    });
  };

  return (
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

        <div className="flex items-center gap-2">
          <input
            id="disableJavaScriptExecution"
            type="checkbox"
            checked={settings.disableJavaScriptExecution}
            onChange={handleDisableJavaScriptChange}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <Label htmlFor="disableJavaScriptExecution" className="cursor-pointer">
            Disable JavaScript Execution
          </Label>
        </div>
        <p className="text-xs text-gray-500">
          Prevent all post-scan scripts from running (Send Mode only)
        </p>

        <div className="flex items-center gap-2">
          <input
            id="showDebugConsole"
            type="checkbox"
            checked={settings.showDebugConsole}
            onChange={handleShowDebugConsoleChange}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <Label htmlFor="showDebugConsole" className="cursor-pointer">
            Show Debug Console
          </Label>
        </div>
      </div>
    </div>
  );
}
