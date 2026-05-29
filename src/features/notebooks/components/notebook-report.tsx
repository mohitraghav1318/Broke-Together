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

function getEntrySummary(entry: NotebookEntry, notebook: HisabaNotebook) {
  if (entry.entryType === "loan") {
    const borrower = entry.loanFriendId
      ? getFriendName(notebook, entry.loanFriendId)
      : "Unknown";

    return entry.description
      ? `Loan to ${borrower} - ${entry.description}`
      : `Loan to ${borrower}`;
  }

  return entry.description || "No description";
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

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function buildTimeline(entries: NotebookEntry[]) {
  const grouped = new Map<number, number>();
  const formatter = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
  });

  entries.forEach((entry) => {
    const day = startOfDay(getEntryDate(entry)).getTime();

    grouped.set(day, (grouped.get(day) || 0) + entry.amount);
  });

  const today = startOfDay(new Date());
  const days: TimelinePoint[] = [];

  for (let offset = 4; offset >= 0; offset -= 1) {
    const day = new Date(today);
    day.setDate(day.getDate() - offset);
    const key = day.getTime();

    days.push({
      label: formatter.format(day),
      amount: grouped.get(key) || 0,
    });
  }

  return days;
}

function CategoryPieChart({ categories }: { categories: CategorySummary[] }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const total = categories.reduce((sum, item) => sum + item.amount, 0);
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
      <div className="relative mx-auto grid place-items-center">
        <svg
          aria-label="Category expense pie chart"
          className="h-40 w-40 sm:h-48 sm:w-48"
          role="img"
          viewBox="0 0 160 160"
        >
          <defs>
            <filter id="categoryShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#0f172a" floodOpacity="0.12" />
            </filter>
          </defs>
          <circle
            cx="80"
            cy="80"
            fill="none"
            r={radius}
            stroke="#e4e4e7"
            strokeWidth="22"
          />
          {segments.map((category) => {
            return (
              <circle
                cx="80"
                cy="80"
                fill="none"
                key={category.category}
                r={radius}
                stroke={category.color}
                strokeDasharray={`${category.length} ${
                  circumference - category.length
                }`}
                strokeDashoffset={category.dashOffset}
                strokeLinecap="round"
                strokeWidth="22"
                transform="rotate(-90 80 80)"
                filter="url(#categoryShadow)"
              />
            );
          })}
        </svg>
        <div className="absolute text-center">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Total</p>
          <p className="text-lg font-semibold text-zinc-950">
            {formatMoney(total)}
          </p>
          <p className="text-xs text-zinc-500">
            {categories.length} categories
          </p>
        </div>
      </div>

      <div className="grid gap-3">
        {categories.map((category) => (
          <div
            className="grid gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs sm:text-sm"
            key={category.category}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className="size-3 rounded-sm"
                  style={{ backgroundColor: category.color }}
                />
                <span className="truncate font-medium text-zinc-800">
                  {category.category}
                </span>
              </div>
              <span className="text-zinc-600">
                {formatMoney(category.amount)}
              </span>
            </div>
            <div className="h-2 rounded-full bg-zinc-100">
              <div
                className="h-2 rounded-full"
                style={{
                  width: `${category.percent}%`,
                  backgroundColor: category.color,
                }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-zinc-500">
              <span>{category.count} entries</span>
              <span>{category.percent.toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelineChart({ points }: { points: TimelinePoint[] }) {
  const maxAmount = Math.max(...points.map((point) => point.amount), 0);
  const hasData = points.some((point) => point.amount > 0);
  const width = 520;
  const height = 200;
  const padding = 24;
  const xStep = points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0;

  const coordinates = points.map((point, index) => {
    const x = padding + index * xStep;
    const y = maxAmount
      ? height - padding - (point.amount / maxAmount) * (height - padding * 2)
      : height - padding;

    return { x, y, label: point.label, amount: point.amount };
  });

  const linePath = coordinates
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`)
    .join(" ");
  const areaPath = `${linePath} L ${padding + (points.length - 1) * xStep},${height - padding} L ${padding},${height - padding} Z`;

  if (!points.length || !hasData) {
    return (
      <div className="grid min-h-64 place-items-center rounded-lg border border-zinc-200 bg-zinc-50 text-sm text-zinc-500">
        No expense data in the last 5 days.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[520px] rounded-lg border border-zinc-200 bg-white px-4 py-5">
        <svg
          className="h-48 w-full"
          role="img"
          viewBox={`0 0 ${width} ${height}`}
        >
          <defs>
            <linearGradient id="timelineFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75, 1].map((tick) => (
            <line
              key={tick}
              x1={padding}
              x2={width - padding}
              y1={height - padding - (height - padding * 2) * tick}
              y2={height - padding - (height - padding * 2) * tick}
              stroke="#e4e4e7"
              strokeDasharray="4 4"
              strokeWidth="1"
            />
          ))}
          <path d={areaPath} fill="url(#timelineFill)" />
          <path
            d={linePath}
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {coordinates.map((point) => (
            <g key={point.label}>
              <circle cx={point.x} cy={point.y} r="5" fill="#10b981" />
              <circle cx={point.x} cy={point.y} r="9" fill="#10b981" opacity="0.12" />
            </g>
          ))}
        </svg>
        <div className="mt-3 grid grid-cols-5 gap-2 text-xs text-zinc-600">
          {coordinates.map((point) => (
            <div className="text-center" key={point.label}>
              <p className="font-medium text-zinc-800">{point.label}</p>
              <p>{formatMoney(point.amount)}</p>
            </div>
          ))}
        </div>
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
  const total = points.reduce((sum, point) => sum + point.amount, 0);

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
      <div className="grid min-h-64 gap-4 rounded-lg border border-zinc-200 bg-white px-4 py-5">
        {points.map((point, index) => {
          const width = maxAmount
            ? Math.max((point.amount / maxAmount) * 100, 2)
            : 2;
          const color = chartColors[index % chartColors.length];
          const percent = total ? (point.amount / total) * 100 : 0;

          return (
            <div className="grid gap-2" key={point.label}>
              <div className="flex justify-between text-sm font-medium">
                <span className="text-zinc-700">{point.label}</span>
                <span className="text-zinc-950">
                  {formatMoney(point.amount)}
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-zinc-100">
                <div
                  className="h-3 rounded-full transition-all"
                  style={{
                    width: `${width}%`,
                    background: `linear-gradient(90deg, ${color}, #10b981)`
                  }}
                />
              </div>
              <div className="text-xs text-zinc-500">
                {percent.toFixed(1)}% of total spending
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
  const expenseEntries = entries.filter((entry) => entry.entryType !== "loan");
  const loanEntries = entries.filter((entry) => entry.entryType === "loan");
  const totalExpense = expenseEntries.reduce(
    (sum, entry) => sum + entry.amount,
    0,
  );
  const totalLoaned = loanEntries.reduce(
    (sum, entry) => sum + entry.amount,
    0,
  );
  const settlements = useMemo(
    () => calculateSettlements(notebook?.friends || [], entries),
    [entries, notebook?.friends],
  );
  const categories = useMemo(
    () => buildCategorySummary(expenseEntries),
    [expenseEntries],
  );
  const timeline = useMemo(() => buildTimeline(expenseEntries), [expenseEntries]);
  const averageEntry = expenseEntries.length
    ? totalExpense / expenseEntries.length
    : 0;
  const isNotebookOwner = Boolean(user && notebook?.ownerUid === user.uid);

  const itemsPerPage = 7;
  const totalPages = Math.max(1, Math.ceil(entries.length / itemsPerPage));
  const paginatedEntries = entries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

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
      const html2canvas = (await import("html2canvas-pro")).default;
      const { jsPDF } = await import("jspdf");
      const element = document.getElementById("report-container");
      
      if (element) {
        const canvas = await html2canvas(element, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL("image/jpeg", 0.98);
        const pdf = new jsPDF({ unit: "in", format: "letter", orientation: "portrait" });
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        // Add 0.5 inch margins
        const margin = 0.5;
        const availableWidth = pdfWidth - margin * 2;
        const finalHeight = (canvas.height * availableWidth) / canvas.width;
        
        pdf.addImage(imgData, "JPEG", margin, margin, availableWidth, finalHeight);
        pdf.save(`${notebook?.name || "notebook"}-report.pdf`);
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
      <section className="min-w-0 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="grid gap-4 sm:flex sm:flex-wrap sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Report
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-zinc-950 sm:text-3xl">
              {notebook.name}
            </h1>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Expense review, category split, timeline, and final settlement.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
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
              className="inline-flex h-11 items-center justify-center rounded-md border border-zinc-300 bg-white px-4 text-center text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-100"
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

      <div id="report-container" className="grid min-w-0 gap-6 bg-stone-50 pb-4">
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-5">
          <SurfaceCard>
            <p className="text-sm font-medium text-zinc-600">Total expense</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-950">
              {formatMoney(totalExpense)}
            </p>
          </SurfaceCard>
          <SurfaceCard>
            <p className="text-sm font-medium text-zinc-600">Entries</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-950">
              {expenseEntries.length}
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
          <SurfaceCard>
            <p className="text-sm font-medium text-zinc-600">Loans total</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-950">
              {formatMoney(totalLoaned)}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {loanEntries.length} loan entries
            </p>
          </SurfaceCard>
        </section>

        <div className="grid min-w-0 gap-4 sm:gap-6 lg:grid-cols-[1fr_420px]">
          <SurfaceCard>
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-zinc-950">
                Timeline graph
              </h2>
              <p className="mt-1 text-sm text-zinc-600">
                Spending totals for the last 5 days.
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

        <div className="grid min-w-0 gap-4 sm:gap-6 lg:grid-cols-[1fr_1fr]">
          <SurfaceCard>
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-zinc-950">
                Who pays how much
              </h2>
              <p className="mt-1 text-sm text-zinc-600">
                Total amount paid by each friend.
              </p>
            </div>
            <WhoPaysGraph entries={expenseEntries} notebook={notebook} />
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
              <div className="-mx-4 overflow-x-auto px-4 sm:-mx-0 sm:px-0">
                <div className="min-w-[320px] overflow-hidden rounded-lg border border-zinc-200">
                <div className="grid grid-cols-[1fr_1fr_auto] gap-2 bg-zinc-50 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-zinc-500 sm:grid-cols-3 sm:gap-3 sm:px-4 sm:py-3">
                  <span>From</span>
                  <span>To</span>
                  <span>Amount</span>
                </div>
                <div className="divide-y divide-zinc-200">
                  {settlements.map((settlement) => (
                    <div
                      className="grid grid-cols-[1fr_1fr_auto] gap-2 px-3 py-3 text-xs sm:grid-cols-3 sm:gap-3 sm:px-4 sm:py-4 sm:text-sm"
                      key={`${settlement.from}-${settlement.to}-${settlement.amount}`}
                    >
                      <span className="truncate font-medium text-zinc-950">
                        {settlement.from}
                      </span>
                      <span className="truncate text-zinc-700">{settlement.to}</span>
                      <span className="whitespace-nowrap font-semibold text-zinc-950">
                        {formatMoney(settlement.amount)}
                      </span>
                    </div>
                  ))}
                </div>
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
              <div className="-mx-4 overflow-x-auto px-4 sm:-mx-0 sm:px-0">
              <div className="min-w-[320px] overflow-hidden rounded-lg border border-zinc-200">
                <div className="grid grid-cols-[1fr_60px_90px] gap-2 bg-zinc-50 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-zinc-500 sm:grid-cols-[1fr_90px_120px] sm:gap-3 sm:px-4 sm:py-3">
                  <span>Category</span>
                  <span>Entries</span>
                  <span>Total</span>
                </div>
                <div className="divide-y divide-zinc-200">
                  {categories.map((category) => (
                    <div
                      className="grid grid-cols-[1fr_60px_90px] gap-2 px-3 py-3 text-xs sm:grid-cols-[1fr_90px_120px] sm:gap-3 sm:px-4 sm:py-4 sm:text-sm"
                      key={category.category}
                    >
                      <span className="flex items-center gap-2 font-medium text-zinc-950 sm:gap-3">
                        <span
                          className="size-2.5 shrink-0 rounded-sm sm:size-3"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="truncate">{category.category}</span>
                      </span>
                      <span className="text-zinc-700">{category.count}</span>

                      <span className="font-semibold text-zinc-950">
                        {formatMoney(category.amount)}
                      </span>
                    </div>
                  ))}
                </div>
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
              Entries table
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              Expenses and loans in table format.
            </p>
          </div>
          {entries.length ? (
            <div className="overflow-x-auto">
              <div className="min-w-[580px] overflow-hidden rounded-lg border border-zinc-200">
                <div className="grid grid-cols-[90px_1fr_100px_100px_100px] gap-2 bg-zinc-50 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-zinc-500 sm:grid-cols-[120px_1fr_130px_130px_130px] sm:gap-3 sm:px-4 sm:py-3">
                  <span>Date</span>
                  <span>Description</span>
                  <span>Category</span>
                  <span>Paid by</span>
                  <span>Amount</span>
                </div>
                <div className="divide-y divide-zinc-200">
                  {paginatedEntries.map((entry) => (
                    <div
                      className="grid grid-cols-[90px_1fr_100px_100px_100px] gap-2 px-3 py-3 text-xs sm:grid-cols-[120px_1fr_130px_130px_130px] sm:gap-3 sm:px-4 sm:py-4 sm:text-sm"
                      key={entry.id}
                    >
                      <span className="text-zinc-600">
                        {new Intl.DateTimeFormat("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }).format(getEntryDate(entry))}
                      </span>
                      <span className="truncate font-medium text-zinc-950">
                        {getEntrySummary(entry, notebook)}
                      </span>
                      <span className="truncate text-zinc-700">{entry.category}</span>
                      <span className="truncate text-zinc-700">
                        {getFriendName(notebook, entry.paidByFriendId)}
                      </span>
                      <span className="font-semibold text-zinc-950">
                        {formatMoney(entry.amount)}
                      </span>
                    </div>
                  ))}
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
