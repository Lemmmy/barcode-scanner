import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type {
  AppMode,
  ScannedCode,
  ConnectionStatus,
  AutoTypeSettings,
  AppSettings,
} from "../types";
import type { CSVExportOptions } from "../lib/csv";
import { TypedSocket } from "@/lib/socket";
import { getDefaultRelayServerUrl } from "@/lib/constants";
import { scannedCodesService } from "@/lib/db";

interface AppState {
  mode: AppMode;
  connectionStatus: ConnectionStatus;
  scannedCodes: ScannedCode[];
  isMuted: boolean;
  isLogOpen: boolean;
  socketRef: TypedSocket | null;
  autoTypeSettings: AutoTypeSettings;
  settings: AppSettings;
  exportPreferences: CSVExportOptions;

  setMode: (mode: AppMode) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  addScannedCode: (code: Omit<ScannedCode, "count" | "firstScannedAt">) => Promise<void>;
  loadScannedCodes: () => Promise<void>;
  clearScannedCodes: () => Promise<void>;
  toggleMute: () => void;
  setLogOpen: (open: boolean) => void;
  setSocketRef: (socket: TypedSocket | null) => void;
  setAutoTypeSettings: (settings: AutoTypeSettings) => void;
  setSettings: (settings: AppSettings) => void;
  setExportPreferences: (preferences: CSVExportOptions) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>()(
  immer(
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
        exportPreferences: {
          includeHeader: true,
          headerFieldName: "Barcode",
          separator: "comma",
          newline: "crlf",
        },

        setMode: (mode) => set({ mode }),

        setConnectionStatus: (status) => set({ connectionStatus: status }),

        addScannedCode: async (code) => {
          await scannedCodesService.addOrUpdate(code);
          const codes = await scannedCodesService.getAll();
          set({ scannedCodes: codes });
        },

        loadScannedCodes: async () => {
          const codes = await scannedCodesService.getAll();
          set({ scannedCodes: codes });
        },

        clearScannedCodes: async () => {
          await scannedCodesService.clear();
          set({ scannedCodes: [] });
        },

        toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

        setLogOpen: (open) => set({ isLogOpen: open }),

        setSocketRef: (socket) => set({ socketRef: socket }),

        setAutoTypeSettings: (settings) => set({ autoTypeSettings: settings }),

        setSettings: (settings) => set({ settings }),

        setExportPreferences: (preferences) => set({ exportPreferences: preferences }),

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
          isMuted: state.isMuted,
          autoTypeSettings: state.autoTypeSettings,
          settings: state.settings,
          exportPreferences: state.exportPreferences,
        }),
      },
    ),
  ),
);
