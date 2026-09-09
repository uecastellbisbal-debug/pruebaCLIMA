import { useMemo, useState } from "react";

export default function DataTable({ columns, rows, searchPlaceholder = "Buscar…", pageSize = 30 }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter((row) =>
      columns.some((c) => String(row[c.key] ?? "").toLowerCase().includes(q))
    );
  }, [rows, query, columns]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const clampedPage = Math.min(page, totalPages - 1);
  const pageRows = filtered.slice(clampedPage * pageSize, clampedPage * pageSize + pageSize);

  return (
    <div>
      <div className="filters">
        <input
          type="search"
          placeholder={searchPlaceholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
          style={{ minWidth: 260 }}
        />
        <span className="text-muted" style={{ alignSelf: "center", fontSize: 13 }}>
          {filtered.length} de {rows.length} filas
        </span>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, i) => (
              <tr key={row.id || row.codigo || i}>
                {columns.map((c) => (
                  <td key={c.key}>{c.render ? c.render(row[c.key], row) : row[c.key] ?? ""}</td>
                ))}
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="text-muted">
                  Sin resultados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}>
          <button
            className="btn secondary"
            disabled={clampedPage === 0}
            onClick={() => setPage(clampedPage - 1)}
          >
            ← Anterior
          </button>
          <span className="text-muted" style={{ fontSize: 13 }}>
            Página {clampedPage + 1} de {totalPages}
          </span>
          <button
            className="btn secondary"
            disabled={clampedPage >= totalPages - 1}
            onClick={() => setPage(clampedPage + 1)}
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}
