import type { ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "default" | "icon" | "iconSm";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold leading-none transition duration-150 ease-out hover:-translate-y-px active:translate-y-0 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60",
  {
    variants: {
      variant: {
        primary: "border border-sage bg-sage text-white hover:bg-sage/90 focus:ring-sage",
        secondary: "border border-surfaceMuted bg-white text-text hover:bg-surface focus:ring-sage",
        danger: "border border-danger bg-danger text-white hover:bg-danger/90 focus:ring-danger",
        ghost: "border border-transparent bg-transparent text-textMuted shadow-none hover:border-surfaceMuted hover:bg-surface hover:text-text focus:ring-sage/25"
      },
      size: {
        default: "min-h-10 px-3 py-2",
        icon: "h-10 min-h-0 w-10 p-0",
        iconSm: "h-8 min-h-0 w-8 p-0"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "default"
    }
  }
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

export default function Button({
  variant = "primary",
  size = "default",
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled}
      className={cn(buttonVariants({ variant, size }), className)}
    />
  );
}
