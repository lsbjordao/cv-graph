import type { Category } from "../types";

export interface CategoryMeta {
  id: Category;
  label: string;
  color: string; // hex, base do nó
  glow: string; // rgba, halo/hover
  order: number;
}

// Paleta coesa em tema escuro: cada categoria tem cor própria + glow derivado.
// Ordem define a disposição na legenda e na barra de filtros.
export const CATEGORIES: Record<Category, CategoryMeta> = {
  person: { id: "person", label: "Pessoas", color: "#f472b6", glow: "rgba(244,114,182,0.9)", order: 1 },
  organization: { id: "organization", label: "Organizações", color: "#22d3ee", glow: "rgba(34,211,238,0.9)", order: 2 },
  employment: { id: "employment", label: "Atuação profissional", color: "#f59e0b", glow: "rgba(245,158,11,0.9)", order: 3 },
  education: { id: "education", label: "Formação", color: "#a78bfa", glow: "rgba(167,139,250,0.9)", order: 4 },
  project: { id: "project", label: "Projetos", color: "#34d399", glow: "rgba(52,211,153,0.9)", order: 5 },
  publication: { id: "publication", label: "Publicações", color: "#60a5fa", glow: "rgba(96,165,250,0.9)", order: 6 },
  assessment: { id: "assessment", label: "Avaliações de risco de extinção", color: "#f87171", glow: "rgba(248,113,113,0.9)", order: 7 },
  teaching: { id: "teaching", label: "Ensino", color: "#fb7185", glow: "rgba(251,113,133,0.9)", order: 8 },
  academic: { id: "academic", label: "Orientação & bancas", color: "#c084fc", glow: "rgba(192,132,252,0.9)", order: 9 },
  event: { id: "event", label: "Eventos", color: "#facc15", glow: "rgba(250,204,21,0.9)", order: 10 },
  award: { id: "award", label: "Prêmios", color: "#fbbf24", glow: "rgba(251,191,36,0.9)", order: 11 },
  skill: { id: "skill", label: "Competências", color: "#4ade80", glow: "rgba(74,222,128,0.9)", order: 12 },
  technology: { id: "technology", label: "Tecnologias", color: "#38bdf8", glow: "rgba(56,189,248,0.9)", order: 13 },
  method: { id: "method", label: "Métodos", color: "#2dd4bf", glow: "rgba(45,212,191,0.9)", order: 14 },
  datasource: { id: "datasource", label: "Fontes de dados", color: "#94a3b8", glow: "rgba(148,163,184,0.9)", order: 15 },
  area: { id: "area", label: "Áreas de pesquisa", color: "#818cf8", glow: "rgba(129,140,248,0.9)", order: 16 },
  periodical: { id: "periodical", label: "Periódicos", color: "#5eead4", glow: "rgba(94,234,212,0.9)", order: 17 },
  other: { id: "other", label: "Outros", color: "#64748b", glow: "rgba(100,116,139,0.9)", order: 18 },
};

export const CATEGORY_LIST: CategoryMeta[] = Object.values(CATEGORIES).sort(
  (a, b) => a.order - b.order,
);

export function categoryColor(c: Category): string {
  return CATEGORIES[c]?.color ?? CATEGORIES.other.color;
}

export function categoryGlow(c: Category): string {
  return CATEGORIES[c]?.glow ?? CATEGORIES.other.glow;
}

// Traduz um "kind" de aresta (do export_graph.py) numa cor de traço.
const EDGE_KIND_COLOR: Record<string, string> = {
  skill: "rgba(74,222,128,0.55)",
  technology: "rgba(56,189,248,0.55)",
  method: "rgba(45,212,191,0.55)",
  datasource: "rgba(148,163,184,0.45)",
  tool: "rgba(56,189,248,0.4)",
  person: "rgba(244,114,182,0.45)",
  organization: "rgba(34,211,238,0.45)",
  author: "rgba(96,165,250,0.5)",
  about: "rgba(129,140,248,0.45)",
  periodical: "rgba(94,234,212,0.45)",
  awarded: "rgba(251,191,36,0.5)",
  hierarchy: "rgba(100,116,139,0.4)",
  related: "rgba(148,163,184,0.35)",
};

export function edgeColor(kind: string, dim = false): string {
  const base = EDGE_KIND_COLOR[kind] ?? "rgba(148,163,184,0.3)";
  if (!dim) return base;
  // escurece para o estado "não relacionado" no hover
  return base.replace(/0?\.\d+\)$/, "0.08)");
}

// Cor viva para destacar uma aresta incidente ao nó em hover.
export function edgeColorHot(kind: string): string {
  const map: Record<string, string> = {
    skill: "rgba(74,222,128,0.95)",
    technology: "rgba(56,189,248,0.95)",
    method: "rgba(45,212,191,0.95)",
    datasource: "rgba(148,163,184,0.85)",
    tool: "rgba(56,189,248,0.85)",
    person: "rgba(244,114,182,0.9)",
    organization: "rgba(34,211,238,0.9)",
    author: "rgba(96,165,250,0.95)",
    about: "rgba(129,140,248,0.9)",
    periodical: "rgba(94,234,212,0.9)",
    awarded: "rgba(251,191,36,0.95)",
    hierarchy: "rgba(100,116,139,0.8)",
    related: "rgba(200,210,230,0.85)",
  };
  return map[kind] ?? "rgba(200,210,230,0.85)";
}
