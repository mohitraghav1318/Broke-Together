import { SurfaceCard } from "@/components/ui/surface-card";
import { formatMoney } from "@/features/notebooks/lib/hisaba-notebooks";
import type { PersonalExpense } from "@/features/personal-expenses/lib/personal-expenses";

type PersonalExpenseSummaryCardProps = {
  expenses: PersonalExpense[];
};

type CategorySummary = {
  amount: number;
  category: string;
  color: string;
  count: number;
  percent: number;
};

const chartColors = [
  "#059669",
  "#0284c7",
  "#d97706",
  "#dc2626",
  "#7c3aed",
  "#0f766e",
  "#be123c",
];

function buildCategorySummary(expenses: PersonalExpense[]) {
  const grouped = new Map<string, { amount: number; count: number }>();
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  expenses.forEach((expense) => {
    const current = grouped.get(expense.category) || { amount: 0, count: 0 };

    grouped.set(expense.category, {
      amount: current.amount + expense.amount,
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
      <div className="grid min-h-48 place-items-center rounded-lg border border-zinc-200 bg-zinc-50 text-sm text-zinc-500">
        No category data yet.
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[180px_1fr] lg:items-center">
      <div className="relative mx-auto grid place-items-center">
        <svg
          aria-label="Personal expense category pie chart"
          className="h-40 w-40"
          role="img"
          viewBox="0 0 160 160"
        >
          <circle
            cx="80"
            cy="80"
            fill="none"
            r={radius}
            stroke="#e4e4e7"
            strokeWidth="22"
          />
          {segments.map((category) => (
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
            />
          ))}
        </svg>
        <div className="absolute text-center">
          <p className="text-xs uppercase text-zinc-500">Total</p>
          <p className="text-lg font-semibold text-zinc-950">
            {formatMoney(total)}
          </p>
        </div>
      </div>

      <div className="grid gap-2">
        {categories.map((category) => (
          <div
            className="grid gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
            key={category.category}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="size-3 shrink-0 rounded-sm"
                  style={{ backgroundColor: category.color }}
                />
                <span className="truncate font-medium text-zinc-800">
                  {category.category}
                </span>
              </div>
              <span className="whitespace-nowrap text-zinc-700">
                {formatMoney(category.amount)}
              </span>
            </div>
            <div className="h-2 rounded-full bg-zinc-100">
              <div
                className="h-2 rounded-full"
                style={{
                  backgroundColor: category.color,
                  width: `${category.percent}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-zinc-500">
              <span>
                {category.count} {category.count === 1 ? "expense" : "expenses"}
              </span>
              <span>{category.percent.toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PersonalExpenseSummaryCard({
  expenses,
}: PersonalExpenseSummaryCardProps) {
  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const categories = buildCategorySummary(expenses);

  return (
    <SurfaceCard>
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-zinc-950">Summary</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Total spending and category split.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[260px_1fr]">
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-sm font-medium text-zinc-600">Total expense</p>
          <p className="mt-2 text-3xl font-semibold text-zinc-950">
            {formatMoney(totalSpent)}
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            {expenses.length} {expenses.length === 1 ? "expense" : "expenses"}
          </p>
        </div>

        <CategoryPieChart categories={categories} />
      </div>
    </SurfaceCard>
  );
}
