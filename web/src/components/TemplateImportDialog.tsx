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

interface TemplateImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: DataEntryTemplate;
  existingTemplate?: DataEntryTemplate;
  onConfirm: () => void;
}

export function TemplateImportDialog({
  open,
  onOpenChange,
  template,
  existingTemplate,
  onConfirm,
}: TemplateImportDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{existingTemplate ? "Overwrite Template?" : "Import Template?"}</DialogTitle>
          <DialogDescription>
            {existingTemplate ? (
              <>
                A user has shared the template <strong>{template.name}</strong>. You already have a
                template with this name. Do you want to overwrite it?
              </>
            ) : (
              <>
                A user has shared the template <strong>{template.name}</strong>. Import it?
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4">
          <div className="rounded-lg border border-gray-200 p-3">
            <p className="font-medium text-gray-900">{template.name}</p>
            <p className="text-sm text-gray-500">{template.fields.length} fields</p>
            <div className="mt-2 space-y-1">
              {template.fields.map((field) => (
                <div key={field.id} className="text-xs text-gray-600">
                  • {field.name} ({field.type}){field.required && " *"}
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm}>
            {existingTemplate ? "Overwrite" : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
