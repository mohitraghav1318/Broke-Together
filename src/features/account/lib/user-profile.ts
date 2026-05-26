import { FirebaseError } from "firebase/app";
import type { User } from "firebase/auth";
import {
  deleteDoc,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { firebaseDb } from "@/firebase/firebase-client";

export type UserProfile = {
  uid: string;
  email: string | null;
  displayName: string;
  username: string;
};

export class UsernameTakenError extends Error {
  constructor() {
    super("That username is already taken.");
    this.name = "UsernameTakenError";
  }
}

export class InvalidUsernameError extends Error {
  constructor() {
    super("Use 3 to 24 letters, numbers, or hyphens.");
    this.name = "InvalidUsernameError";
  }
}

export function normalizeUsername(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 24);
}

export function validateUsername(value: string) {
  const username = normalizeUsername(value);

  if (!/^[a-z0-9][a-z0-9-]{1,22}[a-z0-9]$/.test(username)) {
    throw new InvalidUsernameError();
  }

  return username;
}

export function createDefaultUsername(user: User) {
  const source =
    user.displayName || user.email?.split("@")[0] || `user-${user.uid}`;
  const base = normalizeUsername(source) || "user";
  const trimmedBase = base.slice(0, 15).replace(/-+$/g, "") || "user";

  return `${trimmedBase}-${user.uid.slice(0, 6).toLowerCase()}`;
}

function userProfileFromData(data: UserProfile) {
  return {
    uid: data.uid,
    email: data.email,
    displayName: data.displayName,
    username: data.username,
  };
}

export async function ensureUserProfile(user: User) {
  const userRef = doc(firebaseDb, "users", user.uid);
  const existingProfile = await getDoc(userRef);

  if (existingProfile.exists()) {
    return userProfileFromData(existingProfile.data() as UserProfile);
  }

  const username = createDefaultUsername(user);
  const usernameRef = doc(firebaseDb, "usernames", username);
  const displayName = user.displayName || user.email?.split("@")[0] || "User";

  await runTransaction(firebaseDb, async (transaction) => {
    const reservedUsername = await transaction.get(usernameRef);

    if (reservedUsername.exists()) {
      throw new UsernameTakenError();
    }

    transaction.set(userRef, {
      uid: user.uid,
      email: user.email,
      displayName,
      username,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    transaction.set(usernameRef, {
      uid: user.uid,
      createdAt: serverTimestamp(),
    });
  });

  return {
    uid: user.uid,
    email: user.email,
    displayName,
    username,
  };
}

export async function updateUserProfile(
  user: User,
  nextProfile: Pick<UserProfile, "displayName" | "username">,
) {
  const displayName = nextProfile.displayName.trim() || "User";
  const username = validateUsername(nextProfile.username);
  const userRef = doc(firebaseDb, "users", user.uid);

  await runTransaction(firebaseDb, async (transaction) => {
    const currentProfile = await transaction.get(userRef);
    const currentUsername = currentProfile.exists()
      ? (currentProfile.data() as UserProfile).username
      : "";
    const nextUsernameRef = doc(firebaseDb, "usernames", username);
    const nextUsername = await transaction.get(nextUsernameRef);

    if (nextUsername.exists() && nextUsername.data().uid !== user.uid) {
      throw new UsernameTakenError();
    }

    transaction.set(
      userRef,
      {
        uid: user.uid,
        email: user.email,
        displayName,
        username,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    if (currentUsername && currentUsername !== username) {
      transaction.delete(doc(firebaseDb, "usernames", currentUsername));
    }

    transaction.set(
      nextUsernameRef,
      {
        uid: user.uid,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  });

  return {
    uid: user.uid,
    email: user.email,
    displayName,
    username,
  };
}

export async function deleteUserProfile(profile: UserProfile) {
  await deleteDoc(doc(firebaseDb, "users", profile.uid));
  await deleteDoc(doc(firebaseDb, "usernames", profile.username));
}

export function getAccountErrorMessage(error: unknown) {
  if (
    error instanceof UsernameTakenError ||
    error instanceof InvalidUsernameError
  ) {
    return error.message;
  }

  if (error instanceof FirebaseError) {
    if (error.code === "auth/requires-recent-login") {
      return "Please sign out and sign in again before deleting this account.";
    }

    if (error.code === "permission-denied") {
      return "Firestore rules blocked this action. Check your users and usernames rules.";
    }
  }

  return "Something went wrong. Please try again.";
}
