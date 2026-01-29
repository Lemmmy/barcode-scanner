import { cn } from "../lib/utils";

interface ConnectionStatusProps {
  connected: boolean;
  className?: string;
}

export default function ConnectionStatus({ connected, className }: ConnectionStatusProps) {
  return (
    <div
      className={cn("h-3 w-3 rounded-full", connected ? "bg-green-500" : "bg-red-500", className)}
      title={connected ? "Connected" : "Disconnected"}
    />
  );
}
