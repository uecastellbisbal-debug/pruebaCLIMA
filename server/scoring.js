// Scoring logic for a completed WellnessMETER survey.
//
// Methodological constraints taken directly from the knowledge base (MODELO_FINAL_AD,
// sheet "Reglas de interpretación y puntuación"):
//   R1 - Do NOT collapse factors A-D into a single global score before psychometric
//        validation (AFE/AFC) is complete. We therefore always report four separate
//        factor scores, never a blended "wellness index".
//   R2 - Report results by subfactor and level, with careful aggregation.
//   R4 - Do not claim psychometric validation until AFE/ESEM is complete.
//
// All questions use a 1-10 scale (confirmed against the source data: every row in
// WM-BQ has Escala = "1-10").
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MODEL_DIR = path.join(__dirname, "..", "data", "model");

function loadJson(name) {
  return JSON.parse(readFileSync(path.join(MODEL_DIR, name), "utf-8"));
}

export const preguntasSeleccionadas = loadJson("preguntas_seleccionadas.json");
export const subfactores = loadJson("subfactores.json");
export const factores = loadJson("factores.json");
export const indicadores = loadJson("indicadores.json");

const questionById = new Map(preguntasSeleccionadas.map((q) => [q.id, q]));

function avg(nums) {
  if (!nums.length) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100;
}

/**
 * @param {Array<{questionId: string, value: number}>} answers
 */
export function scoreResponse(answers) {
  const valueByQuestion = new Map();
  for (const a of answers) {
    const v = Number(a.value);
    if (!Number.isFinite(v) || v < 1 || v > 10) continue;
    if (!questionById.has(a.questionId)) continue; // ignore anything not in the selected bank
    valueByQuestion.set(a.questionId, v);
  }

  // --- by subfactor (normalized code, e.g. "A.1.1") ---
  const bySubfactorValues = new Map();
  for (const q of preguntasSeleccionadas) {
    const val = valueByQuestion.get(q.id);
    if (val === undefined) continue;
    const code = q.codigoSubfactorNormalizado || q.subfactor;
    if (!bySubfactorValues.has(code)) bySubfactorValues.set(code, []);
    bySubfactorValues.get(code).push(val);
  }
  const subfactorScores = subfactores
    .map((sf) => {
      const vals = bySubfactorValues.get(sf.codigo) || [];
      return {
        codigo: sf.codigo,
        nombre: sf.nombre,
        factor: sf.factor,
        grupo: sf.grupo,
        nombreGrupo: sf.nombreGrupo,
        score: avg(vals),
        respondidas: vals.length,
        totalSeleccionadas: Number(sf.seleccionadas) || 0,
      };
    })
    .filter((s) => s.respondidas > 0);

  // --- by factor (A/B/C/D) - kept separate per Rule R1, never merged into one index ---
  const byFactorValues = new Map();
  for (const q of preguntasSeleccionadas) {
    const val = valueByQuestion.get(q.id);
    if (val === undefined) continue;
    if (!byFactorValues.has(q.factor)) byFactorValues.set(q.factor, []);
    byFactorValues.get(q.factor).push(val);
  }
  const factorScores = factores.map((f) => {
    const vals = byFactorValues.get(f.codigo) || [];
    return {
      codigo: f.codigo,
      nombre: f.nombre,
      score: avg(vals),
      respondidas: vals.length,
    };
  });

  // --- by indicator ---
  const indicatorScores = indicadores
    .map((ind) => {
      const vals = ind.preguntasIds
        .map((qid) => valueByQuestion.get(qid))
        .filter((v) => v !== undefined);
      const score = avg(vals);
      let interpretacion = null;
      if (score !== null) {
        interpretacion = score >= 5.5 ? ind.interpretacionAlta : ind.interpretacionBaja;
      }
      return {
        id: ind.id,
        nombre: ind.nombre,
        factor: ind.factor,
        score,
        respondidas: vals.length,
        totalPreguntas: ind.preguntasIds.length,
        interpretacion,
        pendiente: ind.pendiente || null,
      };
    })
    .filter((i) => i.totalPreguntas > 0);

  return {
    respondidas: valueByQuestion.size,
    totalPreguntas: preguntasSeleccionadas.length,
    subfactorScores,
    factorScores,
    indicatorScores,
    nota:
      "Por la Regla R1 del modelo (MODELO_FINAL_AD), no se calcula una puntuación global A-D unica: los cuatro factores se reportan por separado, y la validacion psicometrica empirica (AFE/AFC) esta pendiente.",
  };
}

/**
 * Aggregate multiple stored responses (for the admin panel) by averaging each
 * respondent's own subfactor/factor/indicator scores - i.e. an average of averages,
 * which keeps a single very talkative respondent from swamping the others.
 */
export function aggregateResponses(storedResponses) {
  const n = storedResponses.length;
  if (n === 0) {
    return { n: 0, subfactorScores: [], factorScores: [], indicatorScores: [] };
  }

  function aggregateBy(list, keyField) {
    const byKey = new Map();
    for (const resp of storedResponses) {
      for (const item of resp.result[list] || []) {
        if (item.score === null) continue;
        const key = item[keyField];
        if (!byKey.has(key)) byKey.set(key, { meta: item, scores: [] });
        byKey.get(key).scores.push(item.score);
      }
    }
    return [...byKey.values()].map(({ meta, scores }) => ({
      ...meta,
      score: avg(scores),
      respondidas: undefined,
      nRespuestas: scores.length,
    }));
  }

  return {
    n,
    subfactorScores: aggregateBy("subfactorScores", "codigo"),
    factorScores: aggregateBy("factorScores", "codigo"),
    indicatorScores: aggregateBy("indicatorScores", "id"),
  };
}
