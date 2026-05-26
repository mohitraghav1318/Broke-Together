"use client";

import {
  deleteUser,
  onAuthStateChanged,
  updateProfile,
  type User,
} from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { AppButton } from "@/components/ui/app-button";
import { InlineAlert } from "@/components/ui/inline-alert";
import { LoadingPlaceholder } from "@/components/ui/loading-placeholder";
import { SurfaceCard } from "@/components/ui/surface-card";
import { TextInput } from "@/components/ui/text-input";
import { firebaseAuth } from "@/firebase/firebase-client";
import {
  deleteUserProfile,
  ensureUserProfile,
  getAccountErrorMessage,
  updateUserProfile,
  type UserProfile,
} from "@/features/account/lib/user-profile";

type AccountSettingsPanelProps = {
  userId: string;
};

export function AccountSettingsPanel({ userId }: AccountSettingsPanelProps) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    return onAuthStateChanged(firebaseAuth, async (user) => {
      setCurrentUser(user);
      setErrorMessage("");

      if (!user || user.uid !== userId) {
        setIsLoading(false);
        return;
      }

      try {
        const nextProfile = await ensureUserProfile(user);
        setProfile(nextProfile);
        setDisplayName(nextProfile.displayName);
        setUsername(nextProfile.username);
      } catch (error) {
        setErrorMessage(getAccountErrorMessage(error));
      } finally {
        setIsLoading(false);
      }
    });
  }, [userId]);

  async function handleSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentUser) {
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const nextProfile = await updateUserProfile(currentUser, {
        displayName,
        username,
      });

      await updateProfile(currentUser, {
        displayName: nextProfile.displayName,
      });

      setProfile(nextProfile);
      setDisplayName(nextProfile.displayName);
      setUsername(nextProfile.username);
      setSuccessMessage("Profile updated.");
    } catch (error) {
      setErrorMessage(getAccountErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteAccount() {
    if (!currentUser || !profile) {
      return;
    }

    const confirmed = window.confirm(
      "Delete your account? This will remove your profile and sign-in account.",
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await deleteUserProfile(profile);
      try {
        await deleteUser(currentUser);
      } catch (error) {
        await updateUserProfile(currentUser, profile);
        throw error;
      }

      router.push("/");
      router.refresh();
    } catch (error) {
      setErrorMessage(getAccountErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return <LoadingPlaceholder label="Loading account settings" />;
  }

  if (!currentUser) {
    return (
      <SurfaceCard className="grid gap-4">
        <h2 className="text-xl font-semibold text-zinc-950">Sign in required</h2>
        <p className="text-sm leading-6 text-zinc-600">
          Sign in before opening your account settings.
        </p>
        <Link
          className="inline-flex h-11 items-center justify-center rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
          href="/login"
        >
          Sign in
        </Link>
      </SurfaceCard>
    );
  }

  if (currentUser.uid !== userId) {
    return (
      <SurfaceCard className="grid gap-4">
        <h2 className="text-xl font-semibold text-zinc-950">
          Wrong account page
        </h2>
        <p className="text-sm leading-6 text-zinc-600">
          You can only manage the account that is currently signed in.
        </p>
        <Link
          className="inline-flex h-11 items-center justify-center rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
          href={`/${currentUser.uid}`}
        >
          Open my account
        </Link>
      </SurfaceCard>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <SurfaceCard>
        <div className="mb-6 grid gap-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Account settings
          </p>
          <h1 className="text-3xl font-semibold text-zinc-950">
            Update your profile
          </h1>
          <p className="text-sm leading-6 text-zinc-600">
            Your username is unique and reserved for your account.
          </p>
        </div>

        <form className="grid gap-4" onSubmit={handleSaveProfile}>
          <TextInput
            id="display-name"
            label="Display name"
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Your name"
            type="text"
            value={displayName}
          />

          <TextInput
            id="username"
            label="Username"
            onChange={(event) => setUsername(event.target.value)}
            placeholder="your-username"
            type="text"
            value={username}
          />

          {profile?.email ? (
            <p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
              Email: {profile.email}
            </p>
          ) : null}

          {errorMessage ? (
            <InlineAlert tone="error">{errorMessage}</InlineAlert>
          ) : null}
          {successMessage ? (
            <InlineAlert tone="success">{successMessage}</InlineAlert>
          ) : null}

          <AppButton disabled={isSaving || isDeleting} type="submit">
            {isSaving ? "Saving..." : "Save profile"}
          </AppButton>
        </form>
      </SurfaceCard>

      <SurfaceCard className="self-start">
        <div className="grid gap-3">
          <h2 className="text-xl font-semibold text-zinc-950">Delete account</h2>
          <p className="text-sm leading-6 text-zinc-600">
            This removes your app profile and Firebase sign-in account. Firebase
            may ask you to sign in again before deletion.
          </p>
          <AppButton
            disabled={isSaving || isDeleting}
            onClick={handleDeleteAccount}
            variant="danger"
          >
            {isDeleting ? "Deleting..." : "Delete account"}
          </AppButton>
        </div>
      </SurfaceCard>
    </div>
  );
}
