import { useGraphStore, categoryCounts } from "../store";

// Cabeçalho minimalista: título do currículo + contadores ao vivo.
export default function Header() {
  const data = useGraphStore((s) => s.data);
  const counts = categoryCounts(data);
  const visible = useGraphStore((s) => s.visibleCategories);
  const visibleCount = counts
    .filter((c) => visible.has(c.category))
    .reduce((a, c) => a + c.count, 0);

  return (
    <header className="pointer-events-none absolute left-0 right-0 top-0 z-20 flex items-start justify-between gap-4 p-4 sm:p-6">
      <div className="pointer-events-auto">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-sky-300/80">
          Grafo curricular
        </p>
        <h1 className="mt-0.5 font-sans text-lg font-semibold text-slate-100 sm:text-xl">
          Lucas Sá Barreto Jordão
        </h1>
        <p className="mt-0.5 text-xs text-slate-400">
          {data ? (
            <>
              <span className="tabular-nums text-slate-300">{visibleCount}</span>
              <span className="text-slate-500"> / {data.meta.stats.nodes}</span> nós ·{" "}
              <span className="tabular-nums text-slate-300">{data.meta.stats.edges}</span> arestas
            </>
          ) : (
            "carregando…"
          )}
        </p>
      </div>
    </header>
  );
}
