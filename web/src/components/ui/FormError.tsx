import { AlertCircle } from "lucide-react";
import { clsx } from "clsx";

interface FormErrorProps {
  message?: string;
  className?: string;
}

export function FormError({ message, className }: FormErrorProps) {
  if (!message) return null;

  return (
    <div className={clsx("flex items-center gap-2 text-sm text-red-600", className)}>
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}
