import { useState } from "react";
import { Control, useWatch, UseFormRegister, FieldErrors } from "react-hook-form";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import { Button } from "./ui/Button";
import { Select } from "./ui/Select";
import { Checkbox } from "./ui/Checkbox";
import { FormError } from "./ui/FormError";
import type { FieldType } from "../types";

interface TemplateFormData {
  name: string;
  fields: Array<{
    name: string;
    description?: string;
    type: FieldType;
    required: boolean;
    options?: string[];
    checkboxOnValue?: string;
    checkboxOffValue?: string;
    dateFormat?: string;
  }>;
}

interface TemplateFieldEditorProps {
  control: Control<TemplateFormData>;
  index: number;
  fieldId: string;
  register: UseFormRegister<TemplateFormData>;
  errors: FieldErrors<TemplateFormData>;
  onRemove: () => void;
  onMove: (fromIndex: number, toIndex: number) => void;
  canRemove: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: (name: any, value: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getValues: (name: any) => any;
}

export function TemplateFieldEditor({
  control,
  index,
  register,
  errors,
  onRemove,
  onMove,
  canRemove,
  setValue,
  getValues,
}: TemplateFieldEditorProps) {
  const [dropdownOption, setDropdownOption] = useState("");

  // Watch only this specific field's type and options
  const fieldType = useWatch({
    control,
    name: `fields.${index}.type`,
  });

  const fieldOptions = useWatch({
    control,
    name: `fields.${index}.options`,
  });

  const fieldRequired = useWatch({
    control,
    name: `fields.${index}.required`,
  });

  const addDropdownOption = () => {
    const option = dropdownOption.trim();
    if (!option) return;

    const currentOptions = (getValues(`fields.${index}.options`) as string[]) || [];
    if (!currentOptions.includes(option)) {
      setValue(`fields.${index}.options`, [...currentOptions, option]);
    }

    setDropdownOption("");
  };

  const removeDropdownOption = (optionIndex: number) => {
    const currentOptions = (getValues(`fields.${index}.options`) as string[]) || [];
    setValue(
      `fields.${index}.options`,
      currentOptions.filter((_: string, i: number) => i !== optionIndex),
    );
  };

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 p-4">
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing mt-2"
          onMouseDown={(e) => {
            const startY = e.clientY;
            const startIndex = index;

            const handleMouseMove = (moveEvent: MouseEvent) => {
              const deltaY = moveEvent.clientY - startY;
              const itemHeight = 120;
              const newIndex = Math.max(
                0,
                Math.min(Number.MAX_SAFE_INTEGER, startIndex + Math.round(deltaY / itemHeight)),
              );

              if (newIndex !== startIndex) {
                onMove(startIndex, newIndex);
              }
            };

            const handleMouseUp = () => {
              document.removeEventListener("mousemove", handleMouseMove);
              document.removeEventListener("mouseup", handleMouseUp);
            };

            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
          }}
        >
          <GripVertical className="h-5 w-5 text-gray-400" />
        </button>
        <div className="flex-1 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Field Name</Label>
              <Input {...register(`fields.${index}.name`)} placeholder="e.g., Quantity" />
              {errors.fields?.[index]?.name && (
                <FormError message={errors.fields[index]?.name?.message} />
              )}
            </div>

            <div className="space-y-2">
              <Label>Field Type</Label>
              <Select {...register(`fields.${index}.type`)}>
                <option value="text">Single-line Text</option>
                <option value="number">Number</option>
                <option value="textarea">Text Area</option>
                <option value="checkbox">Checkbox</option>
                <option value="dropdown">Dropdown</option>
                <option value="date">Date</option>
              </Select>
              {errors.fields?.[index]?.type && (
                <FormError message={errors.fields[index]?.type?.message} />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Input
              {...register(`fields.${index}.description`)}
              placeholder="Help text for this field"
            />
          </div>

          {fieldType === "dropdown" && (
            <div className="space-y-2">
              <Label>Dropdown Options</Label>
              <div className="flex gap-2">
                <Input
                  value={dropdownOption}
                  onChange={(e) => setDropdownOption(e.target.value)}
                  placeholder="Add option..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addDropdownOption();
                    }
                  }}
                />
                <Button type="button" variant="secondary" size="small" onClick={addDropdownOption}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(fieldOptions || []).map((option, optIndex) => (
                  <div
                    key={optIndex}
                    className="flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-sm"
                  >
                    <span>{option}</span>
                    <button
                      type="button"
                      onClick={() => removeDropdownOption(optIndex)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Checkbox
              id={`field-${index}-required`}
              checked={fieldRequired}
              onCheckedChange={(checked) => setValue(`fields.${index}.required`, checked)}
            />
            <Label htmlFor={`field-${index}-required`} className="text-sm font-normal">
              Required
            </Label>
          </div>

          {fieldType === "checkbox" && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor={`field-${index}-checkboxOnValue`} className="text-xs">
                  Checked value
                </Label>
                <Input
                  id={`field-${index}-checkboxOnValue`}
                  type="text"
                  placeholder="yes"
                  {...register(`fields.${index}.checkboxOnValue`)}
                />
              </div>
              <div>
                <Label htmlFor={`field-${index}-checkboxOffValue`} className="text-xs">
                  Unchecked value
                </Label>
                <Input
                  id={`field-${index}-checkboxOffValue`}
                  type="text"
                  placeholder="no"
                  {...register(`fields.${index}.checkboxOffValue`)}
                />
              </div>
            </div>
          )}

          {fieldType === "date" && (
            <div className="space-y-2">
              <Label htmlFor={`fields.${index}.dateFormat`}>Date Format</Label>
              <Input
                id={`fields.${index}.dateFormat`}
                {...register(`fields.${index}.dateFormat` as const)}
                placeholder="YYYY-MM-DD"
              />
              <p className="text-xs text-gray-500">
                Use dayjs format tokens (e.g., YYYY-MM-DD, DD/MM/YYYY, MM-DD-YYYY)
              </p>
            </div>
          )}
        </div>

        <Button type="button" variant="ghost" size="small" onClick={onRemove} disabled={!canRemove}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
