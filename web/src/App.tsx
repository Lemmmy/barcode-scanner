import { useEffect } from "react";
import { useAppStore } from "./store/useAppStore";
import LandingPage from "./components/LandingPage";
import SendMode from "./components/SendMode";
import ReceiveMode from "./components/ReceiveMode";
import { useShallow } from "zustand/react/shallow";
import { migrateFromLocalStorage } from "./lib/migration";

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
      {mode === "landing" && <LandingPage />}
      {mode === "send" && <SendMode />}
      {mode === "receive" && <ReceiveMode />}
    </div>
  );
}

export default App;
