import { Copy, Check, MoreVertical } from "lucide-react";
import { Checkbox } from "./ui/Checkbox";
import { Button } from "./ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/DropdownMenu";
import { formatTime, cn } from "../lib/utils";
import type { ScannedCode } from "../types";

interface ScannedCodeItemProps {
  item: ScannedCode;
  isSelected: boolean;
  isDesktop: boolean;
  copiedId: string | null;
  onSelect: (id: string, checked: boolean) => void;
  onCopy: (code: string, id: string) => void;
}

export function ScannedCodeItem({
  item,
  isSelected,
  isDesktop,
  copiedId,
  onSelect,
  onCopy,
}: ScannedCodeItemProps) {
  return (
    <div className="group flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
      <Checkbox
        checked={isSelected}
        onCheckedChange={(checked) => onSelect(item.id, checked === true)}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <code className="font-mono text-sm">{item.code}</code>
          {item.count > 1 && (
            <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700">
              ×{item.count}
            </span>
          )}
        </div>
        {item.templateData && Object.keys(item.templateData).length > 0 && (
          <div className="mt-1 space-y-0.5">
            {Object.entries(item.templateData)
              .filter(([key]) => key !== "__barcode" && key !== "__fieldOrder")
              .map(([key, value]) => (
                <div key={key} className="text-xs text-gray-600">
                  <span className="font-medium">{key}:</span> <span>{String(value)}</span>
                </div>
              ))}
          </div>
        )}
        <p className="text-xs text-gray-500">{formatTime(item.timestamp)}</p>
      </div>
      {isDesktop ? (
        <Button
          variant="ghost"
          size="small"
          onClick={() => void onCopy(item.code, item.id)}
          className={cn("opacity-0 transition-opacity group-hover:opacity-100", {
            "opacity-100": copiedId === item.id,
          })}
        >
          {copiedId === item.id ? (
            <>
              <Check className="h-4 w-4" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy
            </>
          )}
        </Button>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded p-1 hover:bg-gray-200">
              <MoreVertical className="h-4 w-4 text-gray-500" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => void onCopy(item.code, item.id)}>
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
