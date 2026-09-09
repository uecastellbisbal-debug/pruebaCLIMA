import { useEffect, useState } from "react";
import { api } from "../../api.js";
import DataTable from "../../components/DataTable.jsx";

export default function Factors() {
  const [factores, setFactores] = useState(null);
  const [subfactores, setSubfactores] = useState(null);
  const [modelo, setModelo] = useState(null);

  useEffect(() => {
    api.model("factores").then(setFactores).catch(() => {});
    api.model("subfactores").then(setSubfactores).catch(() => {});
    api.model("modelo_final_ad").then(setModelo).catch(() => {});
  }, []);

  return (
    <div>
      <h1>Factores &amp; Subfactores</h1>
      <p className="subtitle">
        Arquitectura A–D del modelo (definiciones tal como constan en las hojas FACTORES, SUBFACTORES y
        DICCIONARIO_SUBFACTORES del WM-KB).
      </p>

      {factores && (
        <div className="card">
          <h2>Factores</h2>
          {factores.map((f) => (
            <div key={f.codigo} style={{ marginBottom: 16 }}>
              <h3>
                <span className={`badge factor-${f.codigo}`}>{f.codigo}</span> {f.nombre}
              </h3>
              <p className="text-muted" style={{ margin: "4px 0" }}>
                {f.definicion}
              </p>
              <p style={{ margin: "4px 0", fontSize: 13.5 }}>
                <strong>Objetivo:</strong> {f.objetivo}
              </p>
              <p style={{ margin: "4px 0", fontSize: 13.5 }} className="text-muted">
                Estado: {f.estado} · Madurez: {f.madurez} · {f.preguntasOriginales} preguntas originales →{" "}
                {f.seleccionadas} seleccionadas
              </p>
            </div>
          ))}
        </div>
      )}

      {modelo && (
        <div className="card">
          <h2>Consolidación del modelo final A–D</h2>
          <table>
            <thead>
              <tr>
                <th>Nivel</th>
                <th>Ámbito</th>
                <th>Subfactores</th>
                <th>Preguntas finales</th>
                <th>Peso</th>
                <th>Unidad de análisis</th>
              </tr>
            </thead>
            <tbody>
              {modelo.niveles.map((n) => (
                <tr key={n.nivel}>
                  <td>{n.nivel === "TOTAL" ? <strong>TOTAL</strong> : <span className={`badge factor-${n.nivel}`}>{n.nivel}</span>}</td>
                  <td>{n.ambito}</td>
                  <td>{n.subfactores}</td>
                  <td>{n.preguntasFinales}</td>
                  <td>{typeof n.peso === "number" ? n.peso.toFixed(3) : n.peso}</td>
                  <td>{n.unidadAnalisis}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <h3 style={{ marginTop: 20 }}>Reglas de interpretación y puntuación</h3>
          <ul style={{ paddingLeft: 20, fontSize: 13.5 }}>
            {modelo.reglasInterpretacion.map((r) => (
              <li key={r.id} style={{ marginBottom: 6 }}>
                <strong>{r.id}.</strong> {r.regla}
              </li>
            ))}
          </ul>
        </div>
      )}

      {subfactores && (
        <div className="card">
          <h2>Diccionario oficial de subfactores ({subfactores.length})</h2>
          <DataTable
            searchPlaceholder="Buscar subfactor…"
            columns={[
              { key: "codigo", label: "Código" },
              {
                key: "factor",
                label: "Factor",
                render: (v) => <span className={`badge factor-${v}`}>{v}</span>,
              },
              { key: "nombreGrupo", label: "Grupo" },
              { key: "nombre", label: "Subfactor" },
              { key: "preguntasBanco", label: "Banco" },
              { key: "seleccionadas", label: "Seleccionadas" },
            ]}
            rows={subfactores}
          />
        </div>
      )}
    </div>
  );
}
