import type { ScannedCode } from "../types";

export const newlineTypes = ["crlf", "lf"] as const;
export type NewlineType = (typeof newlineTypes)[number];

export interface CSVExportOptions {
  includeHeader: boolean;
  headerFieldName: string;
  separator: "comma" | "semicolon" | "tab";
  newline: NewlineType;
}

const separatorMap = {
  comma: ",",
  semicolon: ";",
  tab: "\t",
};

export function generateCSV(codes: ScannedCode[], options: CSVExportOptions): string {
  const sep = separatorMap[options.separator];
  const newlineChar = options.newline === "crlf" ? "\r\n" : "\n";

  let csv = "";

  if (options.includeHeader) {
    csv += options.headerFieldName + newlineChar;
  }

  codes.forEach((code) => {
    // Escape quotes and wrap in quotes if contains separator, quotes, or line breaks
    let value = code.code;
    if (
      value.includes(sep) ||
      value.includes('"') ||
      value.includes("\n") ||
      value.includes("\r")
    ) {
      value = '"' + value.replace(/"/g, '""') + '"';
    }
    csv += value + newlineChar;
  });

  return csv;
}

export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function copyToClipboard(content: string): Promise<void> {
  await navigator.clipboard.writeText(content);
}
