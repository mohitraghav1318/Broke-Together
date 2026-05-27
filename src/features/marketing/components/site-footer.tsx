import Link from "next/link";

const contactEmail = "mrzer.env@gmail.com";

export function SiteFooter() {
  return (
    <footer className="border-t border-emerald-100 bg-stone-100 px-4 py-10 text-zinc-900 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-6xl gap-8 md:grid-cols-[1fr_auto_auto]">
        <div className="max-w-md">
          <Link className="flex items-center gap-3 text-base font-bold" href="/">
            <span className="grid size-9 place-items-center rounded-md bg-emerald-700 text-sm text-white shadow-sm">
              BT
            </span>
            <span>Broke Together</span>
          </Link>
          <p className="mt-4 text-sm leading-6 text-zinc-600">
            Shared hisaba notebooks for friends, flatmates, trips, and small
            groups that want clean money clarity.
          </p>
          <a
            className="mt-4 inline-flex text-sm font-semibold text-emerald-700 transition-colors hover:text-emerald-800"
            href={`mailto:${contactEmail}`}
          >
            {contactEmail}
          </a>
        </div>

        <nav className="grid gap-3 text-sm">
          <p className="font-semibold text-zinc-900">Product</p>
          <Link className="text-zinc-600 transition-colors hover:text-emerald-800" href="/">
            Home
          </Link>
          <Link
            className="text-zinc-600 transition-colors hover:text-emerald-800"
            href="/notebooks"
          >
            Notebooks
          </Link>
          <Link
            className="text-zinc-600 transition-colors hover:text-emerald-800"
            href="/help"
          >
            Help
          </Link>
        </nav>

        <div className="grid content-start gap-3 text-sm">
          <p className="font-semibold text-zinc-900">Contact</p>
          <p className="max-w-52 leading-6 text-zinc-600">
            Questions, feedback, or support requests are welcome by email.
          </p>
          <a
            className="font-semibold text-emerald-700 transition-colors hover:text-emerald-800"
            href={`mailto:${contactEmail}`}
          >
            Mail support
          </a>
        </div>
      </div>
    </footer>
  );
}
