import { categoryColor, edgeColor, edgeColorHot } from "./categories";

// Tipo estrutural mínimo: aceita qualquer objeto com os campos que o
// highlight precisa. Compatível com GraphNode da app e NodeObject das libs.
interface ColorableNode {
  id: string;
  category: string;
  label?: string;
  degree?: number;
}

export interface HighlightState {
  focusId: string | null;
  neighborIds: Set<string>;
  activeEdgeKeys: Set<string>;
  dimUnfocusedNodes: boolean;
}

export const NO_HIGHLIGHT: HighlightState = {
  focusId: null,
  neighborIds: new Set(),
  activeEdgeKeys: new Set(),
  dimUnfocusedNodes: true,
};

// --- cache de cores (evita recalcular dim() a cada frame) -------------------
const colorCache = new Map<string, string>(); // hex base
const dimCache = new Map<string, string>(); // hex base -> rgba escurecido

function baseColor(category: string): string {
  let c = colorCache.get(category);
  if (!c) {
    c = categoryColor(category as never);
    colorCache.set(category, c);
  }
  return c;
}

function dim(hex: string): string {
  let c = dimCache.get(hex);
  if (!c) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    c = `rgba(${Math.round(r * 0.3)},${Math.round(g * 0.3)},${Math.round(b * 0.3)},0.5)`;
    dimCache.set(hex, c);
  }
  return c;
}

export function edgeKey(e: {
  source: unknown;
  target: unknown;
  label: string;
}): string {
  const s = typeof e.source === "string" ? e.source : (e.source as { id: string }).id;
  const t = typeof e.target === "string" ? e.target : (e.target as { id: string }).id;
  return `${s}|${t}|${e.label}`;
}

// Estado de highlight a partir de um nó focado + adjacência.
export function computeHighlight(
  focusId: string | null,
  neighborsMap: Map<string, Set<string>>,
  incidentMap: Map<string, Set<{ source: unknown; target: unknown; label: string }>>,
  dimUnfocusedNodes = true,
): HighlightState {
  if (!focusId) return { ...NO_HIGHLIGHT, dimUnfocusedNodes };
  const neighborIds = new Set<string>(neighborsMap.get(focusId) ?? []);
  neighborIds.add(focusId);
  const activeEdgeKeys = new Set<string>();
  for (const e of incidentMap.get(focusId) ?? []) {
    activeEdgeKeys.add(edgeKey(e));
  }
  return { focusId, neighborIds, activeEdgeKeys, dimUnfocusedNodes };
}

// Variação rápida: usa neighbors pré-calculados (do dataset), sem rebuild de
// adjacência. Ideal para o hot-path do hover.
export function highlightFromNeighbors(
  focusId: string | null,
  nodeNeighbors: Map<string, string[]>,
): Set<string> {
  if (!focusId) return new Set();
  const ids = new Set<string>(nodeNeighbors.get(focusId) ?? []);
  ids.add(focusId);
  return ids;
}

export function nodeColorFor(node: ColorableNode, hl: HighlightState): string {
  const base = baseColor(node.category);
  if (!hl.focusId || !hl.dimUnfocusedNodes || hl.neighborIds.has(node.id)) return base;
  return dim(base);
}

export function nodeOpacityFor(node: ColorableNode, hl: HighlightState): number {
  if (!hl.focusId || !hl.dimUnfocusedNodes) return 1;
  return hl.neighborIds.has(node.id) ? 1 : 0.12;
}

export function linkColorFor(
  link: { source: unknown; target: unknown; label: string; kind: string },
  hl: HighlightState,
): string {
  if (!hl.focusId) return edgeColor(link.kind);
  if (hl.activeEdgeKeys.has(edgeKey(link))) return edgeColorHot(link.kind);
  return edgeColor(link.kind, true);
}

export function linkSourceColor(link: { source: unknown }): string {
  const source = link.source;
  if (typeof source === "object" && source && "category" in source) {
    return baseColor(String((source as { category: unknown }).category));
  }
  return categoryColor("other");
}
