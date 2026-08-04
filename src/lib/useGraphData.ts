import { useMemo } from "react";
import type { GraphData, GraphEdge } from "../types";
import { useGraphStore } from "../store";
import { computeHighlight, type HighlightState } from "./highlight";

// Pré-computa a adjacência UMA VEZ sobre o grafo completo (não por filtro),
// usando os `neighbors` que já vêm do dataset. O subgrafo filtrado só filtra
// quais nós/arestas renderizar — a adjacência para highlight permanece global.
export interface PreparedGraph {
  nodes: GraphData["nodes"];
  links: GraphData["edges"];
  adjacency: ReturnType<typeof adjacencyFromEdges>;
  highlight: HighlightState;
  idsInScope: Set<string>;
}

// Mapa de adjacência derivado dos `neighbors` do dataset — construído uma vez.
function adjacencyFromEdges(data: GraphData) {
  const neighbors = new Map<string, Set<string>>();
  const incident = new Map<string, Set<GraphEdge>>();
  // constrói incident a partir das arestas (precisa para o edgeKey do highlight)
  for (const e of data.edges) {
    let ns = neighbors.get(e.source);
    if (!ns) {
      ns = new Set();
      neighbors.set(e.source, ns);
    }
    ns.add(e.target);
    let nt = neighbors.get(e.target);
    if (!nt) {
      nt = new Set();
      neighbors.set(e.target, nt);
    }
    nt.add(e.source);

    let is = incident.get(e.source);
    if (!is) {
      is = new Set();
      incident.set(e.source, is);
    }
    is.add(e);
    let it = incident.get(e.target);
    if (!it) {
      it = new Set();
      incident.set(e.target, it);
    }
    it.add(e);
  }
  return { neighbors, incident };
}

export function usePreparedGraph(): PreparedGraph | null {
  const data = useGraphStore((s) => s.data);
  const visibleCategories = useGraphStore((s) => s.visibleCategories);
  const hoveredId = useGraphStore((s) => s.hoveredId);
  const selectedId = useGraphStore((s) => s.selectedId);
  const dimUnfocusedNodes = useGraphStore((s) => s.dimUnfocusedNodes);

  // adjacência global — memoizada independentemente dos filtros
  const adjacency = useMemo(() => (data ? adjacencyFromEdges(data) : null), [data]);

  const filtered = useMemo(() => {
    if (!data) return null;

    const idsInScope = new Set<string>();
    const nodes = [];
    for (const n of data.nodes) {
      if (visibleCategories.has(n.category)) {
        nodes.push(n);
        idsInScope.add(n.id);
      }
    }
    // force-graph troca source/target por objetos em runtime. Entregamos cópias
    // para preservar o dataset canônico usado por filtros e pelo painel lateral.
    const links = data.edges
      .filter((e) => idsInScope.has(e.source) && idsInScope.has(e.target))
      .map((e) => ({ ...e }));

    return { nodes, links, idsInScope };
  }, [data, visibleCategories]);

  return useMemo(() => {
    if (!adjacency || !filtered) return null;

    const focusId = hoveredId ?? selectedId ?? null;
    const highlight = computeHighlight(
      focusId && filtered.idsInScope.has(focusId) ? focusId : null,
      adjacency.neighbors,
      adjacency.incident,
      dimUnfocusedNodes,
    );

    return { ...filtered, adjacency, highlight };
  }, [adjacency, filtered, hoveredId, selectedId, dimUnfocusedNodes]);
}
