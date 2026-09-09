import { useEffect, useState } from "react";
import { api } from "../../api.js";

export default function Indicators() {
  const [indicadores, setIndicadores] = useState(null);
  const [planes, setPlanes] = useState(null);

  useEffect(() => {
    api.model("indicadores").then(setIndicadores).catch(() => {});
    api.model("planes_accion").then(setPlanes).catch(() => {});
  }, []);

  if (!indicadores || !planes) return <p className="text-muted">Cargando…</p>;

  const planById = new Map(planes.map((p) => [p.id, p]));

  return (
    <div>
      <h1>Indicadores &amp; planes de acción</h1>
      <p className="subtitle">
        Cada indicador sintetiza una o varias preguntas seleccionadas del banco y define interpretaciones
        cualitativas; los planes de acción vinculan cada subdimensión a un responsable, objetivo y
        horizonte concretos.
      </p>

      {indicadores.map((ind) => {
        const plan = [...planes].find((p) => p.indicadorAsociado === ind.id);
        return (
          <div className="card" key={ind.id}>
            <h3>
              <span className={`badge factor-${ind.factor}`}>{ind.factor}</span> {ind.nombre}
              {ind.calidadDatos !== "ok" && (
                <span className="badge" style={{ marginLeft: 8, background: "#fee2e2", color: "#991b1b" }}>
                  revisar fuente
                </span>
              )}
            </h3>
            <p className="mono text-muted" style={{ margin: "2px 0 10px" }}>
              {ind.id} · subdimensión {ind.subdimension}
            </p>
            {ind.definicion && <p style={{ margin: "6px 0" }}>{ind.definicion}</p>}
            <p style={{ margin: "6px 0", fontSize: 13.5 }}>
              <strong>Preguntas vinculadas:</strong>{" "}
              {ind.preguntasIds.length ? (
                <span className="pill-list" style={{ display: "inline-flex" }}>
                  {ind.preguntasIds.map((q) => (
                    <span key={q} className="badge mono">
                      {q}
                    </span>
                  ))}
                </span>
              ) : (
                <em className="text-muted">{ind.pendiente || "sin preguntas asignadas"}</em>
              )}
            </p>
            <div className="grid-2">
              <div className="callout" style={{ margin: 0 }}>
                <strong>Interpretación baja:</strong> {ind.interpretacionBaja || "—"}
              </div>
              <div className="callout info" style={{ margin: 0 }}>
                <strong>Interpretación alta:</strong> {ind.interpretacionAlta || "—"}
              </div>
            </div>
            {plan && (
              <div style={{ marginTop: 14, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                <p style={{ margin: "2px 0", fontSize: 13.5 }}>
                  <strong>Plan de acción {plan.id}</strong> · Responsable: {plan.responsablePrincipal} ·
                  Horizonte: {plan.horizonte}
                </p>
                <p style={{ margin: "2px 0", fontSize: 13.5 }}>{plan.objetivo}</p>
                <p style={{ margin: "2px 0", fontSize: 13.5 }} className="text-muted">
                  {plan.accionesSugeridas}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
