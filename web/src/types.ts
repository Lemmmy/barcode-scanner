export type AppMode = "landing" | "send" | "receive";

export interface ScannedCode {
  id: string;
  code: string;
  timestamp: number;
  count: number;
  firstScannedAt: number;
}

export interface ConnectionStatus {
  connected: boolean;
  roomCode: string | null;
}

export interface AutoTypeSettings {
  enabled: boolean;
  keypressDelay: number;
  keyAfterCode: "enter" | "right" | "down";
}

export interface AppSettings {
  relayServerUrl: string;
  autoDiscoverRooms: boolean;
}
