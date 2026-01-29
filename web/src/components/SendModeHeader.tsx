import { ArrowLeft, Settings, Volume2, VolumeX } from "lucide-react";
import RoomCodeDisplay from "./RoomCodeDisplay";
import { useAppStore } from "../store/useAppStore";
import { useShallow } from "zustand/react/shallow";

interface SendModeHeaderProps {
  onSettingsClick: () => void;
}

export function SendModeHeader({ onSettingsClick }: SendModeHeaderProps) {
  const { connectionStatus, isMuted, toggleMute, reset, setConnectionStatus, socketRef } =
    useAppStore(
      useShallow((state) => ({
        connectionStatus: state.connectionStatus,
        setConnectionStatus: state.setConnectionStatus,
        isMuted: state.isMuted,
        toggleMute: state.toggleMute,
        reset: state.reset,
        socketRef: state.socketRef,
      })),
    );

  const handleChangeCode = () => {
    const newCode = prompt("Enter a 4-digit room code:");
    if (newCode && /^\d{4}$/.test(newCode)) {
      socketRef?.emit("changeRoom", newCode);
      setConnectionStatus({ connected: connectionStatus.connected, roomCode: newCode });
    } else if (newCode) {
      alert("Invalid code. Please enter a 4-digit number.");
    }
  };

  return (
    <div className="flex items-center justify-between p-4">
      <button
        onClick={reset}
        className="rounded-lg bg-black/50 p-3 text-white backdrop-blur-sm transition-colors hover:bg-black/60 active:bg-black/70"
      >
        <ArrowLeft className="h-6 w-6" />
      </button>

      <RoomCodeDisplay
        code={connectionStatus.roomCode}
        connected={connectionStatus.connected}
        onChangeCode={handleChangeCode}
      />

      <div className="flex gap-2">
        <button
          onClick={toggleMute}
          className="rounded-lg bg-black/50 p-3 text-white backdrop-blur-sm transition-colors hover:bg-black/60 active:bg-black/70"
        >
          {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
        </button>
        <button
          onClick={onSettingsClick}
          className="rounded-lg bg-black/50 p-3 text-white backdrop-blur-sm transition-colors hover:bg-black/60 active:bg-black/70"
        >
          <Settings className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
