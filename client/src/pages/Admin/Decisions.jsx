import { useEffect, useState } from "react";
import { api } from "../../api.js";
import DataTable from "../../components/DataTable.jsx";

export default function Decisions() {
  const [decisiones, setDecisiones] = useState(null);
  const [criterios, setCriterios] = useState(null);

  useEffect(() => {
    api.model("decisiones").then(setDecisiones).catch(() => {});
    api.model("criterios_metodologicos").then(setCriterios).catch(() => {});
  }, []);

  if (!decisiones) return <p className="text-muted">Cargando…</p>;

  return (
    <div>
      <h1>Decisiones metodológicas (DM)</h1>
      <p className="subtitle">
        Registro de decisiones (hoja DECISIONES_DM): qué se mantuvo, qué se descartó y por qué, para cada
        ámbito del modelo.
      </p>

      <div className="card">
        <DataTable
          searchPlaceholder="Buscar por ámbito, decisión, justificación…"
          columns={[
            { key: "id", label: "ID" },
            { key: "fecha", label: "Fecha" },
            { key: "ambito", label: "Ámbito" },
            { key: "decision", label: "Decisión" },
            { key: "justificacion", label: "Justificación" },
            { key: "estado", label: "Estado" },
          ]}
          rows={decisiones}
        />
      </div>

      {criterios && (
        <div className="card">
          <h2>Criterios metodológicos</h2>
          <table>
            <thead>
              <tr>
                <th>Criterio</th>
                <th>Definición</th>
                <th>Escala</th>
              </tr>
            </thead>
            <tbody>
              {criterios.map((c) => (
                <tr key={c.criterio}>
                  <td style={{ fontWeight: 600 }}>{c.criterio}</td>
                  <td>{c.definicion}</td>
                  <td>{c.escala}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
