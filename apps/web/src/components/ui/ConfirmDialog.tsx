import type { ReactNode } from "react";
import { useEffect } from "react";
import Button from "./Button";
import ModalPortal from "./ModalPortal";

type ConfirmDialogProps = {
  open: boolean;
  title?: ReactNode;
  description?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title = "Confirm",
  description,
  confirmText = "OK",
  cancelText = "Cancel",
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === "Escape") onCancel();
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[2147483647] flex items-center justify-center p-4">
        <div className="absolute inset-0 animate-dialog-overlay bg-black/50 backdrop-blur-[2px]" onClick={onCancel} />
        <div className="relative w-full max-w-md animate-dialog-enter rounded-lg bg-surface p-5 shadow-xl ring-1 ring-surfaceMuted">
          <h3 className="text-lg font-semibold">{title}</h3>
          {description ? <p className="mt-2 text-sm text-textMuted">{description}</p> : null}
          <div className="mt-6 flex flex-wrap items-center justify-end gap-2.5">
            <Button variant="secondary" onClick={onCancel}>{cancelText}</Button>
            <Button variant="danger" onClick={() => void onConfirm()}>{confirmText}</Button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
