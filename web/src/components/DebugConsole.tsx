import { useEffect, useState, useRef } from "react";
import { X } from "lucide-react";
import clsx from "clsx";

interface LogEntry {
  id: number;
  timestamp: string;
  type: "log" | "error" | "warn";
  message: string;
}

export function DebugConsole() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const logIdRef = useRef(0);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    const addLog = (type: "log" | "error" | "warn", args: unknown[]) => {
      const message = args
        .map((arg) => {
          if (typeof arg === "object" && arg !== null) {
            try {
              return JSON.stringify(arg, null, 2);
            } catch {
              return "[Object]";
            }
          }
          return String(arg);
        })
        .join(" ");

      const timestamp = new Date().toLocaleTimeString();
      setLogs((prev) => [
        ...prev.slice(-99), // Keep last 100 logs
        { id: logIdRef.current++, timestamp, type, message },
      ]);
    };

    console.log = (...args: unknown[]) => {
      originalLog(...args);
      addLog("log", args);
    };

    console.error = (...args: unknown[]) => {
      originalError(...args);
      addLog("error", args);
    };

    console.warn = (...args: unknown[]) => {
      originalWarn(...args);
      addLog("warn", args);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className={clsx(
          "fixed bottom-2 left-2 z-50 rounded-full bg-blue-500 px-3 py-2 text-xs font-semibold",
          "text-white shadow-lg select-none",
        )}
      >
        Debug
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 text-white">
      <div className="flex items-center justify-between border-b border-white/20 p-4">
        <h2 className="text-lg font-semibold">Debug Console</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setLogs([])}
            className="rounded bg-red-500/20 px-3 py-1 text-sm font-medium text-red-300 hover:bg-red-500/30"
          >
            Clear
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="rounded bg-white/10 p-1 hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 font-mono text-xs">
        {logs.length === 0 ? (
          <div className="text-white/50">No logs yet...</div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className={`mb-2 border-l-2 pl-2 ${
                log.type === "error"
                  ? "border-red-500 text-red-300"
                  : log.type === "warn"
                    ? "border-yellow-500 text-yellow-300"
                    : "border-blue-500 text-white/90"
              }`}
            >
              <div className="text-white/50">{log.timestamp}</div>
              <div className="whitespace-pre-wrap break-words">{log.message}</div>
            </div>
          ))
        )}
        <div ref={logsEndRef} />
      </div>
    </div>
  );
}
