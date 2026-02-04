import clsx from "clsx";
import { useEffect, useState } from "react";

interface LastScannedCodeProps {
  code: string | null;
}

export function LastScannedCode({ code }: LastScannedCodeProps) {
  const [showFlash, setShowFlash] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);

  useEffect(() => {
    setLastScannedCode(code);
    setShowFlash(true);

    const timeout = setTimeout(() => setShowFlash(false), 750);
    return () => clearTimeout(timeout);
  }, [code]);

  return lastScannedCode ? (
    <div
      className={clsx(
        "overflow-hidden rounded-lg px-4 py-3 max-w-[360px] text-center font-mono text-sm font-semibold",
        "backdrop-blur-sm transition-colors",
        showFlash
          ? "bg-green-500/20 text-green-200 opacity-100"
          : "opacity-80 bg-black/50 text-white",
      )}
    >
      <div className="truncate whitespace-nowrap">{lastScannedCode}</div>
    </div>
  ) : null;
}
