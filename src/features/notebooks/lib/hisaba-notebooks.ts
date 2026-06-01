import { FirebaseError } from "firebase/app";
import type { User } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
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

export type NotebookEntryType = "expense" | "loan";

export type NotebookEntry = {
  id: string;
  entryType: NotebookEntryType;
  amount: number;
  paidByFriendId: string;
  splitFriendIds: string[];
  loanFriendId: string | null;
  category: string;
  description: string;
  createdByUid: string;
  createdByName: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  deletedAt: Timestamp | null;
};

export type Settlement = {
  from: string;
  to: string;
  amount: number;
};

export type NotebookActivityType =
  | "entry.created"
  | "entry.updated"
  | "entry.deleted"
  | "entry.restored"
  | "member.joined"
  | "member.added"
  | "member.removed"
  | "notebook.renamed";

export type NotebookActivity = {
  id: string;
  type: NotebookActivityType;
  actorUid: string;
  actorName: string;
  targetType: "entry" | "member" | "notebook";
  targetId: string;
  summary: string;
  createdAt: Timestamp | null;
  metadata: Record<string, unknown>;
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
  snapshot:
    | DocumentSnapshot<DocumentData>
    | QueryDocumentSnapshot<DocumentData>,
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

export function getNotebookCategories(
  notebook: Pick<HisabaNotebook, "categories">,
) {
  return notebook.categories.length
    ? notebook.categories
    : defaultNotebookCategories;
}

function entryFromSnapshot(
  snapshot:
    | DocumentSnapshot<DocumentData>
    | QueryDocumentSnapshot<DocumentData>,
): NotebookEntry {
  const data = snapshot.data() || {};

  return {
    id: snapshot.id,
    entryType: data.entryType === "loan" ? "loan" : "expense",
    amount: Number(data.amount || 0),
    paidByFriendId: String(data.paidByFriendId || ""),
    splitFriendIds: Array.isArray(data.splitFriendIds)
      ? data.splitFriendIds
      : [],
    loanFriendId: data.loanFriendId ? String(data.loanFriendId) : null,
    category: String(data.category || "General"),
    description: String(data.description || ""),
    createdByUid: String(data.createdByUid || ""),
    createdByName: String(data.createdByName || "Friend"),
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
    deletedAt: data.deletedAt || null,
  };
}

function activityFromSnapshot(
  snapshot: QueryDocumentSnapshot<DocumentData>,
): NotebookActivity {
  const data = snapshot.data();

  return {
    id: snapshot.id,
    type: String(data.type || "entry.created") as NotebookActivityType,
    actorUid: String(data.actorUid || ""),
    actorName: String(data.actorName || "Friend"),
    targetType: String(data.targetType || "entry") as NotebookActivity["targetType"],
    targetId: String(data.targetId || ""),
    summary: String(data.summary || "Notebook activity"),
    createdAt: data.createdAt || null,
    metadata:
      data.metadata && typeof data.metadata === "object"
        ? data.metadata
        : {},
  };
}

function getFriendNameFromData(notebook: DocumentData, friendId: string | null) {
  const friends = Array.isArray(notebook.friends) ? notebook.friends : [];

  if (!friendId) {
    return "Unknown";
  }

  return (
    friends.find((friend: NotebookFriend) => friend.id === friendId)?.name ||
    "Unknown"
  );
}

function getEntryActivityLabel(
  type: Extract<
    NotebookActivityType,
    "entry.created" | "entry.updated" | "entry.deleted" | "entry.restored"
  >,
  entryType: NotebookEntryType,
) {
  const noun = entryType === "loan" ? "loan" : "expense";

  if (type === "entry.created") {
    return `added a ${noun}`;
  }

  if (type === "entry.updated") {
    return `edited a ${noun}`;
  }

  if (type === "entry.deleted") {
    return `removed a ${noun}`;
  }

  return `restored a ${noun}`;
}

function buildEntryActivitySummary(
  type: Extract<
    NotebookActivityType,
    "entry.created" | "entry.updated" | "entry.deleted" | "entry.restored"
  >,
  actorName: string,
  entry: Pick<
    NotebookEntry,
    "entryType" | "amount" | "category" | "paidByFriendId" | "loanFriendId"
  >,
  notebook: DocumentData,
) {
  const action = getEntryActivityLabel(type, entry.entryType);
  const payerName = getFriendNameFromData(notebook, entry.paidByFriendId);

  if (entry.entryType === "loan") {
    const borrowerName = getFriendNameFromData(notebook, entry.loanFriendId);

    return `${actorName} ${action} of ${formatMoney(entry.amount)} from ${payerName} to ${borrowerName}`;
  }

  return `${actorName} ${action} of ${formatMoney(entry.amount)} for ${entry.category}`;
}

function entryActivityMetadata(
  entry: Pick<
    NotebookEntry,
    | "entryType"
    | "amount"
    | "paidByFriendId"
    | "splitFriendIds"
    | "loanFriendId"
    | "category"
    | "description"
  >,
) {
  return {
    entryType: entry.entryType,
    amount: entry.amount,
    paidByFriendId: entry.paidByFriendId,
    splitFriendIds: entry.splitFriendIds,
    loanFriendId: entry.loanFriendId,
    category: entry.category,
    description: entry.description,
  };
}

type NotebookEntryInput = Pick<
  NotebookEntry,
  "amount" | "paidByFriendId" | "category" | "entryType" | "loanFriendId"
> & {
  description?: string;
};

function validateNotebookEntryInput(
  notebook: DocumentData,
  input: NotebookEntryInput,
) {
  const amount = Number(input.amount);
  const entryType = input.entryType === "loan" ? "loan" : "expense";
  const category =
    entryType === "loan"
      ? "Loan"
      : normalizeCategory(input.category) || "General";
  const friends = Array.isArray(notebook.friends) ? notebook.friends : [];
  const categories = Array.isArray(notebook.categories)
    ? notebook.categories
    : defaultNotebookCategories;
  const splitFriendIds = friends.map((friend: NotebookFriend) => friend.id);

  if (!Number.isFinite(amount) || amount <= 0 || !Number.isInteger(amount)) {
    throw new InvalidEntryError("Add a whole-number amount.");
  }

  if (!input.paidByFriendId) {
    throw new InvalidEntryError("Choose who paid.");
  }

  if (splitFriendIds.length === 0) {
    throw new InvalidEntryError(
      "Add at least one friend before adding entries.",
    );
  }

  if (!splitFriendIds.includes(input.paidByFriendId)) {
    throw new InvalidEntryError("Choose a friend from this notebook.");
  }

  if (entryType === "expense" && !categories.includes(category)) {
    throw new InvalidEntryError("Choose a category from this notebook.");
  }

  if (entryType === "loan") {
    if (!input.loanFriendId) {
      throw new InvalidEntryError("Choose who is borrowing the money.");
    }

    if (input.loanFriendId === input.paidByFriendId) {
      throw new InvalidEntryError("Lender and borrower must be different.");
    }

    if (!splitFriendIds.includes(input.loanFriendId)) {
      throw new InvalidEntryError("Choose a friend from this notebook.");
    }
  }

  return {
    amount,
    entryType: entryType as NotebookEntryType,
    category,
    splitFriendIds,
    description: input.description?.trim() || "",
  };
}

async function getNotebookEntryRef(
  notebookId: string,
  entryId: string,
) {
  const entryRef = doc(firebaseDb, "notebooks", notebookId, "entries", entryId);
  const entrySnapshot = await getDoc(entryRef);

  if (!entrySnapshot.exists()) {
    throw new InvalidEntryError("Entry not found.");
  }

  return { entryRef, entrySnapshot };
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
        .filter((entry) => !entry.deletedAt)
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

export function subscribeRecentNotebookActivities(
  notebookId: string,
  activityLimit: number,
  onNext: (activities: NotebookActivity[]) => void,
  onError: (error: unknown) => void,
) {
  const activitiesQuery = query(
    collection(firebaseDb, "notebooks", notebookId, "activities"),
    orderBy("createdAt", "desc"),
    limit(activityLimit),
  );

  return onSnapshot(
    activitiesQuery,
    (snapshot) => {
      onNext(snapshot.docs.map(activityFromSnapshot));
    },
    onError,
  );
}

export async function clearNotebookEntries(
  notebookId: string,
  entries: NotebookEntry[],
) {
  const batch = writeBatch(firebaseDb);

  for (const entry of entries) {
    const entryRef = doc(
      firebaseDb,
      "notebooks",
      notebookId,
      "entries",
      entry.id,
    );
    batch.delete(entryRef);
  }

  await batch.commit();
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
  const activityRef = doc(
    collection(firebaseDb, "notebooks", notebookId, "activities"),
  );

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

    const alreadyMember = memberIds.includes(user.uid);
    const actorName = getUserName(user);

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

    if (!alreadyMember) {
      transaction.set(activityRef, {
        type: "member.joined",
        actorUid: user.uid,
        actorName,
        targetType: "member",
        targetId: user.uid,
        summary: `${actorName} joined the notebook`,
        metadata: {
          memberId: user.uid,
          memberName: actorName,
        },
        createdAt: serverTimestamp(),
      });
    }
  });
}

export async function updateNotebookName(
  notebookId: string,
  user: User,
  name: string,
) {
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new EmptyNotebookNameError();
  }

  const notebookRef = doc(firebaseDb, "notebooks", notebookId);
  const notebook = await getDoc(notebookRef);

  if (!notebook.exists()) {
    throw new Error("Notebook not found.");
  }

  const previousName = String(notebook.data().name || "Untitled notebook");
  const batch = writeBatch(firebaseDb);

  batch.update(notebookRef, {
    name: trimmedName,
    updatedAt: serverTimestamp(),
  });

  if (previousName !== trimmedName) {
    batch.set(doc(collection(firebaseDb, "notebooks", notebookId, "activities")), {
      type: "notebook.renamed",
      actorUid: user.uid,
      actorName: getUserName(user),
      targetType: "notebook",
      targetId: notebookId,
      summary: `${getUserName(user)} renamed the notebook from ${previousName} to ${trimmedName}`,
      metadata: {
        previousName,
        nextName: trimmedName,
      },
      createdAt: serverTimestamp(),
    });
  }

  await batch.commit();
}

export async function addNotebookFriend(
  notebookId: string,
  user: User,
  name: string,
) {
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

  const batch = writeBatch(firebaseDb);
  const friendId = createId();

  batch.update(notebookRef, {
    friends: [
      ...friends,
      {
        id: friendId,
        name: trimmedName,
        email: null,
        uid: null,
      },
    ],
    updatedAt: serverTimestamp(),
  });

  batch.set(doc(collection(firebaseDb, "notebooks", notebookId, "activities")), {
    type: "member.added",
    actorUid: user.uid,
    actorName: getUserName(user),
    targetType: "member",
    targetId: friendId,
    summary: `${getUserName(user)} added ${trimmedName} to the notebook`,
    metadata: {
      memberId: friendId,
      memberName: trimmedName,
    },
    createdAt: serverTimestamp(),
  });

  await batch.commit();
}

export async function removeNotebookFriend(
  notebookId: string,
  user: User,
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

  const removedFriend = friends.find(
    (friend: NotebookFriend) => friend.id === friendId,
  );
  const batch = writeBatch(firebaseDb);

  batch.update(notebookRef, {
    friends: nextFriends,
    updatedAt: serverTimestamp(),
  });

  batch.set(doc(collection(firebaseDb, "notebooks", notebookId, "activities")), {
    type: "member.removed",
    actorUid: user.uid,
    actorName: getUserName(user),
    targetType: "member",
    targetId: friendId,
    summary: `${getUserName(user)} removed ${
      removedFriend?.name || "a friend"
    } from the notebook`,
    metadata: {
      memberId: friendId,
      memberName: removedFriend?.name || "",
    },
    createdAt: serverTimestamp(),
  });

  await batch.commit();
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
  entry: NotebookEntryInput,
) {
  const notebookRef = doc(firebaseDb, "notebooks", notebookId);
  const notebook = await getDoc(notebookRef);

  if (!notebook.exists()) {
    throw new Error("Notebook not found.");
  }

  const data = notebook.data();
  const payload = validateNotebookEntryInput(data, entry);

  const entryRef = doc(collection(firebaseDb, "notebooks", notebookId, "entries"));
  const batch = writeBatch(firebaseDb);
  const activityEntry = {
    entryType: payload.entryType,
    amount: payload.amount,
    paidByFriendId: entry.paidByFriendId,
    splitFriendIds:
      payload.entryType === "loan"
        ? [entry.loanFriendId || ""]
        : payload.splitFriendIds,
    loanFriendId: payload.entryType === "loan" ? entry.loanFriendId : null,
    category: payload.category,
    description: payload.description,
  };
  const entryPayload = {
    entryType: payload.entryType,
    amount: payload.amount,
    paidByFriendId: entry.paidByFriendId,
    splitFriendIds:
      payload.entryType === "loan"
        ? [entry.loanFriendId]
        : payload.splitFriendIds,
    loanFriendId: payload.entryType === "loan" ? entry.loanFriendId : null,
    category: payload.category,
    description: payload.description,
    createdByUid: user.uid,
    createdByName: getUserName(user),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    deletedAt: null,
  };

  batch.set(entryRef, entryPayload);
  batch.update(notebookRef, {
    updatedAt: serverTimestamp(),
  });
  batch.set(doc(collection(firebaseDb, "notebooks", notebookId, "activities")), {
    type: "entry.created",
    actorUid: user.uid,
    actorName: getUserName(user),
    targetType: "entry",
    targetId: entryRef.id,
    summary: buildEntryActivitySummary(
      "entry.created",
      getUserName(user),
      activityEntry,
      data,
    ),
    metadata: entryActivityMetadata(activityEntry),
    createdAt: serverTimestamp(),
  });

  await batch.commit();
}

export async function updateNotebookEntry(
  notebookId: string,
  user: User,
  entryId: string,
  input: NotebookEntryInput,
) {
  const notebookRef = doc(firebaseDb, "notebooks", notebookId);
  const notebook = await getDoc(notebookRef);

  if (!notebook.exists()) {
    throw new Error("Notebook not found.");
  }

  const { entryRef, entrySnapshot } = await getNotebookEntryRef(
    notebookId,
    entryId,
  );

  const payload = validateNotebookEntryInput(notebook.data(), input);

  const nextEntry = {
    entryType: payload.entryType,
    amount: payload.amount,
    paidByFriendId: input.paidByFriendId,
    splitFriendIds:
      payload.entryType === "loan"
        ? [input.loanFriendId]
        : payload.splitFriendIds,
    loanFriendId: payload.entryType === "loan" ? input.loanFriendId : null,
    category: payload.category,
    description: payload.description,
    updatedAt: serverTimestamp(),
    deletedAt: entrySnapshot.data().deletedAt || null,
  };
  const previousEntry = entryFromSnapshot(
    entrySnapshot as QueryDocumentSnapshot<DocumentData>,
  );
  const nextActivityEntry = {
    entryType: payload.entryType,
    amount: payload.amount,
    paidByFriendId: input.paidByFriendId,
    splitFriendIds:
      payload.entryType === "loan"
        ? [input.loanFriendId || ""]
        : payload.splitFriendIds,
    loanFriendId: payload.entryType === "loan" ? input.loanFriendId : null,
    category: payload.category,
    description: payload.description,
  };
  const batch = writeBatch(firebaseDb);

  batch.update(entryRef, nextEntry);

  batch.update(notebookRef, {
    updatedAt: serverTimestamp(),
  });
  batch.set(doc(collection(firebaseDb, "notebooks", notebookId, "activities")), {
    type: "entry.updated",
    actorUid: user.uid,
    actorName: getUserName(user),
    targetType: "entry",
    targetId: entryId,
    summary: buildEntryActivitySummary(
      "entry.updated",
      getUserName(user),
      nextActivityEntry,
      notebook.data(),
    ),
    metadata: {
      before: entryActivityMetadata(previousEntry),
      after: entryActivityMetadata(nextActivityEntry),
    },
    createdAt: serverTimestamp(),
  });

  await batch.commit();
}

export async function softDeleteNotebookEntry(
  notebookId: string,
  user: User,
  entryId: string,
) {
  const notebookRef = doc(firebaseDb, "notebooks", notebookId);
  const notebook = await getDoc(notebookRef);

  if (!notebook.exists()) {
    throw new Error("Notebook not found.");
  }

  const { entryRef, entrySnapshot } = await getNotebookEntryRef(
    notebookId,
    entryId,
  );
  const entry = entryFromSnapshot(
    entrySnapshot as QueryDocumentSnapshot<DocumentData>,
  );
  const batch = writeBatch(firebaseDb);

  batch.update(entryRef, {
    deletedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  batch.update(notebookRef, {
    updatedAt: serverTimestamp(),
  });
  batch.set(doc(collection(firebaseDb, "notebooks", notebookId, "activities")), {
    type: "entry.deleted",
    actorUid: user.uid,
    actorName: getUserName(user),
    targetType: "entry",
    targetId: entryId,
    summary: buildEntryActivitySummary(
      "entry.deleted",
      getUserName(user),
      entry,
      notebook.data(),
    ),
    metadata: entryActivityMetadata(entry),
    createdAt: serverTimestamp(),
  });

  await batch.commit();
}

export async function restoreNotebookEntry(
  notebookId: string,
  user: User,
  entryId: string,
) {
  const notebookRef = doc(firebaseDb, "notebooks", notebookId);
  const notebook = await getDoc(notebookRef);

  if (!notebook.exists()) {
    throw new Error("Notebook not found.");
  }

  const { entryRef, entrySnapshot } = await getNotebookEntryRef(
    notebookId,
    entryId,
  );
  const entry = entryFromSnapshot(
    entrySnapshot as QueryDocumentSnapshot<DocumentData>,
  );
  const batch = writeBatch(firebaseDb);

  batch.update(entryRef, {
    deletedAt: null,
    updatedAt: serverTimestamp(),
  });

  batch.update(notebookRef, {
    updatedAt: serverTimestamp(),
  });
  batch.set(doc(collection(firebaseDb, "notebooks", notebookId, "activities")), {
    type: "entry.restored",
    actorUid: user.uid,
    actorName: getUserName(user),
    targetType: "entry",
    targetId: entryId,
    summary: buildEntryActivitySummary(
      "entry.restored",
      getUserName(user),
      entry,
      notebook.data(),
    ),
    metadata: entryActivityMetadata(entry),
    createdAt: serverTimestamp(),
  });

  await batch.commit();
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

    const splitFriendIds =
      entry.entryType === "loan" && entry.loanFriendId
        ? [entry.loanFriendId]
        : entry.splitFriendIds.length
          ? entry.splitFriendIds
          : friends.map((friend) => friend.id);
    const validSplitFriendIds = splitFriendIds.filter((friendId) =>
      balances.has(friendId),
    );

    if (validSplitFriendIds.length === 0) {
      return;
    }

    const units = entry.amount;
    const baseShare = Math.floor(units / validSplitFriendIds.length);
    const remainder = units % validSplitFriendIds.length;

    validSplitFriendIds.forEach((friendId, index) => {
      const share = baseShare + (index < remainder ? 1 : 0);
      balances.set(friendId, (balances.get(friendId) || 0) - share);
    });

    balances.set(
      entry.paidByFriendId,
      (balances.get(entry.paidByFriendId) || 0) + units,
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
        amount,
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
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
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

export async function deleteNotebook(notebookId: string, user: User) {
  const notebookRef = doc(firebaseDb, "notebooks", notebookId);
  const notebook = await getDoc(notebookRef);

  if (!notebook.exists()) {
    throw new Error("Notebook not found.");
  }

  const data = notebook.data();
  if (data.ownerUid !== user.uid) {
    throw new Error("Only the creator can delete this notebook.");
  }

  await deleteDoc(notebookRef);
}
