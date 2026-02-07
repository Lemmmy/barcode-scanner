import { useForm, Controller } from "react-hook-form";
import { useShallow } from "zustand/react/shallow";
import { useAppStore } from "../store/useAppStore";
import { Button } from "./ui/Button";
import { Checkbox } from "./ui/Checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/Dialog";
import { Label } from "./ui/Label";
import { copyToClipboard as copyTextToClipboard } from "../lib/csv";

interface JSONExportOptions {
  minify: boolean;
}

interface JSONExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportDialogJSON({ open, onOpenChange }: JSONExportDialogProps) {
  const { scannedCodes } = useAppStore(
    useShallow((state) => ({
      scannedCodes: state.scannedCodes,
    })),
  );

  const { handleSubmit, control } = useForm<JSONExportOptions>({
    defaultValues: {
      minify: false,
    },
  });

  const onSubmit = (action: "download" | "copy") => (data: JSONExportOptions) => {
    const jsonString = data.minify
      ? JSON.stringify(scannedCodes)
      : JSON.stringify(scannedCodes, null, 2);

    if (action === "download") {
      const timestamp = new Date().toISOString().split("T")[0];
      const blob = new Blob([jsonString], { type: "application/json;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute("download", `barcodes-${timestamp}.json`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      void copyTextToClipboard(jsonString);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export to JSON</DialogTitle>
          <DialogDescription>Configure JSON export options for scanned barcodes.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center space-x-2">
            <Controller
              name="minify"
              control={control}
              render={({ field }) => (
                <Checkbox id="minify" checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
            <Label htmlFor="minify" className="text-sm font-normal">
              Minify JSON (remove whitespace)
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={(e) => void handleSubmit(onSubmit("copy"))(e)}>
            Copy to Clipboard
          </Button>
          <Button onClick={(e) => void handleSubmit(onSubmit("download"))(e)}>Download</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
