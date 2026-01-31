import * as React from "react";
import { clsx } from "clsx";

const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        className={clsx(
          "w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-base font-medium transition-colors",
          "focus:outline-none focus:border-blue-500",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    );
  },
);
Select.displayName = "Select";

export { Select };
