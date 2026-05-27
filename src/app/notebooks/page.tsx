import type { Metadata } from "next";
import { AppNavbar } from "@/components/navigation/app-navbar";
import { NotebooksDashboard } from "@/features/notebooks/components/notebooks-dashboard";

export const metadata: Metadata = {
  title: "Notebooks | Broke Together",
  description: "Create and manage shared hisaba notebooks.",
};

export default function NotebooksPage() {
  return (
    <>
      <AppNavbar />
      <main className="min-h-[calc(100vh-4rem)] bg-stone-50 px-4 py-10 text-zinc-950 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-6xl">
          <NotebooksDashboard />
        </div>
      </main>
    </>
  );
}
