# Firestore Schemas and TypeScript Interfaces

## 1. activities

**Collection path**

`users/{userId}/activities`

**Example document**

```json
{
  "id": "act_2026_05_31_001",
  "userId": "uid_123",
  "scope": "personal",
  "entityType": "personalExpense",
  "entityId": "pexp_abc123",
  "action": "created",
  "notebookId": null,
  "amount": 450,
  "currency": "INR",
  "category": "Food",
  "title": "Lunch",
  "createdAt": "2026-05-31T09:15:00.000Z",
  "actorUid": "uid_123",
  "metadata": {
    "source": "manual"
  }
}
```

**TypeScript interface**

```ts
export type ActivityScope = "personal" | "notebook";
export type ActivityAction = "created" | "updated" | "deleted" | "restored";

export interface Activity {
  id: string;
  userId: string;
  scope: ActivityScope;
  entityType: "personalExpense" | "budget" | "recurringExpense" | "notebookEntry";
  entityId: string;
  action: ActivityAction;
  notebookId: string | null;
  amount: number | null;
  currency: "INR";
  category: string | null;
  title: string | null;
  createdAt: FirebaseFirestore.Timestamp;
  actorUid: string;
  metadata?: {
    source?: "manual" | "recurring" | "import" | "undo";
    previousId?: string;
  };
}
```

**Required indexes**

1. `users/{userId}/activities` by `createdAt` desc
2. `users/{userId}/activities` by `entityType`, `createdAt` desc
3. `users/{userId}/activities` by `scope`, `createdAt` desc

**Security rule example**

```
match /users/{userId}/activities/{activityId} {
  allow read: if request.auth != null && request.auth.uid == userId;
  allow create: if request.auth != null
    && request.auth.uid == userId
    && request.resource.data.userId == userId
    && request.resource.data.createdAt is timestamp;
  allow update, delete: if false;
}
```

**Migration impact on current data**

No migration needed. New append-only collection.

---

## 2. deletedEntries

**Collection path**

`notebooks/{notebookId}/deletedEntries`

Optional personal: `users/{userId}/deletedEntries`

**Example document**

```json
{
  "id": "del_2026_05_31_001",
  "notebookId": "nb_123",
  "entryId": "entry_987",
  "deletedByUid": "uid_abc",
  "deletedAt": "2026-05-31T10:10:00.000Z",
  "undoUntil": "2026-06-30T10:10:00.000Z",
  "original": {
    "entryType": "expense",
    "amount": 1200,
    "paidByFriendId": "fr_1",
    "splitFriendIds": ["fr_1", "fr_2"],
    "loanFriendId": null,
    "category": "Travel",
    "description": "Airport cab",
    "createdByUid": "uid_abc",
    "createdByName": "Amit",
    "createdAt": "2026-05-31T09:00:00.000Z"
  }
}
```

**TypeScript interface**

```ts
export interface DeletedNotebookEntry {
  id: string;
  notebookId: string;
  entryId: string;
  deletedByUid: string;
  deletedAt: FirebaseFirestore.Timestamp;
  undoUntil: FirebaseFirestore.Timestamp;
  original: NotebookEntry;
}
```

**Required indexes**

1. `notebooks/{notebookId}/deletedEntries` by `undoUntil` asc
2. `notebooks/{notebookId}/deletedEntries` by `deletedAt` desc

**Security rule example**

```
match /notebooks/{notebookId}/deletedEntries/{deletedId} {
  allow read: if isNotebookMemberById(notebookId);
  allow create: if isNotebookMemberById(notebookId)
    && request.resource.data.deletedByUid == request.auth.uid
    && request.resource.data.undoUntil is timestamp;
  allow update, delete: if false;
}
```

**Migration impact on current data**

No migration required. Deletes will start writing here.

---

## 3. personalExpenses

**Collection path**

`users/{userId}/personalExpenses`

**Example document**

```json
{
  "id": "pexp_2026_05_31_001",
  "userId": "uid_123",
  "amount": 350,
  "currency": "INR",
  "category": "Food",
  "description": "Breakfast",
  "entryDate": "2026-05-31",
  "createdAt": "2026-05-31T07:30:00.000Z",
  "updatedAt": "2026-05-31T07:30:00.000Z",
  "source": "manual",
  "recurringId": null,
  "deletedAt": null
}
```

**TypeScript interface**

```ts
export interface PersonalExpense {
  id: string;
  userId: string;
  amount: number;
  currency: "INR";
  category: string;
  description: string | null;
  entryDate: string;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  source: "manual" | "recurring";
  recurringId: string | null;
  deletedAt: FirebaseFirestore.Timestamp | null;
}
```

**Required indexes**

1. `users/{userId}/personalExpenses` by `entryDate` desc
2. `users/{userId}/personalExpenses` by `category`, `entryDate` desc
3. `users/{userId}/personalExpenses` by `deletedAt`, `entryDate` desc

**Security rule example**

```
match /users/{userId}/personalExpenses/{expenseId} {
  allow read: if request.auth != null && request.auth.uid == userId;
  allow create: if request.auth != null
    && request.auth.uid == userId
    && request.resource.data.userId == userId
    && request.resource.data.amount is number
    && request.resource.data.amount > 0;
  allow update: if request.auth != null
    && request.auth.uid == userId;
  allow delete: if false;
}
```

**Migration impact on current data**

No migration required. New collection.

---

## 4. budgets

**Collection path**

`users/{userId}/budgets`

**Example document**

```json
{
  "id": "budget_2026_06",
  "userId": "uid_123",
  "period": "2026-06",
  "currency": "INR",
  "overallLimit": 15000,
  "categoryLimits": {
    "Food": 3000,
    "Travel": 2000
  },
  "createdAt": "2026-05-31T18:00:00.000Z",
  "updatedAt": "2026-05-31T18:00:00.000Z"
}
```

**TypeScript interface**

```ts
export interface Budget {
  id: string;
  userId: string;
  period: string;
  currency: "INR";
  overallLimit: number | null;
  categoryLimits: Record<string, number>;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}
```

**Required indexes**

1. `users/{userId}/budgets` by `period` desc

**Security rule example**

```
match /users/{userId}/budgets/{budgetId} {
  allow read: if request.auth != null && request.auth.uid == userId;
  allow create, update: if request.auth != null
    && request.auth.uid == userId
    && request.resource.data.userId == userId
    && request.resource.data.period is string;
  allow delete: if false;
}
```

**Migration impact on current data**

No migration required.

---

## 5. recurringExpenses

**Collection path**

`users/{userId}/recurringExpenses`

**Example document**

```json
{
  "id": "rec_001",
  "userId": "uid_123",
  "amount": 799,
  "currency": "INR",
  "category": "Subscriptions",
  "description": "Music app",
  "startDate": "2026-06-01",
  "frequency": "monthly",
  "dayOfMonth": 1,
  "nextOccurrence": "2026-06-01",
  "active": true,
  "createdAt": "2026-05-31T20:00:00.000Z",
  "updatedAt": "2026-05-31T20:00:00.000Z"
}
```

**TypeScript interface**

```ts
export type RecurringFrequency = "weekly" | "monthly";

export interface RecurringExpense {
  id: string;
  userId: string;
  amount: number;
  currency: "INR";
  category: string;
  description: string | null;
  startDate: string;
  frequency: RecurringFrequency;
  dayOfMonth: number | null;
  dayOfWeek: number | null;
  nextOccurrence: string;
  active: boolean;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}
```

**Required indexes**

1. `users/{userId}/recurringExpenses` by `nextOccurrence` asc
2. `users/{userId}/recurringExpenses` by `active`, `nextOccurrence` asc

**Security rule example**

```
match /users/{userId}/recurringExpenses/{recurringId} {
  allow read: if request.auth != null && request.auth.uid == userId;
  allow create, update: if request.auth != null
    && request.auth.uid == userId
    && request.resource.data.userId == userId
    && request.resource.data.amount is number
    && request.resource.data.amount > 0;
  allow delete: if false;
}
```

**Migration impact on current data**

No migration required. New collection.
