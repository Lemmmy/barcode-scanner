export interface AutoTypeSettings {
  enabled: boolean;
  keypressDelay: number;
  keyAfterCode: "enter" | "right" | "down";
}

export interface ElectronAPI {
  autoType: (code: string, settings: AutoTypeSettings) => Promise<void>;
  getPlatform: () => Promise<string>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
