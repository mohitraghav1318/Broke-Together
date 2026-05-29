import { FormEvent } from "react";
import { AppButton } from "@/components/ui/app-button";
import { InlineAlert } from "@/components/ui/inline-alert";
import { TextInput } from "@/components/ui/text-input";
import type {
  HisabaNotebook,
  NotebookEntryType,
} from "@/features/notebooks/lib/hisaba-notebooks";
import { useNotebookEntryForm } from "@/features/notebooks/hooks/use-notebook-entry-form";

type NotebookEntryDraft = {
  entryType: NotebookEntryType;
  amount: string;
  paidByFriendId: string;
  loanFriendId: string;
  category: string;
  description: string;
};

type NotebookEntryFormProps = {
  notebook: HisabaNotebook;
  categories: string[];
  isSaving: boolean;
  onSubmit: (draft: NotebookEntryDraft) => Promise<boolean>;
};

export function NotebookEntryForm({
  notebook,
  categories,
  isSaving,
  onSubmit,
}: NotebookEntryFormProps) {
  const {
    state,
    setEntryType,
    setAmount,
    setPaidByFriendId,
    setLoanFriendId,
    setCategory,
    setDescription,
    borrowerOptions,
    resetForm,
  } = useNotebookEntryForm({ notebook, categories });

  const isLoan = state.entryType === "loan";
  const canPickBorrower = borrowerOptions.length > 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const success = await onSubmit({
      ...state,
      loanFriendId: isLoan ? state.loanFriendId : "",
    });

    if (success) {
      resetForm();
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <label
        className="grid gap-2 text-sm font-medium text-zinc-800"
        htmlFor="entry-type"
      >
        Entry type
        <select
          className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-base text-zinc-950 outline-none transition-colors focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          id="entry-type"
          onChange={(event) =>
            setEntryType(event.target.value as NotebookEntryType)
          }
          value={state.entryType}
        >
          <option value="expense">Expense (shared)</option>
          <option value="loan">Lend money</option>
        </select>
      </label>

      <TextInput
        id="amount"
        label={isLoan ? "Amount lent" : "Money paid"}
        min="0"
        onChange={(event) => setAmount(event.target.value)}
        placeholder="120.00"
        step="1"
        type="number"
        value={state.amount}
      />

      <label
        className="grid gap-2 text-sm font-medium text-zinc-800"
        htmlFor="paid-by"
      >
        {isLoan ? "Lender" : "By whom"}
        <select
          className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-base text-zinc-950 outline-none transition-colors focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          id="paid-by"
          onChange={(event) => setPaidByFriendId(event.target.value)}
          value={state.paidByFriendId}
        >
          {notebook.friends.map((friend) => (
            <option key={friend.id} value={friend.id}>
              {friend.name}
            </option>
          ))}
        </select>
      </label>

      {isLoan ? (
        <label
          className="grid gap-2 text-sm font-medium text-zinc-800"
          htmlFor="borrower"
        >
          Borrower
          <select
            className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-base text-zinc-950 outline-none transition-colors focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            disabled={!canPickBorrower}
            id="borrower"
            onChange={(event) => setLoanFriendId(event.target.value)}
            value={state.loanFriendId}
          >
            {borrowerOptions.map((friend) => (
              <option key={friend.id} value={friend.id}>
                {friend.name}
              </option>
            ))}
          </select>
          {!canPickBorrower ? (
            <span className="text-xs text-zinc-500">
              Add another friend to lend money.
            </span>
          ) : null}
        </label>
      ) : (
        <label
          className="grid gap-2 text-sm font-medium text-zinc-800"
          htmlFor="category"
        >
          On what
          <select
            className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-base text-zinc-950 outline-none transition-colors focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            id="category"
            onChange={(event) => setCategory(event.target.value)}
            value={state.category}
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      )}

      <label
        className="grid gap-2 text-sm font-medium text-zinc-800"
        htmlFor="description"
      >
        {isLoan ? "Note" : "Description"}
        <textarea
          className="min-h-24 rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-950 outline-none transition-colors placeholder:text-zinc-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          id="description"
          onChange={(event) => setDescription(event.target.value)}
          placeholder={isLoan ? "Reason or note" : "Items, notes, or leave empty"}
          value={state.description}
        />
      </label>

      {isLoan ? (
        <InlineAlert tone="info">
          Loans are not split. They directly add a balance between two friends.
        </InlineAlert>
      ) : null}

      <AppButton disabled={isSaving} type="submit">
        {isSaving ? "Saving..." : "Add entry"}
      </AppButton>
    </form>
  );
}
