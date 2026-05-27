"use client";

import { FirebaseError } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AppButton } from "@/components/ui/app-button";
import { InlineAlert } from "@/components/ui/inline-alert";
import { TextInput } from "@/components/ui/text-input";
import { firebaseAuth } from "@/firebase/firebase-client";
import { ensureUserProfile } from "@/features/account/lib/user-profile";
import {
  ensurePersistentAuth,
  markAuthSessionActive,
} from "@/features/auth/lib/auth-session";
import { getFriendlyAuthError } from "@/features/auth/lib/firebase-auth-errors";

type AuthFormProps = {
  mode: "login" | "signup";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const isSignup = mode === "signup";
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function completeAuth(message: string, nextPath = "/") {
    setSuccessMessage(message);
    router.push(nextPath);
    router.refresh();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      await ensurePersistentAuth();

      if (isSignup) {
        const credential = await createUserWithEmailAndPassword(
          firebaseAuth,
          email,
          password,
        );

        if (displayName.trim()) {
          await updateProfile(credential.user, {
            displayName: displayName.trim(),
          });
        }

        await ensureUserProfile(credential.user);
        markAuthSessionActive();
        completeAuth(
          "Account created. You are signed in now.",
          `/${credential.user.uid}`,
        );
      } else {
        const credential = await signInWithEmailAndPassword(
          firebaseAuth,
          email,
          password,
        );
        await ensureUserProfile(credential.user);
        markAuthSessionActive();
        completeAuth("Welcome back. You are signed in now.");
      }
    } catch (error) {
      if (error instanceof FirebaseError) {
        setErrorMessage(getFriendlyAuthError(error.code));
      } else {
        setErrorMessage("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      await ensurePersistentAuth();

      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(firebaseAuth, provider);
      await ensureUserProfile(credential.user);
      markAuthSessionActive();
      completeAuth("You are signed in with Google.", `/${credential.user.uid}`);
    } catch (error) {
      if (error instanceof FirebaseError) {
        setErrorMessage(getFriendlyAuthError(error.code));
      } else {
        setErrorMessage("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <AppButton
        className="gap-3"
        disabled={isSubmitting}
        onClick={handleGoogleSignIn}
        type="button"
        variant="secondary"
      >
        <span className="grid size-5 place-items-center rounded-full border border-zinc-300 text-xs font-bold text-zinc-700">
          G
        </span>
        Continue with Google
      </AppButton>

      <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
        <span className="h-px flex-1 bg-zinc-200" />
        or
        <span className="h-px flex-1 bg-zinc-200" />
      </div>

      {isSignup ? (
        <TextInput
          autoComplete="name"
          id="display-name"
          label="Name"
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="Your name"
          type="text"
          value={displayName}
        />
      ) : null}

      <TextInput
        autoComplete="email"
        id="email"
        label="Email"
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@example.com"
        required
        type="email"
        value={email}
      />

      <TextInput
        autoComplete={isSignup ? "new-password" : "current-password"}
        id="password"
        label="Password"
        minLength={6}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="At least 6 characters"
        required
        type="password"
        value={password}
      />

      {errorMessage ? <InlineAlert tone="error">{errorMessage}</InlineAlert> : null}
      {successMessage ? (
        <InlineAlert tone="success">{successMessage}</InlineAlert>
      ) : null}

      <AppButton disabled={isSubmitting} type="submit">
        {isSubmitting
          ? isSignup
            ? "Creating account..."
            : "Signing in..."
          : isSignup
            ? "Create account"
            : "Sign in"}
      </AppButton>

      <p className="text-center text-sm text-zinc-600">
        {isSignup ? "Already have an account?" : "New here?"}{" "}
        <Link
          className="font-semibold text-emerald-700 hover:text-emerald-800"
          href={isSignup ? "/login" : "/signup"}
        >
          {isSignup ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}
