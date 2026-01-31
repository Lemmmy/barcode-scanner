export interface AutoTypeSettings {
  enabled: boolean;
  keypressDelay: number;
  keyBetweenFields: string; // Key pressed between fields (default: "Tab")
  keyAfterCode: string; // Key pressed at end of row (default: "Enter")
}

export interface ElectronAPI {
  autoType: (
    code: string,
    settings: AutoTypeSettings,
    templateData?: Record<string, unknown>,
    fieldOrder?: string[],
  ) => Promise<void>;
  getPlatform: () => Promise<string>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
