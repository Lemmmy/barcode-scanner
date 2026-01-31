import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/Button";
import { ConfirmDialog } from "./ConfirmDialog";

interface ClearHistoryButtonProps {
  onClear: () => Promise<void>;
  disabled?: boolean;
}

export function ClearHistoryButton({ onClear, disabled }: ClearHistoryButtonProps) {
  const [showDialog, setShowDialog] = useState(false);

  const handleConfirm = async () => {
    await onClear();
    setShowDialog(false);
  };

  return (
    <>
      <Button
        variant="secondary"
        size="small"
        onClick={() => setShowDialog(true)}
        disabled={disabled}
      >
        <Trash2 className="h-4 w-4" />
        Clear
      </Button>
      <ConfirmDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        title="Clear History"
        description="Are you sure you want to clear all scanned codes? This action cannot be undone."
        confirmLabel="Clear All"
        onConfirm={() => void handleConfirm()}
      />
    </>
  );
}
