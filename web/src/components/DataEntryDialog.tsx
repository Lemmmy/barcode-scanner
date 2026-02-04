import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { DataEntryTemplate } from "../types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/Dialog";
import { Button } from "./ui/Button";
import { TemplateFieldInput } from "./TemplateFieldInput";

interface DataEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: DataEntryTemplate;
  scannedCode: string;
  onSubmit: (data: Record<string, unknown>) => void;
  prePopulatedData?: Record<string, unknown> | null;
}

export function DataEntryDialog({
  open,
  onOpenChange,
  template,
  scannedCode,
  onSubmit,
  prePopulatedData,
}: DataEntryDialogProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (open) {
      // Reset form with pre-populated data if available
      if (prePopulatedData) {
        reset(prePopulatedData);
      } else {
        reset({});
      }
    }
  }, [open, reset, prePopulatedData]);

  const validateAndSubmit = (formData: Record<string, unknown>) => {
    // Transform data to use field names instead of IDs
    // Include ALL fields (even empty ones) to maintain consistent structure
    const dataWithFieldNames: Record<string, unknown> = {};
    const fieldOrder: string[] = [];

    // Build field order with barcode at the correct position
    const barcodePos = template.barcodePosition ?? 0;
    let fieldIdx = 0;

    for (let i = 0; i <= template.fields.length; i++) {
      if (i === barcodePos) {
        fieldOrder.push("__barcode");
      }
      if (fieldIdx < template.fields.length) {
        const field = template.fields[fieldIdx];
        fieldOrder.push(field.name);
        let value = formData[field.id];

        // Convert checkbox boolean to custom string values
        if (field.type === "checkbox" && typeof value === "boolean") {
          value = value ? field.checkboxOnValue || "yes" : field.checkboxOffValue || "no";
        }

        dataWithFieldNames[field.name] = value !== undefined ? value : "";
        fieldIdx++;
      }
    }

    // Include field order metadata
    onSubmit({ ...dataWithFieldNames, __fieldOrder: fieldOrder });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <form onSubmit={(e) => void handleSubmit(validateAndSubmit)(e)}>
          <DialogHeader>
            <DialogTitle>Enter Data for Scanned Code</DialogTitle>
            <DialogDescription>
              Code: <span className="font-mono font-semibold">{scannedCode}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {template.fields.map((field) => (
              <TemplateFieldInput
                key={field.id}
                field={field}
                register={register}
                control={control}
                error={errors[field.id]?.message as string | undefined}
              />
            ))}
          </div>

          <DialogFooter className="sticky bottom-0 bg-white pt-4">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Scan</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
