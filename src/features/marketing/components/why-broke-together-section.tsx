const reasons = [
  {
    title: "Shared notebooks",
    body: "Every trip, flat, dinner plan, or group has its own clean place for people and entries.",
  },
  {
    title: "Fast entry capture",
    body: "Amount, payer, category, and optional notes are enough to keep records useful without slowing anyone down.",
  },
  {
    title: "Reports that settle",
    body: "Timeline, category review, tables, and settlement lines show who needs to pay whom.",
  },
];

export function WhyBrokeTogetherSection() {
  return (
    <section className="bg-white px-4 py-20 text-zinc-900 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-6xl gap-10">
        <div className="marketing-reveal max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Why Broke Together
          </p>
          <h2 className="mt-3 text-wrap text-4xl font-semibold leading-tight sm:text-5xl">
            Built for the moment when everyone paid for something.
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {reasons.map((reason, index) => (
            <article
              className="glow-card marketing-reveal rounded-lg border border-emerald-100 bg-stone-50 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200"
              key={reason.title}
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <span className="grid size-10 place-items-center rounded-md bg-emerald-700 text-sm font-bold text-white">
                {index + 1}
              </span>
              <h3 className="mt-5 text-xl font-semibold text-zinc-900">
                {reason.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-zinc-600">
                {reason.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
