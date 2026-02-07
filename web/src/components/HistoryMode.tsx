import { AppHeader } from "./AppHeader";
import ScannedCodesLog from "./ScannedCodesLog";

export default function HistoryMode() {
  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <AppHeader title="Scan History" />

      <div className="flex-1 overflow-hidden">
        <ScannedCodesLog isOpen={true} onClose={() => {}} fullscreen />
      </div>
    </div>
  );
}
