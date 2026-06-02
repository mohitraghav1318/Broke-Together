"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppButton } from "@/components/ui/app-button";
import { InlineAlert } from "@/components/ui/inline-alert";
import { TextInput } from "@/components/ui/text-input";

export type PersonalExpenseDraft = {
  amount: string;
  category: string;
  description: string;
  entryDate: string;
};

type PersonalExpenseDialogProps = {
  errorMessage?: string;
  initialValues: PersonalExpenseDraft;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (draft: PersonalExpenseDraft) => Promise<boolean>;
  submitLabel: string;
  title: string;
};

export function PersonalExpenseDialog({
  errorMessage = "",
  initialValues,
  isSaving,
  onClose,
  onSubmit,
  submitLabel,
  title,
}: PersonalExpenseDialogProps) {
  const [amount, setAmount] = useState(initialValues.amount);
  const [category, setCategory] = useState(initialValues.category);
  const [description, setDescription] = useState(initialValues.description);
  const [entryDate] = useState(initialValues.entryDate);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSaving) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSaving, onClose]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const success = await onSubmit({
      amount,
      category,
      description,
      entryDate,
    });

    if (success) {
      onClose();
    }
  }

  return (
    <div
      aria-labelledby="personal-expense-dialog-title"
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/45 px-4 py-6"
      role="dialog"
    >
      <div className="max-h-[calc(100vh-3rem)] w-full max-w-xl overflow-y-auto rounded-lg border border-zinc-200 bg-white p-4 shadow-xl sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2
            className="text-xl font-semibold text-zinc-950"
            id="personal-expense-dialog-title"
          >
            {title}
          </h2>
          <AppButton
            aria-label="Close dialog"
            className="h-9 px-3"
            disabled={isSaving}
            onClick={onClose}
            type="button"
            variant="ghost"
          >
            Close
          </AppButton>
        </div>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <TextInput
            id="personal-expense-amount"
            label="Amount"
            min="0"
            onChange={(event) => setAmount(event.target.value)}
            placeholder="120"
            step="1"
            type="number"
            value={amount}
          />

          <TextInput
            id="personal-expense-category"
            label="Category"
            onChange={(event) => setCategory(event.target.value)}
            placeholder="Food, Travel, Shopping"
            type="text"
            value={category}
          />

          <label
            className="grid gap-2 text-sm font-medium text-zinc-800"
            htmlFor="personal-expense-description"
          >
            Description
            <textarea
              className="min-h-24 rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-950 outline-none transition-colors placeholder:text-zinc-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              id="personal-expense-description"
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
              {isSaving ? "Saving..." : submitLabel}
            </AppButton>
            <AppButton
              disabled={isSaving}
              onClick={onClose}
              type="button"
              variant="secondary"
            >
              Cancel
            </AppButton>
          </div>
        </form>
      </div>
    </div>
  );
}
