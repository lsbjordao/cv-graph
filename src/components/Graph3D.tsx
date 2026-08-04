import { useEffect, useRef } from "react";
import ThreeForceGraphBase from "3d-force-graph";
import SpriteText from "three-spritetext";
import {
  AdditiveBlending,
  Color,
  Mesh,
  ShaderMaterial,
  SphereGeometry,
} from "three";
import { useGraphStore } from "../store";
import { usePreparedGraph } from "../lib/useGraphData";
import {
  linkColorFor,
  nodeColorFor,
  NO_HIGHLIGHT,
  type HighlightState,
} from "../lib/highlight";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Limiares de performance:
//  - LABEL_MIN_DEGREE: só cria SpriteText (textura WebGL cara) para poucos hubs.
//    765 nós tinham grau >= 4; com >= 15 caímos para ~60 — GPU respira.
//  - ASSESSMENT_LIMIT: assessments (588) não ganham label nunca (são folhas
//    da nuvem de espécies), reduzindo o custo visual.
const LABEL_MIN_DEGREE = 15;

export default function Graph3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<any>(null);
  const lastHighlightRef = useRef<HighlightState>(NO_HIGHLIGHT);

  const prepared = usePreparedGraph();
  const mode = useGraphStore((s) => s.mode);

  // 3d-force-graph é exportado como `declare const` (não-callável no tipo),
  // mas em runtime é uma factory `ForceGraph3D()(element)`. Cast no uso.
  const ThreeForceGraph = ThreeForceGraphBase as unknown as () => any;

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;

    const Graph = ThreeForceGraph()(el)
      .backgroundColor("#070b14")
      .showNavInfo(false)
      .warmupTicks(40)
      .cooldownTicks(80)
      .d3AlphaDecay(0.045) // resfria mais rápido (grafo estrela é difícil)
      .d3VelocityDecay(0.4)
      .nodeRelSize(2.5)
      .nodeResolution(8) // octaedros low-poly (default 12)
      .nodeOpacity(0.92)
      .nodeLabel((node: any) => node.label)
      .linkOpacity(0.35)
      .linkColor(() => "rgba(120,140,170,0.18)")
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

    const controls = Graph.controls();
    const resizeParticles = () => updateParticleScale(Graph.camera(), controls);
    controls.addEventListener("change", resizeParticles);
    resizeParticles();

    instanceRef.current = Graph;

    return () => {
      controls.removeEventListener("change", resizeParticles);
      Graph._destructor();
      el.innerHTML = "";
      instanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // (re)alimenta dados quando o subgrafo muda
  useEffect(() => {
    const g = instanceRef.current;
    if (!g || !prepared) return;
    g.graphData({ nodes: prepared.nodes, links: prepared.links });
    applyHighlight(g, prepared.highlight);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prepared?.nodes, prepared?.links]);

  // recolore só quando o highlight muda (não a cada frame)
  useEffect(() => {
    const g = instanceRef.current;
    if (!g || !prepared) return;
    const hl = prepared.highlight;
    const illuminationChanged =
      hl.dimUnfocusedNodes !== lastHighlightRef.current.dimUnfocusedNodes;
    // skip se o highlight não mudou (evita realloc de accessors)
    if (
      hl.focusId === lastHighlightRef.current.focusId &&
      hl.neighborIds === lastHighlightRef.current.neighborIds &&
      hl.dimUnfocusedNodes === lastHighlightRef.current.dimUnfocusedNodes
    )
      return;
    lastHighlightRef.current = hl;
    applyHighlight(g, hl);
    if (illuminationChanged) g.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prepared?.highlight]);

  if (mode !== "3d") return null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      aria-label="Visualização 3D do grafo curricular"
    />
  );
}

// Aplica cores/labels uma única vez por mudança de highlight.
function applyHighlight(g: any, hl: HighlightState): void {
  const showLabels = useGraphStore.getState().showLabels;
  g.nodeColor((node: any) => nodeColorFor(node, hl))
    .linkColor((link: any) => linkColorFor(link, hl))
    .linkDirectionalParticles((link: any) =>
      isActiveLink(link, hl.focusId) ? 4 : 0,
    )
    .linkDirectionalParticleThreeObject((link: any) => glowParticle(link, hl))
    .linkDirectionalParticleSpeed(0.008)
    .nodeThreeObjectExtend(true)
    .nodeThreeObject((node: any) => {
      // só hubs muito grandes recebem label (SpriteText = textura WebGL cara)
      if (!showLabels) return null;
      if (node.id !== hl.focusId && node.degree < LABEL_MIN_DEGREE) return null;
      const sprite = new SpriteText(truncate(node.label, 22));
      sprite.color = "#cbd5e1";
      sprite.textHeight = 5;
      sprite.padding = 1.5;
      sprite.backgroundColor = "rgba(7,11,20,0.5)";
      sprite.position.y = -8;
      return sprite;
    });
}

const glowParticles = new Map<string, Mesh>();
const particleGeometry = new SphereGeometry(1, 8, 8);
let particleScale = 1;

function glowParticle(link: any, hl: HighlightState): Mesh {
  const color = linkColorFor(link, hl);
  let particle = glowParticles.get(color);
  if (!particle) {
    const opaqueColor = color.replace(
      /^rgba\(([^,]+,[^,]+,[^,]+),[^)]+\)$/,
      "rgb($1)",
    );
    particle = new Mesh(
      particleGeometry,
      new ShaderMaterial({
        uniforms: { glowColor: { value: new Color(opaqueColor) } },
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
        vertexShader: `
          varying float glow;
          void main() {
            vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
            vec3 viewNormal = normalize(normalMatrix * normal);
            glow = max(dot(viewNormal, normalize(-viewPosition.xyz)), 0.0);
            gl_Position = projectionMatrix * viewPosition;
          }
        `,
        fragmentShader: `
          uniform vec3 glowColor;
          varying float glow;
          void main() {
            float alpha = pow(glow, 2.2) * 0.72;
            if (alpha < 0.015) discard;
            gl_FragColor = vec4(glowColor, alpha);
          }
        `,
      }),
    );
    glowParticles.set(color, particle);
  }
  return particle;
}

function updateParticleScale(camera: any, controls: any): void {
  const distance = camera.position.distanceTo(controls.target);
  const nextScale = Math.min(
    1.4,
    Math.max(0.25, Math.pow(distance / 520, 1.25)),
  );
  particleGeometry.scale(nextScale / particleScale, nextScale / particleScale, nextScale / particleScale);
  particleScale = nextScale;
}

function isActiveLink(link: any, focusId: string | null): boolean {
  if (!focusId) return false;
  const sid = typeof link.source === "string" ? link.source : link.source.id;
  const tid = typeof link.target === "string" ? link.target : link.target.id;
  return sid === focusId || tid === focusId;
}

function focusOn(g: any, node: any): void {
  if (!g) return;
  const distance = 180;
  g.cameraPosition(
    { x: (node.x ?? 0) + distance, y: (node.y ?? 0) + distance / 2, z: (node.z ?? 0) + distance },
    { x: node.x ?? 0, y: node.y ?? 0, z: node.z ?? 0 },
    1000,
  );
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
