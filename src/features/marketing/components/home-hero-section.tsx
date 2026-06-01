import Link from "next/link";

const mockEntries = [
  { label: "Dinner", payer: "Maya", amount: "₹2,480" },
  { label: "Cab", payer: "Aarav", amount: "₹760" },
  { label: "Groceries", payer: "Riya", amount: "₹1,340" },
];

export function HomeHeroSection() {
  return (
    <section className="relative isolate overflow-hidden border-b border-emerald-100 bg-stone-50 px-4 py-20 text-zinc-900 sm:px-6 sm:py-24 lg:px-8">
      <div className="pointer-events-none absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(39,39,42,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(39,39,42,0.055)_1px,transparent_1px)] [background-size:44px_44px]" />

      <div className="relative mx-auto grid min-h-[calc(100vh-10rem)] w-full max-w-6xl content-center gap-12">
        <div className="marketing-reveal mx-auto max-w-4xl text-center">
          <div className="mx-auto inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm">
            Shared money, less awkward
          </div>
          <h1 className="mx-auto mt-6 max-w-4xl text-balance text-5xl font-semibold leading-tight tracking-normal text-zinc-900 sm:text-6xl lg:text-7xl">
            Broke Together keeps group expenses calm, clear, and settled.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-zinc-600">
            Create a shareable hisaba notebook, invite friends, add payments,
            and turn messy splits into a clean settlement report.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              className="inline-flex h-12 items-center justify-center rounded-md bg-emerald-600 px-5 text-sm font-bold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-700"
              href="/notebooks"
            >
              Open notebooks
            </Link>
            <Link
              className="inline-flex h-12 items-center justify-center rounded-md border border-emerald-200 bg-white px-5 text-sm font-bold text-zinc-800 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50"
              href="/expenses"
            >
              Personal expenses
            </Link>
            <Link
              className="inline-flex h-12 items-center justify-center rounded-md border border-emerald-200 bg-white px-5 text-sm font-bold text-zinc-800 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50"
              href="/help"
            >
              View help
            </Link>
          </div>
        </div>

        <div className="marketing-reveal mx-auto w-full max-w-5xl">
          <div className="glow-card rounded-lg border border-emerald-100 bg-white p-3 shadow-xl shadow-emerald-100/70 transition-all duration-300 hover:-translate-y-1">
            <div className="rounded-lg border border-emerald-100 bg-stone-50">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-emerald-100 bg-white px-5 py-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    Goa trip notebook
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-zinc-900">
                    ₹14,820 tracked
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {["5 friends", "8 entries", "Ready report"].map((item) => (
                    <span
                      className="rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800"
                      key={item}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 p-4 lg:grid-cols-[1fr_300px]">
                <div className="grid gap-3">
                  {mockEntries.map((entry) => (
                    <div
                      className="grid grid-cols-[1fr_auto] gap-4 rounded-lg border border-zinc-200 bg-white p-4 transition-colors duration-300 hover:border-emerald-200 hover:bg-emerald-50/50"
                      key={entry.label}
                    >
                      <div>
                        <p className="font-semibold text-zinc-900">
                          {entry.label}
                        </p>
                        <p className="mt-1 text-sm text-zinc-600">
                          Paid by {entry.payer}
                        </p>
                      </div>
                      <p className="font-semibold text-emerald-700">
                        {entry.amount}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="grid gap-4 rounded-lg border border-emerald-100 bg-white p-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-zinc-900">
                        Category split
                      </p>
                      <p className="text-xs font-semibold text-zinc-500">
                        Live report
                      </p>
                    </div>
                    <div className="mt-4 grid gap-3">
                      <div className="h-3 rounded bg-emerald-500" />
                      <div className="h-3 w-4/5 rounded bg-sky-500" />
                      <div className="h-3 w-3/5 rounded bg-amber-400" />
                      <div className="h-3 w-2/5 rounded bg-rose-400" />
                    </div>
                  </div>

                  <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                      Settlement
                    </p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-zinc-900">
                      Dev pays ₹1,120 to Maya.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
