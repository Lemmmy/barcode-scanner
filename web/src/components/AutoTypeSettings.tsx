import { Keyboard } from "lucide-react";
import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useAppStore } from "../store/useAppStore";
import type { AutoTypeSettings as AutoTypeSettingsType } from "../types";

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
              <div className="flex items-center justify-between">
                <label htmlFor="autoTypeEnabled" className="text-sm font-medium text-gray-700">
                  Auto-Type Enabled
                </label>
                <button
                  id="autoTypeEnabled"
                  onClick={handleToggleEnabled}
                  className={`relative h-8 w-14 rounded-full transition-colors ${
                    autoTypeSettings.enabled ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-transform ${
                      autoTypeSettings.enabled ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </button>
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

              {/* Key After Code */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Key to Press After Code
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["enter", "right", "down"] as const).map((key) => (
                    <button
                      key={key}
                      onClick={() => handleKeyAfterCodeChange(key)}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                        autoTypeSettings.keyAfterCode === key
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {key === "enter" ? "Enter" : key === "right" ? "Right →" : "Down ↓"}
                    </button>
                  ))}
                </div>
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
