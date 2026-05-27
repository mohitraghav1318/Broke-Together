"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { firebaseAuth } from "@/firebase/firebase-client";
import { enforceAuthSession } from "@/features/auth/lib/auth-session";

export function AboutUsSection() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    return onAuthStateChanged(firebaseAuth, async (currentUser) => {
      setUser(await enforceAuthSession(currentUser));
    });
  }, []);

  return (
    <section className="bg-stone-50 px-4 py-20 text-zinc-900 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1fr_420px] lg:items-center">
        <div className="marketing-reveal max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            About us
          </p>
          <h2 className="mt-3 text-wrap text-4xl font-semibold leading-tight sm:text-5xl">
            We care about making money talk feel normal.
          </h2>
          <p className="mt-5 text-base leading-8 text-zinc-600">
            Broke Together is made for groups that trust each other but still
            need clear records. The goal is simple: keep expenses visible,
            reduce awkward reminders, and help everyone settle fairly.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            {!user && (
              <Link
                className="inline-flex h-11 items-center justify-center rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-800"
                href="/signup"
              >
                Create account
              </Link>
            )}
            <a
              className="inline-flex h-11 items-center justify-center rounded-md border border-emerald-200 bg-white px-4 text-sm font-semibold text-zinc-800 transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-50"
              href="mailto:mrzer.env@gmail.com"
            >
              Contact us
            </a>
          </div>
        </div>

        <div className="glow-card marketing-reveal rounded-lg border border-emerald-100 bg-white p-6 shadow-sm">
          <div className="grid gap-4">
            {[
              [
                "Clear by default",
                "Balances, categories, and reports stay visible.",
              ],
              [
                "Shareable by design",
                "Friends can join the same notebook link.",
              ],
              [
                "Simple to maintain",
                "Edit people and categories as the group changes.",
              ],
            ].map(([title, body]) => (
              <div
                className="rounded-lg border border-emerald-100 bg-stone-50 p-4"
                key={title}
              >
                <p className="font-semibold text-zinc-900">{title}</p>
                <p className="mt-1 text-sm leading-6 text-zinc-600">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
