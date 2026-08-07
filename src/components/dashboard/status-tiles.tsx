import Link from "next/link";
import { CheckCircle2, CloudSun, Sun, Tags } from "lucide-react";
import type { Insight } from "@/lib/types";

export function StatusTiles({
  insights,
  uncategorizedCount,
}: {
  insights: Insight[];
  uncategorizedCount: number;
}) {
  const negative = insights.filter((i) => i.type === "negative").length;
  const ForecastIcon = negative > 0 ? CloudSun : Sun;
  const forecastText =
    negative > 0
      ? `${negative} point${negative > 1 ? "s" : ""} nécessite${negative > 1 ? "nt" : ""} votre attention`
      : "Vos finances sont au beau fixe";

  return (
    <div className="animate-fade-up stagger-2 grid gap-3 sm:grid-cols-2">
      <article className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-black/5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold tracking-tight">Mes prévisions</h2>
            <p className="mt-2 text-sm text-muted-foreground">{forecastText}</p>
          </div>
          <ForecastIcon
            className={`h-10 w-10 shrink-0 ${negative > 0 ? "text-amber-500" : "text-amber-400"} animate-soft-pulse`}
          />
        </div>
        {insights[0] ? (
          <p className="mt-4 line-clamp-2 rounded-xl bg-muted/70 px-3 py-2 text-sm">
            <span className="font-semibold">{insights[0].title}</span>
            {" — "}
            {insights[0].description}
          </p>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            Plus de données = meilleures prévisions.
          </p>
        )}
      </article>

      <Link
        href={uncategorizedCount > 0 ? "/transactions?uncategorized=1" : "/transactions"}
        className="group rounded-2xl bg-card p-5 shadow-sm ring-1 ring-black/5 transition hover:ring-brand/30"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold tracking-tight">À catégoriser</h2>
            {uncategorizedCount > 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                <span className="text-2xl font-extrabold text-brand">{uncategorizedCount}</span>
                {" "}
                opération{uncategorizedCount > 1 ? "s" : ""} à classer
              </p>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">Tout est catégorisé</p>
            )}
          </div>
          {uncategorizedCount > 0 ? (
            <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand">
              <Tags className="h-6 w-6" />
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-brand-foreground">
                {uncategorizedCount}
              </span>
            </span>
          ) : (
            <CheckCircle2 className="h-10 w-10 text-money-in" />
          )}
        </div>
        <p className="mt-4 text-xs font-semibold text-brand opacity-0 transition group-hover:opacity-100">
          Voir les paiements →
        </p>
      </Link>
    </div>
  );
}
