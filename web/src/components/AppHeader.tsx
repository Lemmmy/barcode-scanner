import { useAppStore } from "@/store/useAppStore";
import { ArrowLeft } from "lucide-react";
import { ReactNode } from "react";
import { useShallow } from "zustand/react/shallow";

interface Props {
  title?: ReactNode;
  subtitle?: ReactNode;
  extra?: ReactNode;
  onBack?: () => void;
}

export function AppHeader({ title, subtitle, extra, onBack }: Props) {
  const setMode = useAppStore(useShallow((state) => state.setMode));

  const handleBack =
    onBack ||
    (() => {
      setMode("landing");
    });

  return (
    <div className="flex items-center border-b border-gray-200 bg-white p-4">
      <button
        onClick={handleBack}
        className="rounded-lg p-2 text-gray-700 transition-colors hover:bg-gray-100 active:bg-gray-200"
        aria-label="Back to home"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      <h1 className="ml-4 text-xl font-semibold text-gray-900">{title}</h1>
      {subtitle && <h2 className="ml-4 text-lg text-gray-600">{subtitle}</h2>}

      {extra && <div className="ml-4 flex-1">{extra}</div>}
    </div>
  );
}
