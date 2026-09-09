import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import LikertInput from "../components/LikertInput.jsx";

const FACTOR_ORDER = ["A", "B", "C", "D"];

export default function Survey() {
  const [def, setDef] = useState(null);
  const [answers, setAnswers] = useState({});
  const [step, setStep] = useState(0); // 0..3 factors, 4 = review
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.surveyDefinition().then(setDef).catch((e) => setError(e.message));
  }, []);

  const questionsByFactor = useMemo(() => {
    if (!def) return {};
    const map = {};
    for (const f of FACTOR_ORDER) map[f] = [];
    for (const q of def.preguntas) {
      if (!map[q.factor]) map[q.factor] = [];
      map[q.factor].push(q);
    }
    return map;
  }, [def]);

  if (error) {
    return (
      <div className="page page-narrow">
        <div className="callout">No se pudo cargar la encuesta: {error}</div>
      </div>
    );
  }
  if (!def) {
    return (
      <div className="page page-narrow">
        <p className="text-muted">Cargando encuesta…</p>
      </div>
    );
  }

  const totalQuestions = def.preguntas.length;
  const answeredCount = Object.keys(answers).length;
  const isReview = step === FACTOR_ORDER.length;
  const currentFactor = !isReview ? FACTOR_ORDER[step] : null;
  const factorMeta = def.factores.find((f) => f.codigo === currentFactor);
  const currentQuestions = currentFactor ? questionsByFactor[currentFactor] || [] : [];
  const currentAnswered = currentQuestions.filter((q) => answers[q.id] !== undefined).length;

  function setAnswer(qid, value) {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
  }

  function groupBySubfactor(questions) {
    const groups = new Map();
    for (const q of questions) {
      const key = q.subdimension || q.subfactor;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(q);
    }
    return [...groups.entries()];
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        answers: Object.entries(answers).map(([questionId, value]) => ({ questionId, value })),
        meta: { source: "web-form" },
      };
      const record = await api.submitResponse(payload);
      navigate(`/resultados/${record.id}`);
    } catch (e) {
      setError(e.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="page page-narrow">
      <h1>Encuesta WellnessMETER</h1>
      <p className="subtitle">
        {isReview
          ? "Revisa tu progreso y envía la encuesta."
          : `Factor ${currentFactor} · ${factorMeta?.nombre}`}
      </p>

      <div className="progress-bar">
        <div
          className="progress-bar-fill"
          style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
        />
      </div>
      <p className="text-muted" style={{ marginTop: -14, marginBottom: 24, fontSize: 13 }}>
        {answeredCount} de {totalQuestions} preguntas respondidas
      </p>

      {!isReview && (
        <div className="card">
          {groupBySubfactor(currentQuestions).map(([subKey, qs]) => (
            <div key={subKey}>
              <h3 style={{ marginTop: 18 }}>{subKey}</h3>
              {qs.map((q) => (
                <div className="question-block" key={q.id}>
                  <div className="question-text">{q.pregunta}</div>
                  <div className="question-meta">
                    {q.id} · {q.constructo}
                  </div>
                  <LikertInput value={answers[q.id]} onChange={(v) => setAnswer(q.id, v)} />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {isReview && (
        <div className="card">
          <h2>Resumen</h2>
          <table>
            <thead>
              <tr>
                <th>Factor</th>
                <th>Preguntas</th>
                <th>Respondidas</th>
              </tr>
            </thead>
            <tbody>
              {FACTOR_ORDER.map((f) => {
                const qs = questionsByFactor[f] || [];
                const answered = qs.filter((q) => answers[q.id] !== undefined).length;
                return (
                  <tr key={f}>
                    <td>
                      <span className={`badge factor-${f}`}>{f}</span>
                    </td>
                    <td>{qs.length}</td>
                    <td>{answered}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {answeredCount < totalQuestions && (
            <div className="callout" style={{ marginTop: 16 }}>
              Faltan {totalQuestions - answeredCount} preguntas por responder. Puedes enviarla igualmente:
              las preguntas sin respuesta simplemente no contarán en tus puntuaciones.
            </div>
          )}
        </div>
      )}

      {error && <div className="callout" style={{ marginBottom: 16 }}>{error}</div>}

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button className="btn secondary" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          ← Anterior
        </button>
        {!isReview ? (
          <button className="btn" onClick={() => setStep((s) => s + 1)}>
            {currentAnswered < currentQuestions.length
              ? `Siguiente (${currentAnswered}/${currentQuestions.length}) →`
              : "Siguiente →"}
          </button>
        ) : (
          <button className="btn" disabled={submitting} onClick={handleSubmit}>
            {submitting ? "Enviando…" : "Enviar encuesta"}
          </button>
        )}
      </div>
    </div>
  );
}
