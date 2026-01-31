import { Download } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/DropdownMenu";
import { ExportDialog, type CSVExportOptions } from "./ExportDialog";

interface ExportButtonProps {
  onExport: (options: CSVExportOptions, action: "download" | "copy") => void;
  disabled?: boolean;
}

export function ExportButton({ onExport, disabled }: ExportButtonProps) {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="small" disabled={disabled}>
            <Download className="h-4 w-4" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setShowDialog(true)}>CSV</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ExportDialog open={showDialog} onOpenChange={setShowDialog} onExport={onExport} />
    </>
  );
}
