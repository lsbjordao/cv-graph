import { useEffect, useRef } from "react";
import ForceGraph from "force-graph";
import { useGraphStore } from "../store";
import { usePreparedGraph } from "../lib/useGraphData";
import {
  linkColorFor,
  linkSourceColor,
  nodeColorFor,
  NO_HIGHLIGHT,
  type HighlightState,
} from "../lib/highlight";
import { nodeRadius } from "../lib/neighbors";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Em 2D os labels são desenhados no canvas (baratos), mas só mostramos para
// nós grandes ou em zoom alto para manter a legibilidade.
const LABEL_MIN_DEGREE_2D = 8;

export default function Graph2D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<any>(null);
  const lastHighlightRef = useRef<HighlightState>(NO_HIGHLIGHT);

  const prepared = usePreparedGraph();
  const showLabels = useGraphStore((s) => s.showLabels);
  const mode = useGraphStore((s) => s.mode);

  const ForceGraphFn = ForceGraph as unknown as () => (el: HTMLElement) => any;

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;

    const Graph = ForceGraphFn()(el)
      .backgroundColor("#070b14")
      .warmupTicks(40)
      .cooldownTicks(80)
      .d3AlphaDecay(0.04)
      .d3VelocityDecay(0.4)
      .linkDirectionalParticles(0)
      .nodeLabel((node: any) => node.label)
      .linkColor(() => "rgba(120,140,170,0.15)")
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
    applyHighlight2D(g, prepared.highlight);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prepared?.nodes, prepared?.links]);

  useEffect(() => {
    const g = instanceRef.current;
    if (!g || !prepared) return;
    const hl = prepared.highlight;
    if (
      hl.focusId === lastHighlightRef.current.focusId &&
      hl.neighborIds === lastHighlightRef.current.neighborIds &&
      hl.dimUnfocusedNodes === lastHighlightRef.current.dimUnfocusedNodes
    )
      return;
    lastHighlightRef.current = hl;
    applyHighlight2D(g, hl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prepared?.highlight]);

  // toggle de labels não depende do highlight
  useEffect(() => {
    const g = instanceRef.current;
    if (!g || !prepared) return;
    applyHighlight2D(g, prepared.highlight);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showLabels]);

  if (mode !== "2d") return null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      aria-label="Visualização 2D do grafo curricular"
    />
  );
}

function applyHighlight2D(g: any, hl: HighlightState): void {
  const showLabels = useGraphStore.getState().showLabels;
  g.nodeColor((node: any) => nodeColorFor(node, hl))
    .nodeRelSize(1)
    .nodeVal((node: any) => nodeRadius(node.degree ?? 0))
    .linkColor((link: any) => linkColorFor(link, hl))
    .linkDirectionalParticles((link: any) => isActiveLink(link, hl) ? 4 : 0)
    .linkDirectionalParticleCanvasObject(drawGlowParticle)
    .linkDirectionalParticleSpeed(0.008)
    .nodePointerAreaPaint((node: any, color: string, ctx: CanvasRenderingContext2D) => {
      ctx.beginPath();
      ctx.arc(node.x ?? 0, node.y ?? 0, Math.max(5, nodeRadius(node.degree ?? 0)), 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
    })
    .nodeCanvasObject((node: any, ctx: CanvasRenderingContext2D, globalScale: number) =>
      drawNode(ctx, node, hl, globalScale, showLabels),
    );
}

function isActiveLink(link: any, hl: HighlightState): boolean {
  if (!hl.focusId) return false;
  const sid = typeof link.source === "string" ? link.source : link.source.id;
  const tid = typeof link.target === "string" ? link.target : link.target.id;
  return (
    hl.activeEdgeKeys.has(`${sid}|${tid}|${link.label}`) ||
    hl.activeEdgeKeys.has(`${tid}|${sid}|${link.label}`)
  );
}

function drawGlowParticle(
  x: number,
  y: number,
  link: any,
  ctx: CanvasRenderingContext2D,
  globalScale: number,
): void {
  const color = linkSourceColor(link);
  const haloRadius = 8 / globalScale;
  const coreRadius = 2.4 / globalScale;
  const glow = ctx.createRadialGradient(x, y, 0, x, y, haloRadius);
  glow.addColorStop(0, `${color}ff`);
  glow.addColorStop(coreRadius / haloRadius, `${color}e6`);
  glow.addColorStop(0.55, `${color}66`);
  glow.addColorStop(1, `${color}00`);

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, haloRadius, 0, 2 * Math.PI);
  ctx.fillStyle = glow;
  ctx.fill();
  ctx.restore();
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
    ctx.arc(x, y, r + 2.5, 0, 2 * Math.PI);
    ctx.fillStyle = color + "33";
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();

  const showThisLabel =
    showLabels &&
    (scale > 2.5 || node.degree >= LABEL_MIN_DEGREE_2D || node.id === hl.focusId);
  if (showThisLabel) {
    ctx.font = `${Math.max(8, 10 / scale)}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = "rgba(203,213,225,0.85)";
    ctx.fillText(truncate(node.label, 24), x, y + r + 2);
  }
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
