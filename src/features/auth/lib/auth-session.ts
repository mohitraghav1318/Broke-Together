import { signOut, type User } from "firebase/auth";
import {
  firebaseAuth,
  firebaseAuthPersistence,
} from "@/firebase/firebase-client";

const lastActiveKey = "broke-together:last-active-at";
const tenDaysInMs = 10 * 24 * 60 * 60 * 1000;

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

export async function ensurePersistentAuth() {
  await firebaseAuthPersistence;
}

export function markAuthSessionActive() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(lastActiveKey, Date.now().toString());
}

export function clearAuthSessionActivity() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(lastActiveKey);
}

export async function enforceAuthSession(user: User | null) {
  if (!user || !canUseStorage()) {
    return user;
  }

  const lastActiveAt = Number(window.localStorage.getItem(lastActiveKey) || 0);
  const isExpired = lastActiveAt > 0 && Date.now() - lastActiveAt > tenDaysInMs;

  if (isExpired) {
    clearAuthSessionActivity();
    await signOut(firebaseAuth);
    return null;
  }

  markAuthSessionActive();
  return user;
}

export async function signOutAndClearSession() {
  clearAuthSessionActivity();
  await signOut(firebaseAuth);
}
