import { useEffect, useState } from "react";
import { api } from "../../api.js";

export default function Overview() {
  const [dashboard, setDashboard] = useState(null);
  const [cierre, setCierre] = useState(null);
  const [factores, setFactores] = useState(null);
  const [manifest, setManifest] = useState(null);
  const [responses, setResponses] = useState(null);

  useEffect(() => {
    api.model("dashboard").then(setDashboard).catch(() => {});
    api.model("cierre").then(setCierre).catch(() => {});
    api.model("factores").then(setFactores).catch(() => {});
    api.kbManifest().then(setManifest).catch(() => {});
    api.listResponses().then(setResponses).catch(() => {});
  }, []);

  return (
    <div>
      <h1>Overview</h1>
      <p className="subtitle">
        Estado consolidado del WM-KB (WellnessMETER Knowledge Base) v7.0 RC1 · Fase 3 Cierre, extraído
        íntegramente del Excel original ({manifest ? manifest.length : "…"} hojas).
      </p>

      <div className="card-grid" style={{ marginBottom: 24 }}>
        <div className="stat">
          <div className="value">{responses ? responses.length : "…"}</div>
          <div className="label">Respuestas de encuesta recibidas</div>
        </div>
        <div className="stat">
          <div className="value">{manifest ? manifest.length : "…"}</div>
          <div className="label">Hojas del WM-KB original</div>
        </div>
        <div className="stat">
          <div className="value">278</div>
          <div className="label">Preguntas en el banco maestro (WM-BQ)</div>
        </div>
        <div className="stat">
          <div className="value">97</div>
          <div className="label">Preguntas seleccionadas para la encuesta</div>
        </div>
      </div>

      {dashboard && (
        <div className="card">
          <h2>{dashboard.titulo}</h2>
          <table>
            <thead>
              <tr>
                <th></th>
                <th>A</th>
                <th>B</th>
                <th>C</th>
                <th>D</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.filas.map((row) => (
                <tr key={row.etiqueta}>
                  <td>{row.etiqueta}</td>
                  <td>{row.A}</td>
                  <td>{row.B}</td>
                  <td>{row.C}</td>
                  <td>{row.D}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {cierre && (
        <div className="grid-2">
          <div className="card">
            <h2>Dictamen global</h2>
            <table>
              <tbody>
                {cierre.dictamenGlobal.map((r) => (
                  <tr key={r.clave}>
                    <td style={{ fontWeight: 600 }}>{r.clave}</td>
                    <td>{r.valor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card">
            <h2>Checklist final</h2>
            <table>
              <tbody>
                {cierre.checklistFinal.map((r) => (
                  <tr key={r.clave}>
                    <td style={{ fontWeight: 600 }}>{r.clave}</td>
                    <td>{r.valor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {cierre && (
        <div className="card">
          <h2>Roadmap de pilotaje</h2>
          <table>
            <tbody>
              {cierre.roadmapPilotaje.map((r) => (
                <tr key={r.clave}>
                  <td style={{ fontWeight: 600, width: 140 }}>{r.clave}</td>
                  <td>{r.valor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {factores && (
        <div className="card">
          <h2>Factores</h2>
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Estado</th>
                <th>Madurez</th>
                <th>Originales</th>
                <th>Seleccionadas</th>
              </tr>
            </thead>
            <tbody>
              {factores.map((f) => (
                <tr key={f.codigo}>
                  <td>
                    <span className={`badge factor-${f.codigo}`}>{f.codigo}</span>
                  </td>
                  <td>{f.nombre}</td>
                  <td>{f.estado}</td>
                  <td>{f.madurez}</td>
                  <td>{f.preguntasOriginales}</td>
                  <td>{f.seleccionadas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
