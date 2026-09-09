import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../../api.js";
import ScoreBar from "../../components/ScoreBar.jsx";

export default function Responses() {
  const { id } = useParams();
  if (id) return <ResponseDetail id={id} />;
  return <ResponseList />;
}

function ResponseList() {
  const [responses, setResponses] = useState(null);
  const [aggregate, setAggregate] = useState(null);

  useEffect(() => {
    api.listResponses().then(setResponses).catch(() => {});
    api.aggregate().then(setAggregate).catch(() => {});
  }, []);

  return (
    <div>
      <h1>Respuestas de la encuesta</h1>
      <p className="subtitle">
        Cada envío se puntúa por subfactor, factor e indicador en el momento de guardarse. El agregado
        promedia las puntuaciones de cada persona (no las respuestas individuales), para que nadie pese
        más que otra persona por responder más preguntas.
      </p>

      {aggregate && aggregate.n > 0 && (
        <div className="card">
          <h2>Agregado ({aggregate.n} respuestas)</h2>
          <h3>Por factor</h3>
          {aggregate.factorScores.map((f) => (
            <ScoreBar key={f.codigo} label={`${f.codigo} · ${f.nombre}`} score={f.score} factor={f.codigo} />
          ))}
        </div>
      )}
      {aggregate && aggregate.n === 0 && (
        <div className="callout info">Todavía no hay respuestas registradas.</div>
      )}

      <div className="card">
        <h2>Envíos individuales</h2>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Respondidas</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {responses &&
              responses
                .slice()
                .reverse()
                .map((r) => (
                  <tr key={r.id}>
                    <td>{new Date(r.createdAt).toLocaleString()}</td>
                    <td>
                      {r.respondidas} / {r.totalPreguntas}
                    </td>
                    <td>
                      <Link to={`/resultados/${r.id}`}>Ver resultados →</Link>
                    </td>
                  </tr>
                ))}
            {responses && responses.length === 0 && (
              <tr>
                <td colSpan={3} className="text-muted">
                  Sin respuestas todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ResponseDetail({ id }) {
  const [record, setRecord] = useState(null);
  useEffect(() => {
    api.getResponse(id).then(setRecord).catch(() => {});
  }, [id]);
  if (!record) return <p className="text-muted">Cargando…</p>;
  return (
    <div>
      <h1>Respuesta {record.id}</h1>
      <pre className="mono" style={{ whiteSpace: "pre-wrap" }}>
        {JSON.stringify(record, null, 2)}
      </pre>
    </div>
  );
}
