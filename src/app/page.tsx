import { AppNavbar } from "@/components/navigation/app-navbar";
import { UserSessionPanel } from "@/features/auth/components/user-session-panel";

export default function Home() {
  return (
    <>
      <AppNavbar />
      <main className="min-h-[calc(100vh-4rem)] bg-stone-50 px-4 py-10 text-zinc-950 sm:px-6 lg:px-8">
        <section className="mx-auto grid min-h-[calc(100vh-9rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1fr_420px]">
          <div className="grid gap-5">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Shared money, less awkward
            </p>
            <h1 className="max-w-2xl text-4xl font-semibold leading-tight text-zinc-950 sm:text-6xl">
              Track group expenses before they become group drama.
            </h1>
            <p className="max-w-xl text-lg leading-8 text-zinc-600">
              Broke Together helps friends, roommates, and travel groups keep
              balances clear from the first split.
            </p>
          </div>

          <UserSessionPanel />
        </section>
      </main>
    </>
  );
}
