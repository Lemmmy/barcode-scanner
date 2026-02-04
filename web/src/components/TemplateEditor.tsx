import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import type { DataEntryTemplate } from "../types";
import { BarcodePositionPlaceholder } from "./BarcodePositionPlaceholder";
import { ScriptEditor } from "./ScriptEditor";
import { TemplateFieldEditor } from "./TemplateFieldEditor";
import { Button } from "./ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/Dialog";
import { FormError } from "./ui/FormError";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";

const fieldSchema = z.object({
  name: z.string().min(1, "Field name is required"),
  description: z.string().optional(),
  type: z.enum(["text", "textarea", "number", "checkbox", "dropdown", "date"]),
  required: z.boolean(),
  options: z.array(z.string()).optional(),
  checkboxOnValue: z.string().optional(),
  checkboxOffValue: z.string().optional(),
  dateFormat: z.string().optional(),
});

const templateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  fields: z.array(fieldSchema),
  postScanScript: z.string().optional(),
  scriptUrl: z.string().optional(),
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
  const [postScanScript, setPostScanScript] = useState("");
  const [scriptUrl, setScriptUrl] = useState("");

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
            checkboxOnValue: f.checkboxOnValue || "",
            checkboxOffValue: f.checkboxOffValue || "",
            dateFormat: f.dateFormat || "",
          })),
          postScanScript: template.postScanScript || "",
          scriptUrl: template.scriptUrl || "",
        }
      : {
          name: "",
          fields: [],
          postScanScript: "",
          scriptUrl: "",
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
          dateFormat: f.dateFormat || "",
        })),
        postScanScript: template.postScanScript || "",
        scriptUrl: template.scriptUrl || "",
      });
      setBarcodePosition(template.barcodePosition ?? 0);
      setPostScanScript(template.postScanScript || "");
      setScriptUrl(template.scriptUrl || "");
    } else {
      reset({
        name: "",
        fields: [],
        postScanScript: "",
        scriptUrl: "",
      });
      setBarcodePosition(0);
      setPostScanScript("");
      setScriptUrl("");
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
        dateFormat: f.type === "date" ? f.dateFormat || "YYYY-MM-DD" : undefined,
      })),
      barcodePosition: Math.max(0, Math.min(barcodePosition, data.fields.length)),
      createdAt: template?.createdAt || now,
      updatedAt: now,
      postScanScript: postScanScript || undefined,
      scriptUrl: scriptUrl || undefined,
    };

    onSave(savedTemplate);
    reset();
    setBarcodePosition(0);
    setPostScanScript("");
    setScriptUrl("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[860px]">
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
                <Label>Fields {fields.length === 0 && "(optional)"}</Label>
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

              {fields.length === 0 && (
                <p className="text-sm text-gray-500">
                  No fields added yet. Templates can have zero fields if you only need the barcode
                  or use a post-scan script.
                </p>
              )}

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
                    canRemove={true}
                    setValue={setValue}
                    getValues={getValues}
                  />
                );
              })}

              {errors.fields && <FormError message={errors.fields.message} />}
            </div>

            <div className="space-y-4 border-t border-gray-200 pt-4">
              <ScriptEditor
                value={postScanScript}
                onChange={setPostScanScript}
                onUrlChange={setScriptUrl}
                scriptUrl={scriptUrl}
              />
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
