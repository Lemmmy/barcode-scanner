import { useState, useEffect } from "react";
import { Button } from "./ui/Button";

interface KeyCaptureProps {
  value: string;
  onChange: (keyName: string) => void;
  placeholder?: string;
}

// Map browser KeyboardEvent.code to nut.js Key enum names
const keyCodeToNutJs: Record<string, string> = {
  Enter: "Enter",
  Tab: "Tab",
  Space: "Space",
  Escape: "Escape",
  Backspace: "Backspace",
  Delete: "Delete",
  ArrowUp: "Up",
  ArrowDown: "Down",
  ArrowLeft: "Left",
  ArrowRight: "Right",
  Home: "Home",
  End: "End",
  PageUp: "PageUp",
  PageDown: "PageDown",
  Insert: "Insert",
  F1: "F1",
  F2: "F2",
  F3: "F3",
  F4: "F4",
  F5: "F5",
  F6: "F6",
  F7: "F7",
  F8: "F8",
  F9: "F9",
  F10: "F10",
  F11: "F11",
  F12: "F12",
};

// Display names for common keys
const keyDisplayNames: Record<string, string> = {
  Enter: "Enter",
  Tab: "Tab",
  Space: "Space",
  Escape: "Esc",
  Up: "↑",
  Down: "↓",
  Left: "←",
  Right: "→",
  PageUp: "Page Up",
  PageDown: "Page Down",
  Home: "Home",
  End: "End",
  Backspace: "Backspace",
  Delete: "Delete",
  Insert: "Insert",
};

export function KeyCapture({ value, onChange, placeholder = "Click to set key" }: KeyCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    if (!isCapturing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const nutJsKey = keyCodeToNutJs[e.code];
      if (nutJsKey) {
        onChange(nutJsKey);
        setIsCapturing(false);
      }
    };

    const handleBlur = () => {
      setIsCapturing(false);
    };

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("blur", handleBlur);
    };
  }, [isCapturing, onChange]);

  const displayValue = value ? keyDisplayNames[value] || value : placeholder;

  return (
    <Button
      type="button"
      variant={isCapturing ? "primary" : "secondary"}
      onClick={() => setIsCapturing(true)}
      className="w-full justify-center font-mono"
    >
      {isCapturing ? "Press a key..." : displayValue}
    </Button>
  );
}
