type InlineAlertProps = {
  children: React.ReactNode;
  tone?: "error" | "success" | "info";
};

const alertStyles = {
  error: "border-red-200 bg-red-50 text-red-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  info: "border-zinc-200 bg-zinc-50 text-zinc-700",
};

export function InlineAlert({ children, tone = "info" }: InlineAlertProps) {
  return (
    <p className={`rounded-md border px-3 py-2 text-sm ${alertStyles[tone]}`}>
      {children}
    </p>
  );
}
