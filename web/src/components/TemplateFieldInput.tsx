import dayjs from "dayjs";
import { memo } from "react";
import { Control, Controller, UseFormRegister } from "react-hook-form";
import type { TemplateField } from "../types";
import { Input } from "./ui/Input";
import { Textarea } from "./ui/Textarea";
import { Checkbox } from "./ui/Checkbox";
import { Select } from "./ui/Select";
import { Label } from "./ui/Label";
import { FormError } from "./ui/FormError";

interface TemplateFieldInputProps {
  field: TemplateField;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: UseFormRegister<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  error?: string;
}

function TemplateFieldInputComponent({ field, register, control, error }: TemplateFieldInputProps) {
  const registerOptions = {
    required: field.required ? `${field.name} is required` : false,
  };

  const renderInput = () => {
    switch (field.type) {
      case "text":
        return (
          <Input
            type="text"
            {...register(field.id, registerOptions)}
            placeholder={field.description}
          />
        );

      case "textarea":
        return (
          <Textarea {...register(field.id, registerOptions)} placeholder={field.description} />
        );

      case "number":
        return (
          <Input
            type="number"
            step="any"
            {...register(field.id, {
              ...registerOptions,
              valueAsNumber: true,
            })}
            placeholder={field.description}
          />
        );

      case "checkbox":
        return (
          <div className="flex items-center gap-2">
            <Controller
              name={field.id}
              control={control}
              defaultValue={false}
              render={({ field: controllerField }) => (
                <Checkbox
                  checked={controllerField.value}
                  onCheckedChange={controllerField.onChange}
                />
              )}
            />
            {field.description && (
              <span className="text-sm text-gray-600">{field.description}</span>
            )}
          </div>
        );

      case "dropdown":
        return (
          <Select {...register(field.id, registerOptions)}>
            <option value="">Select an option...</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        );

      case "date":
        return (
          <Controller
            name={field.id}
            control={control}
            defaultValue={dayjs().format(field.dateFormat || "YYYY-MM-DD")}
            rules={registerOptions}
            render={({ field: { onChange, value } }) => (
              <Input
                type="text"
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                placeholder={field.dateFormat || "YYYY-MM-DD"}
              />
            )}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      <Label>
        {field.name}
        {field.required && <span className="ml-1 text-red-500">*</span>}
      </Label>
      {renderInput()}
      {error && <FormError message={error} />}
    </div>
  );
}

// Memoize to prevent re-renders when other fields change
export const TemplateFieldInput = memo(TemplateFieldInputComponent, (prevProps, nextProps) => {
  // Only re-render if this field's error changed (register and control are stable)
  return (
    prevProps.error === nextProps.error &&
    prevProps.field.id === nextProps.field.id &&
    prevProps.control === nextProps.control
  );
});
