import { useEffect, useMemo, useRef, useState } from "react";
import Fuse from "fuse.js";
import { useGraphStore } from "../store";
import { categoryColor } from "../lib/categories";
import type { GraphNode } from "../types";

// Busca fuzzy (Fuse.js) sobre label + snippet + tipos. Selecionar voa até o nó
// e abre o painel de detalhe.
export default function SearchBar() {
  const data = useGraphStore((s) => s.data);
  const visible = useGraphStore((s) => s.visibleCategories);
  const select = useGraphStore((s) => s.select);
  const setHover = useGraphStore((s) => s.hover);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const fuse = useMemo(() => {
    if (!data) return null;
    const pool = data.nodes.filter((n) => visible.has(n.category));
    return new Fuse<GraphNode>(pool, {
      keys: [
        { name: "label", weight: 0.7 },
        { name: "snippet", weight: 0.25 },
        { name: "primaryType", weight: 0.05 },
      ],
      threshold: 0.4,
      ignoreLocation: true,
      minMatchCharLength: 2,
    });
  }, [data, visible]);

  const results = useMemo(() => {
    if (!fuse || q.trim().length < 2) return [];
    return fuse.search(q).slice(0, 8);
  }, [fuse, q]);

  // atalho "/" foca a busca
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // reset do índice ativo quando a query muda
  useEffect(() => setActive(0), [q]);

  const choose = (n: GraphNode) => {
    select(n.id);
    setQ(n.label);
    setOpen(false);
    inputRef.current?.blur();
  };

  return (
    <div className="pointer-events-auto absolute left-1/2 top-3 z-30 w-[min(72vw,420px)] -translate-x-1/2 sm:top-4">
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </span>
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter" && results[active]) {
              choose(results[active].item);
            }
          }}
          placeholder="Buscar nó…  (/)"
          className="w-full rounded-xl border border-white/10 bg-ink-900/80 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder-slate-500 shadow-lg outline-none backdrop-blur-md transition-colors focus:border-sky-400/50 focus:bg-ink-900"
        />
        {open && results.length > 0 && (
          <ul className="absolute left-0 right-0 top-full mt-1.5 overflow-hidden rounded-xl border border-white/10 bg-ink-900/95 shadow-2xl backdrop-blur-md">
            {results.map((r, i) => (
              <li key={r.item.id}>
                <button
                  onMouseEnter={() => {
                    setActive(i);
                    setHover(r.item.id);
                  }}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => choose(r.item)}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                    i === active ? "bg-white/10" : "hover:bg-white/5"
                  }`}
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: categoryColor(r.item.category) }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-slate-100">
                      {r.item.label}
                    </span>
                    {r.item.snippet && (
                      <span className="block truncate text-xs text-slate-500">
                        {r.item.snippet}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
