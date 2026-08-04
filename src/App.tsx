import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGraphStore } from "./store";
import { loadGraph } from "./lib/loadGraph";
import GraphCanvas from "./components/GraphCanvas";
import Header from "./components/Header";
import Controls from "./components/Controls";
import FilterBar from "./components/FilterBar";
import SearchBar from "./components/SearchBar";
import DetailPanel from "./components/DetailPanel";
import Legend from "./components/Legend";

export default function App() {
  const loading = useGraphStore((s) => s.loading);
  const error = useGraphStore((s) => s.error);
  const setData = useGraphStore((s) => s.setData);
  const setLoading = useGraphStore((s) => s.setLoading);
  const setError = useGraphStore((s) => s.setError);
  const select = useGraphStore((s) => s.select);
  const data = useGraphStore((s) => s.data);

  // carrega o dataset uma vez
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadGraph()
      .then((d) => {
        if (cancelled) return;
        setData(d);
        setLoading(false);
        // abre o painel na pessoa principal por padrão
        if (d.meta.person) select(d.meta.person);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-ink-950 text-slate-100">
      {/* halo de fundo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(1200px 800px at 30% 20%, rgba(56,189,248,0.08), transparent 60%)," +
            "radial-gradient(1000px 700px at 80% 80%, rgba(167,139,250,0.07), transparent 60%)",
        }}
      />

      {data && <GraphCanvas />}

      <Header />
      <FilterBar />
      <SearchBar />
      <Controls />
      <Legend />
      <DetailPanel />

      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 flex items-center justify-center bg-ink-950"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-sky-500/30 border-t-sky-400" />
              <p className="text-sm text-slate-400">Montando o grafo…</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-ink-950/95 p-6"
          >
            <div className="max-w-md rounded-2xl border border-red-500/20 bg-red-950/30 p-6 text-center">
              <h2 className="text-base font-semibold text-red-200">
                Não foi possível carregar o grafo
              </h2>
              <p className="mt-2 text-sm text-red-300/80">{error}</p>
              <p className="mt-3 text-xs text-slate-400">
                Gere os dados no repositório-fonte:
                <code className="mt-1 block rounded bg-black/40 px-2 py-1 font-mono text-[11px] text-slate-300">
                  npm run export:graph
                </code>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
