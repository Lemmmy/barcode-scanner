import { type ClassValue, clsx } from "clsx";

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

export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  }

  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-999999px";
  document.body.appendChild(textArea);
  textArea.select();

  try {
    document.execCommand("copy");
    return Promise.resolve();
  } catch (err) {
    return Promise.reject(err instanceof Error ? err : new Error(String(err)));
  } finally {
    document.body.removeChild(textArea);
  }
}

export async function shareText(text: string, title?: string): Promise<void> {
  if (navigator.share) {
    await navigator.share({
      title: title || "Room Code",
      text,
    });
  } else {
    await copyToClipboard(text);
  }
}
