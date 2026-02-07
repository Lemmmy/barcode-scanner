import { Trash2, X } from "lucide-react";
import { ConfirmDialog } from "./ConfirmDialog";
import { useState, useMemo, useEffect } from "react";
import { useAppStore } from "../store/useAppStore";
import { useShallow } from "zustand/react/shallow";
import { Checkbox } from "./ui/Checkbox";
import { Button } from "./ui/Button";
import { ClearHistoryButton } from "./ClearHistoryButton";
import { ExportButton } from "./ExportButton";
import { DateGroup } from "./DateGroup";
import { PaginationControls } from "./PaginationControls";
import { groupByDate } from "../lib/dateUtils";
import { cn } from "../lib/utils";
import { useMediaQuery } from "../hooks/useMediaQuery";
import {
  generateCSV,
  downloadCSV,
  copyToClipboard as copyTextToClipboard,
  type CSVExportOptions,
} from "../lib/csv";
import type { ScannedCode } from "../types";

interface ScannedCodesLogProps {
  isOpen: boolean;
  onClose: () => void;
  fullscreen?: boolean;
}

const ITEMS_PER_PAGE = 50;

export default function ScannedCodesLog({ isOpen, onClose, fullscreen }: ScannedCodesLogProps) {
  const { scannedCodes, clearScannedCodes, deleteScannedCodes } = useAppStore(
    useShallow((state) => ({
      scannedCodes: state.scannedCodes,
      clearScannedCodes: state.clearScannedCodes,
      deleteScannedCodes: state.deleteScannedCodes,
    })),
  );

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(0);
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 512px)");

  const groupedCodes = useMemo(() => {
    const groups = groupByDate(scannedCodes);
    return Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [scannedCodes]);

  // Reset page when scanned codes change significantly
  useEffect(() => {
    const totalPages = Math.ceil(scannedCodes.length / ITEMS_PER_PAGE);
    if (currentPage >= totalPages && totalPages > 0) {
      setCurrentPage(totalPages - 1);
    }
  }, [scannedCodes.length, currentPage]);

  const totalPages = Math.ceil(scannedCodes.length / ITEMS_PER_PAGE);
  const startIndex = currentPage * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;

  const paginatedGroups = useMemo(() => {
    let count = 0;
    const result: [string, ScannedCode[]][] = [];

    for (const [date, codes] of groupedCodes) {
      const remaining = endIndex - count;
      if (count >= endIndex) break;
      if (count + codes.length <= startIndex) {
        count += codes.length;
        continue;
      }

      const start = Math.max(0, startIndex - count);
      const end = Math.min(codes.length, start + remaining);
      const slicedCodes = codes.slice(start, end);

      if (slicedCodes.length > 0) {
        result.push([date, slicedCodes]);
      }
      count += codes.length;
    }

    return result;
  }, [groupedCodes, startIndex, endIndex]);

  const handleCopy = async (code: string, id: string) => {
    try {
      await copyTextToClipboard(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(scannedCodes.map((c) => c.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectDate = (_date: string, codes: ScannedCode[], checked: boolean) => {
    const newSelected = new Set(selectedIds);
    codes.forEach((code) => {
      if (checked) {
        newSelected.add(code.id);
      } else {
        newSelected.delete(code.id);
      }
    });
    setSelectedIds(newSelected);
  };

  const handleSelectCode = (id: string, checked: boolean, event?: React.MouseEvent) => {
    const newSelected = new Set(selectedIds);

    // Shift+click: range selection
    if (event?.shiftKey && lastSelectedId) {
      const allIds = scannedCodes.map((c) => c.id);
      const lastIndex = allIds.indexOf(lastSelectedId);
      const currentIndex = allIds.indexOf(id);

      if (lastIndex !== -1 && currentIndex !== -1) {
        const start = Math.min(lastIndex, currentIndex);
        const end = Math.max(lastIndex, currentIndex);

        for (let i = start; i <= end; i++) {
          if (checked) {
            newSelected.add(allIds[i]);
          } else {
            newSelected.delete(allIds[i]);
          }
        }
      }
    }
    // Ctrl+click or Cmd+click: toggle without affecting others
    else if (event?.ctrlKey || event?.metaKey) {
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
    }
    // Normal click: single selection
    else {
      if (checked) {
        newSelected.add(id);
      } else {
        newSelected.delete(id);
      }
    }

    setSelectedIds(newSelected);
    setLastSelectedId(id);
  };

  const toggleDateCollapse = (date: string) => {
    const newCollapsed = new Set(collapsedDates);
    if (newCollapsed.has(date)) {
      newCollapsed.delete(date);
    } else {
      newCollapsed.add(date);
    }
    setCollapsedDates(newCollapsed);
  };

  const handleExport = (options: CSVExportOptions, action: "download" | "copy") => {
    // If nothing selected, export all codes
    const codesToExport =
      selectedIds.size > 0 ? scannedCodes.filter((c) => selectedIds.has(c.id)) : scannedCodes;
    const csv = generateCSV(codesToExport, options);

    if (action === "download") {
      const timestamp = new Date().toISOString().split("T")[0];
      downloadCSV(csv, `barcodes-${timestamp}.csv`);
    } else {
      void copyTextToClipboard(csv);
    }
  };

  const handleClearHistory = async () => {
    await clearScannedCodes();
    setSelectedIds(new Set());
    setCurrentPage(0);
    setCollapsedDates(new Set());
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    await deleteScannedCodes(Array.from(selectedIds));
    setSelectedIds(new Set());
    setShowDeleteDialog(false);
  };

  const allSelected = scannedCodes.length > 0 && selectedIds.size === scannedCodes.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < scannedCodes.length;

  if (!isOpen && !fullscreen) return null;

  const content = (
    <>
      <div className="flex items-center justify-between border-b border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={allSelected}
            indeterminate={someSelected}
            onCheckedChange={(checked) => handleSelectAll(checked === true)}
            aria-label="Select all"
          />
          <h2 className="text-xl font-semibold text-gray-900">Scanned Codes</h2>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <Button variant="danger" size="small" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="h-4 w-4" />
              Delete {selectedIds.size}
            </Button>
          )}
          <ExportButton
            onExport={handleExport}
            disabled={scannedCodes.length === 0}
            selectedCount={selectedIds.size}
          />
          <ClearHistoryButton onClear={handleClearHistory} disabled={scannedCodes.length === 0} />
          {!fullscreen && (
            <Button variant="ghost" size="small" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {scannedCodes.length === 0 ? (
          <div className="flex h-full items-center justify-center p-8 text-center">
            <div>
              <p className="text-lg font-medium text-gray-900">No codes scanned yet</p>
              <p className="mt-1 text-sm text-gray-500">Scanned barcodes will appear here</p>
            </div>
          </div>
        ) : (
          <div>
            {paginatedGroups.map(([date, codes]) => (
              <DateGroup
                key={date}
                date={date}
                codes={codes}
                isCollapsed={collapsedDates.has(date)}
                isDesktop={isDesktop}
                copiedId={copiedId}
                selectedIds={selectedIds}
                onToggleCollapse={toggleDateCollapse}
                onSelectDate={handleSelectDate}
                onSelectCode={handleSelectCode}
                onCopy={(code, id) => void handleCopy(code, id)}
              />
            ))}
          </div>
        )}
      </div>

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        startIndex={startIndex}
        endIndex={endIndex}
        totalItems={scannedCodes.length}
        onPageChange={setCurrentPage}
      />
    </>
  );

  if (fullscreen) {
    return (
      <div className="flex h-full flex-col bg-white">
        {content}
        <ConfirmDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          title="Delete Selected Codes"
          description={`Are you sure you want to delete ${selectedIds.size} selected code${selectedIds.size === 1 ? "" : "s"}? This action cannot be undone.`}
          confirmLabel={`Delete ${selectedIds.size}`}
          onConfirm={() => void handleDeleteSelected()}
        />
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity",
          isOpen ? "opacity-100" : "!pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />

      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 flex max-h-[80vh] flex-col bg-white transition-transform",
          "rounded-t-2xl shadow-2xl",
          isOpen ? "translate-y-0" : "translate-y-full",
        )}
      >
        {content}
        <ConfirmDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          title="Delete Selected Codes"
          description={`Are you sure you want to delete ${selectedIds.size} selected code${selectedIds.size === 1 ? "" : "s"}? This action cannot be undone.`}
          confirmLabel={`Delete ${selectedIds.size}`}
          onConfirm={() => void handleDeleteSelected()}
        />
      </div>
    </>
  );
}
