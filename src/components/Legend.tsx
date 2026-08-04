import { CATEGORY_LIST } from "../lib/categories";

// Legenda compacta das categorias. A barra de filtros (FilterBar) também mostra
// as categorias, mas esta é uma referência visual rápida no canto.
export default function Legend() {
  return (
    <div className="pointer-events-none absolute bottom-4 right-4 z-10 hidden max-w-[200px] rounded-xl border border-white/5 bg-ink-900/50 p-2.5 text-[10px] text-slate-400 backdrop-blur-sm sm:block sm:right-6 sm:bottom-6">
      <p className="mb-1.5 font-semibold uppercase tracking-wider text-slate-500">
        Categorias
      </p>
      <ul className="grid grid-cols-2 gap-x-2 gap-y-0.5">
        {CATEGORY_LIST.map((c) => (
          <li key={c.id} className="flex items-center gap-1.5">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: c.color }}
            />
            <span className="truncate">{c.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
