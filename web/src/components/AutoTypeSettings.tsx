import { Keyboard } from "lucide-react";
import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useAppStore } from "../store/useAppStore";
import type { AutoTypeSettings as AutoTypeSettingsType } from "../types";
import { KeyCapture } from "./KeyCapture";
import { Checkbox } from "./ui/Checkbox";
import { Label } from "./ui/Label";

export default function AutoTypeSettings() {
  const [isOpen, setIsOpen] = useState(false);
  const { autoTypeSettings, setAutoTypeSettings } = useAppStore(
    useShallow((state) => ({
      autoTypeSettings: state.autoTypeSettings,
      setAutoTypeSettings: state.setAutoTypeSettings,
    })),
  );

  const handleToggleEnabled = () => {
    setAutoTypeSettings({
      ...autoTypeSettings,
      enabled: !autoTypeSettings.enabled,
    });
  };

  const handleKeypressDelayChange = (value: number) => {
    setAutoTypeSettings({
      ...autoTypeSettings,
      keypressDelay: value,
    });
  };

  const handleKeyAfterCodeChange = (key: AutoTypeSettingsType["keyAfterCode"]) => {
    setAutoTypeSettings({
      ...autoTypeSettings,
      keyAfterCode: key,
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-lg p-2 text-gray-700 transition-colors hover:bg-gray-100 active:bg-gray-200"
        title="Auto-Type Settings"
      >
        <Keyboard className="h-6 w-6" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setIsOpen(false)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-[90%] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-4 text-xl font-bold text-gray-900">Auto-Type Settings</h2>

            <div className="space-y-4">
              {/* Enable/Disable Toggle */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="autoTypeEnabled"
                  checked={autoTypeSettings.enabled}
                  onCheckedChange={handleToggleEnabled}
                />
                <Label htmlFor="autoTypeEnabled" className="text-sm font-normal">
                  Auto-Type Enabled
                </Label>
              </div>

              {/* Keypress Delay */}
              <div>
                <label
                  htmlFor="keypressDelay"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Keypress Delay: {autoTypeSettings.keypressDelay}ms
                </label>
                <input
                  id="keypressDelay"
                  type="range"
                  min="0"
                  max="200"
                  step="10"
                  value={autoTypeSettings.keypressDelay}
                  onChange={(e) => handleKeypressDelayChange(Number(e.target.value))}
                  className="w-full"
                />
                <div className="mt-1 flex justify-between text-xs text-gray-500">
                  <span>0ms</span>
                  <span>200ms</span>
                </div>
              </div>

              {/* Key Between Fields */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Key Between Fields
                </label>
                <KeyCapture
                  value={autoTypeSettings.keyBetweenFields || "Tab"}
                  onChange={(key) =>
                    setAutoTypeSettings({
                      ...autoTypeSettings,
                      keyBetweenFields: key,
                    })
                  }
                  placeholder="Tab"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Click button and press the key to use between fields
                </p>
              </div>

              {/* Key After Row */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Key After Row
                </label>
                <KeyCapture
                  value={autoTypeSettings.keyAfterCode || "Enter"}
                  onChange={(key) => handleKeyAfterCodeChange(key)}
                  placeholder="Enter"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Click button and press the key to use at end of row
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-700 active:bg-blue-800"
            >
              Done
            </button>
          </div>
        </>
      )}
    </>
  );
}
