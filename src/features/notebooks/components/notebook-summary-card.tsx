import Link from "next/link";
import { SummaryMetricCard } from "@/components/ui/summary-metric-card";
import { SurfaceCard } from "@/components/ui/surface-card";
import {
  calculateSettlements,
  formatMoney,
  type HisabaNotebook,
  type NotebookEntry,
} from "@/features/notebooks/lib/hisaba-notebooks";

type NotebookSummaryCardProps = {
  entries: NotebookEntry[];
  notebook: HisabaNotebook;
  notebookId: string;
};

function isCurrentMonthExpense(entry: NotebookEntry) {
  if (entry.entryType !== "expense" || !entry.createdAt) {
    return false;
  }

  const entryDate = entry.createdAt.toDate();
  const now = new Date();

  return (
    entryDate.getFullYear() === now.getFullYear() &&
    entryDate.getMonth() === now.getMonth()
  );
}

export function NotebookSummaryCard({
  entries,
  notebook,
  notebookId,
}: NotebookSummaryCardProps) {
  const currentMonthExpenses = entries.filter(isCurrentMonthExpense);
  const loanEntries = entries.filter((entry) => entry.entryType === "loan");
  const currentMonthTotal = currentMonthExpenses.reduce(
    (sum, entry) => sum + entry.amount,
    0,
  );
  const totalLentMoney = loanEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const loanCount = loanEntries.length;
  const settlements = calculateSettlements(notebook.friends, entries);

  return (
    <SurfaceCard>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-zinc-950">Summary</h2>
          <p className="mt-1 text-sm text-zinc-600">
            This month&apos;s spending, total lent money, and current settlement.
          </p>
        </div>
        <Link
          className="inline-flex h-11 items-center justify-center rounded-md border border-transparent bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
          href={`/notebooks/${notebookId}/report`}
        >
          Generate detailed report
        </Link>
      </div>

      <div className="grid gap-4 xl:grid-cols-[220px_220px_1fr]">
        <SummaryMetricCard
          detail={`${currentMonthExpenses.length} ${
            currentMonthExpenses.length === 1 ? "expense" : "expenses"
          } this month`}
          label="Expenses this month"
          value={formatMoney(currentMonthTotal)}
        />

        <SummaryMetricCard
          detail={`${loanCount} ${loanCount === 1 ? "loan" : "loans"} recorded`}
          label="Total lent money"
          tone="emerald"
          value={formatMoney(totalLentMoney)}
        />

        <div className="rounded-lg border border-zinc-200 bg-white xl:col-span-1">
          <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Who pays whom
          </div>
          {settlements.length ? (
            <div className="divide-y divide-zinc-200">
              {settlements.map((settlement) => (
                <div
                  className="grid grid-cols-[1fr_auto] gap-3 px-4 py-3 text-sm"
                  key={`${settlement.from}-${settlement.to}-${settlement.amount}`}
                >
                  <p className="min-w-0 text-zinc-700">
                    <span className="font-semibold text-zinc-950">
                      {settlement.from}
                    </span>{" "}
                    pays{" "}
                    <span className="font-semibold text-zinc-950">
                      {settlement.to}
                    </span>
                  </p>
                  <p className="whitespace-nowrap font-semibold text-zinc-950">
                    {formatMoney(settlement.amount)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="px-4 py-5 text-sm text-zinc-600">
              Everyone is settled.
            </p>
          )}
        </div>
      </div>
    </SurfaceCard>
  );
}
