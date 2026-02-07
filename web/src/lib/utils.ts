import { type ClassValue, clsx } from "clsx";
import copyToClipboard from "copy-to-clipboard";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export async function shareText(text: string, title?: string): Promise<void> {
  if (navigator.share) {
    await navigator.share({
      title: title || "Room Code",
      text,
    });
  } else {
    copyToClipboard(text);
  }
}
