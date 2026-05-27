type SurfaceCardProps = {
  children: React.ReactNode;
  className?: string;
};

export function SurfaceCard({ children, className = "" }: SurfaceCardProps) {
  return (
    <section
      className={`min-w-0 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm sm:p-6 ${className}`}
    >
      {children}
    </section>
  );
}
