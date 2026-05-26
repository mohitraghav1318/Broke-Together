import { HelpArticleCard } from "@/features/help/components/help-article-card";
import { helpArticles } from "@/features/help/content/help-articles";

export function HelpPageContent() {
  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="px-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Help topics
          </p>
          <nav className="mt-3 grid gap-1">
            {helpArticles.map((article) => (
              <a
                className="rounded-md px-2 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-950"
                href={`#${article.id}`}
                key={article.id}
              >
                {article.title}
              </a>
            ))}
          </nav>
        </div>
      </aside>

      <section className="grid gap-4">
        {helpArticles.map((article) => (
          <HelpArticleCard article={article} key={article.id} />
        ))}
      </section>
    </div>
  );
}
