import { useMemo } from "react";
import type { GraphData } from "../types";
import { useGraphStore } from "../store";
import { buildAdjacency } from "./neighbors";
import { computeHighlight, type HighlightState } from "./highlight";

// Prepara o subgrafo filtrado (por categoria visível) + adjacência + estado
// de highlight. Compartilhado por Graph3D e Graph2D para que ambos reajam
// igual ao hover/seleção.
export interface PreparedGraph {
  nodes: GraphData["nodes"];
  links: GraphData["edges"];
  adjacency: ReturnType<typeof buildAdjacency>;
  highlight: HighlightState;
  idsInScope: Set<string>;
}

export function usePreparedGraph(): PreparedGraph | null {
  const data = useGraphStore((s) => s.data);
  const visibleCategories = useGraphStore((s) => s.visibleCategories);
  const hoveredId = useGraphStore((s) => s.hoveredId);
  const selectedId = useGraphStore((s) => s.selectedId);

  return useMemo(() => {
    if (!data) return null;

    const idsInScope = new Set<string>();
    const nodes = [];
    for (const n of data.nodes) {
      if (visibleCategories.has(n.category)) {
        nodes.push(n);
        idsInScope.add(n.id);
      }
    }
    // arestas só se ambas as pontas estiverem no escopo
    const links = data.edges.filter(
      (e) => idsInScope.has(e.source) && idsInScope.has(e.target),
    );

    const adjacency = buildAdjacency({ ...data, nodes, edges: links });
    const focusId = hoveredId ?? selectedId ?? null;
    const highlight = computeHighlight(
      focusId && idsInScope.has(focusId) ? focusId : null,
      adjacency.neighbors,
      adjacency.incident,
    );

    return { nodes, links, adjacency, highlight, idsInScope };
  }, [data, visibleCategories, hoveredId, selectedId]);
}
