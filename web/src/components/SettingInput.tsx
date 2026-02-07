import { useShallow } from "zustand/react/shallow";
import { useAppStore } from "../store/useAppStore";
import { AppSettings } from "../types";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";

// Extract string keys from AppSettings
type StringKeys<T> = {
  [K in keyof T]: T[K] extends string ? K : never;
}[keyof T];

type SettingKey = StringKeys<AppSettings>;

interface SettingInputProps {
  settingKey: SettingKey;
  label: string;
  description?: string;
  type?: "text" | "url" | "email" | "password";
  placeholder?: string;
}

export function SettingInput({
  settingKey,
  label,
  description,
  type = "text",
  placeholder,
}: SettingInputProps) {
  const { settings, setSettings } = useAppStore(
    useShallow((state) => ({
      settings: state.settings,
      setSettings: state.setSettings,
    })),
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({
      ...settings,
      [settingKey]: e.target.value,
    });
  };

  const id = `setting-${settingKey}`;

  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={settings[settingKey]}
        onChange={handleChange}
        placeholder={placeholder}
        className="mt-2"
      />
      {description && <p className="mt-1 text-xs text-gray-500">{description}</p>}
    </div>
  );
}
