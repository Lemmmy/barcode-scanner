import { clsx } from "clsx";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  [
    "rounded-lg font-semibold transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed",
    "whitespace-nowrap inline-flex items-center justify-center",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        primary: "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800",
        secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300",
        ghost: "text-gray-700 hover:bg-gray-100 active:bg-gray-200",
      },
      size: {
        default: "h-10 gap-2 px-4 text-base [&_svg]:size-4 [&_svg]:-ml-0.5",
        large: "h-12 gap-2 px-4 text-lg [&_svg]:size-5 [&_svg]:-ml-0.5",
        small: "h-8 gap-1.5 px-3 text-sm [&_svg]:size-4 [&_svg]:-ml-0.5",
        icon: "size-10 [&_svg]:size-5 [&_svg]:-ml-0.5",
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
