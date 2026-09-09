import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";

export default function Home() {
  const [factores, setFactores] = useState(null);
  const [cierre, setCierre] = useState(null);

  useEffect(() => {
    api.model("factores").then(setFactores).catch(() => {});
    api.model("cierre").then(setCierre).catch(() => {});
  }, []);

  const resumen = cierre?.resumenEjecutivo || [];
  const val = (clave) => resumen.find((r) => r.clave === clave)?.valor;

  return (
    <div className="page">
      <h1>WellnessMETER</h1>
      <p className="subtitle">
        Encuesta de bienestar laboral construida sobre el WM-KB (Knowledge Base) v7.0 RC1 — arquitectura
        multinivel de 4 factores, 51 subfactores y un banco maestro de 278 preguntas metodológicamente
        auditadas, de las que {val("Preguntas") || "95-97"} están seleccionadas para el cuestionario actual.
      </p>

      <div className="card-grid" style={{ marginBottom: 24 }}>
        <div className="stat">
          <div className="value">{val("Madurez") || "M5"}</div>
          <div className="label">Madurez metodológica</div>
        </div>
        <div className="stat">
          <div className="value">{val("Subfactores") || "51"}</div>
          <div className="label">Subfactores cubiertos</div>
        </div>
        <div className="stat">
          <div className="value">{val("Estado") || "Cierre metodológico"}</div>
          <div className="label">Estado del modelo</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h2>Responder la encuesta</h2>
          <p className="text-muted">
            Cuestionario de {val("Preguntas") || "~95"} preguntas (escala 1–10), agrupadas por factor y
            subfactor. Tarda entre 12 y 18 minutos.
          </p>
          <Link to="/encuesta" className="btn">
            Empezar encuesta →
          </Link>
        </div>
        <div className="card">
          <h2>Panel de gestión</h2>
          <p className="text-muted">
            Explora los factores, subfactores, el banco completo de preguntas, indicadores, planes de
            acción, decisiones metodológicas, gobernanza y las ~110 hojas de auditoría del WM-KB original.
          </p>
          <Link to="/panel" className="btn secondary">
            Abrir panel →
          </Link>
        </div>
      </div>

      {factores && (
        <div className="card">
          <h2>Los 4 factores</h2>
          <table>
            <thead>
              <tr>
                <th>Factor</th>
                <th>Nombre</th>
                <th>Estado</th>
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
