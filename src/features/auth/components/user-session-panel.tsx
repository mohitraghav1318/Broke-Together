"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AppButton } from "@/components/ui/app-button";
import { LoadingPlaceholder } from "@/components/ui/loading-placeholder";
import { SurfaceCard } from "@/components/ui/surface-card";
import { firebaseAuth } from "@/firebase/firebase-client";
import {
  enforceAuthSession,
  signOutAndClearSession,
} from "@/features/auth/lib/auth-session";

export function UserSessionPanel() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(firebaseAuth, async (currentUser) => {
      setUser(await enforceAuthSession(currentUser));
      setIsLoading(false);
    });
  }, []);

  if (isLoading) {
    return <LoadingPlaceholder label="Checking sign in status" />;
  }

  if (!user) {
    return (
      <SurfaceCard className="grid gap-5">
        <div>
          <h2 className="text-xl font-semibold text-zinc-950">Get started</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            Create an account or sign in to continue.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            className="inline-flex h-11 items-center justify-center rounded-md border border-transparent bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
            href="/signup"
          >
            Create account
          </Link>
          <Link
            className="inline-flex h-11 items-center justify-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-100"
            href="/login"
          >
            Sign in
          </Link>
        </div>
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard className="grid gap-5">
      <div>
        <p className="text-sm font-medium text-emerald-700">Signed in</p>
        <h2 className="mt-2 text-xl font-semibold text-zinc-950">
          {user.displayName || user.email}
        </h2>
        {user.email ? (
          <p className="mt-1 text-sm text-zinc-600">{user.email}</p>
        ) : null}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          className="inline-flex h-11 items-center justify-center rounded-md border border-transparent bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
          href="/notebooks"
        >
          Open notebooks
        </Link>
        <AppButton variant="secondary" onClick={signOutAndClearSession}>
          Sign out
        </AppButton>
      </div>
    </SurfaceCard>
  );
}
