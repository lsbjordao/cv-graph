import { useGraphStore } from "../store";

// Controles flutuantes: alternar 2D/3D, mostrar/ocultar rótulos, recentralizar.
export default function Controls() {
  const mode = useGraphStore((s) => s.mode);
  const setMode = useGraphStore((s) => s.setMode);
  const showLabels = useGraphStore((s) => s.showLabels);
  const setShowLabels = useGraphStore((s) => s.setShowLabels);

  return (
    <div className="pointer-events-auto absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/10 bg-ink-900/70 px-1.5 py-1.5 shadow-2xl backdrop-blur-md sm:bottom-6">
      <div className="flex items-center rounded-full bg-white/5 p-0.5">
        <button
          onClick={() => setMode("3d")}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            mode === "3d"
              ? "bg-sky-500/90 text-white shadow"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          3D
        </button>
        <button
          onClick={() => setMode("2d")}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            mode === "2d"
              ? "bg-sky-500/90 text-white shadow"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          2D
        </button>
      </div>

      <div className="mx-1 h-5 w-px bg-white/10" />

      <button
        onClick={() => setShowLabels(!showLabels)}
        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
          showLabels
            ? "text-sky-200 hover:text-sky-100"
            : "text-slate-500 hover:text-slate-300"
        }`}
        title="Mostrar rótulos"
      >
        Rótulos
      </button>
    </div>
  );
}
