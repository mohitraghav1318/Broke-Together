import type { Metadata } from "next";
import { AppNavbar } from "@/components/navigation/app-navbar";
import { HelpPageContent } from "@/features/help/components/help-page-content";

export const metadata: Metadata = {
  title: "Help | Broke Together",
  description: "Guides for managing your Broke Together account.",
};

export default function HelpPage() {
  return (
    <>
      <AppNavbar />
      <main className="min-h-[calc(100vh-4rem)] bg-stone-50 px-4 py-10 text-zinc-950 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-6xl gap-8">
          <section className="grid gap-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Help center
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-zinc-950 sm:text-5xl">
              Simple guides for managing your account.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-zinc-600">
              Start here for account changes, deletion guidance, and sign-in
              help. More topics can be added as Broke Together grows.
            </p>
          </section>

          <HelpPageContent />
        </div>
      </main>
    </>
  );
}
