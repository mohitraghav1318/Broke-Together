import { useState } from "react";
import { AppButton } from "@/components/ui/app-button";
import { SurfaceCard } from "@/components/ui/surface-card";
import { formatMoney } from "@/features/notebooks/lib/hisaba-notebooks";
import type { PersonalExpense } from "@/features/personal-expenses/lib/personal-expenses";

type PersonalExpenseActivityTableProps = {
  expenses: PersonalExpense[];
  isDeletingExpenseId: string | null;
  isSaving: boolean;
  onAddExpense: () => void;
  onDeleteExpense: (expense: PersonalExpense) => void;
  onEditExpense: (expense: PersonalExpense) => void;
};

function formatExpenseTimestamp(timestamp: PersonalExpense["createdAt"]) {
  const date = timestamp?.toDate();

  if (!date) {
    return "No date";
  }

  const datePart = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
  const timePart = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);

  return `${datePart} • ${timePart}`;
}

export function PersonalExpenseActivityTable({
  expenses,
  isDeletingExpenseId,
  isSaving,
  onAddExpense,
  onDeleteExpense,
  onEditExpense,
}: PersonalExpenseActivityTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;
  const totalPages = Math.max(1, Math.ceil(expenses.length / rowsPerPage));
  const page = Math.min(currentPage, totalPages);
  const visibleRows = expenses.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );

  return (
    <SurfaceCard>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-zinc-950">
            Recent activity
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Latest personal expense changes.
          </p>
        </div>
        <AppButton onClick={onAddExpense} type="button">
          Add expense
        </AppButton>
      </div>

      {expenses.length ? (
        <div className="overflow-hidden rounded-lg border border-zinc-200">
          <div className="grid grid-cols-[1fr_110px] gap-3 bg-zinc-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 md:grid-cols-[1fr_150px_130px_170px]">
            <span>Activity</span>
            <span>Amount</span>
            <span className="hidden md:block">Category</span>
            <span className="hidden md:block">Actions</span>
          </div>
          <div className="divide-y divide-zinc-200">
            {visibleRows.map((expense) => (
              <div
                className="grid grid-cols-[1fr_110px] gap-3 px-4 py-4 text-sm md:grid-cols-[1fr_150px_130px_170px]"
                key={expense.id}
              >
                <div className="min-w-0">
                  <p className="font-semibold text-zinc-950">
                    {expense.description || "Expense added"}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {formatExpenseTimestamp(expense.createdAt)}
                  </p>
                  <p className="mt-2 text-xs font-medium text-zinc-600 md:hidden">
                    {expense.category}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 md:hidden">
                    <AppButton
                      className="h-9 px-3"
                      onClick={() => onEditExpense(expense)}
                      type="button"
                      variant="secondary"
                    >
                      Edit
                    </AppButton>
                    <AppButton
                      className="h-9 px-3"
                      disabled={isDeletingExpenseId === expense.id || isSaving}
                      onClick={() => onDeleteExpense(expense)}
                      type="button"
                      variant="danger"
                    >
                      {isDeletingExpenseId === expense.id ? "Deleting..." : "Delete"}
                    </AppButton>
                  </div>
                </div>
                <p className="font-semibold text-zinc-950">
                  {formatMoney(expense.amount)}
                </p>
                <p className="hidden truncate text-zinc-700 md:block">
                  {expense.category}
                </p>
                <div className="hidden gap-2 md:flex">
                  <AppButton
                    className="h-9 px-3"
                    onClick={() => onEditExpense(expense)}
                    type="button"
                    variant="secondary"
                  >
                    Edit
                  </AppButton>
                  <AppButton
                    className="h-9 px-3"
                    disabled={isDeletingExpenseId === expense.id || isSaving}
                    onClick={() => onDeleteExpense(expense)}
                    type="button"
                    variant="danger"
                  >
                    {isDeletingExpenseId === expense.id ? "Deleting..." : "Delete"}
                  </AppButton>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 ? (
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-zinc-200 bg-white px-4 py-3">
              <p className="text-sm text-zinc-700">
                Showing{" "}
                <span className="font-medium">
                  {(page - 1) * rowsPerPage + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(page * rowsPerPage, expenses.length)}
                </span>{" "}
                of <span className="font-medium">{expenses.length}</span>{" "}
                activities
              </p>
              <div className="flex gap-2">
                <AppButton
                  disabled={page === 1}
                  onClick={() => setCurrentPage((current) => current - 1)}
                  type="button"
                  variant="secondary"
                >
                  Previous
                </AppButton>
                <AppButton
                  disabled={page === totalPages}
                  onClick={() => setCurrentPage((current) => current + 1)}
                  type="button"
                  variant="secondary"
                >
                  Next
                </AppButton>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <h3 className="text-lg font-semibold text-zinc-950">
            No activity yet
          </h3>
          <p className="mt-1 text-sm leading-6 text-zinc-600">
            Add your first personal expense to get started.
          </p>
        </div>
      )}
    </SurfaceCard>
  );
}
