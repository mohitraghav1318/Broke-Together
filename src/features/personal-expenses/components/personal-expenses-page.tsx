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
import { PersonalExpenseActivityTable } from "@/features/personal-expenses/components/personal-expense-activity-table";
import {
  PersonalExpenseDialog,
  type PersonalExpenseDraft,
} from "@/features/personal-expenses/components/personal-expense-dialog";
import { PersonalExpenseSummaryCard } from "@/features/personal-expenses/components/personal-expense-summary-card";
import {
  createPersonalExpense,
  deletePersonalExpense,
  getPersonalExpenseErrorMessage,
  subscribePersonalExpenses,
  updatePersonalExpense,
  restorePersonalExpense,
  type PersonalExpense,
} from "@/features/personal-expenses/lib/personal-expenses";

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

export function PersonalExpensesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [expenses, setExpenses] = useState<PersonalExpense[]>([]);
  const [editingExpense, setEditingExpense] = useState<PersonalExpense | null>(null);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [recentlyDeletedExpense, setRecentlyDeletedExpense] = useState<PersonalExpense | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingExpenseId, setIsDeletingExpenseId] = useState<string | null>(null);
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

  const visibleExpenses = useMemo(
    () => expenses.filter((expense) => !expense.deletedAt),
    [expenses],
  );

  const isEditing = Boolean(editingExpense);

  function getDialogInitialValues(): PersonalExpenseDraft {
    return {
      amount: editingExpense ? String(editingExpense.amount) : "",
      category: editingExpense?.category || "",
      description: editingExpense?.description || "",
      entryDate: editingExpense?.entryDate || getTodayDate(),
    };
  }

  function handleAddExpense() {
    setEditingExpense(null);
    setErrorMessage("");
    setIsExpenseDialogOpen(true);
  }

  function handleEditExpense(expense: PersonalExpense) {
    setEditingExpense(expense);
    setErrorMessage("");
    setIsExpenseDialogOpen(true);
  }

  function handleCloseExpenseDialog() {
    setIsExpenseDialogOpen(false);
    setEditingExpense(null);
    setErrorMessage("");
  }

  async function handleDeleteExpense(expense: PersonalExpense) {
    if (!user) {
      return;
    }

    setIsDeletingExpenseId(expense.id);
    setErrorMessage("");

    try {
      await deletePersonalExpense(user.uid, expense.id);
      setRecentlyDeletedExpense(expense);

      if (editingExpense?.id === expense.id) {
        handleCloseExpenseDialog();
      }
    } catch (error) {
      setErrorMessage(getPersonalExpenseErrorMessage(error));
    } finally {
      setIsDeletingExpenseId(null);
    }
  }

  async function handleUndoDelete() {
    if (!user || !recentlyDeletedExpense) {
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      await restorePersonalExpense(user.uid, recentlyDeletedExpense.id);
      setRecentlyDeletedExpense(null);
    } catch (error) {
      setErrorMessage(getPersonalExpenseErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSubmitExpense(draft: PersonalExpenseDraft) {
    if (!user) {
      return false;
    }

    const currentEditingExpense = editingExpense;

    if (!draft.amount) {
      setErrorMessage("Enter a valid amount.");
      return false;
    }

    if (!draft.category.trim()) {
      setErrorMessage("Add a category.");
      return false;
    }

    if (!draft.entryDate) {
      setErrorMessage("Pick a date.");
      return false;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      const payload = {
        amount: Number(draft.amount),
        category: draft.category,
        description: draft.description,
        entryDate: draft.entryDate,
      };

      if (currentEditingExpense) {
        await updatePersonalExpense(user.uid, currentEditingExpense.id, payload);
      } else {
        await createPersonalExpense(user.uid, payload);
      }

      handleCloseExpenseDialog();
      return true;
    } catch (error) {
      setErrorMessage(getPersonalExpenseErrorMessage(error));
      return false;
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
    <div className="grid gap-6">
      <section className="grid gap-4">
        <SurfaceCard className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-zinc-950">
              Personal expenses
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              Review spending, category split, and recent activity.
            </p>
          </div>
          <AppButton onClick={handleAddExpense} type="button">
            Add expense
          </AppButton>
        </SurfaceCard>

        {errorMessage && !isExpenseDialogOpen ? (
          <InlineAlert tone="error">{errorMessage}</InlineAlert>
        ) : null}

        {recentlyDeletedExpense ? (
          <SurfaceCard className="flex flex-wrap items-center justify-between gap-3 border-emerald-200 bg-emerald-50/60">
            <div>
              <h3 className="text-base font-semibold text-zinc-950">
                Expense deleted
              </h3>
              <p className="mt-1 text-sm text-zinc-600">
                {recentlyDeletedExpense.category} was removed. Undo if that was a mistake.
              </p>
            </div>
            <AppButton
              disabled={isSaving}
              onClick={handleUndoDelete}
              type="button"
              variant="secondary"
            >
              Undo
            </AppButton>
          </SurfaceCard>
        ) : null}

        <PersonalExpenseSummaryCard expenses={visibleExpenses} />

        <PersonalExpenseActivityTable
          expenses={visibleExpenses}
          isDeletingExpenseId={isDeletingExpenseId}
          isSaving={isSaving}
          onAddExpense={handleAddExpense}
          onDeleteExpense={handleDeleteExpense}
          onEditExpense={handleEditExpense}
        />
      </section>

      {isExpenseDialogOpen ? (
        <PersonalExpenseDialog
          errorMessage={errorMessage}
          initialValues={getDialogInitialValues()}
          isSaving={isSaving}
          onClose={handleCloseExpenseDialog}
          onSubmit={handleSubmitExpense}
          submitLabel={isEditing ? "Save changes" : "Add expense"}
          title={isEditing ? "Edit expense" : "Add expense"}
        />
      ) : null}
    </div>
  );
}
