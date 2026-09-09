import { useEffect, useMemo, useState } from "react";
import { api } from "../../api.js";
import DataTable from "../../components/DataTable.jsx";

export default function Questions() {
  const [preguntas, setPreguntas] = useState(null);
  const [factorFilter, setFactorFilter] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");

  useEffect(() => {
    api.model("preguntas").then(setPreguntas).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    if (!preguntas) return [];
    return preguntas.filter(
      (p) =>
        (!factorFilter || p.factor === factorFilter) && (!estadoFilter || p.estado === estadoFilter)
    );
  }, [preguntas, factorFilter, estadoFilter]);

  if (!preguntas) return <p className="text-muted">Cargando banco de preguntas…</p>;

  const estados = [...new Set(preguntas.map((p) => p.estado))];

  return (
    <div>
      <h1>Banco de preguntas (WM-BQ)</h1>
      <p className="subtitle">
        Fuente única de verdad del modelo: {preguntas.length} registros, cada uno con ID permanente,
        criterios metodológicos (claridad, relevancia, accionabilidad, no redundancia, sensibilidad al
        cambio…), decisión y justificación.
      </p>

      <div className="filters">
        <select value={factorFilter} onChange={(e) => setFactorFilter(e.target.value)}>
          <option value="">Todos los factores</option>
          {["A", "B", "C", "D"].map((f) => (
            <option key={f} value={f}>
              Factor {f}
            </option>
          ))}
        </select>
        <select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)}>
          <option value="">Todos los estados</option>
          {estados.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        searchPlaceholder="Buscar por texto de la pregunta, ID, subfactor…"
        columns={[
          { key: "id", label: "ID" },
          { key: "factor", label: "F", render: (v) => <span className={`badge factor-${v}`}>{v}</span> },
          { key: "subdimension", label: "Subfactor" },
          { key: "pregunta", label: "Pregunta" },
          {
            key: "estado",
            label: "Estado",
            render: (v) => <span className={`badge estado-${v}`}>{v}</span>,
          },
          { key: "prioridad", label: "Prioridad" },
          { key: "madurezMetodologica", label: "Madurez" },
        ]}
        rows={filtered}
        pageSize={25}
      />
    </div>
  );
}
