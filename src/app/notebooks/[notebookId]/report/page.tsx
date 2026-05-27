import type { Metadata } from "next";
import { AppNavbar } from "@/components/navigation/app-navbar";
import { NotebookReport } from "@/features/notebooks/components/notebook-report";

export const metadata: Metadata = {
  title: "Report | Broke Together",
  description: "Review spending and settlement details for a shared notebook.",
};

type NotebookReportPageProps = {
  params: Promise<{
    notebookId: string;
  }>;
};

export default async function NotebookReportPage({
  params,
}: NotebookReportPageProps) {
  const { notebookId } = await params;

  return (
    <>
      <AppNavbar />
      <main className="min-h-[calc(100vh-4rem)] bg-stone-50 px-4 py-10 text-zinc-950 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-6xl">
          <NotebookReport notebookId={notebookId} />
        </div>
      </main>
    </>
  );
}
