"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppButton } from "@/components/ui/app-button";
import { InlineAlert } from "@/components/ui/inline-alert";
import { LoadingPlaceholder } from "@/components/ui/loading-placeholder";
import { SurfaceCard } from "@/components/ui/surface-card";
import { firebaseAuth } from "@/firebase/firebase-client";
import { enforceAuthSession } from "@/features/auth/lib/auth-session";
import {
  calculateSettlements,
  clearNotebookEntries,
  formatMoney,
  getNotebookErrorMessage,
  subscribeNotebook,
  subscribeNotebookEntries,
  type HisabaNotebook,
  type NotebookEntry,
} from "@/features/notebooks/lib/hisaba-notebooks";

const chartColors = [
  "#059669",
  "#0284c7",
  "#d97706",
  "#dc2626",
  "#7c3aed",
  "#0f766e",
  "#be123c",
];

type NotebookReportProps = {
  notebookId: string;
};

type CategorySummary = {
  category: string;
  amount: number;
  count: number;
  color: string;
  percent: number;
};

type TimelinePoint = {
  label: string;
  amount: number;
};

function getEntryDate(entry: NotebookEntry) {
  return entry.createdAt?.toDate() || new Date(0);
}

function getFriendName(notebook: HisabaNotebook, friendId: string) {
  return (
    notebook.friends.find((friend) => friend.id === friendId)?.name || "Unknown"
  );
}

function buildCategorySummary(entries: NotebookEntry[]) {
  const grouped = new Map<string, { amount: number; count: number }>();
  const total = entries.reduce((sum, entry) => sum + entry.amount, 0);

  entries.forEach((entry) => {
    const current = grouped.get(entry.category) || { amount: 0, count: 0 };

    grouped.set(entry.category, {
      amount: current.amount + entry.amount,
      count: current.count + 1,
    });
  });

  return Array.from(grouped.entries())
    .map(([category, value], index) => ({
      category,
      amount: value.amount,
      count: value.count,
      color: chartColors[index % chartColors.length],
      percent: total ? (value.amount / total) * 100 : 0,
    }))
    .sort((first, second) => second.amount - first.amount);
}

function buildTimeline(entries: NotebookEntry[]) {
  const grouped = new Map<string, number>();
  const formatter = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
  });

  entries.forEach((entry) => {
    const date = getEntryDate(entry);
    const key = date.toISOString().slice(0, 10);

    grouped.set(key, (grouped.get(key) || 0) + entry.amount);
  });

  return Array.from(grouped.entries())
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([key, amount]) => ({
      label: formatter.format(new Date(`${key}T00:00:00`)),
      amount,
    }));
}

function CategoryPieChart({ categories }: { categories: CategorySummary[] }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const segments = categories.map((category, index) => {
    const previousLength = categories
      .slice(0, index)
      .reduce((sum, item) => sum + (item.percent / 100) * circumference, 0);
    const length = (category.percent / 100) * circumference;

    return {
      ...category,
      dashOffset: -previousLength,
      length,
    };
  });

  if (!categories.length) {
    return (
      <div className="grid min-h-64 place-items-center rounded-lg border border-zinc-200 bg-zinc-50 text-sm text-zinc-500">
        No category data yet.
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-[180px_1fr] sm:items-center">
      <svg
        aria-label="Category expense pie chart"
        className="mx-auto h-44 w-44"
        role="img"
        viewBox="0 0 140 140"
      >
        <circle
          cx="70"
          cy="70"
          fill="none"
          r={radius}
          stroke="#e4e4e7"
          strokeWidth="20"
        />
        {segments.map((category) => {
          return (
            <circle
              cx="70"
              cy="70"
              fill="none"
              key={category.category}
              r={radius}
              stroke={category.color}
              strokeDasharray={`${category.length} ${
                circumference - category.length
              }`}
              strokeDashoffset={category.dashOffset}
              strokeLinecap="butt"
              strokeWidth="20"
              transform="rotate(-90 70 70)"
            />
          );
        })}
        <text
          className="fill-zinc-950 text-sm font-semibold"
          textAnchor="middle"
          x="70"
          y="66"
        >
          Total
        </text>
        <text
          className="fill-zinc-600 text-xs"
          textAnchor="middle"
          x="70"
          y="84"
        >
          {categories.length} groups
        </text>
      </svg>

      <div className="grid gap-3">
        {categories.map((category) => (
          <div
            className="grid grid-cols-[auto_1fr_auto] items-center gap-3 text-sm"
            key={category.category}
          >
            <span
              className="size-3 rounded-sm"
              style={{ backgroundColor: category.color }}
            />
            <span className="font-medium text-zinc-800">
              {category.category}
            </span>
            <span className="text-zinc-600">
              {category.percent.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelineChart({ points }: { points: TimelinePoint[] }) {
  const maxAmount = Math.max(...points.map((point) => point.amount), 0);

  if (!points.length) {
    return (
      <div className="grid min-h-64 place-items-center rounded-lg border border-zinc-200 bg-zinc-50 text-sm text-zinc-500">
        No timeline data yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex min-h-64 min-w-[520px] items-end gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-5">
        {points.map((point) => {
          const height = maxAmount
            ? Math.max((point.amount / maxAmount) * 170, 8)
            : 8;

          return (
            <div className="grid flex-1 gap-2" key={point.label}>
              <div className="flex h-44 items-end">
                <div
                  className="w-full rounded-t-md bg-emerald-600"
                  style={{ height }}
                  title={`${point.label}: ${formatMoney(point.amount)}`}
                />
              </div>
              <div className="grid gap-1 text-center">
                <span className="text-xs font-semibold text-zinc-700">
                  {point.label}
                </span>
                <span className="text-xs text-zinc-500">
                  {formatMoney(point.amount)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WhoPaysGraph({
  entries,
  notebook,
}: {
  entries: NotebookEntry[];
  notebook: HisabaNotebook;
}) {
  const grouped = new Map<string, number>();

  entries.forEach((entry) => {
    grouped.set(
      entry.paidByFriendId,
      (grouped.get(entry.paidByFriendId) || 0) + entry.amount,
    );
  });

  const points = Array.from(grouped.entries())
    .map(([id, amount]) => ({
      label: getFriendName(notebook, id),
      amount,
    }))
    .sort((a, b) => b.amount - a.amount);

  const maxAmount = Math.max(...points.map((point) => point.amount), 0);

  if (!points.length) {
    return (
      <div className="grid min-h-64 place-items-center rounded-lg border border-zinc-200 bg-zinc-50 text-sm text-zinc-500">
        No payment data yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="grid min-h-64 gap-4 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-5">
        {points.map((point, index) => {
          const width = maxAmount
            ? Math.max((point.amount / maxAmount) * 100, 2)
            : 2;
          const color = chartColors[index % chartColors.length];
          return (
            <div className="grid gap-2" key={point.label}>
              <div className="flex justify-between text-sm font-medium">
                <span className="text-zinc-700">{point.label}</span>
                <span className="text-zinc-950">
                  {formatMoney(point.amount)}
                </span>
              </div>
              <div className="h-4 w-full rounded-sm bg-zinc-200">
                <div
                  className="h-full rounded-sm transition-all"
                  style={{ width: `${width}%`, backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function NotebookReport({ notebookId }: NotebookReportProps) {
  const [user, setUser] = useState<User | null>(null);
  const [notebook, setNotebook] = useState<HisabaNotebook | null>(null);
  const [entries, setEntries] = useState<NotebookEntry[]>([]);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isNotebookLoading, setIsNotebookLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isClearing, setIsClearing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

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
  const totalExpense = entries.reduce((sum, entry) => sum + entry.amount, 0);
  const settlements = useMemo(
    () => calculateSettlements(notebook?.friends || [], entries),
    [entries, notebook?.friends],
  );
  const categories = useMemo(() => buildCategorySummary(entries), [entries]);
  const timeline = useMemo(() => buildTimeline(entries), [entries]);
  const averageEntry = entries.length ? totalExpense / entries.length : 0;
  const isNotebookOwner = Boolean(user && notebook?.ownerUid === user.uid);

  async function handleClearEntries() {
    if (
      !window.confirm(
        "Are you sure you want to clear all entries? This action cannot be undone.",
      )
    ) {
      return;
    }
    setIsClearing(true);
    setErrorMessage("");
    try {
      if (notebook) {
        await clearNotebookEntries(notebookId, entries);
      }
    } catch (error) {
      setErrorMessage(getNotebookErrorMessage(error));
    } finally {
      setIsClearing(false);
    }
  }

  async function handleDownloadReport() {
    setIsDownloading(true);
    try {
      // @ts-expect-error No type definitions for html2pdf.js available out of the box
      const html2pdf = (await import("html2pdf.js")).default;
      const element = document.getElementById("report-container");
      if (element) {
        const opt = {
          margin: [0.5, 0.5, 0.5, 0.5],
          filename: `${notebook?.name || "notebook"}-report.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
        };
        await html2pdf().set(opt).from(element).save();
      }
    } catch (error) {
      setErrorMessage("Failed to download PDF report. Try again later.");
      console.error(error);
    } finally {
      setIsDownloading(false);
    }
  }

  if (isAuthLoading || isNotebookLoading) {
    return <LoadingPlaceholder label="Loading report" />;
  }

  if (!user) {
    return (
      <SurfaceCard className="grid max-w-xl gap-4">
        <h1 className="text-2xl font-semibold text-zinc-950">
          Sign in required
        </h1>
        <p className="text-sm leading-6 text-zinc-600">
          Sign in before opening this report.
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
          This report link is no longer available.
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
          Open the shared notebook and join it before viewing the report.
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
      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Report
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-zinc-950">
              {notebook.name}
            </h1>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Expense review, category split, timeline, and final settlement.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <AppButton
              disabled={isDownloading}
              onClick={handleDownloadReport}
              type="button"
              variant="secondary"
            >
              {isDownloading ? "Downloading..." : "Download PDF"}
            </AppButton>
            {isNotebookOwner && entries.length > 0 && (
              <AppButton
                disabled={isClearing}
                onClick={handleClearEntries}
                type="button"
                variant="danger"
              >
                {isClearing ? "Clearing..." : "Clear all entries"}
              </AppButton>
            )}
            <Link
              className="inline-flex h-11 items-center justify-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-100"
              href={`/notebooks/${notebookId}`}
            >
              Back to notebook
            </Link>
          </div>
        </div>
      </section>

      {errorMessage ? (
        <InlineAlert tone="error">{errorMessage}</InlineAlert>
      ) : null}

      <div id="report-container" className="grid gap-6 bg-stone-50 pb-4">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SurfaceCard>
            <p className="text-sm font-medium text-zinc-600">Total expense</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-950">
              {formatMoney(totalExpense)}
            </p>
          </SurfaceCard>
          <SurfaceCard>
            <p className="text-sm font-medium text-zinc-600">Entries</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-950">
              {entries.length}
            </p>
          </SurfaceCard>
          <SurfaceCard>
            <p className="text-sm font-medium text-zinc-600">Friends</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-950">
              {notebook.friends.length}
            </p>
          </SurfaceCard>
          <SurfaceCard>
            <p className="text-sm font-medium text-zinc-600">Average entry</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-950">
              {formatMoney(averageEntry)}
            </p>
          </SurfaceCard>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <SurfaceCard>
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-zinc-950">
                Timeline graph
              </h2>
              <p className="mt-1 text-sm text-zinc-600">
                Daily spending from all entries.
              </p>
            </div>
            <TimelineChart points={timeline} />
          </SurfaceCard>

          <SurfaceCard>
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-zinc-950">
                Category split
              </h2>
              <p className="mt-1 text-sm text-zinc-600">
                Share of spend by category.
              </p>
            </div>
            <CategoryPieChart categories={categories} />
          </SurfaceCard>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <SurfaceCard>
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-zinc-950">
                Who pays how much
              </h2>
              <p className="mt-1 text-sm text-zinc-600">
                Total amount paid by each friend.
              </p>
            </div>
            <WhoPaysGraph entries={entries} notebook={notebook} />
          </SurfaceCard>

          <SurfaceCard>
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-zinc-950">
                Who pays whom
              </h2>
              <p className="mt-1 text-sm text-zinc-600">
                Simple settlement table.
              </p>
            </div>
            {settlements.length ? (
              <div className="overflow-hidden rounded-lg border border-zinc-200">
                <div className="grid grid-cols-3 gap-3 bg-zinc-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  <span>From</span>
                  <span>To</span>
                  <span>Amount</span>
                </div>
                <div className="divide-y divide-zinc-200">
                  {settlements.map((settlement) => (
                    <div
                      className="grid grid-cols-3 gap-3 px-4 py-4 text-sm"
                      key={`${settlement.from}-${settlement.to}-${settlement.amount}`}
                    >
                      <span className="font-medium text-zinc-950">
                        {settlement.from}
                      </span>
                      <span className="text-zinc-700">{settlement.to}</span>
                      <span className="font-semibold text-zinc-950">
                        {formatMoney(settlement.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
                Everyone is settled.
              </p>
            )}
          </SurfaceCard>

          <SurfaceCard>
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-zinc-950">
                Category review
              </h2>
              <p className="mt-1 text-sm text-zinc-600">
                Total amount and entry count per category.
              </p>
            </div>
            {categories.length ? (
              <div className="overflow-hidden rounded-lg border border-zinc-200">
                <div className="grid grid-cols-[1fr_90px_120px] gap-3 bg-zinc-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  <span>Category</span>
                  <span>Entries</span>
                  <span>Total</span>
                </div>
                <div className="divide-y divide-zinc-200">
                  {categories.map((category) => (
                    <div
                      className="grid grid-cols-[1fr_90px_120px] gap-3 px-4 py-4 text-sm"
                      key={category.category}
                    >
                      <span className="flex items-center gap-3 font-medium text-zinc-950">
                        <span
                          className="size-3 rounded-sm"
                          style={{ backgroundColor: category.color }}
                        />
                        {category.category}
                      </span>
                      <span className="text-zinc-700">{category.count}</span>
                      <span className="font-semibold text-zinc-950">
                        {formatMoney(category.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
                No category spending yet.
              </p>
            )}
          </SurfaceCard>
        </div>

        <SurfaceCard>
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-zinc-950">
              Expense table
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              All notebook entries in table format.
            </p>
          </div>
          {entries.length ? (
            <div className="overflow-x-auto">
              <div className="min-w-[720px] overflow-hidden rounded-lg border border-zinc-200">
                <div className="grid grid-cols-[120px_1fr_130px_130px_130px] gap-3 bg-zinc-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  <span>Date</span>
                  <span>Description</span>
                  <span>Category</span>
                  <span>Paid by</span>
                  <span>Amount</span>
                </div>
                <div className="divide-y divide-zinc-200">
                  {entries.map((entry) => (
                    <div
                      className="grid grid-cols-[120px_1fr_130px_130px_130px] gap-3 px-4 py-4 text-sm"
                      key={entry.id}
                    >
                      <span className="text-zinc-600">
                        {new Intl.DateTimeFormat("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }).format(getEntryDate(entry))}
                      </span>
                      <span className="font-medium text-zinc-950">
                        {entry.description || "No description"}
                      </span>
                      <span className="text-zinc-700">{entry.category}</span>
                      <span className="text-zinc-700">
                        {getFriendName(notebook, entry.paidByFriendId)}
                      </span>
                      <span className="font-semibold text-zinc-950">
                        {formatMoney(entry.amount)}
                      </span>
                    </div>
                  ))}
                </div>
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
  );
}
