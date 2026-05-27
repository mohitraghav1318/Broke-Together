"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { AppButton } from "@/components/ui/app-button";
import { InlineAlert } from "@/components/ui/inline-alert";
import { LoadingPlaceholder } from "@/components/ui/loading-placeholder";
import { SurfaceCard } from "@/components/ui/surface-card";
import { TextInput } from "@/components/ui/text-input";
import { firebaseAuth } from "@/firebase/firebase-client";
import { enforceAuthSession } from "@/features/auth/lib/auth-session";
import {
  addNotebookEntry,
  addNotebookCategory,
  addNotebookFriend,
  formatMoney,
  getNotebookCategories,
  getNotebookErrorMessage,
  joinNotebook,
  removeNotebookCategory,
  removeNotebookFriend,
  subscribeNotebook,
  subscribeNotebookEntries,
  updateNotebookName,
  type HisabaNotebook,
  type NotebookEntry,
} from "@/features/notebooks/lib/hisaba-notebooks";

type NotebookWorkspaceProps = {
  notebookId: string;
};

export function NotebookWorkspace({ notebookId }: NotebookWorkspaceProps) {
  const [user, setUser] = useState<User | null>(null);
  const [notebook, setNotebook] = useState<HisabaNotebook | null>(null);
  const [entries, setEntries] = useState<NotebookEntry[]>([]);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isNotebookLoading, setIsNotebookLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [isSavingFriend, setIsSavingFriend] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [isSavingEntry, setIsSavingEntry] = useState(false);
  const [isEditingNotebook, setIsEditingNotebook] = useState(false);
  const [notebookName, setNotebookName] = useState("");
  const [friendName, setFriendName] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [amount, setAmount] = useState("");
  const [paidByFriendId, setPaidByFriendId] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
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
        setNotebookName(nextNotebook?.name || "");
        setPaidByFriendId((current) => {
          if (
            current &&
            nextNotebook?.friends.some((friend) => friend.id === current)
          ) {
            return current;
          }

          return nextNotebook?.friends[0]?.id || "";
        });
        setCategory((current) => {
          const nextCategories = nextNotebook
            ? getNotebookCategories(nextNotebook)
            : [];

          return current && nextCategories.includes(current)
            ? current
            : nextCategories[0] || "";
        });
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

  const itemsPerPage = 7;
  const totalPages = Math.max(1, Math.ceil(entries.length / itemsPerPage));
  const paginatedEntries = entries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  function isFriendUsed(friendId: string) {
    return entries.some(
      (entry) =>
        entry.paidByFriendId === friendId ||
        entry.splitFriendIds.includes(friendId),
    );
  }

  function isCategoryUsed(nextCategory: string) {
    return entries.some((entry) => entry.category === nextCategory);
  }

  async function handleJoinNotebook() {
    if (!user) {
      return;
    }

    setIsJoining(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await joinNotebook(notebookId, user);
      setSuccessMessage("Joined notebook.");
    } catch (error) {
      setErrorMessage(getNotebookErrorMessage(error));
    } finally {
      setIsJoining(false);
    }
  }

  async function handleCopyLink() {
    if (typeof window === "undefined") {
      return;
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
      setSuccessMessage("Share link copied.");
      setErrorMessage("");
    } catch {
      setErrorMessage("Could not copy the share link.");
    }
  }

  async function handleSaveNotebookName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingName(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await updateNotebookName(notebookId, notebookName);
      setSuccessMessage("Notebook name updated.");
    } catch (error) {
      setErrorMessage(getNotebookErrorMessage(error));
    } finally {
      setIsSavingName(false);
    }
  }

  async function handleAddFriend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingFriend(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await addNotebookFriend(notebookId, friendName);
      setFriendName("");
      setSuccessMessage("Friend added.");
    } catch (error) {
      setErrorMessage(getNotebookErrorMessage(error));
    } finally {
      setIsSavingFriend(false);
    }
  }

  async function handleRemoveFriend(friendId: string) {
    setIsSavingFriend(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await removeNotebookFriend(notebookId, friendId);
      setSuccessMessage("Friend removed.");
    } catch (error) {
      setErrorMessage(getNotebookErrorMessage(error));
    } finally {
      setIsSavingFriend(false);
    }
  }

  async function handleAddCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingCategory(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await addNotebookCategory(notebookId, categoryName);
      setCategoryName("");
      setSuccessMessage("Category added.");
    } catch (error) {
      setErrorMessage(getNotebookErrorMessage(error));
    } finally {
      setIsSavingCategory(false);
    }
  }

  async function handleRemoveCategory(nextCategory: string) {
    setIsSavingCategory(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await removeNotebookCategory(notebookId, nextCategory);
      setSuccessMessage("Category removed.");
    } catch (error) {
      setErrorMessage(getNotebookErrorMessage(error));
    } finally {
      setIsSavingCategory(false);
    }
  }

  async function handleAddEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      return;
    }

    setIsSavingEntry(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await addNotebookEntry(notebookId, user, {
        amount: Number(amount),
        paidByFriendId,
        category,
        description,
      });
      setAmount("");
      setDescription("");
      setSuccessMessage("Entry added.");
    } catch (error) {
      setErrorMessage(getNotebookErrorMessage(error));
    } finally {
      setIsSavingEntry(false);
    }
  }

  if (isAuthLoading || isNotebookLoading) {
    return <LoadingPlaceholder label="Loading notebook" />;
  }

  if (!user) {
    return (
      <SurfaceCard className="grid max-w-xl gap-4">
        <h1 className="text-2xl font-semibold text-zinc-950">
          Sign in required
        </h1>
        <p className="text-sm leading-6 text-zinc-600">
          Sign in before opening a shared hisaba notebook.
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
      <SurfaceCard className="grid max-w-xl gap-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Shared notebook
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-zinc-950">
            {notebook.name}
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            Join this notebook to see entries and add payments with friends.
          </p>
        </div>
        {errorMessage ? (
          <InlineAlert tone="error">{errorMessage}</InlineAlert>
        ) : null}
        {successMessage ? (
          <InlineAlert tone="success">{successMessage}</InlineAlert>
        ) : null}
        <AppButton disabled={isJoining} onClick={handleJoinNotebook}>
          {isJoining ? "Joining..." : "Join notebook"}
        </AppButton>
      </SurfaceCard>
    );
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Hisaba notebook
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-zinc-950">
              {notebook.name}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              className="inline-flex h-11 items-center justify-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-100"
              href="/notebooks"
            >
              All notebooks
            </Link>
            <AppButton onClick={handleCopyLink} variant="secondary">
              Copy share link
            </AppButton>
            <AppButton
              onClick={() => setIsEditingNotebook((current) => !current)}
              variant="secondary"
            >
              {isEditingNotebook ? "Close edit" : "Edit notebook"}
            </AppButton>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {notebook.friends.map((friend) => (
            <span
              className="rounded-md bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-800"
              key={friend.id}
            >
              {friend.name}
            </span>
          ))}
        </div>

        {errorMessage ? (
          <InlineAlert tone="error">{errorMessage}</InlineAlert>
        ) : null}
        {successMessage ? (
          <InlineAlert tone="success">{successMessage}</InlineAlert>
        ) : null}
      </section>

      {isEditingNotebook ? (
        <SurfaceCard className="grid gap-6">
          <div>
            <h2 className="text-xl font-semibold text-zinc-950">
              Edit notebook
            </h2>
            <p className="mt-1 text-sm leading-6 text-zinc-600">
              Update the notebook name, friends, and entry categories.
            </p>
          </div>

          <form className="grid gap-4" onSubmit={handleSaveNotebookName}>
            <TextInput
              id="edit-notebook-name"
              label="Notebook name"
              onChange={(event) => setNotebookName(event.target.value)}
              placeholder="Notebook name"
              type="text"
              value={notebookName}
            />
            <AppButton
              className="w-full sm:w-fit"
              disabled={isSavingName}
              type="submit"
            >
              {isSavingName ? "Saving..." : "Save name"}
            </AppButton>
          </form>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="grid gap-4">
              <form className="grid gap-4" onSubmit={handleAddFriend}>
                <TextInput
                  id="edit-friend-name"
                  label="Add friend"
                  onChange={(event) => setFriendName(event.target.value)}
                  placeholder="Aarav, Maya, Jordan"
                  type="text"
                  value={friendName}
                />
                <AppButton
                  className="w-full sm:w-fit"
                  disabled={isSavingFriend}
                  type="submit"
                >
                  {isSavingFriend ? "Saving..." : "Add friend"}
                </AppButton>
              </form>

              <div className="overflow-hidden rounded-lg border border-zinc-200">
                <div className="bg-zinc-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Friends
                </div>
                <div className="divide-y divide-zinc-200">
                  {notebook.friends.map((friend) => {
                    const isUsed = isFriendUsed(friend.id);

                    return (
                      <div
                        className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
                        key={friend.id}
                      >
                        <span className="font-medium text-zinc-950">
                          {friend.name}
                        </span>
                        <AppButton
                          className="h-9 px-3"
                          disabled={
                            isSavingFriend ||
                            isUsed ||
                            notebook.friends.length === 1
                          }
                          onClick={() => handleRemoveFriend(friend.id)}
                          variant="danger"
                        >
                          Remove
                        </AppButton>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <form className="grid gap-4" onSubmit={handleAddCategory}>
                <TextInput
                  id="edit-category-name"
                  label="Add category"
                  onChange={(event) => setCategoryName(event.target.value)}
                  placeholder="Fuel, Movies, Snacks"
                  type="text"
                  value={categoryName}
                />
                <AppButton
                  className="w-full sm:w-fit"
                  disabled={isSavingCategory}
                  type="submit"
                >
                  {isSavingCategory ? "Saving..." : "Add category"}
                </AppButton>
              </form>

              <div className="overflow-hidden rounded-lg border border-zinc-200">
                <div className="bg-zinc-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Categories
                </div>
                <div className="divide-y divide-zinc-200">
                  {notebookCategories.map((item) => {
                    const isUsed = isCategoryUsed(item);

                    return (
                      <div
                        className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
                        key={item}
                      >
                        <span className="font-medium text-zinc-950">
                          {item}
                        </span>
                        <AppButton
                          className="h-9 px-3"
                          disabled={
                            isSavingCategory ||
                            isUsed ||
                            notebookCategories.length === 1
                          }
                          onClick={() => handleRemoveCategory(item)}
                          variant="danger"
                        >
                          Remove
                        </AppButton>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </SurfaceCard>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="grid gap-6 self-start">
          <SurfaceCard>
            <h2 className="mb-4 text-xl font-semibold text-zinc-950">
              Add entry
            </h2>
            <form className="grid gap-4" onSubmit={handleAddEntry}>
              <TextInput
                id="amount"
                label="Money paid"
                min="0"
                onChange={(event) => setAmount(event.target.value)}
                placeholder="120.00"
                step="0.01"
                type="number"
                value={amount}
              />

              <label
                className="grid gap-2 text-sm font-medium text-zinc-800"
                htmlFor="paid-by"
              >
                By whom
                <select
                  className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-base text-zinc-950 outline-none transition-colors focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  id="paid-by"
                  onChange={(event) => setPaidByFriendId(event.target.value)}
                  value={paidByFriendId}
                >
                  {notebook.friends.map((friend) => (
                    <option key={friend.id} value={friend.id}>
                      {friend.name}
                    </option>
                  ))}
                </select>
              </label>

              <label
                className="grid gap-2 text-sm font-medium text-zinc-800"
                htmlFor="category"
              >
                On what
                <select
                  className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-base text-zinc-950 outline-none transition-colors focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  id="category"
                  onChange={(event) => setCategory(event.target.value)}
                  value={category}
                >
                  {notebookCategories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label
                className="grid gap-2 text-sm font-medium text-zinc-800"
                htmlFor="description"
              >
                Description
                <textarea
                  className="min-h-24 rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-950 outline-none transition-colors placeholder:text-zinc-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  id="description"
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Items, notes, or leave empty"
                  value={description}
                />
              </label>

              <AppButton disabled={isSavingEntry} type="submit">
                {isSavingEntry ? "Saving..." : "Add entry"}
              </AppButton>
            </form>
          </SurfaceCard>
        </div>

        <div className="grid gap-6">
          <SurfaceCard>
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-zinc-950">
                  Settlement report
                </h2>
                <p className="mt-1 text-sm text-zinc-600">
                  Split equally between {notebook.friends.length}{" "}
                  {notebook.friends.length === 1 ? "friend" : "friends"}.
                </p>
              </div>
              <Link
                className="inline-flex h-11 items-center justify-center rounded-md border border-transparent bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
                href={`/notebooks/${notebookId}/report`}
              >
                Generate report
              </Link>
            </div>
            <p className="rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
              Open a full report with settlement table, timeline graph, pie
              chart, and category review.
            </p>
          </SurfaceCard>

          <SurfaceCard>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-zinc-950">Entries</h2>
                <p className="mt-1 text-sm text-zinc-600">
                  {entries.length} {entries.length === 1 ? "entry" : "entries"}
                </p>
              </div>
            </div>

            {entries.length ? (
              <div className="overflow-hidden rounded-lg border border-zinc-200">
                <div className="grid grid-cols-[1fr_120px] gap-3 bg-zinc-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 sm:grid-cols-[1fr_140px_140px]">
                  <span>Entry</span>
                  <span>Paid by</span>
                  <span className="hidden sm:block">Amount</span>
                </div>
                <div className="divide-y divide-zinc-200">
                  {paginatedEntries.map((entry) => {
                    const payer = notebook.friends.find(
                      (friend) => friend.id === entry.paidByFriendId,
                    );

                    return (
                      <div
                        className="grid grid-cols-[1fr_120px] gap-3 px-4 py-4 text-sm sm:grid-cols-[1fr_140px_140px]"
                        key={entry.id}
                      >
                        <div>
                          <p className="font-semibold text-zinc-950">
                            {entry.category}
                          </p>
                          {entry.description ? (
                            <p className="mt-1 leading-6 text-zinc-600">
                              {entry.description}
                            </p>
                          ) : null}
                        </div>
                        <p className="text-zinc-700">
                          {payer?.name || "Unknown"}
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
                      entries
                    </p>
                    <div className="flex gap-2">
                      <AppButton
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => p - 1)}
                        type="button"
                        variant="secondary"
                      >
                        Previous
                      </AppButton>
                      <AppButton
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((p) => p + 1)}
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
                No entries yet.
              </p>
            )}
          </SurfaceCard>
        </div>
      </div>
    </div>
  );
}
