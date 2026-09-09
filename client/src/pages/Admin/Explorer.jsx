import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api.js";
import DataTable from "../../components/DataTable.jsx";

function categoryOf(sheetName) {
  if (/^AUDITORIA_PSICOMETRICA/.test(sheetName)) return "Auditorías psicométricas";
  if (/^AUDITORIA/.test(sheetName)) return "Auditorías";
  if (/^C7\./.test(sheetName)) return "Factor C · C7 Entorno";
  if (/^C8\./.test(sheetName)) return "Factor C · C8 Liderazgo";
  if (/^C9\./.test(sheetName)) return "Factor C · C9 Cultura";
  if (/^D10\./.test(sheetName)) return "Factor D · D10 FIT";
  if (/_CD$/.test(sheetName) || /_CD_/.test(sheetName)) return "Auditoría transversal C-D";
  if (/_AD$/.test(sheetName) || /_GLOBAL/.test(sheetName)) return "Auditoría global A-D";
  if (/^ROADMAP/.test(sheetName)) return "Roadmaps";
  if (/COBERTURA/.test(sheetName)) return "Cobertura";
  if (/GOBERNANZA|REGLAS/.test(sheetName)) return "Gobernanza";
  if (/^AUD_MET|ICM_|DICTAMEN/.test(sheetName)) return "Auditoría metodológica";
  if (["WM-BQ", "FACTORES", "SUBFACTORES", "INDICADORES", "PLANES_ACCION", "DECISIONES_DM", "DASHBOARD", "CRITERIOS_METODOLOGICOS", "CATALOGOS", "DICCIONARIO_SUBFACTORES"].includes(sheetName))
    return "Modelo base";
  return "Otras hojas";
}

export default function Explorer() {
  const { file } = useParams();
  const navigate = useNavigate();
  const [manifest, setManifest] = useState(null);
  const [sheetData, setSheetData] = useState(null);
  const [query, setQuery] = useState("");
  const [loadingSheet, setLoadingSheet] = useState(false);

  useEffect(() => {
    api.kbManifest().then(setManifest).catch(() => {});
  }, []);

  useEffect(() => {
    if (!file) {
      setSheetData(null);
      return;
    }
    setLoadingSheet(true);
    api
      .kbSheet(file)
      .then(setSheetData)
      .finally(() => setLoadingSheet(false));
  }, [file]);

  const grouped = useMemo(() => {
    if (!manifest) return [];
    const filtered = manifest.filter((m) => m.sheet.toLowerCase().includes(query.toLowerCase()));
    const groups = new Map();
    for (const m of filtered) {
      const cat = categoryOf(m.sheet);
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat).push(m);
    }
    return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [manifest, query]);

  return (
    <div>
      <h1>Explorador de la base de conocimiento</h1>
      <p className="subtitle">
        Las {manifest ? manifest.length : "…"} hojas del Excel original, extraídas sin abreviar. Útil para
        auditar cualquier detalle metodológico que no tenga todavía una vista dedicada en este panel.
      </p>

      <div className="grid-2" style={{ alignItems: "start", gridTemplateColumns: "300px 1fr" }}>
        <div className="card" style={{ maxHeight: 640, overflowY: "auto" }}>
          <input
            type="search"
            placeholder="Buscar hoja…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              marginBottom: 14,
              borderRadius: 8,
              border: "1px solid var(--border)",
            }}
          />
          {grouped.map(([cat, sheets]) => (
            <div key={cat} style={{ marginBottom: 14 }}>
              <div className="sidebar-group-title" style={{ margin: "0 0 6px" }}>
                {cat}
              </div>
              {sheets.map((s) => (
                <div
                  key={s.file}
                  onClick={() => navigate(`/panel/explorador/${s.file}`)}
                  style={{
                    padding: "7px 10px",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 13.5,
                    background: file === s.file ? "var(--brand-light)" : "transparent",
                    color: file === s.file ? "var(--brand-dark)" : "var(--text)",
                    fontWeight: file === s.file ? 700 : 500,
                  }}
                >
                  {s.sheet}
                  <span className="text-muted" style={{ fontWeight: 400 }}>
                    {" "}
                    · {s.recordCount} filas
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div>
          {!file && (
            <div className="card">
              <p className="text-muted">Selecciona una hoja de la lista para ver su contenido completo.</p>
            </div>
          )}
          {file && loadingSheet && <p className="text-muted">Cargando hoja…</p>}
          {file && sheetData && !loadingSheet && (
            <div className="card">
              <h2>{sheetData.sheet}</h2>
              <p className="text-muted mono" style={{ marginTop: -6 }}>
                {sheetData.dimensions}
              </p>
              {sheetData.records ? (
                <DataTable
                  rows={sheetData.records}
                  columns={sheetData.header.map((h) => ({ key: h, label: h }))}
                  pageSize={20}
                />
              ) : (
                <RawTable rows={sheetData.rows_raw} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RawTable({ rows }) {
  if (!rows || !rows.length) return <p className="text-muted">Hoja vacía.</p>;
  const maxCols = Math.max(...rows.map((r) => r.length));
  return (
    <div className="table-scroll" style={{ maxHeight: 500 }}>
      <table>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {Array.from({ length: maxCols }).map((_, j) => (
                <td key={j}>{row[j] ?? ""}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
