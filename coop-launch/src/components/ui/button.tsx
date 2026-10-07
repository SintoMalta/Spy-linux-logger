import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 min-h-11 min-w-11 px-4 active:scale-[0.97] active:brightness-95 cursor-pointer select-none",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--brand)] text-white hover:bg-[var(--brand-dark)] shadow-sm hover:shadow",
        secondary:
          "bg-[var(--surface-2)] text-[var(--ink)] hover:bg-[var(--surface-3)] shadow-sm",
        outline:
          "border border-[var(--border)] bg-white hover:bg-[var(--surface-2)] shadow-sm",
        ghost: "hover:bg-[var(--surface-2)]",
        danger: "bg-red-700 text-white hover:bg-red-800 shadow-sm",
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-12 rounded-md px-6 text-base",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
