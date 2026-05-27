import { FirebaseError } from "firebase/app";
import type { User } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentSnapshot,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { firebaseDb } from "@/firebase/firebase-client";

export type NotebookFriend = {
  id: string;
  name: string;
  email: string | null;
  uid: string | null;
};

export type HisabaNotebook = {
  id: string;
  name: string;
  ownerUid: string;
  memberIds: string[];
  friends: NotebookFriend[];
  categories: string[];
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
};

export type NotebookEntry = {
  id: string;
  amount: number;
  paidByFriendId: string;
  splitFriendIds: string[];
  category: string;
  description: string;
  createdByUid: string;
  createdByName: string;
  createdAt: Timestamp | null;
};

export type Settlement = {
  from: string;
  to: string;
  amount: number;
};

class EmptyNotebookNameError extends Error {
  constructor() {
    super("Add a notebook name first.");
    this.name = "EmptyNotebookNameError";
  }
}

class EmptyFriendNameError extends Error {
  constructor() {
    super("Add a friend name first.");
    this.name = "EmptyFriendNameError";
  }
}

class EmptyCategoryNameError extends Error {
  constructor() {
    super("Add a category name first.");
    this.name = "EmptyCategoryNameError";
  }
}

class InvalidEntryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidEntryError";
  }
}

export const defaultNotebookCategories = [
  "Food",
  "Travel",
  "Stay",
  "Groceries",
  "Bills",
  "Shopping",
  "Other",
];

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2);
}

function normalizeCategory(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function getUserName(user: User) {
  return user.displayName || user.email?.split("@")[0] || "Friend";
}

function notebookFromSnapshot(
  snapshot: DocumentSnapshot<DocumentData> | QueryDocumentSnapshot<DocumentData>,
): HisabaNotebook {
  const data = snapshot.data() || {};

  return {
    id: snapshot.id,
    name: String(data.name || "Untitled notebook"),
    ownerUid: String(data.ownerUid || ""),
    memberIds: Array.isArray(data.memberIds) ? data.memberIds : [],
    friends: Array.isArray(data.friends) ? data.friends : [],
    categories: Array.isArray(data.categories)
      ? data.categories
      : defaultNotebookCategories,
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  };
}

export function getNotebookCategories(notebook: Pick<HisabaNotebook, "categories">) {
  return notebook.categories.length ? notebook.categories : defaultNotebookCategories;
}

function entryFromSnapshot(
  snapshot: QueryDocumentSnapshot<DocumentData>,
): NotebookEntry {
  const data = snapshot.data();

  return {
    id: snapshot.id,
    amount: Number(data.amount || 0),
    paidByFriendId: String(data.paidByFriendId || ""),
    splitFriendIds: Array.isArray(data.splitFriendIds)
      ? data.splitFriendIds
      : [],
    category: String(data.category || "General"),
    description: String(data.description || ""),
    createdByUid: String(data.createdByUid || ""),
    createdByName: String(data.createdByName || "Friend"),
    createdAt: data.createdAt || null,
  };
}

export function subscribeUserNotebooks(
  userId: string,
  onNext: (notebooks: HisabaNotebook[]) => void,
  onError: (error: unknown) => void,
): Unsubscribe {
  const notebooksQuery = query(
    collection(firebaseDb, "notebooks"),
    where("memberIds", "array-contains", userId),
  );

  return onSnapshot(
    notebooksQuery,
    (snapshot) => {
      const notebooks = snapshot.docs
        .map(notebookFromSnapshot)
        .sort((first, second) => {
          const firstTime = first.updatedAt?.toMillis() || 0;
          const secondTime = second.updatedAt?.toMillis() || 0;

          return secondTime - firstTime;
        });

      onNext(notebooks);
    },
    onError,
  );
}

export function subscribeNotebook(
  notebookId: string,
  onNext: (notebook: HisabaNotebook | null) => void,
  onError: (error: unknown) => void,
) {
  return onSnapshot(
    doc(firebaseDb, "notebooks", notebookId),
    (snapshot) => {
      onNext(snapshot.exists() ? notebookFromSnapshot(snapshot) : null);
    },
    onError,
  );
}

export function subscribeNotebookEntries(
  notebookId: string,
  onNext: (entries: NotebookEntry[]) => void,
  onError: (error: unknown) => void,
) {
  return onSnapshot(
    collection(firebaseDb, "notebooks", notebookId, "entries"),
    (snapshot) => {
      const entries = snapshot.docs
        .map(entryFromSnapshot)
        .sort((first, second) => {
          const firstTime = first.createdAt?.toMillis() || 0;
          const secondTime = second.createdAt?.toMillis() || 0;

          return secondTime - firstTime;
        });

      onNext(entries);
    },
    onError,
  );
}

export async function createNotebook(user: User, name: string) {
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new EmptyNotebookNameError();
  }

  const ownerFriend: NotebookFriend = {
    id: user.uid,
    name: getUserName(user),
    email: user.email,
    uid: user.uid,
  };

  const notebookRef = await addDoc(collection(firebaseDb, "notebooks"), {
    name: trimmedName,
    ownerUid: user.uid,
    memberIds: [user.uid],
    friends: [ownerFriend],
    categories: defaultNotebookCategories,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return notebookRef.id;
}

export async function joinNotebook(notebookId: string, user: User) {
  const notebookRef = doc(firebaseDb, "notebooks", notebookId);

  await runTransaction(firebaseDb, async (transaction) => {
    const notebook = await transaction.get(notebookRef);

    if (!notebook.exists()) {
      throw new Error("Notebook not found.");
    }

    const data = notebook.data();
    const memberIds = Array.isArray(data.memberIds) ? data.memberIds : [];
    const friends = Array.isArray(data.friends) ? data.friends : [];
    const nextFriends = friends.some(
      (friend: NotebookFriend) => friend.uid === user.uid,
    )
      ? friends
      : [
          ...friends,
          {
            id: user.uid,
            name: getUserName(user),
            email: user.email,
            uid: user.uid,
          },
        ];

    transaction.update(notebookRef, {
      memberIds: memberIds.includes(user.uid)
        ? memberIds
        : [...memberIds, user.uid],
      friends: nextFriends,
      categories: Array.isArray(data.categories)
        ? data.categories
        : defaultNotebookCategories,
      updatedAt: serverTimestamp(),
    });
  });
}

export async function updateNotebookName(notebookId: string, name: string) {
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new EmptyNotebookNameError();
  }

  await updateDoc(doc(firebaseDb, "notebooks", notebookId), {
    name: trimmedName,
    updatedAt: serverTimestamp(),
  });
}

export async function addNotebookFriend(notebookId: string, name: string) {
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new EmptyFriendNameError();
  }

  const notebookRef = doc(firebaseDb, "notebooks", notebookId);
  const notebook = await getDoc(notebookRef);

  if (!notebook.exists()) {
    throw new Error("Notebook not found.");
  }

  const data = notebook.data();
  const friends = Array.isArray(data.friends) ? data.friends : [];

  await updateDoc(notebookRef, {
    friends: [
      ...friends,
      {
        id: createId(),
        name: trimmedName,
        email: null,
        uid: null,
      },
    ],
    updatedAt: serverTimestamp(),
  });
}

export async function removeNotebookFriend(
  notebookId: string,
  friendId: string,
) {
  const notebookRef = doc(firebaseDb, "notebooks", notebookId);
  const notebook = await getDoc(notebookRef);

  if (!notebook.exists()) {
    throw new Error("Notebook not found.");
  }

  const data = notebook.data();
  const friends = Array.isArray(data.friends) ? data.friends : [];
  const nextFriends = friends.filter(
    (friend: NotebookFriend) => friend.id !== friendId,
  );

  if (nextFriends.length === friends.length) {
    return;
  }

  if (nextFriends.length === 0) {
    throw new InvalidEntryError("A notebook needs at least one friend.");
  }

  await updateDoc(notebookRef, {
    friends: nextFriends,
    updatedAt: serverTimestamp(),
  });
}

export async function addNotebookCategory(
  notebookId: string,
  category: string,
) {
  const nextCategory = normalizeCategory(category);

  if (!nextCategory) {
    throw new EmptyCategoryNameError();
  }

  const notebookRef = doc(firebaseDb, "notebooks", notebookId);
  const notebook = await getDoc(notebookRef);

  if (!notebook.exists()) {
    throw new Error("Notebook not found.");
  }

  const data = notebook.data();
  const categories = Array.isArray(data.categories)
    ? data.categories
    : defaultNotebookCategories;
  const exists = categories.some(
    (item: string) => item.toLowerCase() === nextCategory.toLowerCase(),
  );

  if (exists) {
    return;
  }

  await updateDoc(notebookRef, {
    categories: [...categories, nextCategory],
    updatedAt: serverTimestamp(),
  });
}

export async function removeNotebookCategory(
  notebookId: string,
  category: string,
) {
  const notebookRef = doc(firebaseDb, "notebooks", notebookId);
  const notebook = await getDoc(notebookRef);

  if (!notebook.exists()) {
    throw new Error("Notebook not found.");
  }

  const data = notebook.data();
  const categories = Array.isArray(data.categories)
    ? data.categories
    : defaultNotebookCategories;
  const nextCategories = categories.filter((item: string) => item !== category);

  if (nextCategories.length === categories.length) {
    return;
  }

  if (nextCategories.length === 0) {
    throw new InvalidEntryError("A notebook needs at least one category.");
  }

  await updateDoc(notebookRef, {
    categories: nextCategories,
    updatedAt: serverTimestamp(),
  });
}

export async function addNotebookEntry(
  notebookId: string,
  user: User,
  entry: Pick<NotebookEntry, "amount" | "paidByFriendId" | "category"> & {
    description?: string;
  },
) {
  const amount = Number(entry.amount);
  const category = normalizeCategory(entry.category) || "General";

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new InvalidEntryError("Add a valid paid amount.");
  }

  if (!entry.paidByFriendId) {
    throw new InvalidEntryError("Choose who paid.");
  }

  const notebookRef = doc(firebaseDb, "notebooks", notebookId);
  const notebook = await getDoc(notebookRef);

  if (!notebook.exists()) {
    throw new Error("Notebook not found.");
  }

  const data = notebook.data();
  const friends = Array.isArray(data.friends) ? data.friends : [];
  const categories = Array.isArray(data.categories)
    ? data.categories
    : defaultNotebookCategories;
  const splitFriendIds = friends.map((friend: NotebookFriend) => friend.id);

  if (splitFriendIds.length === 0) {
    throw new InvalidEntryError("Add at least one friend before adding entries.");
  }

  if (!splitFriendIds.includes(entry.paidByFriendId)) {
    throw new InvalidEntryError("Choose a friend from this notebook.");
  }

  if (!categories.includes(category)) {
    throw new InvalidEntryError("Choose a category from this notebook.");
  }

  await addDoc(collection(firebaseDb, "notebooks", notebookId, "entries"), {
    amount,
    paidByFriendId: entry.paidByFriendId,
    splitFriendIds,
    category,
    description: entry.description?.trim() || "",
    createdByUid: user.uid,
    createdByName: getUserName(user),
    createdAt: serverTimestamp(),
  });

  await updateDoc(notebookRef, {
    updatedAt: serverTimestamp(),
  });
}

export function calculateSettlements(
  friends: NotebookFriend[],
  entries: NotebookEntry[],
) {
  const balances = new Map<string, number>();
  const friendNames = new Map<string, string>();

  friends.forEach((friend) => {
    balances.set(friend.id, 0);
    friendNames.set(friend.id, friend.name);
  });

  entries.forEach((entry) => {
    if (!balances.has(entry.paidByFriendId) || friends.length === 0) {
      return;
    }

    const splitFriendIds = entry.splitFriendIds.length
      ? entry.splitFriendIds
      : friends.map((friend) => friend.id);
    const validSplitFriendIds = splitFriendIds.filter((friendId) =>
      balances.has(friendId),
    );

    if (validSplitFriendIds.length === 0) {
      return;
    }

    const cents = Math.round(entry.amount * 100);
    const baseShare = Math.floor(cents / validSplitFriendIds.length);
    const remainder = cents % validSplitFriendIds.length;

    validSplitFriendIds.forEach((friendId, index) => {
      const share = baseShare + (index < remainder ? 1 : 0);
      balances.set(friendId, (balances.get(friendId) || 0) - share);
    });

    balances.set(
      entry.paidByFriendId,
      (balances.get(entry.paidByFriendId) || 0) + cents,
    );
  });

  const debtors = Array.from(balances.entries())
    .filter(([, balance]) => balance < 0)
    .map(([id, balance]) => ({ id, amount: -balance }))
    .sort((first, second) => second.amount - first.amount);
  const creditors = Array.from(balances.entries())
    .filter(([, balance]) => balance > 0)
    .map(([id, balance]) => ({ id, amount: balance }))
    .sort((first, second) => second.amount - first.amount);
  const settlements: Settlement[] = [];
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amount = Math.min(debtor.amount, creditor.amount);

    if (amount > 0) {
      settlements.push({
        from: friendNames.get(debtor.id) || "Someone",
        to: friendNames.get(creditor.id) || "Someone",
        amount: amount / 100,
      });
    }

    debtor.amount -= amount;
    creditor.amount -= amount;

    if (debtor.amount === 0) {
      debtorIndex += 1;
    }

    if (creditor.amount === 0) {
      creditorIndex += 1;
    }
  }

  return settlements;
}

export function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    currency: "INR",
    style: "currency",
  }).format(amount);
}

export function getNotebookErrorMessage(error: unknown) {
  if (
    error instanceof EmptyNotebookNameError ||
    error instanceof EmptyFriendNameError ||
    error instanceof EmptyCategoryNameError ||
    error instanceof InvalidEntryError
  ) {
    return error.message;
  }

  if (error instanceof FirebaseError) {
    if (error.code === "permission-denied") {
      return "Firestore rules blocked this notebook action.";
    }
  }

  if (error instanceof Error && error.message === "Notebook not found.") {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}
