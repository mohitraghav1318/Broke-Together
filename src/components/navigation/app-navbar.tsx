"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { firebaseAuth } from "@/firebase/firebase-client";
import {
  enforceAuthSession,
  signOutAndClearSession,
} from "@/features/auth/lib/auth-session";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/notebooks", label: "Notebooks", authOnly: true },
  { href: "/help", label: "Help" },
  { href: "/login", label: "Sign in" },
];

export function AppNavbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    return onAuthStateChanged(firebaseAuth, async (currentUser) => {
      setUser(await enforceAuthSession(currentUser));
    });
  }, []);

  function closeMenu() {
    setIsMenuOpen(false);
  }

  async function handleSignOut() {
    await signOutAndClearSession();
    closeMenu();
  }

  const visibleLinks = navLinks.filter((link) => {
    if (link.authOnly) {
      return Boolean(user);
    }

    return user ? link.href !== "/login" : true;
  });

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          className="flex items-center gap-3 text-base font-bold text-zinc-950"
          href="/"
          onClick={closeMenu}
        >
          <span className="grid size-9 place-items-center rounded-md bg-zinc-950 text-sm text-white">
            BT
          </span>
          <span>Broke Together</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {visibleLinks.map((link) => (
            <Link
              className={[
                "rounded-md px-3 py-2 text-sm font-semibold transition-colors",
                pathname === link.href
                  ? "bg-zinc-100 text-zinc-950"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950",
              ].join(" ")}
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}

          {user ? (
            <>
              <Link
                className={[
                  "ml-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors",
                  pathname === `/${user.uid}`
                    ? "bg-zinc-100 text-zinc-950"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950",
                ].join(" ")}
                href={`/${user.uid}`}
              >
                My account
              </Link>
              <button
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-100"
                onClick={handleSignOut}
                type="button"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              className={[
                "ml-2 rounded-md px-3 py-2 text-sm font-semibold shadow-sm transition-colors",
                pathname === "/signup"
                  ? "bg-emerald-700 text-white"
                  : "bg-emerald-600 text-white hover:bg-emerald-700",
              ].join(" ")}
              href="/signup"
            >
              Get started
            </Link>
          )}
        </div>

        <button
          aria-expanded={isMenuOpen}
          aria-label="Toggle navigation menu"
          className="grid size-10 place-items-center rounded-md border border-zinc-300 bg-white text-zinc-950 md:hidden"
          onClick={() => setIsMenuOpen((current) => !current)}
          type="button"
        >
          <span className="grid gap-1.5">
            <span className="block h-0.5 w-5 rounded bg-zinc-950" />
            <span className="block h-0.5 w-5 rounded bg-zinc-950" />
            <span className="block h-0.5 w-5 rounded bg-zinc-950" />
          </span>
        </button>
      </nav>

      {isMenuOpen ? (
        <div className="border-t border-zinc-200 bg-white px-4 py-3 md:hidden">
          <div className="mx-auto grid max-w-6xl gap-2">
            {visibleLinks.map((link) => (
              <Link
                className={[
                  "rounded-md px-3 py-3 text-sm font-semibold transition-colors",
                  pathname === link.href
                    ? "bg-zinc-100 text-zinc-950"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950",
                ].join(" ")}
                href={link.href}
                key={link.href}
                onClick={closeMenu}
              >
                {link.label}
              </Link>
            ))}

            {user ? (
              <>
                <Link
                  className={[
                    "rounded-md px-3 py-3 text-sm font-semibold transition-colors",
                    pathname === `/${user.uid}`
                      ? "bg-zinc-100 text-zinc-950"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950",
                  ].join(" ")}
                  href={`/${user.uid}`}
                  onClick={closeMenu}
                >
                  My account
                </Link>
                <button
                  className="rounded-md border border-zinc-300 bg-white px-3 py-3 text-left text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-100"
                  onClick={handleSignOut}
                  type="button"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                className={[
                  "rounded-md px-3 py-3 text-sm font-semibold text-white shadow-sm transition-colors",
                  pathname === "/signup"
                    ? "bg-emerald-700"
                    : "bg-emerald-600 hover:bg-emerald-700",
                ].join(" ")}
                href="/signup"
                onClick={closeMenu}
              >
                Get started
              </Link>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
