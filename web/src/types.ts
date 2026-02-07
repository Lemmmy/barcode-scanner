export type AppMode = "landing" | "send" | "receive" | "history" | "settings";

export type ScanMode = "camera" | "keyboard";

export interface ScannedCode {
  id: string;
  code: string;
  timestamp: number;
  count: number;
  firstScannedAt: number;
  templateData?: Record<string, unknown>;
  fieldOrder?: string[];
}

export type FieldType = "text" | "textarea" | "number" | "checkbox" | "dropdown" | "date";

export interface TemplateField {
  id: string;
  name: string;
  description?: string;
  type: FieldType;
  required: boolean;
  options?: string[]; // For dropdown type
  checkboxOnValue?: string; // For checkbox type (default: "yes")
  checkboxOffValue?: string; // For checkbox type (default: "no")
  dateFormat?: string; // For date fields - dayjs format string (default: "YYYY-MM-DD")
}

export interface ScannedCodeInfo {
  code: string;
  timestamp: number;
  format?: string;
}

export interface DataEntryTemplate {
  id: string;
  name: string;
  fields: TemplateField[];
  barcodePosition: number; // Index where barcode should appear in field order (0 = first)
  createdAt: number;
  updatedAt: number;
  postScanScript?: string; // JavaScript code to execute after scan
  scriptUrl?: string; // URL to fetch script from
}

export interface ConnectionStatus {
  connected: boolean;
  roomCode: string | null;
}

export interface AutoTypeSettings {
  enabled: boolean;
  keypressDelay: number;
  keyBetweenFields: string; // Key pressed between fields (default: "Tab")
  keyAfterCode: string; // Key pressed at end of row (default: "Enter")
}

export interface AppSettings {
  relayServerUrl: string;
  autoDiscoverRooms: boolean;
  ignoreTildePrefix: boolean;
  disableJavaScriptExecution: boolean;
  showDebugConsole: boolean;
  holdToScan: boolean;
  showFpsCounter: boolean;
}
