"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AppButton } from "@/components/ui/app-button";
import { InlineAlert } from "@/components/ui/inline-alert";
import { LoadingPlaceholder } from "@/components/ui/loading-placeholder";
import { SurfaceCard } from "@/components/ui/surface-card";
import { firebaseAuth } from "@/firebase/firebase-client";
import { enforceAuthSession } from "@/features/auth/lib/auth-session";
import { NotebookEntryDialog } from "@/features/notebooks/components/notebook-entry-dialog";
import type { NotebookEntryDraft } from "@/features/notebooks/components/notebook-entry-form";
import { NotebookSummaryCard } from "@/features/notebooks/components/notebook-summary-card";
import {
  formatMoney,
  getNotebookCategories,
  getNotebookErrorMessage,
  restoreNotebookEntry,
  softDeleteNotebookEntry,
  subscribeNotebook,
  subscribeNotebookEntries,
  updateNotebookEntry,
  type HisabaNotebook,
  type NotebookEntry,
} from "@/features/notebooks/lib/hisaba-notebooks";

type NotebookTransactionsProps = {
  notebookId: string;
};

function formatEntryTimestamp(entry: NotebookEntry) {
  if (!entry.createdAt) {
    return "No date";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(entry.createdAt.toDate());
}

export function NotebookTransactions({ notebookId }: NotebookTransactionsProps) {
  const [user, setUser] = useState<User | null>(null);
  const [notebook, setNotebook] = useState<HisabaNotebook | null>(null);
  const [entries, setEntries] = useState<NotebookEntry[]>([]);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isNotebookLoading, setIsNotebookLoading] = useState(true);
  const [isSavingEntry, setIsSavingEntry] = useState(false);
  const [isDeletingEntryId, setIsDeletingEntryId] = useState<string | null>(null);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingEntryDraft, setEditingEntryDraft] =
    useState<NotebookEntryDraft | null>(null);
  const [recentlyDeletedEntry, setRecentlyDeletedEntry] =
    useState<NotebookEntry | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    return onAuthStateChanged(firebaseAuth, async (currentUser) => {
      setUser(await enforceAuthSession(currentUser));
      setIsAuthLoading(false);
    });
  }, []);

  useEffect(() => {
    return subscribeNotebook(
      notebookId,
      (nextNotebook) => {
        setNotebook(nextNotebook);
        setIsNotebookLoading(false);
      },
      (error) => {
        setErrorMessage(getNotebookErrorMessage(error));
        setIsNotebookLoading(false);
      },
    );
  }, [notebookId]);

  useEffect(() => {
    if (!user || !notebook?.memberIds.includes(user.uid)) {
      return;
    }

    return subscribeNotebookEntries(notebookId, setEntries, (error) =>
      setErrorMessage(getNotebookErrorMessage(error)),
    );
  }, [notebook?.memberIds, notebookId, user]);

  const isMember = Boolean(user && notebook?.memberIds.includes(user.uid));
  const notebookCategories = notebook ? getNotebookCategories(notebook) : [];
  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(entries.length / itemsPerPage));
  const paginatedEntries = entries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  function getFriendName(friendId: string | null) {
    if (!friendId) {
      return "Unknown";
    }

    return (
      notebook?.friends.find((friend) => friend.id === friendId)?.name ||
      "Unknown"
    );
  }

  function handleEditEntry(entry: NotebookEntry) {
    setEditingEntryId(entry.id);
    setEditingEntryDraft({
      entryType: entry.entryType,
      amount: String(entry.amount),
      paidByFriendId: entry.paidByFriendId,
      loanFriendId: entry.loanFriendId || "",
      category: entry.category,
      description: entry.description,
    });
    setErrorMessage("");
    setSuccessMessage("");
  }

  function handleCancelEditEntry() {
    setEditingEntryId(null);
    setEditingEntryDraft(null);
  }

  async function handleSubmitEntry(draft: NotebookEntryDraft) {
    if (!user || !editingEntryId) {
      return false;
    }

    setIsSavingEntry(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await updateNotebookEntry(notebookId, user, editingEntryId, {
        amount: Number(draft.amount),
        paidByFriendId: draft.paidByFriendId,
        category: draft.category,
        entryType: draft.entryType,
        loanFriendId: draft.loanFriendId || null,
        description: draft.description,
      });
      setSuccessMessage("Transaction updated.");
      handleCancelEditEntry();
      return true;
    } catch (error) {
      setErrorMessage(getNotebookErrorMessage(error));
      return false;
    } finally {
      setIsSavingEntry(false);
    }
  }

  async function handleDeleteEntry(entry: NotebookEntry) {
    if (!user) {
      return;
    }

    setIsDeletingEntryId(entry.id);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await softDeleteNotebookEntry(notebookId, user, entry.id);
      setRecentlyDeletedEntry(entry);

      if (editingEntryId === entry.id) {
        handleCancelEditEntry();
      }
    } catch (error) {
      setErrorMessage(getNotebookErrorMessage(error));
    } finally {
      setIsDeletingEntryId(null);
    }
  }

  async function handleUndoDelete() {
    if (!user || !recentlyDeletedEntry) {
      return;
    }

    setIsSavingEntry(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await restoreNotebookEntry(notebookId, user, recentlyDeletedEntry.id);
      setRecentlyDeletedEntry(null);
      setSuccessMessage("Transaction restored.");
    } catch (error) {
      setErrorMessage(getNotebookErrorMessage(error));
    } finally {
      setIsSavingEntry(false);
    }
  }

  if (isAuthLoading || isNotebookLoading) {
    return <LoadingPlaceholder label="Loading transactions" />;
  }

  if (!user) {
    return (
      <SurfaceCard className="grid max-w-xl gap-4">
        <h1 className="text-2xl font-semibold text-zinc-950">
          Sign in required
        </h1>
        <p className="text-sm leading-6 text-zinc-600">
          Sign in before opening notebook transactions.
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

  if (!notebook) {
    return (
      <SurfaceCard className="grid max-w-xl gap-4">
        <h1 className="text-2xl font-semibold text-zinc-950">
          Notebook not found
        </h1>
        <p className="text-sm leading-6 text-zinc-600">
          This notebook link is no longer available.
        </p>
        <Link
          className="inline-flex h-11 items-center justify-center rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
          href="/notebooks"
        >
          Back to notebooks
        </Link>
      </SurfaceCard>
    );
  }

  if (!isMember) {
    return (
      <SurfaceCard className="grid max-w-xl gap-4">
        <h1 className="text-2xl font-semibold text-zinc-950">
          Join notebook first
        </h1>
        <p className="text-sm leading-6 text-zinc-600">
          Open the notebook and join it before viewing transactions.
        </p>
        <Link
          className="inline-flex h-11 items-center justify-center rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
          href={`/notebooks/${notebookId}`}
        >
          Open notebook
        </Link>
      </SurfaceCard>
    );
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Transactions
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-zinc-950">
              {notebook.name}
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              Full list of expenses and loans for this notebook.
            </p>
          </div>
          <Link
            className="inline-flex h-11 items-center justify-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-100"
            href={`/notebooks/${notebookId}`}
          >
            Back to notebook
          </Link>
        </div>
      </section>

      {errorMessage ? (
        <InlineAlert tone="error">{errorMessage}</InlineAlert>
      ) : null}
      {successMessage ? (
        <InlineAlert tone="success">{successMessage}</InlineAlert>
      ) : null}

      <NotebookSummaryCard
        entries={entries}
        notebook={notebook}
        notebookId={notebookId}
      />

      <SurfaceCard>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-zinc-950">
              Transaction table
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              {entries.length} {entries.length === 1 ? "transaction" : "transactions"}
            </p>
          </div>
        </div>

        {recentlyDeletedEntry ? (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-zinc-950">
                Transaction removed
              </p>
              <p className="mt-1 text-sm text-zinc-600">
                {recentlyDeletedEntry.category} {formatMoney(recentlyDeletedEntry.amount)}
              </p>
            </div>
            <AppButton
              disabled={isSavingEntry}
              onClick={handleUndoDelete}
              type="button"
              variant="secondary"
            >
              Undo
            </AppButton>
          </div>
        ) : null}

        {entries.length ? (
          <div className="overflow-hidden rounded-lg border border-zinc-200">
            <div className="grid grid-cols-[1fr_120px] gap-3 bg-zinc-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 sm:grid-cols-[1fr_140px_150px_140px]">
              <span>Transaction</span>
              <span>Paid by</span>
              <span className="hidden sm:block">Date</span>
              <span className="hidden sm:block">Amount</span>
            </div>
            <div className="divide-y divide-zinc-200">
              {paginatedEntries.map((entry) => {
                const payer = notebook.friends.find(
                  (friend) => friend.id === entry.paidByFriendId,
                );
                const borrowerName =
                  entry.entryType === "loan"
                    ? getFriendName(entry.loanFriendId)
                    : "";
                const entryTitle =
                  entry.entryType === "loan"
                    ? `Loan to ${borrowerName}`
                    : entry.category;

                return (
                  <div
                    className="grid grid-cols-[1fr_120px] gap-3 px-4 py-4 text-sm sm:grid-cols-[1fr_140px_150px_140px]"
                    key={entry.id}
                  >
                    <div>
                      <p className="font-semibold text-zinc-950">
                        {entryTitle}
                      </p>
                      {entry.description ? (
                        <p className="mt-1 leading-6 text-zinc-600">
                          {entry.description}
                        </p>
                      ) : null}
                      {entry.entryType === "loan" && !entry.description ? (
                        <p className="mt-1 leading-6 text-zinc-600">
                          Borrower: {borrowerName}
                        </p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <AppButton
                          className="h-9 px-3"
                          onClick={() => handleEditEntry(entry)}
                          type="button"
                          variant="secondary"
                        >
                          Edit
                        </AppButton>
                        <AppButton
                          className="h-9 px-3"
                          disabled={isDeletingEntryId === entry.id}
                          onClick={() => handleDeleteEntry(entry)}
                          type="button"
                          variant="danger"
                        >
                          {isDeletingEntryId === entry.id
                            ? "Removing..."
                            : "Remove"}
                        </AppButton>
                      </div>
                    </div>
                    <p className="text-zinc-700">{payer?.name || "Unknown"}</p>
                    <p className="hidden text-zinc-600 sm:block">
                      {formatEntryTimestamp(entry)}
                    </p>
                    <p className="font-semibold text-zinc-950 sm:block">
                      {formatMoney(entry.amount)}
                    </p>
                  </div>
                );
              })}
            </div>
            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-zinc-200 bg-white px-4 py-3 sm:px-6">
                <p className="text-sm text-zinc-700">
                  Showing{" "}
                  <span className="font-medium">
                    {(currentPage - 1) * itemsPerPage + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, entries.length)}
                  </span>{" "}
                  of <span className="font-medium">{entries.length}</span>{" "}
                  transactions
                </p>
                <div className="flex gap-2">
                  <AppButton
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((page) => page - 1)}
                    type="button"
                    variant="secondary"
                  >
                    Previous
                  </AppButton>
                  <AppButton
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((page) => page + 1)}
                    type="button"
                    variant="secondary"
                  >
                    Next
                  </AppButton>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
            No transactions yet.
          </p>
        )}
      </SurfaceCard>

      <NotebookEntryDialog
        categories={notebookCategories}
        formKey={editingEntryId || "edit-entry"}
        initialValues={editingEntryDraft || undefined}
        isOpen={Boolean(editingEntryId && editingEntryDraft)}
        isSaving={isSavingEntry}
        notebook={notebook}
        onClose={handleCancelEditEntry}
        onSubmit={handleSubmitEntry}
        submitLabel="Save changes"
        title="Edit transaction"
      />
    </div>
  );
}
