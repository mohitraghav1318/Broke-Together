"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppButton } from "@/components/ui/app-button";
import { InlineAlert } from "@/components/ui/inline-alert";
import { LoadingPlaceholder } from "@/components/ui/loading-placeholder";
import { SurfaceCard } from "@/components/ui/surface-card";
import { TextInput } from "@/components/ui/text-input";
import { firebaseAuth } from "@/firebase/firebase-client";
import {
  addNotebookEntry,
  addNotebookFriend,
  calculateSettlements,
  formatMoney,
  getNotebookErrorMessage,
  joinNotebook,
  subscribeNotebook,
  subscribeNotebookEntries,
  type HisabaNotebook,
  type NotebookEntry,
} from "@/features/notebooks/lib/hisaba-notebooks";

const categories = [
  "Food",
  "Travel",
  "Stay",
  "Groceries",
  "Bills",
  "Shopping",
  "Other",
];

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
  const [isSavingEntry, setIsSavingEntry] = useState(false);
  const [friendName, setFriendName] = useState("");
  const [amount, setAmount] = useState("");
  const [paidByFriendId, setPaidByFriendId] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [description, setDescription] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isReportVisible, setIsReportVisible] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(firebaseAuth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
  }, []);

  useEffect(() => {
    return subscribeNotebook(
      notebookId,
      (nextNotebook) => {
        setNotebook(nextNotebook);
        setPaidByFriendId((current) => {
          if (
            current &&
            nextNotebook?.friends.some((friend) => friend.id === current)
          ) {
            return current;
          }

          return nextNotebook?.friends[0]?.id || "";
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

    return subscribeNotebookEntries(
      notebookId,
      setEntries,
      (error) => setErrorMessage(getNotebookErrorMessage(error)),
    );
  }, [notebook?.memberIds, notebookId, user]);

  const isMember = Boolean(user && notebook?.memberIds.includes(user.uid));
  const settlements = useMemo(() => {
    return calculateSettlements(notebook?.friends || [], entries);
  }, [entries, notebook?.friends]);

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
        {errorMessage ? <InlineAlert tone="error">{errorMessage}</InlineAlert> : null}
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

        {errorMessage ? <InlineAlert tone="error">{errorMessage}</InlineAlert> : null}
        {successMessage ? (
          <InlineAlert tone="success">{successMessage}</InlineAlert>
        ) : null}
      </section>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="grid gap-6 self-start">
          <SurfaceCard>
            <h2 className="mb-4 text-xl font-semibold text-zinc-950">
              Add friend
            </h2>
            <form className="grid gap-4" onSubmit={handleAddFriend}>
              <TextInput
                id="friend-name"
                label="Friend name"
                onChange={(event) => setFriendName(event.target.value)}
                placeholder="Aarav, Maya, Jordan"
                type="text"
                value={friendName}
              />
              <AppButton disabled={isSavingFriend} type="submit">
                {isSavingFriend ? "Adding..." : "Add friend"}
              </AppButton>
            </form>
          </SurfaceCard>

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
                  {categories.map((item) => (
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
              <AppButton onClick={() => setIsReportVisible(true)}>
                Generate report
              </AppButton>
            </div>

            {isReportVisible ? (
              settlements.length ? (
                <div className="grid gap-3">
                  {settlements.map((settlement) => (
                    <div
                      className="rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-800"
                      key={`${settlement.from}-${settlement.to}-${settlement.amount}`}
                    >
                      <span className="font-semibold">{settlement.from}</span>{" "}
                      needs to pay{" "}
                      <span className="font-semibold">
                        {formatMoney(settlement.amount)}
                      </span>{" "}
                      to <span className="font-semibold">{settlement.to}</span>.
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
                  Everyone is settled.
                </p>
              )
            ) : (
              <p className="rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
                Generate the report when entries are ready.
              </p>
            )}
          </SurfaceCard>

          <SurfaceCard>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-zinc-950">
                  Entries
                </h2>
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
                  {entries.map((entry) => {
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
