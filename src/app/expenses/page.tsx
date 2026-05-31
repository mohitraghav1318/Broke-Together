import type { Metadata } from "next";
import { AppNavbar } from "@/components/navigation/app-navbar";
import { PersonalExpensesPage } from "@/features/personal-expenses/components/personal-expenses-page";

export const metadata: Metadata = {
  title: "Personal Expenses | Broke Together",
  description: "Track your personal expenses in one place.",
};

export default function ExpensesPage() {
  return (
    <>
      <AppNavbar />
      <main className="min-h-[calc(100vh-4rem)] bg-stone-50 px-4 py-10 text-zinc-950 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-6xl">
          <PersonalExpensesPage />
        </div>
      </main>
    </>
  );
}
