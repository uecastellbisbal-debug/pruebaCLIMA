import express from "express";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

import { scoreResponse, aggregateResponses } from "./scoring.js";
import { readAll, append, getById } from "./store.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");
const MODEL_DIR = path.join(DATA_DIR, "model");
const RAW_DIR = path.join(DATA_DIR, "raw");
const CLIENT_DIST = path.join(__dirname, "..", "client", "dist");

const PORT = process.env.PORT || 4000;

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

function loadModel(name) {
  return JSON.parse(fs.readFileSync(path.join(MODEL_DIR, `${name}.json`), "utf-8"));
}

// ---------------------------------------------------------------------------
// Curated model API - what the Survey and the specialized Admin views consume.
// ---------------------------------------------------------------------------
const modelEndpoints = [
  "factores",
  "subfactores",
  "preguntas",
  "preguntas_seleccionadas",
  "indicadores",
  "planes_accion",
  "decisiones",
  "criterios_metodologicos",
  "gobernanza",
  "cierre",
  "dashboard",
  "modelo_final_ad",
];
for (const name of modelEndpoints) {
  app.get(`/api/model/${name}`, (req, res) => {
    try {
      res.json(loadModel(name));
    } catch (e) {
      res.status(500).json({ error: `No se pudo cargar ${name}`, detail: String(e) });
    }
  });
}

// One call that returns everything the Survey page needs to render.
app.get("/api/survey/definition", (req, res) => {
  res.json({
    factores: loadModel("factores"),
    subfactores: loadModel("subfactores"),
    preguntas: loadModel("preguntas_seleccionadas"),
  });
});

// ---------------------------------------------------------------------------
// Raw knowledge-base explorer - every one of the ~110 sheets from the original
// workbook, unabridged, for the admin "Explorador KB" screen.
// ---------------------------------------------------------------------------
app.get("/api/kb/manifest", (req, res) => {
  const manifest = JSON.parse(fs.readFileSync(path.join(RAW_DIR, "_manifest.json"), "utf-8"));
  res.json(manifest);
});

app.get("/api/kb/sheet/:file", (req, res) => {
  const file = path.basename(req.params.file); // guard against path traversal
  const full = path.join(RAW_DIR, file);
  if (!full.startsWith(RAW_DIR) || !fs.existsSync(full)) {
    return res.status(404).json({ error: "Hoja no encontrada" });
  }
  res.json(JSON.parse(fs.readFileSync(full, "utf-8")));
});

// ---------------------------------------------------------------------------
// Survey responses
// ---------------------------------------------------------------------------
app.post("/api/responses", async (req, res) => {
  const { answers, meta } = req.body || {};
  if (!Array.isArray(answers)) {
    return res.status(400).json({ error: "Se espera un array 'answers' de {questionId, value}." });
  }
  const result = scoreResponse(answers);
  const record = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    meta: meta || {},
    answers,
    result,
  };
  await append(record);
  res.status(201).json(record);
});

app.get("/api/responses", (req, res) => {
  const all = readAll();
  // list view: omit raw answers to keep the payload light
  res.json(
    all.map(({ id, createdAt, meta, result }) => ({
      id,
      createdAt,
      meta,
      respondidas: result.respondidas,
      totalPreguntas: result.totalPreguntas,
    }))
  );
});

app.get("/api/responses/aggregate", (req, res) => {
  res.json(aggregateResponses(readAll()));
});

app.get("/api/responses/:id", (req, res) => {
  const record = getById(req.params.id);
  if (!record) return res.status(404).json({ error: "Respuesta no encontrada" });
  res.json(record);
});

// ---------------------------------------------------------------------------
// Serve the built client in production (npm run build in /client first)
// ---------------------------------------------------------------------------
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    res.sendFile(path.join(CLIENT_DIST, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`WellnessMETER API escuchando en http://localhost:${PORT}`);
});
