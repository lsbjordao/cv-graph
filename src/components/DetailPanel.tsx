import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGraphStore } from "../store";
import { CATEGORIES, categoryColor } from "../lib/categories";
import type { GraphNode } from "../types";

// Painel de detalhe (lateral, glassmorphism). Mostra o nó selecionado e seus
// vizinhos como lista navegável — clicar num vizinho seleciona + foca.
export default function DetailPanel() {
  const data = useGraphStore((s) => s.data);
  const selectedId = useGraphStore((s) => s.selectedId);
  const detailOpen = useGraphStore((s) => s.detailOpen);
  const select = useGraphStore((s) => s.select);
  const setHover = useGraphStore((s) => s.hover);
  const close = () => select(null);

  const node = useMemo(
    () => (data && selectedId ? data.nodes.find((n) => n.id === selectedId) ?? null : null),
    [data, selectedId],
  );

  // vizinhos: junta arestas onde o nó é origem ou destino
  const neighbors = useMemo(() => {
    if (!data || !node) return [] as { node: GraphNode; edge: { label: string; kind: string } }[];
    const out: { node: GraphNode; edge: { label: string; kind: string } }[] = [];
    const byId = new Map(data.nodes.map((n) => [n.id, n]));
    for (const e of data.edges) {
      if (e.source === node.id) {
        const t = byId.get(e.target);
        if (t) out.push({ node: t, edge: { label: e.label, kind: e.kind } });
      } else if (e.target === node.id) {
        const s = byId.get(e.source);
        if (s) out.push({ node: s, edge: { label: inverse(e.label), kind: e.kind } });
      }
    }
    // ordena por relevância (grau) e depois por nome
    out.sort((a, b) => b.node.degree - a.node.degree || a.node.label.localeCompare(b.node.label));
    return out;
  }, [data, node]);

  return (
    <AnimatePresence>
      {detailOpen && node && (
        <motion.aside
          key="panel"
          initial={{ x: 380, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 380, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 34 }}
          className="pointer-events-auto absolute right-0 top-0 z-30 flex h-full w-[88vw] max-w-sm flex-col border-l border-white/10 bg-ink-900/80 shadow-2xl backdrop-blur-xl"
        >
          {/* topo */}
          <div className="flex items-start justify-between gap-3 p-4 pb-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full ring-2 ring-white/10"
                  style={{ backgroundColor: categoryColor(node.category) }}
                />
                <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  {CATEGORIES[node.category].label}
                </span>
              </div>
              <h2 className="mt-1.5 font-sans text-lg font-semibold leading-tight text-slate-50">
                {node.label}
              </h2>
              {node.primaryType && (
                <code className="mt-1 inline-block rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
                  {node.primaryType}
                </code>
              )}
            </div>
            <button
              onClick={close}
              className="shrink-0 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-white/10 hover:text-slate-200"
              aria-label="Fechar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-6">
            {/* datas */}
            {node.dates && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {(["startDate", "expectedEndDate", "endDate", "date"] as const).map((k) =>
                  node.dates?.[k] ? (
                    <span
                      key={k}
                      className="rounded-md bg-white/5 px-2 py-0.5 text-[11px] text-slate-300"
                    >
                      <span className="text-slate-500">{labelOf(k)}:</span> {node.dates[k]}
                    </span>
                  ) : null,
                )}
              </div>
            )}

            {/* snippet */}
            {node.snippet && (
              <p className="mb-4 text-sm leading-relaxed text-slate-300">{node.snippet}</p>
            )}

            {/* links externos */}
            <div className="mb-4 flex flex-wrap gap-2">
              {node.url && (
                <a
                  href={node.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-sky-200 transition-colors hover:bg-white/10"
                >
                  abrir ↗
                </a>
              )}
              {node.doi && (
                <a
                  href={`https://doi.org/${node.doi}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[11px] text-slate-300 transition-colors hover:bg-white/10"
                >
                  doi:{node.doi.length > 22 ? node.doi.slice(0, 21) + "…" : node.doi}
                </a>
              )}
            </div>

            {/* vizinhos */}
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Conexões
              </h3>
              <span className="tabular-nums text-[11px] text-slate-500">
                {neighbors.length}
              </span>
            </div>
            {neighbors.length === 0 ? (
              <p className="text-xs text-slate-500">Sem conexões diretas.</p>
            ) : (
              <ul className="space-y-0.5">
                {neighbors.slice(0, 200).map(({ node: nb, edge }) => (
                  <li key={`${nb.id}-${edge.label}`}>
                    <button
                      onMouseEnter={() => setHover(nb.id)}
                      onMouseLeave={() => setHover(null)}
                      onClick={() => select(nb.id)}
                      className="group flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/10"
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: categoryColor(nb.category) }}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-slate-200 group-hover:text-white">
                          {nb.label}
                        </span>
                        <span className="block truncate text-[11px] text-slate-500">
                          {edge.label}
                        </span>
                      </span>
                      <span className="shrink-0 text-[10px] uppercase tracking-wide text-slate-600">
                        {CATEGORIES[nb.category].label}
                      </span>
                    </button>
                  </li>
                ))}
                {neighbors.length > 200 && (
                  <li className="px-2 py-2 text-center text-[11px] text-slate-500">
                    + {neighbors.length - 200} outras conexões
                  </li>
                )}
              </ul>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

// Inverte o rótulo da aresta quando o nó selecionado é o destino (para ler
// naturalmente: "orientou" em vez de "foi orientado por" quando faz sentido).
function inverse(label: string): string {
  const m: Record<string, string> = {
    "cv:author": "autor de",
    "cv:committeeMember": "membro de banca em",
    "cv:candidate": "candidato de banca em",
    "cv:contributor": "contribuiu em",
    "cv:advisee": "orientado em",
    "cv:relatedRecord": "relacionado a",
    advisor: "orientador em",
    coAdvisor: "coorientador em",
    skill: "usado em",
    technology: "usado em",
    method: "aplicado em",
    dataSource: "fonte para",
    tool: "ferramenta de",
    person: "pessoa em",
    organization: "organização em",
    parentOrganization: "matriz de",
    memberOf: "membro de",
    about: "sobre",
    periodical: "publicado em",
    reviewedPeriodical: "avaliou",
    awardedWork: "premiou",
    broaderSkill: "broader de",
    narrowerSkill: "narrower de",
  };
  return m[label] ?? label;
}

function labelOf(k: string): string {
  const m: Record<string, string> = {
    startDate: "início",
    expectedEndDate: "previsão",
    endDate: "fim",
    date: "data",
  };
  return m[k] ?? k;
}
