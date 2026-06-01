import type { Metadata } from "next";
import { AppNavbar } from "@/components/navigation/app-navbar";
import { NotebookTransactions } from "@/features/notebooks/components/notebook-transactions";

export const metadata: Metadata = {
  title: "Transactions | Broke Together",
  description: "Review and manage notebook transactions.",
};

type NotebookTransactionsPageProps = {
  params: Promise<{
    notebookId: string;
  }>;
};

export default async function NotebookTransactionsPage({
  params,
}: NotebookTransactionsPageProps) {
  const { notebookId } = await params;

  return (
    <>
      <AppNavbar />
      <main className="min-h-[calc(100vh-4rem)] bg-stone-50 px-4 py-10 text-zinc-950 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-6xl">
          <NotebookTransactions notebookId={notebookId} />
        </div>
      </main>
    </>
  );
}
