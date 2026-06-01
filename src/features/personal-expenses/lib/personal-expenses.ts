import { FirebaseError } from "firebase/app";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { firebaseDb } from "@/firebase/firebase-client";

export type PersonalExpense = {
  id: string;
  userId: string;
  amount: number;
  currency: "INR";
  category: string;
  description: string;
  entryDate: string;
  source: "manual" | "recurring";
  recurringId: string | null;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  deletedAt: Timestamp | null;
};

export type CreatePersonalExpenseInput = {
  amount: number;
  category: string;
  description: string;
  entryDate: string;
};

type ExpenseOwnershipCheck = {
  expenseRef: ReturnType<typeof doc>;
  expenseSnapshot: Awaited<ReturnType<typeof getDoc>>;
};

class InvalidPersonalExpenseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidPersonalExpenseError";
  }
}

function normalizeCategory(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

async function getOwnedExpenseRef(userId: string, expenseId: string) {
  const expenseRef = doc(firebaseDb, "users", userId, "personalExpenses", expenseId);
  const expenseSnapshot = await getDoc(expenseRef);

  if (!expenseSnapshot.exists()) {
    throw new InvalidPersonalExpenseError("Expense not found.");
  }

  if (expenseSnapshot.data().userId !== userId) {
    throw new InvalidPersonalExpenseError("You can only manage your own expense.");
  }

  return { expenseRef, expenseSnapshot } satisfies ExpenseOwnershipCheck;
}

function expenseFromSnapshot(
  snapshot: QueryDocumentSnapshot<DocumentData>,
): PersonalExpense {
  const data = snapshot.data();

  return {
    id: snapshot.id,
    userId: String(data.userId || ""),
    amount: Number(data.amount || 0),
    currency: data.currency === "INR" ? "INR" : "INR",
    category: String(data.category || "Uncategorized"),
    description: String(data.description || ""),
    entryDate: String(data.entryDate || ""),
    source: data.source === "recurring" ? "recurring" : "manual",
    recurringId: data.recurringId ? String(data.recurringId) : null,
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
    deletedAt: data.deletedAt || null,
  };
}

export function subscribePersonalExpenses(
  userId: string,
  onNext: (expenses: PersonalExpense[]) => void,
  onError: (error: unknown) => void,
): Unsubscribe {
  const expensesQuery = query(
    collection(firebaseDb, "users", userId, "personalExpenses"),
    orderBy("createdAt", "desc"),
  );

  return onSnapshot(
    expensesQuery,
    (snapshot) => {
      const expenses = snapshot.docs
        .map(expenseFromSnapshot)
        .filter((expense) => !expense.deletedAt);
      onNext(expenses);
    },
    onError,
  );
}

export async function createPersonalExpense(
  userId: string,
  input: CreatePersonalExpenseInput,
) {
  const amount = Number(input.amount);
  const category = normalizeCategory(input.category);
  const description = input.description.trim();
  const entryDate = input.entryDate.trim();

  if (!amount || amount <= 0) {
    throw new InvalidPersonalExpenseError("Enter a valid amount.");
  }

  if (!category) {
    throw new InvalidPersonalExpenseError("Add a category.");
  }

  if (!entryDate) {
    throw new InvalidPersonalExpenseError("Pick a date.");
  }

  await addDoc(collection(firebaseDb, "users", userId, "personalExpenses"), {
    userId,
    amount,
    currency: "INR",
    category,
    description,
    entryDate,
    source: "manual",
    recurringId: null,
    deletedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updatePersonalExpense(
  userId: string,
  expenseId: string,
  input: CreatePersonalExpenseInput,
) {
  const amount = Number(input.amount);
  const category = normalizeCategory(input.category);
  const description = input.description.trim();
  const entryDate = input.entryDate.trim();
  const { expenseRef } = await getOwnedExpenseRef(userId, expenseId);

  if (!amount || amount <= 0) {
    throw new InvalidPersonalExpenseError("Enter a valid amount.");
  }

  if (!category) {
    throw new InvalidPersonalExpenseError("Add a category.");
  }

  if (!entryDate) {
    throw new InvalidPersonalExpenseError("Pick a date.");
  }

  await updateDoc(expenseRef, {
    amount,
    category,
    description,
    entryDate,
    updatedAt: serverTimestamp(),
  });
}

export async function deletePersonalExpense(userId: string, expenseId: string) {
  const { expenseRef } = await getOwnedExpenseRef(userId, expenseId);

  await updateDoc(expenseRef, {
    deletedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function restorePersonalExpense(userId: string, expenseId: string) {
  const { expenseRef } = await getOwnedExpenseRef(userId, expenseId);

  await updateDoc(expenseRef, {
    deletedAt: null,
    updatedAt: serverTimestamp(),
  });
}

export function getPersonalExpenseErrorMessage(error: unknown) {
  if (error instanceof InvalidPersonalExpenseError) {
    return error.message;
  }

  if (error instanceof FirebaseError && error.code === "permission-denied") {
    return "Firestore rules blocked this expense action.";
  }

  return "Something went wrong. Please try again.";
}
