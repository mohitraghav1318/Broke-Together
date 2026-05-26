import { AppNavbar } from "@/components/navigation/app-navbar";
import { SurfaceCard } from "@/components/ui/surface-card";

type AuthPageLayoutProps = {
  children: React.ReactNode;
  heading: string;
  subheading: string;
};

export function AuthPageLayout({
  children,
  heading,
  subheading,
}: AuthPageLayoutProps) {
  return (
    <>
      <AppNavbar />
      <main className="min-h-[calc(100vh-4rem)] bg-stone-50 px-4 py-10 text-zinc-950 sm:px-6 lg:px-8">
        <div className="mx-auto grid min-h-[calc(100vh-9rem)] w-full max-w-5xl items-center gap-8 lg:grid-cols-[1fr_420px]">
          <section className="grid gap-5">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Broke Together
            </p>
            <h1 className="max-w-xl text-4xl font-semibold leading-tight text-zinc-950 sm:text-5xl">
              Split expenses without turning friendship into accounting.
            </h1>
            <p className="max-w-lg text-lg leading-8 text-zinc-600">
              Sign in to keep shared costs, balances, and paybacks in one clear
              place.
            </p>
          </section>

          <SurfaceCard className="w-full">
            <div className="mb-6 grid gap-2">
              <h2 className="text-2xl font-semibold text-zinc-950">
                {heading}
              </h2>
              <p className="text-sm leading-6 text-zinc-600">{subheading}</p>
            </div>
            {children}
          </SurfaceCard>
        </div>
      </main>
    </>
  );
}
