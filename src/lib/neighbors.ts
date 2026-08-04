import type { GraphData, GraphEdge } from "../types";

// Mapas de adjacência pré-computados: para cada nó, o conjunto de vizinhos e
// o conjunto de arestas incidentes. Alimenta o highlight do hover estilo
// Obsidian (destaca o nó + vizinhos, escurece o resto).

export interface Adjacency {
  neighbors: Map<string, Set<string>>;
  incident: Map<string, Set<GraphEdge>>;
}

export function buildAdjacency(data: GraphData): Adjacency {
  const neighbors = new Map<string, Set<string>>();
  const incident = new Map<string, Set<GraphEdge>>();

  const ensureN = (id: string) => {
    let s = neighbors.get(id);
    if (!s) {
      s = new Set();
      neighbors.set(id, s);
    }
    return s;
  };
  const ensureE = (id: string) => {
    let s = incident.get(id);
    if (!s) {
      s = new Set();
      incident.set(id, s);
    }
    return s;
  };

  for (const e of data.edges) {
    ensureN(e.source).add(e.target);
    ensureN(e.target).add(e.source);
    ensureE(e.source).add(e);
    ensureE(e.target).add(e);
  }

  return { neighbors, incident };
}

// Tamanho visual do nó: escala logarítmica no grau para que a nuvem de 588
// SpeciesAssessment não domine a tela, enquanto hubs (pessoa principal,
// tecnologias muito usadas) se destaquem.
export function nodeRadius(degree: number): number {
  if (degree <= 0) return 2.5;
  return 2.5 + Math.log2(degree + 1) * 1.8;
}
