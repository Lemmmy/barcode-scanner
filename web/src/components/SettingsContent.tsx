import { SettingCheckbox } from "./SettingCheckbox";
import { SettingInput } from "./SettingInput";

export function SettingsContent() {
  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="space-y-4">
        <SettingInput
          settingKey="relayServerUrl"
          label="Relay Server URL"
          type="url"
          placeholder="https://bs.lem.sh"
          description="The WebSocket server URL for barcode relay. Changes take effect on next connection."
        />

        <SettingCheckbox
          settingKey="autoDiscoverRooms"
          label="Auto-discover nearby rooms"
          description="Automatically refresh the list of nearby rooms every 10 seconds"
        />

        <SettingCheckbox
          settingKey="ignoreTildePrefix"
          label="Ignore tilde (~) prefix in barcodes"
          description="Strip leading tilde characters from scanned barcodes (Send Mode only)"
        />

        <SettingCheckbox
          settingKey="holdToScan"
          label="Hold to Scan"
          description="Require holding a button to scan in camera mode (Send Mode only)"
        />

        <SettingCheckbox
          settingKey="disableJavaScriptExecution"
          label="Disable JavaScript Execution"
          description="Prevent all post-scan scripts from running (Send Mode only)"
        />

        <SettingCheckbox settingKey="showDebugConsole" label="Show Debug Console" />

        <SettingCheckbox
          settingKey="showFpsCounter"
          label="Show FPS Counter"
          description="Display scan rate and detection rate in camera mode (Send Mode only)"
        />
      </div>
    </div>
  );
}
