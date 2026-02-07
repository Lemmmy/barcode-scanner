import { ChevronDown, ChevronRight } from "lucide-react";
import { Checkbox } from "./ui/Checkbox";
import { ScannedCodeItem } from "./ScannedCodeItem";
import type { ScannedCode } from "../types";

interface DateGroupProps {
  date: string;
  codes: ScannedCode[];
  isCollapsed: boolean;
  isDesktop: boolean;
  copiedId: string | null;
  selectedIds: Set<string>;
  onToggleCollapse: (date: string) => void;
  onSelectDate: (date: string, codes: ScannedCode[], checked: boolean) => void;
  onSelectCode: (id: string, checked: boolean, event?: React.MouseEvent) => void;
  onCopy: (code: string, id: string) => void;
}

export function DateGroup({
  date,
  codes,
  isCollapsed,
  isDesktop,
  copiedId,
  selectedIds,
  onToggleCollapse,
  onSelectDate,
  onSelectCode,
  onCopy,
}: DateGroupProps) {
  const allSelected = codes.every((c) => selectedIds.has(c.id));
  const someSelected = codes.some((c) => selectedIds.has(c.id)) && !allSelected;

  return (
    <div className="border-b border-gray-200">
      <div className="flex items-center gap-2 bg-gray-50 px-4 py-2">
        <button onClick={() => onToggleCollapse(date)} className="rounded p-1 hover:bg-gray-200">
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </button>
        <Checkbox
          checked={allSelected}
          indeterminate={someSelected}
          onCheckedChange={(checked) => onSelectDate(date, codes, checked === true)}
        />
        <h3 className="flex-1 text-sm font-medium text-gray-700">
          {date} ({codes.length})
        </h3>
      </div>
      {!isCollapsed && (
        <div className="divide-y divide-gray-100">
          {codes.map((item) => (
            <ScannedCodeItem
              key={item.id}
              item={item}
              isSelected={selectedIds.has(item.id)}
              isDesktop={isDesktop}
              copiedId={copiedId}
              onSelect={onSelectCode}
              onCopy={onCopy}
            />
          ))}
        </div>
      )}
    </div>
  );
}
