import { useEffect } from "react";
import { useAppStore } from "../store/useAppStore";
import { createSocket } from "../lib/socket";
import { useShallow } from "zustand/react/shallow";

export function useSocketConnection() {
  const { connectionStatus, setConnectionStatus, setSocketRef, settings } = useAppStore(
    useShallow((state) => ({
      connectionStatus: state.connectionStatus,
      setConnectionStatus: state.setConnectionStatus,
      setSocketRef: state.setSocketRef,
      settings: state.settings,
    })),
  );

  useEffect(() => {
    console.log("useSocketConnection: Creating socket");
    const socket = createSocket(settings.relayServerUrl);
    setSocketRef(socket);

    socket.on("connect", () => {
      console.log("Socket connected");
      setConnectionStatus({ connected: true, roomCode: connectionStatus.roomCode });
      socket.emit("createRoom");
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
      setConnectionStatus({ connected: false, roomCode: connectionStatus.roomCode });
    });

    socket.on("roomCode", (code: string) => {
      console.log("Received room code:", code);
      setConnectionStatus({ connected: true, roomCode: code });
    });

    socket.on("error", (message: string) => {
      console.error("Socket error:", message);
      alert(`Error: ${message}`);
    });

    console.log("useSocketConnection: Connecting socket");
    socket.connect();

    return () => {
      console.log("useSocketConnection: Cleanup - disconnecting socket");
      socket.disconnect();
      setSocketRef(null);
    };
  }, [setConnectionStatus, setSocketRef]);
}
