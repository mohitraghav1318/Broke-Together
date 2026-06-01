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
import { NotebookEntryForm } from "@/features/notebooks/components/notebook-entry-form";
import { NotebookSummaryCard } from "@/features/notebooks/components/notebook-summary-card";
import type { NotebookEntryFormState } from "@/features/notebooks/hooks/use-notebook-entry-form";
import {
  addNotebookEntry,
  addNotebookCategory,
  addNotebookFriend,
  getNotebookCategories,
  getNotebookErrorMessage,
  joinNotebook,
  removeNotebookCategory,
  removeNotebookFriend,
  subscribeNotebook,
  subscribeNotebookEntries,
  subscribeRecentNotebookActivities,
  updateNotebookName,
  type HisabaNotebook,
  type NotebookActivity,
  type NotebookEntry,
} from "@/features/notebooks/lib/hisaba-notebooks";

type NotebookWorkspaceProps = {
  notebookId: string;
};

function formatActivityTimestamp(createdAt: NotebookActivity["createdAt"]) {
  if (!createdAt) {
    return "Just now";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(createdAt.toDate());
}

export function NotebookWorkspace({ notebookId }: NotebookWorkspaceProps) {
  const [user, setUser] = useState<User | null>(null);
  const [notebook, setNotebook] = useState<HisabaNotebook | null>(null);
  const [entries, setEntries] = useState<NotebookEntry[]>([]);
  const [activities, setActivities] = useState<NotebookActivity[]>([]);
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
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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

  useEffect(() => {
    if (!user || !notebook?.memberIds.includes(user.uid)) {
      return;
    }

    return subscribeRecentNotebookActivities(
      notebookId,
      5,
      setActivities,
      (error) => setErrorMessage(getNotebookErrorMessage(error)),
    );
  }, [notebook?.memberIds, notebookId, user]);

  const isMember = Boolean(user && notebook?.memberIds.includes(user.uid));
  const notebookCategories = notebook ? getNotebookCategories(notebook) : [];

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
      if (!user) {
        return;
      }

      await updateNotebookName(notebookId, user, notebookName);
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
      if (!user) {
        return;
      }

      await addNotebookFriend(notebookId, user, friendName);
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
      if (!user) {
        return;
      }

      await removeNotebookFriend(notebookId, user, friendId);
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

  async function handleSubmitEntry(draft: NotebookEntryFormState) {
    if (!user) {
      return false;
    }

    setIsSavingEntry(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const payload = {
        amount: Number(draft.amount),
        paidByFriendId: draft.paidByFriendId,
        category: draft.category,
        entryType: draft.entryType,
        loanFriendId: draft.loanFriendId || null,
        description: draft.description,
      };

      await addNotebookEntry(notebookId, user, payload);
      setSuccessMessage("Entry added.");
      return true;
    } catch (error) {
      setErrorMessage(getNotebookErrorMessage(error));
      return false;
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
            <NotebookEntryForm
              key="create-entry"
              categories={notebookCategories}
              isSaving={isSavingEntry}
              notebook={notebook}
              onSubmit={handleSubmitEntry}
            />
          </SurfaceCard>
        </div>

        <div className="grid gap-6">
          <NotebookSummaryCard
            entries={entries}
            notebook={notebook}
            notebookId={notebookId}
          />

          <SurfaceCard>
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-zinc-950">
                  Recent activity
                </h2>
                <p className="mt-1 text-sm text-zinc-600">
                  Latest notebook changes and transactions.
                </p>
              </div>
              <Link
                className="inline-flex h-11 items-center justify-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-100"
                href={`/notebooks/${notebookId}/transactions`}
              >
                View all transactions
              </Link>
            </div>

            {activities.length ? (
              <div className="divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200">
                {activities.map((activity) => (
                  <div className="grid gap-1 px-4 py-3" key={activity.id}>
                    <p className="text-sm font-medium text-zinc-950">
                      {activity.summary}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {formatActivityTimestamp(activity.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
                No activity yet.
              </p>
            )}
          </SurfaceCard>
        </div>
      </div>
    </div>
  );
}
