import { create } from "zustand";
import type { Category, GraphData, ViewMode } from "./types";

interface GraphState {
  data: GraphData | null;
  loading: boolean;
  error: string | null;

  // seleção / hover
  selectedId: string | null;
  hoveredId: string | null;

  // UI
  mode: ViewMode;
  query: string;
  visibleCategories: Set<Category>;
  showLabels: boolean;
  dimUnfocusedNodes: boolean;
  detailOpen: boolean;

  // actions
  setData: (d: GraphData | null) => void;
  setLoading: (b: boolean) => void;
  setError: (e: string | null) => void;
  select: (id: string | null) => void;
  hover: (id: string | null) => void;
  setMode: (m: ViewMode) => void;
  setQuery: (q: string) => void;
  toggleCategory: (c: Category) => void;
  setCategories: (cs: Set<Category>) => void;
  showAll: () => void;
  setShowLabels: (b: boolean) => void;
  setDimUnfocusedNodes: (b: boolean) => void;
}

export const useGraphStore = create<GraphState>((set) => ({
  data: null,
  loading: true,
  error: null,

  selectedId: null,
  hoveredId: null,

  mode: "3d",
  query: "",
  // por padrão, todas as categorias visíveis
  visibleCategories: new Set<Category>(),
  showLabels: true,
  dimUnfocusedNodes: true,
  detailOpen: false,

  setData: (d) =>
    set(() => ({
      data: d,
      visibleCategories: d
        ? new Set(d.nodes.map((n) => n.category))
        : new Set(),
    })),
  setLoading: (b) => set({ loading: b }),
  setError: (e) => set({ error: e, loading: false }),
  select: (id) => set({ selectedId: id, detailOpen: id !== null }),
  hover: (id) => set({ hoveredId: id }),
  setMode: (m) => set({ mode: m }),
  setQuery: (q) => set({ query: q }),
  toggleCategory: (c) =>
    set((s) => {
      const next = new Set(s.visibleCategories);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return { visibleCategories: next };
    }),
  setCategories: (cs) => set({ visibleCategories: cs }),
  showAll: () =>
    set((s) => ({
      visibleCategories: s.data
        ? new Set(s.data.nodes.map((n) => n.category))
        : new Set(),
    })),
  setShowLabels: (b) => set({ showLabels: b }),
  setDimUnfocusedNodes: (b) => set({ dimUnfocusedNodes: b }),
}));

// Helper: lista de categorias presentes com contagem (para filtros/legenda).
export function categoryCounts(
  data: GraphData | null,
): { category: Category; count: number }[] {
  if (!data) return [];
  const m = new Map<Category, number>();
  for (const n of data.nodes) m.set(n.category, (m.get(n.category) ?? 0) + 1);
  return [...m.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}
