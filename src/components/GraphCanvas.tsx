import { useGraphStore } from "../store";
import Graph3D from "./Graph3D";
import Graph2D from "./Graph2D";

// Comuta entre 3D e 2D conforme o modo. Cada um monta/desmonta o próprio
// canvas, então a troca reinicia a simulação (esperado num toggle de motor).
export default function GraphCanvas() {
  const mode = useGraphStore((s) => s.mode);
  return (
    <div className="absolute inset-0">
      {mode === "3d" ? <Graph3D /> : <Graph2D />}
    </div>
  );
}
