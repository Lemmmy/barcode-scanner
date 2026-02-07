import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";
import copyToClipboard from "copy-to-clipboard";

interface LastScannedCodeProps {
  code: string | null;
}

export function LastScannedCode({ code }: LastScannedCodeProps) {
  const [showFlash, setShowFlash] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [copiedFlash, setCopiedFlash] = useState(false);

  useEffect(() => {
    setLastScannedCode(code);
    setShowFlash(true);
    setCopiedFlash(false);
    const timeout = setTimeout(() => setShowFlash(false), 750);
    return () => {
      clearTimeout(timeout);
    };
  }, [code]);

  const copy = useCallback(() => {
    if (!code) return;
    copyToClipboard(code);

    setCopiedFlash(true);
    const timeout = setTimeout(() => setCopiedFlash(false), 2000);
    return () => {
      clearTimeout(timeout);
    };
  }, [code]);

  return lastScannedCode ? (
    <button
      onClick={copy}
      className={clsx(
        "overflow-hidden rounded-lg px-4 py-3 max-w-[360px] text-center text-sm font-semibold",
        "backdrop-blur-sm transition-colors",
        showFlash
          ? "bg-green-500/20 text-green-200 opacity-100"
          : "opacity-80 bg-black/50 text-white",
      )}
      aria-label={`Copy code ${lastScannedCode} to clipboard`}
    >
      <div className="truncate whitespace-nowrap font-mono">{lastScannedCode}</div>
      {copiedFlash && <div className="truncate whitespace-nowrap">Copied!</div>}
    </button>
  ) : null;
}
