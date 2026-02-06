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

  // Use fieldOrder from the first code that has it, otherwise collect all unique fields
  let fieldNames: string[] = [];
  const firstCodeWithOrder = codes.find((code) => code.fieldOrder && code.fieldOrder.length > 0);

  if (firstCodeWithOrder?.fieldOrder) {
    // Use the field order from the template (includes __barcode placeholder)
    fieldNames = firstCodeWithOrder.fieldOrder.filter((name) => name !== "__fieldOrder");
  } else {
    // Fallback: collect all unique template field names across all codes
    const templateFields = new Set<string>();
    codes.forEach((code) => {
      if (code.templateData) {
        Object.keys(code.templateData).forEach((key) => {
          if (key !== "__fieldOrder") {
            templateFields.add(key);
          }
        });
      }
    });
    fieldNames = Array.from(templateFields).sort();

    // If no template fields found, at least include the barcode
    if (fieldNames.length === 0) {
      fieldNames = ["__barcode"];
    }
  }

  let csv = "";

  if (options.includeHeader) {
    // Replace __barcode with the actual header name
    const headers = fieldNames.map((name) =>
      name === "__barcode" ? options.headerFieldName : name,
    );
    csv += headers.join(sep) + newlineChar;
  }

  codes.forEach((code) => {
    const escapeValue = (value: string) => {
      if (
        value.includes(sep) ||
        value.includes('"') ||
        value.includes("\n") ||
        value.includes("\r")
      ) {
        return '"' + value.replace(/"/g, '""') + '"';
      }
      return value;
    };

    const row: string[] = [];

    // Add values in the same order as headers, replacing __barcode with actual barcode
    fieldNames.forEach((fieldName) => {
      if (fieldName === "__barcode") {
        row.push(escapeValue(code.code));
      } else {
        const value = code.templateData?.[fieldName];
        if (value === undefined || value === null) {
          row.push("");
        } else if (typeof value === "boolean") {
          row.push(value ? "true" : "false");
        } else if (typeof value === "number") {
          row.push(String(value));
        } else if (typeof value === "string") {
          row.push(escapeValue(value));
        } else {
          row.push(escapeValue(JSON.stringify(value)));
        }
      }
    });

    csv += row.join(sep) + newlineChar;
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
