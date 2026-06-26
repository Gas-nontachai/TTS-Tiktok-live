import type { ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

type ButtonVariant = "primary" | "secondary" | "danger";

const buttonVariants = cva(
  "inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold leading-none transition duration-150 ease-out hover:-translate-y-px active:translate-y-0 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60",
  {
    variants: {
      variant: {
        primary: "border border-sage bg-sage text-white hover:bg-sage/90 focus:ring-sage",
        secondary: "border border-surfaceMuted bg-white text-text hover:bg-surface focus:ring-sage",
        danger: "border border-danger bg-danger text-white hover:bg-danger/90 focus:ring-danger"
      }
    },
    defaultVariants: {
      variant: "primary"
    }
  }
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
  variant?: ButtonVariant;
  className?: string;
};

export default function Button({
  variant = "primary",
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled}
      className={cn(buttonVariants({ variant }), className)}
    />
  );
}

export { buttonVariants };
