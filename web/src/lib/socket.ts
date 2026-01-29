import { io, Socket } from "socket.io-client";

export interface ServerToClientEvents {
  roomCode: (code: string) => void;
  barcodeScanned: (data: { code: string; timestamp: number }) => void;
  error: (message: string) => void;
}

export interface ClientToServerEvents {
  createRoom: () => void;
  joinRoom: (code: string) => void;
  scanBarcode: (code: string) => void;
  changeRoom: (code: string) => void;
}

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function createSocket(serverUrl?: string): TypedSocket {
  if (serverUrl) {
    return io(serverUrl, { autoConnect: false }) as TypedSocket;
  }
  return io({ autoConnect: false }) as TypedSocket;
}
