import { X, Copy, Check } from "lucide-react";
import { useState } from "react";
import { useAppStore } from "../store/useAppStore";
import { copyToClipboard, formatTime, cn } from "../lib/utils";
import { useShallow } from "zustand/react/shallow";

interface ScannedCodesLogProps {
  isOpen: boolean;
  onClose: () => void;
  fullscreen?: boolean;
}

export default function ScannedCodesLog({ isOpen, onClose, fullscreen }: ScannedCodesLogProps) {
  const scannedCodes = useAppStore(useShallow((state) => state.scannedCodes));
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (code: string, id: string) => {
    try {
      await copyToClipboard(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  if (!isOpen && !fullscreen) return null;

  const content = (
    <>
      {!fullscreen && (
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900">Scanned Codes</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 active:bg-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {scannedCodes.length === 0 ? (
          <div className="flex h-full items-center justify-center p-8 text-center">
            <p className="text-gray-500">No codes scanned yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {scannedCodes.map((item) => (
              <button
                key={item.id}
                onClick={() => void handleCopy(item.code, item.id)}
                className="flex w-full items-center justify-between gap-4 p-4 text-left transition-colors hover:bg-gray-50 active:bg-gray-100"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-sm font-medium text-gray-900">
                    {item.code}
                  </p>
                  <p className="text-xs text-gray-500">{formatTime(item.timestamp)}</p>
                </div>
                <div className="flex-shrink-0">
                  {copiedId === item.id ? (
                    <Check className="h-5 w-5 text-green-600" />
                  ) : (
                    <Copy className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );

  if (fullscreen) {
    return <div className="flex h-full flex-col bg-white">{content}</div>;
  }

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />

      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 flex max-h-[70vh] flex-col bg-white transition-transform",
          "rounded-t-2xl shadow-2xl",
          isOpen ? "translate-y-0" : "translate-y-full",
        )}
      >
        {content}
      </div>
    </>
  );
}
