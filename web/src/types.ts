export type AppMode = "landing" | "send" | "receive";

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

export type FieldType = "text" | "textarea" | "number" | "checkbox" | "dropdown";

export interface TemplateField {
  id: string;
  name: string;
  description?: string;
  type: FieldType;
  required: boolean;
  options?: string[]; // For dropdown type
  checkboxOnValue?: string; // For checkbox type (default: "yes")
  checkboxOffValue?: string; // For checkbox type (default: "no")
}

export interface DataEntryTemplate {
  id: string;
  name: string;
  fields: TemplateField[];
  barcodePosition: number; // Index where barcode should appear in field order (0 = first)
  createdAt: number;
  updatedAt: number;
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
}
