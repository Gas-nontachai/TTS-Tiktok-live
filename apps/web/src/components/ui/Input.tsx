type FormFieldProps = {
  label: string;
  children: React.ReactNode;
  className?: string;
};

function FormField({ label, children, className = "" }: FormFieldProps) {
  return (
    <label className={"grid gap-2 text-sm font-semibold text-slate-700 " + className}>
      <span>{label}</span>
      {children}
    </label>
  );
}

const inputClassName =
  "w-full rounded-2xl border border-surfaceMuted bg-surface px-4 py-3 text-sm text-text shadow-sm outline-none transition focus:border-sage focus:ring-2 focus:ring-sage/20";

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
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClassName}
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
      <textarea
        rows={6}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClassName + " min-h-[10rem] resize-y"}
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
      <input
        type="number"
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className={inputClassName}
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
  className = ""
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  className?: string;
}) {
  return (
    <FormField label={label} className={className}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-surfaceMuted accent-sage"
        />
        <input
          type="number"
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className={inputClassName + " w-full max-w-[6rem]"}
        />
      </div>
    </FormField>
  );
}
