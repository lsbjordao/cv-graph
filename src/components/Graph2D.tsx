import { useEffect, useRef } from "react";
import ForceGraphBase from "force-graph";
import { useGraphStore } from "../store";
import { usePreparedGraph } from "../lib/useGraphData";
import {
  linkColorFor,
  nodeColorFor,
  type HighlightState,
} from "../lib/highlight";
import { nodeRadius } from "../lib/neighbors";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Renderização 2D (force-graph). Mesma lógica de highlight do Graph3D —
// ambos consomem usePreparedGraph, então hover/clique/filtros ficam idênticos.
//
// As libs force-graph (vasturiano) encadeiam setters com generics próprios;
// aqui tratamos a instância como `any` e os callbacks recebem nós/arestas
// "crus" que castamos para o nosso RNode/RLink em runtime. É o padrão
// adotado pela comunidade para essas libs.
export default function Graph2D() {
  const containerRef = useRef<HTMLDivElement>(null);
  // biome-ignore lint/suspicious/noExplicitAny: instância da lib force-graph
  const instanceRef = useRef<any>(null);

  const prepared = usePreparedGraph();
  const showLabels = useGraphStore((s) => s.showLabels);
  const mode = useGraphStore((s) => s.mode);

  // force-graph é exportado como classe no tipo, mas em runtime é uma factory
  // function `ForceGraph()(element)`. Fazemos o cast no ponto de uso.
  const ForceGraph = ForceGraphBase as unknown as () => (el: HTMLElement) => any;

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;

    const Graph = ForceGraph()(el)
      .backgroundColor("#070b14")
      .warmupTicks(60)
      .cooldownTicks(120)
      .d3VelocityDecay(0.3)
      .linkDirectionalParticles(0)
      .linkDirectionalParticleSpeed(0.004)
      .onNodeHover((node: any) => {
        useGraphStore.getState().hover(node ? node.id : null);
        el.style.cursor = node ? "pointer" : "grab";
      })
      .onNodeClick((node: any) => {
        useGraphStore.getState().select(node.id);
        const g = instanceRef.current;
        if (g) {
          g.centerAt(node.x ?? 0, node.y ?? 0, 600);
          g.zoom(3, 600);
        }
      })
      .onBackgroundClick(() => {
        useGraphStore.getState().hover(null);
      });

    instanceRef.current = Graph;

    return () => {
      Graph._destructor();
      el.innerHTML = "";
      instanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const g = instanceRef.current;
    if (!g || !prepared) return;
    g.graphData({ nodes: prepared.nodes, links: prepared.links });
    refreshColors(g, prepared.highlight, showLabels);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prepared?.nodes, prepared?.links]);

  useEffect(() => {
    const g = instanceRef.current;
    if (!g || !prepared) return;
    refreshColors(g, prepared.highlight, showLabels);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prepared?.highlight, showLabels]);

  if (mode !== "2d") return null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      aria-label="Visualização 2D do grafo curricular"
    />
  );
}

function refreshColors(g: any, hl: HighlightState, showLabels: boolean): void {
  g.nodeColor((node: any) => nodeColorFor(node, hl))
    .nodeRelSize(1)
    .nodeVal((node: any) => nodeRadius(node.degree ?? 0))
    .nodeLabel((node: any) =>
      `<div class="fg-tip"><span class="fg-tip__label">${escapeHtml(node.label)}</span>` +
      (node.snippet ? `<span class="fg-tip__snippet">${escapeHtml(node.snippet)}</span>` : "") +
      `</div>`,
    )
    .linkColor((link: any) => linkColorFor(link, hl))
    .linkDirectionalParticleWidth((link: any) => particleWidth(link, hl))
    .linkDirectionalParticles(2)
    .nodeCanvasObject((node: any, ctx: CanvasRenderingContext2D, globalScale: number) =>
      drawNode(ctx, node, hl, globalScale, showLabels),
    );
}

function particleWidth(link: any, hl: HighlightState): number {
  const sid = typeof link.source === "string" ? link.source : link.source.id;
  const tid = typeof link.target === "string" ? link.target : link.target.id;
  const active =
    hl.activeEdgeKeys.has(`${sid}|${tid}|${link.label}`) ||
    hl.activeEdgeKeys.has(`${tid}|${sid}|${link.label}`);
  return active ? 2 : 0;
}

function drawNode(
  ctx: CanvasRenderingContext2D,
  node: any,
  hl: HighlightState,
  scale: number,
  showLabels: boolean,
): void {
  const r = nodeRadius(node.degree ?? 0);
  const color = nodeColorFor(node, hl);
  const x = node.x ?? 0;
  const y = node.y ?? 0;

  if (hl.focusId && hl.neighborIds.has(node.id)) {
    ctx.beginPath();
    ctx.arc(x, y, r + 3, 0, 2 * Math.PI);
    ctx.fillStyle = color + "33";
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();

  const showThisLabel =
    showLabels && (scale > 2.2 || node.degree >= 6 || node.id === hl.focusId);
  if (showThisLabel) {
    ctx.font = `${Math.max(8, 11 / scale)}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = "rgba(226,232,240,0.85)";
    ctx.fillText(truncate(node.label, 26), x, y + r + 2);
  }
}

function escapeHtml(s: string): string {
  return (s ?? "").replace(/[&<>"']/g, (c: string) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c,
  );
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
