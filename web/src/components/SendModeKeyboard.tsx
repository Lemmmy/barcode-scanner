import clsx from "clsx";
import { useEffect, useRef, useState, useCallback } from "react";

interface SendModeKeyboardProps {
  onBarcodeDetected: (code: string) => void;
}

const ignoreEls = new Set(["input", "textarea", "select", "button"]);

export function SendModeKeyboard({ onBarcodeDetected }: SendModeKeyboardProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input on mount and when clicking anywhere
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handlePageClick = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (inputValue.trim()) {
        onBarcodeDetected(inputValue.trim());
        setInputValue("");
      }
    },
    [inputValue, onBarcodeDetected],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && inputValue.trim()) {
        e.preventDefault();
        onBarcodeDetected(inputValue.trim());
        setInputValue("");
      }
    },
    [inputValue, onBarcodeDetected],
  );

  // When typing anywhere on the page, as long as an input isn't focused, auto-focus our input
  useEffect(() => {
    const listener = () => {
      const el = document.activeElement?.tagName?.toLowerCase();
      if (!el || !ignoreEls.has(el)) {
        // Check if active element or any parent has monaco-editor class
        let element = document.activeElement;
        let isInMonaco = false;
        while (element) {
          if (element.classList?.contains("monaco-editor")) {
            isInMonaco = true;
            break;
          }
          element = element.parentElement;
        }

        if (!isInMonaco) {
          inputRef.current?.focus();
        }
      }
    };

    document.addEventListener("keydown", listener);
    return () => {
      document.removeEventListener("keydown", listener);
    };
  }, []);

  return (
    <div
      className="absolute inset-0 flex items-center justify-center bg-gray-800"
      onClick={handlePageClick}
    >
      <form onSubmit={handleSubmit} className="w-full max-w-2xl px-8">
        <input
          ref={inputRef}
          type="text"
          id="barcode"
          name="barcode"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className={clsx(
            "w-full rounded-2xl border-4 border-gray-600 bg-gray-800 text-gray-100",
            "px-8 py-6 text-center text-4xl font-medium shadow-lg transition-all",
            "focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-200",
          )}
          placeholder="Type barcode..."
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          // disable known password managers
          data-1p-ignore
          data-bwignore="true"
          data-lpignore="true"
          data-protonpass-ignore="true"
        />
      </form>
    </div>
  );
}
