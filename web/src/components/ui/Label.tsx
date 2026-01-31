import { clsx } from "clsx";

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
}

export function Label({ children, className, ...props }: LabelProps) {
  return (
    <label
      className={clsx("block select-none text-sm font-medium text-gray-700", className)}
      {...props}
    >
      {children}
    </label>
  );
}
