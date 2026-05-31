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
import { enforceAuthSession } from "@/features/auth/lib/auth-session";
import {
  createPersonalExpense,
  getPersonalExpenseErrorMessage,
  subscribePersonalExpenses,
  updatePersonalExpense,
  type PersonalExpense,
} from "@/features/personal-expenses/lib/personal-expenses";
import { formatMoney } from "@/features/notebooks/lib/hisaba-notebooks";

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatExpenseTimestamp(timestamp: PersonalExpense["createdAt"]) {
  const date = timestamp?.toDate();

  if (!date) {
    return "";
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

export function PersonalExpensesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [expenses, setExpenses] = useState<PersonalExpense[]>([]);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [editingEntryDate, setEditingEntryDate] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    return onAuthStateChanged(firebaseAuth, async (currentUser) => {
      const activeUser = await enforceAuthSession(currentUser);
      setUser(activeUser);
      if (!activeUser) {
        setExpenses([]);
      }
      setIsAuthLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    return subscribePersonalExpenses(user.uid, setExpenses, (error) =>
      setErrorMessage(getPersonalExpenseErrorMessage(error)),
    );
  }, [user]);

  const totalSpent = useMemo(
    () => expenses.reduce((sum, expense) => sum + expense.amount, 0),
    [expenses],
  );

  const isEditing = Boolean(editingExpenseId);

  function resetForm() {
    setAmount("");
    setCategory("");
    setDescription("");
    setEditingExpenseId(null);
    setEditingEntryDate("");
  }

  function handleEditExpense(expense: PersonalExpense) {
    setEditingExpenseId(expense.id);
    setAmount(String(expense.amount));
    setCategory(expense.category);
    setDescription(expense.description);
    setEditingEntryDate(expense.entryDate);
    setErrorMessage("");
  }

  function handleCancelEdit() {
    resetForm();
    setErrorMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      const payload = {
        amount: Number(amount),
        category,
        description,
        entryDate: isEditing ? editingEntryDate : getTodayDate(),
      };

      if (isEditing && editingExpenseId) {
        await updatePersonalExpense(user.uid, editingExpenseId, payload);
      } else {
        await createPersonalExpense(user.uid, payload);
      }

      resetForm();
    } catch (error) {
      setErrorMessage(getPersonalExpenseErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  if (isAuthLoading) {
    return <LoadingPlaceholder label="Loading expenses" />;
  }

  if (!user) {
    return (
      <SurfaceCard className="grid max-w-xl gap-4">
        <h1 className="text-2xl font-semibold text-zinc-950">
          Sign in required
        </h1>
        <p className="text-sm leading-6 text-zinc-600">
          Sign in to track personal expenses.
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
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <SurfaceCard className="self-start">
        <div className="mb-6 grid gap-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Personal expenses
          </p>
          <h1 className="text-3xl font-semibold text-zinc-950">
            {isEditing ? "Edit expense" : "Add expense"}
          </h1>
          <p className="text-sm leading-6 text-zinc-600">
            Track what you spend each day. Your latest expenses appear on the
            right.
          </p>
        </div>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <TextInput
            id="amount"
            label="Amount"
            min="0"
            onChange={(event) => setAmount(event.target.value)}
            placeholder="120"
            step="1"
            type="number"
            value={amount}
          />

          <TextInput
            id="category"
            label="Category"
            onChange={(event) => setCategory(event.target.value)}
            placeholder="Food, Travel, Shopping"
            type="text"
            value={category}
          />

          <label
            className="grid gap-2 text-sm font-medium text-zinc-800"
            htmlFor="description"
          >
            Description
            <textarea
              className="min-h-24 rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-950 outline-none transition-colors placeholder:text-zinc-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              id="description"
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Notes or items"
              value={description}
            />
          </label>

          {errorMessage ? (
            <InlineAlert tone="error">{errorMessage}</InlineAlert>
          ) : null}

          <div className="flex gap-3">
            <AppButton disabled={isSaving} type="submit">
              {isSaving ? "Saving..." : isEditing ? "Save changes" : "Add expense"}
            </AppButton>

            {isEditing ? (
              <AppButton
                disabled={isSaving}
                onClick={handleCancelEdit}
                type="button"
                variant="secondary"
              >
                Cancel
              </AppButton>
            ) : null}
          </div>
        </form>
      </SurfaceCard>

      <section className="grid gap-4">
        <SurfaceCard className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-2xl font-semibold text-zinc-950">
              Recent expenses
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              Sorted by newest first.
            </p>
          </div>
          <div className="text-sm font-semibold text-emerald-700">
            Total: {formatMoney(totalSpent)}
          </div>
        </SurfaceCard>

        {expenses.length ? (
          <div className="grid gap-3">
            {expenses.map((expense) => (
              <SurfaceCard key={expense.id} className="grid gap-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="grid gap-1">
                    <p className="text-sm font-semibold text-zinc-950">
                      {expense.category}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {formatExpenseTimestamp(expense.createdAt) || "No date"}
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="text-right text-sm font-semibold text-zinc-900">
                      {formatMoney(expense.amount)}
                    </div>
                    <AppButton
                      onClick={() => handleEditExpense(expense)}
                      type="button"
                      variant="secondary"
                    >
                      Edit
                    </AppButton>
                  </div>
                </div>
                {expense.description ? (
                  <p className="text-sm text-zinc-600">
                    {expense.description}
                  </p>
                ) : null}
              </SurfaceCard>
            ))}
          </div>
        ) : (
          <SurfaceCard className="grid gap-2">
            <h3 className="text-lg font-semibold text-zinc-950">
              No expenses yet
            </h3>
            <p className="text-sm leading-6 text-zinc-600">
              Add your first personal expense to get started.
            </p>
          </SurfaceCard>
        )}
      </section>
    </div>
  );
}
