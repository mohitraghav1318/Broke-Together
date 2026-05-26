type LoadingPlaceholderProps = {
  label: string;
};

export function LoadingPlaceholder({ label }: LoadingPlaceholderProps) {
  return (
    <div className="rounded-md border border-zinc-200 bg-white p-4">
      <div className="mb-3 h-4 w-28 animate-pulse rounded bg-zinc-200" />
      <div className="h-3 w-full animate-pulse rounded bg-zinc-100" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
