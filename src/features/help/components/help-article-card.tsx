import type { HelpArticle } from "@/features/help/content/help-categories";

type HelpArticleCardProps = {
  article: HelpArticle;
};

export function HelpArticleCard({ article }: HelpArticleCardProps) {
  return (
    <article
      className="scroll-mt-24 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm"
      id={article.id}
    >
      <div className="grid gap-2">
        <h2 className="text-xl font-semibold text-zinc-950">{article.title}</h2>
        <p className="text-sm leading-6 text-zinc-600">{article.summary}</p>
      </div>

      <ol className="mt-5 grid gap-3">
        {article.steps.map((step, index) => (
          <li className="flex gap-3 text-sm leading-6 text-zinc-700" key={step}>
            <span className="grid size-7 shrink-0 place-items-center rounded-md bg-emerald-50 text-xs font-bold text-emerald-700">
              {index + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>

      {article.note ? (
        <p className="mt-5 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-900">
          {article.note}
        </p>
      ) : null}
    </article>
  );
}
