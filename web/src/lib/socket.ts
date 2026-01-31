import { io, Socket } from "socket.io-client";
import type { DataEntryTemplate } from "../types";

export interface ServerToClientEvents {
  roomCode: (code: string) => void;
  barcodeScanned: (data: {
    code: string;
    timestamp: number;
    templateData?: Record<string, unknown>;
    fieldOrder?: string[];
  }) => void;
  templateShared: (template: DataEntryTemplate) => void;
  error: (message: string) => void;
}

export interface ClientToServerEvents {
  createRoom: () => void;
  joinRoom: (code: string) => void;
  scanBarcode: (data: {
    code: string;
    templateData?: Record<string, unknown>;
    fieldOrder?: string[];
  }) => void;
  shareTemplate: (template: DataEntryTemplate) => void;
  changeRoom: (code: string) => void;
}

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function createSocket(serverUrl?: string): TypedSocket {
  if (serverUrl) {
    return io(serverUrl, { autoConnect: false }) as TypedSocket;
  }
  return io({ autoConnect: false }) as TypedSocket;
}
