import { Scan, Download, Radio } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import { cn } from "../lib/utils";
import { useShallow } from "zustand/react/shallow";

export default function LandingPage() {
  const setMode = useAppStore(useShallow((state) => state.setMode));

  const handleSend = () => {
    setMode("send");
  };

  const handleReceive = () => {
    setMode("receive");
  };

  const handleDownload = () => {
    window.open("https://github.com/Lemmmy/barcode-scanner/releases", "_blank");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex flex-1 flex-col items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900">Barcode Scanner</h1>
            <p className="mt-2 text-gray-600">Scan and relay barcodes in real-time</p>
          </div>

          <div className="space-y-4">
            <Button onClick={handleSend} icon={<Scan className="h-6 w-6" />} variant="primary">
              Send
            </Button>

            <Button
              onClick={handleReceive}
              icon={<Radio className="h-6 w-6" />}
              variant="secondary"
            >
              Receive
            </Button>

            <Button
              onClick={handleDownload}
              icon={<Download className="h-6 w-6" />}
              variant="outline"
            >
              Download Windows App
            </Button>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-200 bg-white p-4 text-center">
        <a
          href="https://github.com/Lemmmy/barcode-scanner"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          View on GitHub
        </a>
      </footer>
    </div>
  );
}

interface ButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  variant: "primary" | "secondary" | "outline";
  children: React.ReactNode;
}

function Button({ onClick, icon, variant, children }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-center gap-3 rounded-lg px-6 py-4 text-lg font-semibold transition-colors",
        "min-h-[64px] touch-manipulation",
        variant === "primary" && "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800",
        variant === "secondary" && "bg-green-600 text-white hover:bg-green-700 active:bg-green-800",
        variant === "outline" &&
          "border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100",
      )}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}
