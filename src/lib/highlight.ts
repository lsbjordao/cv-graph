import type { GraphEdge } from "../types";
import { categoryColor, edgeColor, edgeColorHot } from "./categories";

// Tipo estrutural mínimo: aceita qualquer objeto com os campos que o
// highlight precisa (GraphNode da nossa app, ou NodeObject enriquecido das
// libs force-graph em runtime). Evita casar tipos rígidos entre as libs.
interface ColorableNode {
  id: string;
  category: string;
  label: string;
  degree?: number;
}

// Dim palette: a cor base escurecida para o estado "não relacionado" no hover.
function dim(hex: string): string {
  // converte hex #rrggbb para rgba escurecido
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${Math.round(r * 0.32)},${Math.round(g * 0.32)},${Math.round(b * 0.32)},0.55)`;
}

// Estado de highlight: dado o nó focado (hover ou seleção), devolve os sets
// de nós/arestas ativos para coloração. null = sem foco (estado normal).
export interface HighlightState {
  focusId: string | null;
  neighborIds: Set<string>;
  activeEdgeKeys: Set<string>;
}

const empty = (focusId: string | null): HighlightState => ({
  focusId,
  neighborIds: new Set(),
  activeEdgeKeys: new Set(),
});

export function computeHighlight(
  focusId: string | null,
  neighbors: Map<string, Set<string>>,
  incident: Map<string, Set<GraphEdge>>,
): HighlightState {
  if (!focusId) return empty(null);
  const neighborIds = new Set<string>(neighbors.get(focusId) ?? []);
  neighborIds.add(focusId); // o próprio nó também é "ativo"
  const activeEdgeKeys = new Set<string>();
  for (const e of incident.get(focusId) ?? []) {
    activeEdgeKeys.add(edgeKey(e));
  }
  return { focusId, neighborIds, activeEdgeKeys };
}

export function edgeKey(e: { source: unknown; target: unknown; label: string }): string {
  const s = typeof e.source === "string" ? e.source : (e.source as { id: string }).id;
  const t = typeof e.target === "string" ? e.target : (e.target as { id: string }).id;
  return `${s}|${t}|${e.label}`;
}

// Cor de um nó dado o estado de highlight.
export function nodeColorFor(node: ColorableNode, hl: HighlightState): string {
  const base = categoryColor(node.category as never);
  if (!hl.focusId) return base;
  if (hl.neighborIds.has(node.id)) return base;
  return dim(base);
}

// Opacidade de um nó: 1 = ativo, ~0.18 = esmaecido.
export function nodeOpacityFor(node: ColorableNode, hl: HighlightState): number {
  if (!hl.focusId) return 1;
  return hl.neighborIds.has(node.id) ? 1 : 0.18;
}

// Cor de uma aresta dado o estado de highlight.
export function linkColorFor(
  link: { source: unknown; target: unknown; label: string; kind: string },
  hl: HighlightState,
): string {
  if (!hl.focusId) return edgeColor(link.kind);
  if (hl.activeEdgeKeys.has(edgeKey(link))) return edgeColorHot(link.kind);
  return edgeColor(link.kind, true);
}

// Partículas só em arestas ativas.
export function linkParticlesFor(
  link: { source: unknown; target: unknown; label: string },
  hl: HighlightState,
): number {
  if (!hl.focusId) return 0;
  return hl.activeEdgeKeys.has(edgeKey(link)) ? 2 : 0;
}
