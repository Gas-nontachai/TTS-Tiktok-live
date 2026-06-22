import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  className?: string;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-sage text-white hover:bg-sage/90 focus:ring-sage",
  secondary:
    "bg-sage-soft text-[#2F352E] hover:bg-sage-soft/90 focus:ring-sage",
  danger:
    "bg-danger text-white hover:bg-danger/90 focus:ring-danger"
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
      className={
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-60 " +
        variantClasses[variant] +
        (className ? ` ${className}` : "")
      }
    />
  );
}
