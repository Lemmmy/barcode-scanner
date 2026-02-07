import { useShallow } from "zustand/react/shallow";
import { useAppStore } from "../store/useAppStore";
import { AppSettings } from "../types";
import { Checkbox } from "./ui/Checkbox";
import { Label } from "./ui/Label";

// Extract boolean keys from AppSettings
type BooleanKeys<T> = {
  [K in keyof T]: T[K] extends boolean ? K : never;
}[keyof T];

type SettingKey = BooleanKeys<AppSettings>;

interface SettingCheckboxProps {
  settingKey: SettingKey;
  label: string;
  description?: string;
}

export function SettingCheckbox({ settingKey, label, description }: SettingCheckboxProps) {
  const { settings, setSettings } = useAppStore(
    useShallow((state) => ({
      settings: state.settings,
      setSettings: state.setSettings,
    })),
  );

  const handleChange = (checked: boolean) => {
    setSettings({
      ...settings,
      [settingKey]: checked,
    });
  };

  const id = `setting-${settingKey}`;

  return (
    <div>
      <div className="flex items-center gap-2">
        <Checkbox id={id} checked={settings[settingKey]} onCheckedChange={handleChange} />
        <Label htmlFor={id} className="cursor-pointer font-normal">
          {label}
        </Label>
      </div>
      {description && <p className="mt-1 text-xs text-gray-500">{description}</p>}
    </div>
  );
}
