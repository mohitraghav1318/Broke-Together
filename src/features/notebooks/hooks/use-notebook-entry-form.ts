import { useEffect, useMemo, useState } from "react";
import type {
  HisabaNotebook,
  NotebookEntryType,
} from "@/features/notebooks/lib/hisaba-notebooks";

type UseNotebookEntryFormArgs = {
  notebook: HisabaNotebook;
  categories: string[];
};

type NotebookEntryFormState = {
  entryType: NotebookEntryType;
  amount: string;
  paidByFriendId: string;
  loanFriendId: string;
  category: string;
  description: string;
};

function getDefaultBorrower(friends: HisabaNotebook["friends"], lenderId: string) {
  return friends.find((friend) => friend.id !== lenderId)?.id || "";
}

export function useNotebookEntryForm({
  notebook,
  categories,
}: UseNotebookEntryFormArgs) {
  const [entryType, setEntryType] = useState<NotebookEntryType>("expense");
  const [amount, setAmount] = useState("");
  const [paidByFriendId, setPaidByFriendId] = useState("");
  const [loanFriendId, setLoanFriendId] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!notebook.friends.length) {
      return;
    }

    setPaidByFriendId((current) => {
      if (current && notebook.friends.some((friend) => friend.id === current)) {
        return current;
      }

      return notebook.friends[0]?.id || "";
    });
  }, [notebook.friends]);

  useEffect(() => {
    setCategory((current) => {
      if (current && categories.includes(current)) {
        return current;
      }

      return categories[0] || "";
    });
  }, [categories]);

  useEffect(() => {
    setLoanFriendId((current) => {
      if (
        current &&
        current !== paidByFriendId &&
        notebook.friends.some((friend) => friend.id === current)
      ) {
        return current;
      }

      return getDefaultBorrower(notebook.friends, paidByFriendId);
    });
  }, [notebook.friends, paidByFriendId]);

  const borrowerOptions = useMemo(
    () =>
      notebook.friends.filter((friend) => friend.id !== paidByFriendId),
    [notebook.friends, paidByFriendId],
  );

  function resetForm() {
    setAmount("");
    setDescription("");
  }

  const state: NotebookEntryFormState = {
    entryType,
    amount,
    paidByFriendId,
    loanFriendId,
    category,
    description,
  };

  return {
    state,
    setEntryType,
    setAmount,
    setPaidByFriendId,
    setLoanFriendId,
    setCategory,
    setDescription,
    borrowerOptions,
    resetForm,
  };
}
