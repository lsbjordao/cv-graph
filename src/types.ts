// Forma do dataset gerado por export_graph.py. A interface não conhece
// JSON-LD nem ontologia — consome só este formato.

export type Category =
  | "person"
  | "organization"
  | "employment"
  | "education"
  | "project"
  | "skill"
  | "technology"
  | "method"
  | "datasource"
  | "area"
  | "publication"
  | "teaching"
  | "academic"
  | "event"
  | "award"
  | "periodical"
  | "other";

export interface GraphNode {
  id: string;
  label: string;
  primaryType: string | null;
  category: Category;
  types: string[];
  dates: Record<string, string> | null;
  snippet: string | null;
  url: string | null;
  doi: string | null;
  image: string | null;
  degree: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  label: string;
  kind: string;
}

export interface GraphMeta {
  base: string;
  person: string;
  stats: { nodes: number; edges: number };
  generatedBy: string;
}

export interface GraphData {
  meta: GraphMeta;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// O tipo que o force-graph / 3d-force-graph espera internamente: os mesmos
// GraphNode/GraphEdge enriquecidos com coordenadas e índices em runtime.
export interface RuntimeNode extends GraphNode {
  x?: number;
  y?: number;
  z?: number;
  __index?: number;
}

export interface RuntimeLink {
  source: RuntimeNode | string;
  target: RuntimeNode | string;
  label: string;
  kind: string;
}

export type ViewMode = "3d" | "2d";
