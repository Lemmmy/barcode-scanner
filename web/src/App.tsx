import { useEffect } from "react";
import { useAppStore } from "./store/useAppStore";
import LandingPage from "./components/LandingPage";
import SendMode from "./components/SendMode";
import ReceiveMode from "./components/ReceiveMode";
import { useShallow } from "zustand/react/shallow";

function App() {
  const { mode, setMode } = useAppStore(
    useShallow((state) => ({
      mode: state.mode,
      setMode: state.setMode,
    })),
  );

  // If running in Electron, start in receive mode
  useEffect(() => {
    if (window.electronAPI && mode === "landing") {
      setMode("receive");
    }
  }, [mode, setMode]);

  return (
    <div className="min-h-screen bg-gray-50">
      {mode === "landing" && <LandingPage />}
      {mode === "send" && <SendMode />}
      {mode === "receive" && <ReceiveMode />}
    </div>
  );
}

export default App;
