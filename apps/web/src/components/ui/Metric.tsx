type MetricProps = {
  label: string;
  value: string | number;
  className?: string;
};

export default function Metric({ label, value, className = "" }: MetricProps) {
  return (
    <div className={"rounded-3xl bg-surface p-5 shadow-sm ring-1 ring-surfaceMuted " + className}>
      <p className="text-sm font-semibold text-textMuted">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-text">{value}</p>
    </div>
  );
}
