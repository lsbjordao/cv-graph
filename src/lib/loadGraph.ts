import type { GraphData } from "../types";

// O dataset é servido estaticamente de public/data/graph.json (gerado pelo
// `npm run export:graph` no repositório-fonte). Em produção, base relativa.
export async function loadGraph(): Promise<GraphData> {
  const base = import.meta.env.BASE_URL || "/";
  const res = await fetch(`${base}data/graph.json`, { cache: "no-cache" });
  if (!res.ok) {
    throw new Error(
      `Não consegui carregar data/graph.json (${res.status}). ` +
        "Rode `npm run export:graph` no repositório Curriculum-vitae-CV-json.",
    );
  }
  return (await res.json()) as GraphData;
}
