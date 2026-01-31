import { useState, useEffect, useRef } from "react";
import { RefreshCw, Users, Clock } from "lucide-react";
import { Button } from "./ui/Button";
import { discoverNearbyRooms, type NearbyRoom } from "../lib/api";
import { useAppStore } from "../store/useAppStore";
import { useShallow } from "zustand/react/shallow";

const AUTO_REFRESH_INTERVAL_MS = 10000; // 10 seconds

interface RoomDiscoveryProps {
  onRoomSelect: (code: string) => void;
  autoDiscover?: boolean;
}

function formatAge(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function RoomDiscovery({ onRoomSelect, autoDiscover = false }: RoomDiscoveryProps) {
  const [rooms, setRooms] = useState<NearbyRoom[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const settings = useAppStore(useShallow((state) => state.settings));

  const handleDiscover = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const nearbyRooms = await discoverNearbyRooms(settings.relayServerUrl);
      setRooms(nearbyRooms);
      setLastRefresh(Date.now());

      if (nearbyRooms.length === 0 && !autoDiscover) {
        setError("No nearby rooms found on your network");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to discover rooms");
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-discovery effect
  useEffect(() => {
    if (autoDiscover) {
      // Initial discovery
      void handleDiscover();

      // Set up periodic refresh
      intervalRef.current = setInterval(() => {
        void handleDiscover();
      }, AUTO_REFRESH_INTERVAL_MS);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [autoDiscover, settings.relayServerUrl]);

  const formatLastRefresh = () => {
    if (!lastRefresh) return "";
    const seconds = Math.floor((Date.now() - lastRefresh) / 1000);
    if (seconds < 5) return "Just now";
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.floor(seconds / 60)}m ago`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-700">Discover Nearby Rooms</h3>
          {autoDiscover && lastRefresh && (
            <p className="text-xs text-gray-500">Updated {formatLastRefresh()}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="small"
          onClick={() => void handleDiscover()}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          {isLoading ? "Searching..." : "Refresh"}
        </Button>
      </div>

      {error && <div className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">{error}</div>}

      {rooms.length > 0 && (
        <div className="space-y-2">
          {rooms.map((room) => (
            <button
              key={room.code}
              onClick={() => onRoomSelect(room.code)}
              className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white p-3 text-left transition-colors hover:bg-gray-50 active:bg-gray-100"
            >
              <div className="flex-1">
                <div className="font-mono text-lg font-semibold text-gray-900">{room.code}</div>
                <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {room.clientCount} {room.clientCount === 1 ? "client" : "clients"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatAge(room.age)}
                  </span>
                </div>
              </div>
              <div className="text-sm font-medium text-blue-600">Join →</div>
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-500">
        {autoDiscover
          ? "Auto-discovering rooms on your local network every 10 seconds."
          : "Discovers rooms created on your local network. Only shows rooms from devices on the same subnet for privacy."}
      </p>
    </div>
  );
}
