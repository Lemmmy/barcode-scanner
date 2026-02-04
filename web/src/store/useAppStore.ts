import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type {
  AppMode,
  ScannedCode,
  ConnectionStatus,
  AutoTypeSettings,
  AppSettings,
  DataEntryTemplate,
  ScanMode,
} from "../types";
import type { CSVExportOptions } from "../lib/csv";
import { TypedSocket } from "@/lib/socket";
import { getDefaultRelayServerUrl } from "@/lib/constants";
import { scannedCodesService, templatesService } from "@/lib/db";

interface AppState {
  mode: AppMode;
  connectionStatus: ConnectionStatus;
  scannedCodes: ScannedCode[];
  isMuted: boolean;
  socketRef: TypedSocket | null;
  autoTypeSettings: AutoTypeSettings;
  settings: AppSettings;
  exportPreferences: CSVExportOptions;
  templates: DataEntryTemplate[];
  activeTemplateId: string | null;
  incomingTemplate: DataEntryTemplate | null;
  scanMode: ScanMode;

  setMode: (mode: AppMode) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  addScannedCode: (code: Omit<ScannedCode, "count" | "firstScannedAt">) => Promise<void>;
  loadScannedCodes: () => Promise<void>;
  clearScannedCodes: () => Promise<void>;
  toggleMute: () => void;
  setSocketRef: (socket: TypedSocket | null) => void;
  setAutoTypeSettings: (settings: AutoTypeSettings) => void;
  setSettings: (settings: AppSettings) => void;
  setExportPreferences: (preferences: CSVExportOptions) => void;
  addTemplate: (template: DataEntryTemplate) => Promise<void>;
  updateTemplate: (id: string, template: Partial<DataEntryTemplate>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  loadTemplates: () => Promise<void>;
  setActiveTemplateId: (id: string | null) => void;
  setIncomingTemplate: (template: DataEntryTemplate | null) => void;
  setScanMode: (mode: ScanMode) => void;
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
        socketRef: null,
        autoTypeSettings: {
          enabled: false,
          keypressDelay: 0,
          keyBetweenFields: "Tab",
          keyAfterCode: "Enter",
        },
        settings: {
          relayServerUrl: getDefaultRelayServerUrl(),
          autoDiscoverRooms: true,
          ignoreTildePrefix: false,
        },
        exportPreferences: {
          includeHeader: true,
          headerFieldName: "Barcode",
          separator: "comma",
          newline: "crlf",
        },
        templates: [],
        activeTemplateId: null,
        incomingTemplate: null,
        scanMode: "camera",

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

        setSocketRef: (socket) => set({ socketRef: socket }),

        setAutoTypeSettings: (settings) => set({ autoTypeSettings: settings }),

        setSettings: (settings) => set({ settings }),

        setExportPreferences: (preferences) => set({ exportPreferences: preferences }),

        addTemplate: async (template) => {
          await templatesService.add(template);
          const templates = await templatesService.getAll();
          set((state) => {
            state.templates = templates;
          });
        },
        updateTemplate: async (id, updates) => {
          await templatesService.update(id, updates);
          const templates = await templatesService.getAll();
          set((state) => {
            state.templates = templates;
          });
        },
        deleteTemplate: async (id) => {
          await templatesService.delete(id);
          const templates = await templatesService.getAll();
          set((state) => {
            state.templates = templates;
            if (state.activeTemplateId === id) {
              state.activeTemplateId = null;
            }
          });
        },
        loadTemplates: async () => {
          const templates = await templatesService.getAll();
          set((state) => {
            state.templates = templates;
          });
        },
        setActiveTemplateId: (id) => set({ activeTemplateId: id }),

        setIncomingTemplate: (template) => set({ incomingTemplate: template }),

        setScanMode: (mode) => set({ scanMode: mode }),

        reset: () =>
          set({
            mode: "landing",
            connectionStatus: { connected: false, roomCode: null },
            socketRef: null,
          }),
      }),
      {
        name: "barcode-scanner-storage",
        partialize: (state) => ({
          settings: state.settings,
          autoTypeSettings: state.autoTypeSettings,
          exportPreferences: state.exportPreferences,
          activeTemplateId: state.activeTemplateId,
          isMuted: state.isMuted,
          scanMode: state.scanMode,
        }),
      },
    ),
  ),
);
