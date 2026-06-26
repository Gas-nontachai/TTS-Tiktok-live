import { useEffect, useState } from "react";
import { Check, Clipboard } from "lucide-react";
import { cn } from "../../lib/utils";

type CopyRowProps = {
  label: string;
  value: string;
};

export default function CopyRow({ label, value }: CopyRowProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (status === "idle") {
      return;
    }

    const timeout = window.setTimeout(() => setStatus("idle"), 1800);
    return () => window.clearTimeout(timeout);
  }, [status]);

  async function copyValue() {
    try {
      await navigator.clipboard.writeText(value);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
  }

  return (
    <>
      <label className="grid gap-2 text-sm font-semibold text-text">
        <span>{label}</span>
        <div className="relative">
          <input
            type="text"
            value={value}
            readOnly
            className="min-h-10 w-full rounded-md border border-surfaceMuted bg-white px-3 py-2 pr-12 text-sm text-text shadow-sm outline-none transition focus:border-sage focus:ring-2 focus:ring-sage/20"
          />
          <button
            type="button"
            aria-label={`Copy ${label}`}
            onClick={() => void copyValue()}
            className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 rounded-md border border-transparent bg-transparent p-0 text-textMuted shadow-none transition hover:border-surfaceMuted hover:bg-surface hover:text-text focus:outline-none focus:ring-2 focus:ring-sage/25"
          >
            {status === "copied" ? <Check size={16} /> : <Clipboard size={16} />}
          </button>
        </div>
      </label>
      {status !== "idle" ? (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            "fixed right-5 top-5 z-50 animate-toast-enter rounded-md border px-3 py-2 text-sm font-semibold shadow-lg",
            status === "copied"
              ? "border-[#4f624a] bg-[#52684d] text-white"
              : "border-danger bg-white text-danger"
          )}
        >
          {status === "copied" ? "Copied to clipboard" : "Copy failed"}
        </div>
      ) : null}
    </>
  );
}
