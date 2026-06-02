type SummaryMetricCardProps = {
  label: string;
  value: string;
  detail?: string;
  tone?: "neutral" | "emerald";
};

const toneStyles = {
  neutral: "border-zinc-200 bg-zinc-50",
  emerald: "border-emerald-200 bg-emerald-50",
};

export function SummaryMetricCard({
  label,
  value,
  detail,
  tone = "neutral",
}: SummaryMetricCardProps) {
  return (
    <div className={`rounded-lg border p-4 ${toneStyles[tone]}`}>
      <p className="text-sm font-medium text-zinc-600">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-zinc-950">{value}</p>
      {detail ? <p className="mt-2 text-sm text-zinc-500">{detail}</p> : null}
    </div>
  );
}
