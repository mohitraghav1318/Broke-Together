import { HelpArticleCard } from "@/features/help/components/help-article-card";
import { helpCategories } from "@/features/help/content/help-categories";

export function HelpPageContent() {
  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="px-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Help topics
          </p>
          <nav className="mt-4 grid gap-6">
            {helpCategories.map((category) => (
              <div key={category.id} className="grid gap-1">
                <p className="px-2 text-sm font-bold text-zinc-900">
                  {category.title}
                </p>
                <div className="grid gap-0.5">
                  {category.articles.map((article) => (
                    <a
                      className="rounded-md px-2 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950"
                      href={`#${article.id}`}
                      key={article.id}
                    >
                      {article.title}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </aside>

      <section className="grid gap-12">
        {helpCategories.map((category) => (
          <div key={category.id} className="grid gap-6">
            <h2 className="mb-2 text-2xl font-bold tracking-tight text-zinc-950">
              {category.title}
            </h2>
            <div className="grid gap-4">
              {category.articles.map((article) => (
                <HelpArticleCard article={article} key={article.id} />
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
