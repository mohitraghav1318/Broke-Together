type SurfaceCardProps = {
  children: React.ReactNode;
  className?: string;
};

export function SurfaceCard({ children, className = "" }: SurfaceCardProps) {
  return (
    <section
      className={`rounded-lg border border-zinc-200 bg-white p-6 shadow-sm ${className}`}
    >
      {children}
    </section>
  );
}
