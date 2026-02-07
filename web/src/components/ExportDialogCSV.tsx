import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { newlineTypes } from "@/lib/csv";
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
import { FormError } from "./ui/FormError";
import { Label } from "./ui/Label";

const exportSchema = z.object({
  includeHeader: z.boolean(),
  headerFieldName: z.string().min(1, "Header field name is required"),
  separator: z.enum(["comma", "semicolon", "tab"]),
  newline: z.enum(newlineTypes),
});

type ExportFormData = z.infer<typeof exportSchema>;

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (options: ExportFormData, action: "download" | "copy") => void;
}

export function ExportDialogCSV({ open, onOpenChange, onExport }: ExportDialogProps) {
  const { exportPreferences, setExportPreferences } = useAppStore(
    useShallow((state) => ({
      exportPreferences: state.exportPreferences,
      setExportPreferences: state.setExportPreferences,
    })),
  );

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<ExportFormData>({
    resolver: zodResolver(exportSchema),
    defaultValues: exportPreferences,
  });

  const includeHeader = watch("includeHeader");

  const onSubmit = (action: "download" | "copy") => (data: ExportFormData) => {
    setExportPreferences(data);
    onExport(data, action);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export to CSV</DialogTitle>
          <DialogDescription>Configure CSV export options for selected barcodes.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center space-x-2">
            <Controller
              name="includeHeader"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="includeHeader"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="includeHeader" className="text-sm font-normal">
              Include header row
            </Label>
          </div>

          {includeHeader && (
            <div>
              <Label htmlFor="headerFieldName">Header field name</Label>
              <input
                id="headerFieldName"
                type="text"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                {...register("headerFieldName")}
              />
              <FormError message={errors.headerFieldName?.message} className="mt-1" />
            </div>
          )}

          <div>
            <Label>Separator</Label>
            <div className="mt-2 space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="comma"
                  value="comma"
                  className="h-4 w-4"
                  {...register("separator")}
                />
                <Label htmlFor="comma" className="font-normal">
                  Comma (,)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="semicolon"
                  value="semicolon"
                  className="h-4 w-4"
                  {...register("separator")}
                />
                <Label htmlFor="semicolon" className="font-normal">
                  Semicolon (;)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="tab"
                  value="tab"
                  className="h-4 w-4"
                  {...register("separator")}
                />
                <Label htmlFor="tab" className="font-normal">
                  Tab
                </Label>
              </div>
            </div>
          </div>

          <div>
            <Label>Line endings</Label>
            <div className="mt-2 space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="crlf"
                  value="crlf"
                  className="h-4 w-4"
                  {...register("newline")}
                />
                <Label htmlFor="crlf" className="font-normal">
                  Windows (CRLF)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="lf"
                  value="lf"
                  className="h-4 w-4"
                  {...register("newline")}
                />
                <Label htmlFor="lf" className="font-normal">
                  Unix (LF)
                </Label>
              </div>
            </div>
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
