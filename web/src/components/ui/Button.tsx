import { clsx } from "clsx";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "rounded-lg font-semibold transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary: "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800",
        secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300",
        ghost: "text-gray-700 hover:bg-gray-100 active:bg-gray-200",
      },
      size: {
        default: "px-6 py-3 text-base",
        large: "px-6 py-4 text-lg",
        small: "px-4 py-2 text-sm",
        icon: "p-2",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
      fullWidth: false,
    },
  },
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  children: React.ReactNode;
}

export function Button({ className, variant, size, fullWidth, children, ...props }: ButtonProps) {
  return (
    <button className={clsx(buttonVariants({ variant, size, fullWidth }), className)} {...props}>
      {children}
    </button>
  );
}
