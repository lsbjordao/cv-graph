import { useEffect, useRef } from "react";
import ThreeForceGraphBase from "3d-force-graph";
import SpriteText from "three-spritetext";
import { useGraphStore } from "../store";
import { usePreparedGraph } from "../lib/useGraphData";
import {
  linkColorFor,
  nodeColorFor,
  nodeOpacityFor,
  type HighlightState,
} from "../lib/highlight";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Renderização 3D do grafo via 3d-force-graph. Mesma lógica de highlight do
// Graph2D. A instância é tratada como `any` pelos mesmos motivos (encadeamento
// de setters com generics complexos nas libs do vasturiano).
export default function Graph3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<any>(null);

  const prepared = usePreparedGraph();
  const hoveredId = useGraphStore((s) => s.hoveredId);
  const selectedId = useGraphStore((s) => s.selectedId);
  const mode = useGraphStore((s) => s.mode);

  // 3d-force-graph é exportado como `declare const` (não-callável no tipo),
  // mas em runtime é uma factory `ForceGraph3D()(element)`. Cast no uso.
  const ThreeForceGraph = ThreeForceGraphBase as unknown as () => (el: HTMLElement) => any;

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;

    const Graph = ThreeForceGraph()(el)
      .backgroundColor("#070b14")
      .showNavInfo(false)
      .warmupTicks(80)
      .cooldownTicks(140)
      .linkOpacity(0.6)
      .linkDirectionalParticleSpeed(0.004)
      .onNodeHover((node: any) => {
        useGraphStore.getState().hover(node ? node.id : null);
        el.style.cursor = node ? "pointer" : "grab";
      })
      .onNodeClick((node: any) => {
        useGraphStore.getState().select(node.id);
        focusOn(instanceRef.current, node);
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
    refreshColors(g, prepared.highlight);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prepared?.nodes, prepared?.links]);

  useEffect(() => {
    const g = instanceRef.current;
    if (!g || !prepared) return;
    refreshColors(g, prepared.highlight);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prepared?.highlight]);

  useEffect(() => {
    const g = instanceRef.current;
    if (!g) return;
    const focus = hoveredId ?? selectedId ?? null;
    g.linkDirectionalParticles(focus ? 2 : 0);
    g.linkDirectionalParticleWidth((link: any) => particleWidth(link, focus));
  }, [hoveredId, selectedId]);

  if (mode !== "3d") return null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      aria-label="Visualização 3D do grafo curricular"
    />
  );
}

function particleWidth(link: any, focusId: string | null): number {
  if (!focusId) return 0;
  const sid = typeof link.source === "string" ? link.source : link.source.id;
  const tid = typeof link.target === "string" ? link.target : link.target.id;
  return sid === focusId || tid === focusId ? 0.7 : 0;
}

function refreshColors(g: any, hl: HighlightState): void {
  g.nodeColor((node: any) => nodeColorFor(node, hl))
    .nodeOpacity((node: any) => nodeOpacityFor(node, hl))
    .nodeThreeObjectExtend(true)
    .nodeThreeObject((node: any) => {
      if (!useGraphStore.getState().showLabels) return null;
      if (node.degree < 4 && node.id !== hl.focusId) return null;
      const sprite = new SpriteText(truncate(node.label, 30));
      sprite.color = nodeColorFor(node, hl);
      sprite.textHeight = 6;
      sprite.padding = 2;
      sprite.backgroundColor = "rgba(7,11,20,0.6)";
      sprite.position.y = -10;
      return sprite;
    })
    .linkColor((link: any) => linkColorFor(link, hl));
}

function focusOn(g: any, node: any): void {
  if (!g) return;
  const distance = 160;
  g.cameraPosition(
    { x: (node.x ?? 0) + distance, y: (node.y ?? 0) + distance / 2, z: (node.z ?? 0) + distance },
    { x: node.x ?? 0, y: node.y ?? 0, z: node.z ?? 0 },
    1000,
  );
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
