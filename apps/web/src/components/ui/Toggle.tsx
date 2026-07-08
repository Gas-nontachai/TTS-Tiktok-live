import { cn } from "../../lib/utils";

type ToggleProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  needSpan?: boolean;
  activeText?: string;
  inactiveText?: string;
  className?: string;
};

export default function Toggle({
  label,
  checked,
  onChange,
  needSpan = false,
  activeText = "ACTIVE",
  inactiveText = "INACTIVE",
  className = ""
}: ToggleProps) {
  return (
    <div className={cn("grid gap-2 text-sm font-semibold text-text", className)}>
      {needSpan && <span>{label}</span>}
      <button
        type="button"
        aria-pressed={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "group flex min-h-10 w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-sage/30",
          checked
            ? "border-[#4f624a] bg-[#52684d] text-white shadow-[inset_0_1px_6px_rgba(0,0,0,0.2)] hover:bg-[#4a6046]"
            : "border-[#c9c3b6] bg-white text-text hover:border-[#8c8c8c] hover:bg-surface"
        )}
      >
        <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">{label}</span>
        <span
          className={cn(
            "shrink-0 rounded-sm border px-1.5 py-0.5 text-[0.65rem] font-bold tracking-wide",
            checked
              ? "border-white/35 bg-white/18 text-white"
              : "border-surfaceMuted bg-surface text-textMuted"
          )}
        >
          {checked ? activeText : inactiveText}
        </span>
      </button>
    </div>
  );
}
