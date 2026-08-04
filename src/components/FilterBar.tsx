import { useGraphStore, categoryCounts } from "../store";
import { CATEGORIES } from "../lib/categories";
import type { Category } from "../types";

// Barra de filtros: chips de categoria com contagem, toggle de visibilidade.
// Dado o volume de SpeciesAssessment (588), filtrar é essencial para navegar.
export default function FilterBar() {
  const data = useGraphStore((s) => s.data);
  const visible = useGraphStore((s) => s.visibleCategories);
  const toggle = useGraphStore((s) => s.toggleCategory);
  const showAll = useGraphStore((s) => s.showAll);
  const counts = categoryCounts(data);

  if (!data) return null;

  // ordena por ordem canônica da categoria
  const items = counts
    .map((c) => ({ ...c, meta: CATEGORIES[c.category as Category] }))
    .sort((a, b) => a.meta.order - b.meta.order);

  const hiddenCount = counts.reduce(
    (a, c) => a + (visible.has(c.category) ? 0 : c.count),
    0,
  );

  return (
    <div className="pointer-events-auto absolute left-4 top-20 z-20 max-h-[70vh] w-56 overflow-y-auto rounded-2xl border border-white/10 bg-ink-900/70 p-3 shadow-2xl backdrop-blur-md sm:left-6 sm:top-24">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Filtros
        </h2>
        <button
          onClick={showAll}
          className="text-[11px] font-medium text-sky-300/80 transition-colors hover:text-sky-200"
        >
          {hiddenCount > 0 ? `mostrar todos` : "todos visíveis"}
        </button>
      </div>
      <ul className="space-y-0.5">
        {items.map(({ category, count, meta }) => {
          const on = visible.has(category);
          return (
            <li key={category}>
              <button
                onClick={() => toggle(category)}
                className={`group flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors ${
                  on ? "bg-white/5 hover:bg-white/10" : "opacity-40 hover:opacity-70"
                }`}
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-white/20"
                  style={{ backgroundColor: meta.color }}
                />
                <span className={`flex-1 truncate ${on ? "text-slate-200" : "text-slate-500"}`}>
                  {meta.label}
                </span>
                <span className="tabular-nums text-[11px] text-slate-500">{count}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
