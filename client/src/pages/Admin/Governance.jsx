import { useEffect, useState } from "react";
import { api } from "../../api.js";

export default function Governance() {
  const [gobernanza, setGobernanza] = useState(null);
  const [cierre, setCierre] = useState(null);

  useEffect(() => {
    api.model("gobernanza").then(setGobernanza).catch(() => {});
    api.model("cierre").then(setCierre).catch(() => {});
  }, []);

  if (!gobernanza || !cierre) return <p className="text-muted">Cargando…</p>;

  return (
    <div>
      <h1>Gobernanza &amp; dictamen de cierre</h1>
      <p className="subtitle">
        Reglas de gobierno del WM-BQ como fuente única de verdad, y el estado del dictamen final de la
        Fase 3 (v7.0 RC1).
      </p>

      <div className="grid-2">
        <div className="card">
          <h2>Elementos de gobernanza</h2>
          <table>
            <tbody>
              {gobernanza.elementos.map((e) => (
                <tr key={e.elemento}>
                  <td style={{ fontWeight: 600 }}>{e.elemento}</td>
                  <td>{e.estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card">
          <h2>Reglas de gobernanza</h2>
          <ol style={{ paddingLeft: 18, fontSize: 13.5, margin: 0 }}>
            {gobernanza.reglas.map((r, i) => (
              <li key={i} style={{ marginBottom: 8 }}>
                {r}
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="card">
        <h2>Dictamen global</h2>
        <table>
          <tbody>
            {cierre.dictamenGlobal.map((r) => (
              <tr key={r.clave}>
                <td style={{ fontWeight: 600, width: 160 }}>{r.clave}</td>
                <td>{r.valor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid-2">
        <div className="card">
          <h2>Resumen ejecutivo</h2>
          <table>
            <tbody>
              {cierre.resumenEjecutivo.map((r) => (
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
    </div>
  );
}
