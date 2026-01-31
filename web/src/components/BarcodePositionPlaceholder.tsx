import { Barcode, GripVertical } from "lucide-react";
import { Label } from "./ui/Label";

interface BarcodePositionPlaceholderProps {
  onMouseDown: (e: React.MouseEvent) => void;
}

export function BarcodePositionPlaceholder({ onMouseDown }: BarcodePositionPlaceholderProps) {
  return (
    <div className="rounded-lg border-2 border-dashed border-blue-400 bg-blue-50 p-4">
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing mt-2"
          onMouseDown={onMouseDown}
        >
          <GripVertical className="h-5 w-5 text-blue-600" />
        </button>
        <div className="flex flex-1 items-center gap-3">
          <Barcode className="h-6 w-6 text-blue-600" />
          <div>
            <Label className="text-blue-900">Barcode (Auto-filled)</Label>
            <p className="text-xs text-blue-700">
              The scanned barcode will be inserted here in exports and auto-type
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
