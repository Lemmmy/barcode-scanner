import { AppHeader } from "./AppHeader";
import { SettingsContent } from "./SettingsContent";

export default function SettingsMode() {
  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <AppHeader title="Settings" />
      <SettingsContent />
    </div>
  );
}
