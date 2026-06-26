import * as React from "react";
import { cn } from "../../lib/utils";

type FormFieldProps = {
  label: string;
  children: React.ReactNode;
  className?: string;
};

function FormField({ label, children, className = "" }: FormFieldProps) {
  return (
    <label className={cn("grid min-w-0 content-start gap-2 text-sm font-semibold text-text", className)}>
      <span className="min-h-5 leading-5">{label}</span>
      {children}
    </label>
  );
}

const inputClassName =
  "h-10 w-full rounded-md border border-surfaceMuted bg-white px-3 py-2 text-sm text-text shadow-sm outline-none transition placeholder:text-textMuted focus:border-sage focus:ring-2 focus:ring-sage/20 disabled:cursor-not-allowed disabled:opacity-50";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(inputClassName, className)} {...props} />
  )
);
Input.displayName = "Input";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(inputClassName, "min-h-[8rem] resize-y", className)} {...props} />
  )
);
Textarea.displayName = "Textarea";

export function TextInput({
  label,
  value,
  onChange,
  type = "text",
  className = ""
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  className?: string;
}) {
  return (
    <FormField label={label} className={className}>
      <Input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </FormField>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  className = ""
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <FormField label={label} className={className}>
      <Textarea
        rows={6}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </FormField>
  );
}

export function NumberInput({
  label,
  value,
  onChange,
  step = 1,
  className = ""
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  className?: string;
}) {
  return (
    <FormField label={label} className={className}>
      <Input
        type="number"
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </FormField>
  );
}

export function SelectInput({
  label,
  value,
  options,
  onChange,
  className = ""
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <FormField label={label} className={className}>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClassName}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option || "System default"}
          </option>
        ))}
      </select>
    </FormField>
  );
}

export function RangeInput({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
  max = 100,
  className = "",
  showNumberInput = true,
  valueLabel
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  className?: string;
  showNumberInput?: boolean;
  valueLabel?: string;
}) {
  return (
    <FormField label={label} className={className}>
      <div className="grid min-h-10 grid-cols-1 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-surfaceMuted accent-sage"
        />
        {showNumberInput ? (
          <Input
            type="number"
            step={step}
            value={value}
            onChange={(event) => onChange(Number(event.target.value))}
            className="w-full min-w-[6rem] max-w-[6rem]"
          />
        ) : (
          <span className="inline-flex min-h-9 min-w-[4.25rem] items-center justify-center rounded-md border border-surfaceMuted bg-white px-2.5 text-sm font-bold text-text">
            {valueLabel ?? value}
          </span>
        )}
      </div>
    </FormField>
  );
}

export { Input, Textarea };
