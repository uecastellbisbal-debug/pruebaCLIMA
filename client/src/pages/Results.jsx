import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api.js";
import ScoreBar from "../components/ScoreBar.jsx";

export default function Results() {
  const { id } = useParams();
  const [record, setRecord] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getResponse(id).then(setRecord).catch((e) => setError(e.message));
  }, [id]);

  if (error) {
    return (
      <div className="page page-narrow">
        <div className="callout">No se pudo cargar el resultado: {error}</div>
      </div>
    );
  }
  if (!record) {
    return (
      <div className="page page-narrow">
        <p className="text-muted">Cargando resultados…</p>
      </div>
    );
  }

  const { result } = record;
  const subfactorsByFactor = {};
  for (const s of result.subfactorScores) {
    if (!subfactorsByFactor[s.factor]) subfactorsByFactor[s.factor] = [];
    subfactorsByFactor[s.factor].push(s);
  }

  return (
    <div className="page">
      <h1>Tus resultados</h1>
      <p className="subtitle">
        {result.respondidas} de {result.totalPreguntas} preguntas respondidas · enviado el{" "}
        {new Date(record.createdAt).toLocaleString()}
      </p>

      <div className="callout info">{result.nota}</div>

      <div className="card">
        <h2>Puntuación por factor</h2>
        {result.factorScores.map((f) => (
          <ScoreBar key={f.codigo} label={`${f.codigo} · ${f.nombre}`} score={f.score} factor={f.codigo} />
        ))}
      </div>

      {Object.entries(subfactorsByFactor).map(([factor, subs]) => (
        <div className="card" key={factor}>
          <h2>
            <span className={`badge factor-${factor}`}>{factor}</span> Subfactores
          </h2>
          {subs.map((s) => (
            <ScoreBar key={s.codigo} label={`${s.codigo} · ${s.nombre}`} score={s.score} factor={factor} />
          ))}
        </div>
      ))}

      <div className="card">
        <h2>Indicadores</h2>
        <p className="text-muted" style={{ marginTop: -6 }}>
          Cada indicador sintetiza una o varias preguntas seleccionadas del WM-KB con una interpretación
          cualitativa (umbral 5,5/10).
        </p>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Indicador</th>
                <th>Puntuación</th>
                <th>Interpretación</th>
              </tr>
            </thead>
            <tbody>
              {result.indicatorScores.map((ind) => (
                <tr key={ind.id}>
                  <td>
                    <span className={`badge factor-${ind.factor}`}>{ind.factor}</span> {ind.nombre}
                    <div className="mono text-muted">{ind.id}</div>
                  </td>
                  <td>{ind.score !== null ? ind.score.toFixed(1) : ind.pendiente ? "—" : "sin datos"}</td>
                  <td>{ind.interpretacion || (ind.pendiente ? <em className="text-muted">{ind.pendiente}</em> : "—")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Link to="/encuesta" className="btn secondary">
        ← Responder otra encuesta
      </Link>
    </div>
  );
}
