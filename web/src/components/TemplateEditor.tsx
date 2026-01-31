import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus } from "lucide-react";
import type { DataEntryTemplate, FieldType } from "../types";
import { TemplateFieldEditor } from "./TemplateFieldEditor";
import { BarcodePositionPlaceholder } from "./BarcodePositionPlaceholder";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/Dialog";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import { Button } from "./ui/Button";
import { FormError } from "./ui/FormError";

const fieldSchema = z.object({
  name: z.string().min(1, "Field name is required"),
  description: z.string().optional(),
  type: z.enum(["text", "textarea", "number", "checkbox", "dropdown"]),
  required: z.boolean(),
  options: z.array(z.string()).optional(),
  checkboxOnValue: z.string().optional(),
  checkboxOffValue: z.string().optional(),
});

const templateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  fields: z.array(fieldSchema).min(1, "At least one field is required"),
});

type TemplateFormData = z.infer<typeof templateSchema>;

interface TemplateEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: DataEntryTemplate;
  existingNames: string[];
  onSave: (template: DataEntryTemplate) => void;
}

export function TemplateEditor({
  open,
  onOpenChange,
  template,
  existingNames,
  onSave,
}: TemplateEditorProps) {
  const [barcodePosition, setBarcodePosition] = useState(0);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors },
    reset,
  } = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: template
      ? {
          name: template.name,
          fields: template.fields.map((f) => ({
            name: f.name,
            description: f.description || "",
            type: f.type,
            required: f.required,
            options: f.options || [],
          })),
        }
      : {
          name: "",
          fields: [{ name: "", description: "", type: "text" as FieldType, required: false }],
        },
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "fields",
  });

  useEffect(() => {
    if (template) {
      reset({
        name: template.name,
        fields: template.fields.map((f) => ({
          name: f.name,
          description: f.description || "",
          type: f.type,
          required: f.required,
          options: f.options || [],
          checkboxOnValue: f.checkboxOnValue || "",
          checkboxOffValue: f.checkboxOffValue || "",
        })),
      });
      setBarcodePosition(template.barcodePosition ?? 0);
    } else {
      reset({
        name: "",
        fields: [{ name: "", description: "", type: "text" as FieldType, required: false }],
      });
      setBarcodePosition(0);
    }
  }, [template, reset]);

  const onSubmit = (data: TemplateFormData) => {
    // Check for duplicate name
    if (!template && existingNames.includes(data.name)) {
      alert(`A template named "${data.name}" already exists. Please choose a different name.`);
      return;
    }

    if (template && template.name !== data.name && existingNames.includes(data.name)) {
      alert(`A template named "${data.name}" already exists. Please choose a different name.`);
      return;
    }

    const now = Date.now();
    const savedTemplate: DataEntryTemplate = {
      id: template?.id || crypto.randomUUID(),
      name: data.name,
      fields: data.fields.map((f, index) => ({
        id: template?.fields[index]?.id || crypto.randomUUID(),
        name: f.name,
        description: f.description,
        type: f.type,
        required: f.required,
        options: f.type === "dropdown" ? f.options : undefined,
        checkboxOnValue: f.type === "checkbox" ? f.checkboxOnValue : undefined,
        checkboxOffValue: f.type === "checkbox" ? f.checkboxOffValue : undefined,
      })),
      barcodePosition: Math.max(0, Math.min(barcodePosition, data.fields.length)),
      createdAt: template?.createdAt || now,
      updatedAt: now,
    };

    onSave(savedTemplate);
    reset();
    setBarcodePosition(0);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <form onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
          <DialogHeader>
            <DialogTitle>{template ? "Edit Template" : "Create Template"}</DialogTitle>
            <DialogDescription>
              Define a data entry template with custom fields for barcode scanning.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
              <Input id="name" {...register("name")} placeholder="e.g., Inventory Check" />
              {errors.name && <FormError message={errors.name.message} />}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Fields</Label>
                <Button
                  type="button"
                  variant="secondary"
                  size="small"
                  onClick={() =>
                    append({ name: "", description: "", type: "text", required: false })
                  }
                >
                  <Plus className="h-4 w-4" />
                  Add Field
                </Button>
              </div>

              {Array.from({ length: fields.length + 1 }).map((_, displayIndex) => {
                // Determine if barcode placeholder should be shown at this position
                if (displayIndex === barcodePosition) {
                  return (
                    <BarcodePositionPlaceholder
                      key="barcode-placeholder"
                      onMouseDown={(e) => {
                        const startY = e.clientY;
                        const startPos = barcodePosition;

                        const handleMouseMove = (moveEvent: MouseEvent) => {
                          const deltaY = moveEvent.clientY - startY;
                          const itemHeight = 120;
                          const newPos = Math.max(
                            0,
                            Math.min(fields.length, startPos + Math.round(deltaY / itemHeight)),
                          );

                          if (newPos !== startPos) {
                            setBarcodePosition(newPos);
                          }
                        };

                        const handleMouseUp = () => {
                          document.removeEventListener("mousemove", handleMouseMove);
                          document.removeEventListener("mouseup", handleMouseUp);
                        };

                        document.addEventListener("mousemove", handleMouseMove);
                        document.addEventListener("mouseup", handleMouseUp);
                      }}
                    />
                  );
                }

                // Adjust field index based on barcode position
                const fieldIndex = displayIndex > barcodePosition ? displayIndex - 1 : displayIndex;
                if (fieldIndex >= fields.length) return null;

                const field = fields[fieldIndex];
                return (
                  <TemplateFieldEditor
                    key={field.id}
                    control={control}
                    index={fieldIndex}
                    fieldId={field.id}
                    register={register}
                    errors={errors}
                    onRemove={() => {
                      remove(fieldIndex);
                      // Adjust barcode position if needed
                      if (barcodePosition > fieldIndex) {
                        setBarcodePosition(barcodePosition - 1);
                      }
                    }}
                    onMove={(fromIndex, toIndex) => {
                      move(fromIndex, toIndex);
                      // Adjust barcode position when fields are moved
                      if (fromIndex < barcodePosition && toIndex >= barcodePosition) {
                        setBarcodePosition(barcodePosition - 1);
                      } else if (fromIndex >= barcodePosition && toIndex < barcodePosition) {
                        setBarcodePosition(barcodePosition + 1);
                      }
                    }}
                    canRemove={fields.length > 1}
                    setValue={setValue}
                    getValues={getValues}
                  />
                );
              })}

              {errors.fields && <FormError message={errors.fields.message} />}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{template ? "Save Changes" : "Create Template"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
