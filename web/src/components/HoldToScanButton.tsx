import { memo, useCallback } from "react";
import { cn } from "@/lib/utils";

interface HoldToScanButtonProps {
  isScanningLockedByNotHeldRef: React.RefObject<boolean>;
}

export const HoldToScanButton = memo(function HoldToScanButton({
  isScanningLockedByNotHeldRef,
}: HoldToScanButtonProps) {
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (isScanningLockedByNotHeldRef.current !== undefined) {
        isScanningLockedByNotHeldRef.current = false;
      }
    },
    [isScanningLockedByNotHeldRef],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (isScanningLockedByNotHeldRef.current !== undefined) {
        isScanningLockedByNotHeldRef.current = true;
      }
    },
    [isScanningLockedByNotHeldRef],
  );

  const handlePointerLeave = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (isScanningLockedByNotHeldRef.current !== undefined) {
        isScanningLockedByNotHeldRef.current = true;
      }
    },
    [isScanningLockedByNotHeldRef],
  );

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return (
    <button
      type="button"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={handlePointerUp}
      onContextMenu={handleContextMenu}
      className={cn(
        "absolute bottom-0 left-0 right-0 h-[30%]",
        "bg-white/5 backdrop-blur-[1px]",
        "active:bg-white/10",
        "transition-colors duration-150",
        "touch-none select-none",
        "flex items-center justify-center",
        "text-white/60 text-lg font-semibold",
      )}
      style={{
        WebkitTouchCallout: "none",
        WebkitUserSelect: "none",
        userSelect: "none",
      }}
      aria-label="Hold to scan"
    >
      <span className="pointer-events-none">Hold to Scan</span>
    </button>
  );
});
