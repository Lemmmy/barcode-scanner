import { clsx } from "clsx";
import { cva, type VariantProps } from "class-variance-authority";

const inputVariants = cva(
  "w-full rounded-lg border-2 px-4 py-3 font-medium transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default: "border-gray-300 focus:border-blue-500",
        code: "border-gray-300 text-center font-mono text-2xl font-bold focus:border-blue-500",
      },
      size: {
        default: "text-base",
        large: "text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

interface InputProps
  extends
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {}

export function Input({ className, variant, size, ...props }: InputProps) {
  return <input className={clsx(inputVariants({ variant, size }), className)} {...props} />;
}
