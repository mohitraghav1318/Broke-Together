import type { Metadata } from "next";
import { AppNavbar } from "@/components/navigation/app-navbar";
import { NotebookWorkspace } from "@/features/notebooks/components/notebook-workspace";

export const metadata: Metadata = {
  title: "Notebook | Broke Together",
  description: "Track shared payments and generate settlement reports.",
};

type NotebookPageProps = {
  params: Promise<{
    notebookId: string;
  }>;
};

export default async function NotebookPage({ params }: NotebookPageProps) {
  const { notebookId } = await params;

  return (
    <>
      <AppNavbar />
      <main className="min-h-[calc(100vh-4rem)] bg-stone-50 px-4 py-10 text-zinc-950 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-6xl">
          <NotebookWorkspace notebookId={notebookId} />
        </div>
      </main>
    </>
  );
}
