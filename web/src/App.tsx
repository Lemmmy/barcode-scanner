import { lazy, Suspense, useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { migrateFromLocalStorage } from "./lib/migration";
import { useAppStore } from "./store/useAppStore";
import { Loader2 } from "lucide-react";

const LandingPage = lazy(() => import("./components/LandingPage"));
const SendMode = lazy(() => import("./components/SendMode"));
const ReceiveMode = lazy(() => import("./components/ReceiveMode"));
const HistoryMode = lazy(() => import("./components/HistoryMode"));
const SettingsMode = lazy(() => import("./components/SettingsMode"));

function App() {
  const mode = useAppStore(useShallow((state) => state.mode));

  // Initialize app: migrate data and load scanned codes
  useEffect(() => {
    const initialize = async () => {
      try {
        // Migrate from localStorage if needed
        await migrateFromLocalStorage();

        // Load scanned codes from IndexedDB
        await useAppStore.getState().loadScannedCodes();

        // Load templates from IndexedDB
        await useAppStore.getState().loadTemplates();

        // Check if running in Electron and set mode to receive
        if (window.electronAPI) {
          useAppStore.getState().setMode("receive");
        }
      } catch (error) {
        console.error("Failed to initialize app:", error);
        // App can still function without IndexedDB (e.g., in private browsing)
        // Just log the error and continue
      }
    };

    void initialize();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<LoadingFallback />}>
        {mode === "landing" && <LandingPage />}
        {mode === "send" && <SendMode />}
        {mode === "receive" && <ReceiveMode />}
        {mode === "history" && <HistoryMode />}
        {mode === "settings" && <SettingsMode />}
      </Suspense>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
    </div>
  );
}

export default App;
