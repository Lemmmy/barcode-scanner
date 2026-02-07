import { Download } from "lucide-react";
import { useState } from "react";
import type { CSVExportOptions } from "../lib/csv";
import { ExportDialogCSV } from "./ExportDialogCSV";
import { ExportDialogJSON } from "./ExportDialogJSON";
import { Button } from "./ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/DropdownMenu";

interface ExportButtonProps {
  onExport: (options: CSVExportOptions, action: "download" | "copy") => void;
  disabled?: boolean;
  selectedCount?: number;
}

export function ExportButton({ onExport, disabled, selectedCount = 0 }: ExportButtonProps) {
  const [showCSVDialog, setShowCSVDialog] = useState(false);
  const [showJSONDialog, setShowJSONDialog] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="small" disabled={disabled}>
            <Download className="h-4 w-4" />
            {selectedCount > 0 ? `Export ${selectedCount}` : "Export"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setShowCSVDialog(true)}>CSV</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowJSONDialog(true)}>JSON</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ExportDialogCSV open={showCSVDialog} onOpenChange={setShowCSVDialog} onExport={onExport} />
      <ExportDialogJSON open={showJSONDialog} onOpenChange={setShowJSONDialog} />
    </>
  );
}
