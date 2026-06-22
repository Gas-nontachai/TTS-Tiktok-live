import Button from "./Button";

type CopyRowProps = {
  label: string;
  value: string;
};

export default function CopyRow({ label, value }: CopyRowProps) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[#2F352E]">
      <span>{label}</span>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={value}
          readOnly
          className="min-w-0 flex-1 rounded-2xl border border-surfaceMuted bg-surface px-4 py-3 text-sm text-[#2F352E] shadow-sm outline-none transition focus:border-sage focus:ring-2 focus:ring-sage/20"
        />
        <Button
          type="button"
          variant="secondary"
          className="shrink-0"
          onClick={() => navigator.clipboard.writeText(value)}
        >
          Copy
        </Button>
      </div>
    </label>
  );
}
