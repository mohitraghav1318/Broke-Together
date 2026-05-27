"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { AppButton } from "@/components/ui/app-button";
import { InlineAlert } from "@/components/ui/inline-alert";
import { LoadingPlaceholder } from "@/components/ui/loading-placeholder";
import { SurfaceCard } from "@/components/ui/surface-card";
import { TextInput } from "@/components/ui/text-input";
import { firebaseAuth } from "@/firebase/firebase-client";
import {
  createNotebook,
  getNotebookErrorMessage,
  subscribeUserNotebooks,
  type HisabaNotebook,
} from "@/features/notebooks/lib/hisaba-notebooks";

export function NotebooksDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [notebooks, setNotebooks] = useState<HisabaNotebook[]>([]);
  const [notebookName, setNotebookName] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    return onAuthStateChanged(firebaseAuth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setNotebooks([]);
      }
      setIsAuthLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    return subscribeUserNotebooks(
      user.uid,
      setNotebooks,
      (error) => setErrorMessage(getNotebookErrorMessage(error)),
    );
  }, [user]);

  async function handleCreateNotebook(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      const notebookId = await createNotebook(user, notebookName);

      setNotebookName("");
      router.push(`/notebooks/${notebookId}`);
    } catch (error) {
      setErrorMessage(getNotebookErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  if (isAuthLoading) {
    return <LoadingPlaceholder label="Loading notebooks" />;
  }

  if (!user) {
    return (
      <SurfaceCard className="grid max-w-xl gap-4">
        <h1 className="text-2xl font-semibold text-zinc-950">
          Sign in required
        </h1>
        <p className="text-sm leading-6 text-zinc-600">
          Sign in to create and open shared hisaba notebooks.
        </p>
        <Link
          className="inline-flex h-11 items-center justify-center rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
          href="/login"
        >
          Sign in
        </Link>
      </SurfaceCard>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <SurfaceCard className="self-start">
        <div className="mb-6 grid gap-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Hisaba notebooks
          </p>
          <h1 className="text-3xl font-semibold text-zinc-950">
            Create a notebook
          </h1>
          <p className="text-sm leading-6 text-zinc-600">
            One notebook keeps one group&apos;s payments and balances together.
          </p>
        </div>

        <form className="grid gap-4" onSubmit={handleCreateNotebook}>
          <TextInput
            id="notebook-name"
            label="Notebook name"
            onChange={(event) => setNotebookName(event.target.value)}
            placeholder="Goa trip, Flat 302, Weekend dinner"
            type="text"
            value={notebookName}
          />

          {errorMessage ? (
            <InlineAlert tone="error">{errorMessage}</InlineAlert>
          ) : null}

          <AppButton disabled={isSaving} type="submit">
            {isSaving ? "Creating..." : "Create notebook"}
          </AppButton>
        </form>
      </SurfaceCard>

      <section className="grid gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-950">
            Your notebooks
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Open a notebook to add friends, entries, and settlement reports.
          </p>
        </div>

        {notebooks.length ? (
          <div className="grid gap-3">
            {notebooks.map((notebook) => (
              <Link
                className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition-colors hover:border-emerald-200 hover:bg-emerald-50/40"
                href={`/notebooks/${notebook.id}`}
                key={notebook.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-950">
                      {notebook.name}
                    </h3>
                    <p className="mt-1 text-sm text-zinc-600">
                      {notebook.friends.length}{" "}
                      {notebook.friends.length === 1 ? "friend" : "friends"}
                    </p>
                  </div>
                  <span className="rounded-md bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
                    Open
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <SurfaceCard className="grid gap-2">
            <h3 className="text-lg font-semibold text-zinc-950">
              No notebooks yet
            </h3>
            <p className="text-sm leading-6 text-zinc-600">
              Create your first shared notebook to start tracking payments.
            </p>
          </SurfaceCard>
        )}
      </section>
    </div>
  );
}
