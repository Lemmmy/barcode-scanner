import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AppMode,
  ScannedCode,
  ConnectionStatus,
  AutoTypeSettings,
  AppSettings,
} from "../types";
import { TypedSocket } from "@/lib/socket";
import { getDefaultRelayServerUrl } from "@/lib/constants";

interface AppState {
  mode: AppMode;
  connectionStatus: ConnectionStatus;
  scannedCodes: ScannedCode[];
  isMuted: boolean;
  isLogOpen: boolean;
  socketRef: TypedSocket | null;
  autoTypeSettings: AutoTypeSettings;
  settings: AppSettings;

  setMode: (mode: AppMode) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  addScannedCode: (code: ScannedCode) => void;
  clearScannedCodes: () => void;
  toggleMute: () => void;
  setLogOpen: (open: boolean) => void;
  setSocketRef: (socket: TypedSocket | null) => void;
  setAutoTypeSettings: (settings: AutoTypeSettings) => void;
  setSettings: (settings: AppSettings) => void;
  reset: () => void;
}

const MAX_CODES = 50;

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      mode: "landing",
      connectionStatus: { connected: false, roomCode: null },
      scannedCodes: [],
      isMuted: false,
      isLogOpen: false,
      socketRef: null,
      autoTypeSettings: {
        enabled: true,
        keypressDelay: 50,
        keyAfterCode: "enter",
      },

      settings: {
        relayServerUrl: getDefaultRelayServerUrl(),
      },

      setMode: (mode) => set({ mode }),

      setConnectionStatus: (status) => set({ connectionStatus: status }),

      addScannedCode: (code) =>
        set((state) => ({
          scannedCodes: [code, ...state.scannedCodes].slice(0, MAX_CODES),
        })),

      clearScannedCodes: () => set({ scannedCodes: [] }),

      toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

      setLogOpen: (open) => set({ isLogOpen: open }),

      setSocketRef: (socket) => set({ socketRef: socket }),

      setAutoTypeSettings: (settings) => set({ autoTypeSettings: settings }),

      setSettings: (settings) => set({ settings }),

      reset: () =>
        set({
          mode: "landing",
          connectionStatus: { connected: false, roomCode: null },
          isLogOpen: false,
          socketRef: null,
        }),
    }),
    {
      name: "barcode-scanner-storage",
      partialize: (state) => ({
        scannedCodes: state.scannedCodes,
        isMuted: state.isMuted,
        autoTypeSettings: state.autoTypeSettings,
        settings: state.settings,
      }),
    },
  ),
);
