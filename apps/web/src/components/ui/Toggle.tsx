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
  activeText = "เปิด",
  inactiveText = "ปิด",
  className = ""
}: ToggleProps) {
  return (
    <div className={"grid gap-2 text-sm font-semibold text-text " + className}>
      {needSpan && <span>{label}</span>}
      <button
        type="button"
        aria-pressed={checked}
        onClick={() => onChange(!checked)}
        className={
          "inline-flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sage/40 " +
          (checked
            ? "bg-sage text-white hover:bg-sage/90"
            : "bg-surfaceMuted text-text hover:bg-surface/90")
        }
      >
        <span>{checked ? `${activeText} ${label}` : `${inactiveText} ${label}`}</span>
        <span
          className={
            "h-2.5 w-2.5 rounded-full transition " +
            (checked ? "bg-white/90" : "bg-slate-400")
          }
        />
      </button>
    </div>
  );
}
