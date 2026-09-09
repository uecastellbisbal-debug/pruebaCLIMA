#!/usr/bin/env python3
"""
Build the curated data/model/*.json files that the app actually consumes, from
the raw per-sheet extraction in data/raw/ (produced by extract_raw.py).

Usage:
    python3 scripts/extract_raw.py /path/to/WMKB.xlsx   # first
    python3 scripts/build_model.py                       # then this

This encodes every data-quality workaround documented in the top-level README
(section 2): the 51-entry DICCIONARIO_SUBFACTORES is used as the canonical
subfactor list instead of the 41-row SUBFACTORES sheet, and the 4 malformed
rows in INDICADORES are repaired heuristically rather than dropped.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
MODEL = ROOT / "data" / "model"
MODEL.mkdir(parents=True, exist_ok=True)


def load_raw(sheet_file):
    with open(RAW / sheet_file, encoding="utf-8") as f:
        return json.load(f)


def records(sheet_file):
    return load_raw(sheet_file)["records"] or []


def dump(name, data):
    with open(MODEL / f"{name}.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def build_factores():
    out = []
    for r in records("FACTORES.json"):
        if not r.get("Código"):
            continue
        out.append(
            {
                "codigo": r["Código"],
                "nombre": r["Nombre"],
                "definicion": r.get("Definición"),
                "objetivo": r.get("Objetivo"),
                "estado": r.get("Estado"),
                "madurez": r.get("Madurez"),
                "preguntasOriginales": r.get("Preguntas originales"),
                "seleccionadas": r.get("Seleccionadas <100"),
            }
        )
    dump("factores", out)
    return out


def build_subfactores():
    """Canonical list = DICCIONARIO_SUBFACTORES (51 rows), enriched with the
    extra descriptive fields from SUBFACTORES (41 rows) where codes match."""
    dicc = records("DICCIONARIO_SUBFACTORES.json")
    extra_raw = records("SUBFACTORES.json")
    extra_by_code = {r["Código"]: r for r in extra_raw if r.get("Código")}

    out = []
    for r in dicc:
        codigo = r.get("Código")
        if not codigo:
            continue
        extra = extra_by_code.get(codigo, {})
        out.append(
            {
                "codigo": codigo,
                "factor": r.get("Nivel"),
                "nombreFactor": r.get("Nombre nivel"),
                "grupo": r.get("Factor"),
                "nombreGrupo": r.get("Nombre factor"),
                "nombre": r.get("Subfactor oficial"),
                "preguntasBanco": r.get("N.º preguntas banco"),
                "seleccionadas": r.get("N.º seleccionadas"),
                "definicion": extra.get("Definición"),
                "objetivo": extra.get("Objetivo"),
                "influenciaPrincipal": extra.get("Influencia principal"),
                "sensibilidad": extra.get("Sensibilidad"),
                "indicador": extra.get("Indicador"),
                "planAccion": extra.get("Plan de acción"),
            }
        )
    dump("subfactores", out)
    return out


def build_preguntas():
    out = []
    for r in records("WM-BQ.json"):
        if not r.get("ID"):
            continue
        out.append(
            {
                "id": r["ID"],
                "version": r.get("Versión"),
                "estado": r.get("Estado"),
                "fechaCreacion": r.get("Fecha creación"),
                "ultimaRevision": r.get("Última revisión"),
                "origen": r.get("Origen"),
                "factor": r.get("Factor"),
                "subfactor": r.get("Subfactor"),
                "subdimension": r.get("Subdimensión"),
                "codigoInterno": r.get("Código interno"),
                "pregunta": r.get("Pregunta"),
                "objetivo": r.get("Objetivo"),
                "constructo": r.get("Constructo"),
                "tipo": r.get("Tipo"),
                "escala": r.get("Escala"),
                "nivelAnalisis": r.get("Nivel análisis"),
                "claridad": r.get("Claridad"),
                "relevancia": r.get("Relevancia"),
                "accionable": r.get("Accionable"),
                "noRedundante": r.get("No redundante"),
                "sensibilidadCambio": r.get("Sensibilidad cambio"),
                "comprension": r.get("Comprensión"),
                "sesgo": r.get("Sesgo"),
                "complejidad": r.get("Complejidad"),
                "seleccionadaMenos100": r.get("Seleccionada <100"),
                "prioridad": r.get("Prioridad"),
                "puntuacion": r.get("Puntuación"),
                "justificacion": r.get("Justificación"),
                "motivoDescarte": r.get("Motivo descarte"),
                "responsablePrincipal": r.get("Responsable principal"),
                "indicador": r.get("Indicador"),
                "planAccion": r.get("Plan acción"),
                "dm": r.get("DM"),
                "capituloMM": r.get("Capítulo MM"),
                "observaciones": r.get("Observaciones"),
                "madurezMetodologica": r.get("Madurez metodológica"),
                "codigoSubfactorNormalizado": r.get("Código subfactor normalizado"),
                "nombreSubfactorNormalizado": r.get("Nombre subfactor normalizado"),
            }
        )
    dump("preguntas", out)
    dump("preguntas_seleccionadas", [p for p in out if p["estado"] == "Seleccionada"])
    return out


QID_RE = re.compile(r"WM-[A-Z0-9]+-Q\d+")
IND_ID_RE = re.compile(r"IND-[A-Z0-9\-]+")


def build_indicadores(valid_question_ids):
    """INDICADORES has 4 rows with shifted columns (the source workbook mixes
    two differently-shaped tables in one sheet). We repair them heuristically
    instead of dropping them: pull the real ID out of "ID · Nombre" text, and
    recover question references by regex-scanning every field of the row."""
    raw = records("INDICADORES.json")
    parsed = []
    for r in raw:
        raw_id = (r.get("ID") or "").strip()
        if not raw_id:
            continue
        m = IND_ID_RE.match(raw_id)
        clean_id = m.group(0) if m else raw_id
        malformed = " · " in raw_id or raw_id != clean_id

        nombre = r.get("Nombre")
        if malformed and " · " in raw_id:
            nombre = raw_id.split(" · ", 1)[1]

        factor_field = r.get("Factor") or ""
        factor = (
            factor_field
            if factor_field in ("A", "B", "C", "D")
            else (clean_id.split("-")[1][0] if "-" in clean_id else None)
        )

        all_text = " ".join(str(v) for v in r.values() if v)
        q_ids = sorted(set(QID_RE.findall(all_text)) & valid_question_ids)

        pendiente_txt = None
        psel = r.get("Preguntas seleccionadas") or ""
        if not q_ids and psel and not QID_RE.search(psel):
            pendiente_txt = psel

        parsed.append(
            {
                "id": clean_id,
                "factor": factor,
                "subdimension": factor_field if malformed else r.get("Subdimensión"),
                "nombre": nombre,
                "definicion": r.get("Definición") if not malformed else None,
                "preguntasIds": q_ids,
                "interpretacionBaja": r.get("Interpretación baja") if not malformed else None,
                "interpretacionAlta": r.get("Interpretación alta") if not malformed else None,
                "pendiente": pendiente_txt,
                "calidadDatos": "revisar_fuente" if malformed else "ok",
            }
        )

    # dedupe (the malformed IND-A2-RET row duplicates a clean one)
    merged = {}
    for ind in parsed:
        key = ind["id"]
        if key not in merged:
            merged[key] = ind
            continue
        base = merged[key]
        base["preguntasIds"] = sorted(set(base["preguntasIds"]) | set(ind["preguntasIds"]))
        for field in ["definicion", "interpretacionBaja", "interpretacionAlta", "subdimension", "nombre"]:
            if not base.get(field) and ind.get(field):
                base[field] = ind[field]
        if base["preguntasIds"]:
            base["calidadDatos"] = "ok"

    out = list(merged.values())
    dump("indicadores", out)
    return out


def build_planes_accion():
    out = []
    for r in records("PLANES_ACCION.json"):
        if not r.get("ID"):
            continue
        out.append(
            {
                "id": r["ID"],
                "subdimension": r.get("Subdimensión"),
                "responsablePrincipal": r.get("Responsable principal"),
                "objetivo": r.get("Objetivo"),
                "accionesSugeridas": r.get("Acciones sugeridas"),
                "horizonte": r.get("Horizonte"),
                "indicadorAsociado": r.get("Indicador asociado"),
            }
        )
    dump("planes_accion", out)
    return out


def build_decisiones():
    out = []
    for r in records("DECISIONES_DM.json"):
        if not r.get("ID"):
            continue
        out.append(
            {
                "id": r["ID"],
                "fecha": r.get("Fecha"),
                "ambito": r.get("Ámbito"),
                "decision": r.get("Decisión"),
                "justificacion": r.get("Justificación"),
                "impacto": r.get("Impacto"),
                "estado": r.get("Estado"),
            }
        )
    dump("decisiones", out)
    return out


def build_criterios():
    out = []
    for r in records("CRITERIOS_METODOLOGICOS.json"):
        if not r.get("Criterio"):
            continue
        out.append(
            {
                "criterio": r["Criterio"],
                "definicion": r.get("Definición"),
                "escala": r.get("Escala"),
                "usoFactorA": r.get("Uso en Factor A"),
            }
        )
    dump("criterios_metodologicos", out)


def build_modelo_final_ad():
    rows_raw = load_raw("MODELO_FINAL_AD.json")["rows_raw"]
    niveles = [
        {
            "nivel": row[0],
            "ambito": row[1],
            "factores": row[2],
            "subfactores": row[3],
            "preguntasFinales": row[4],
            "peso": row[5],
            "unidadAnalisis": row[6],
            "criterioConsolidacion": row[7],
        }
        for row in rows_raw[3:8]
        if row and row[0]
    ]
    reglas = [{"id": row[0], "regla": row[1]} for row in rows_raw[10:15] if row and row[0]]
    dump("modelo_final_ad", {"niveles": niveles, "reglasInterpretacion": reglas})


def build_gobernanza():
    gob = [
        {"elemento": r.get("Elemento"), "estado": r.get("Estado")}
        for r in records("GOBERNANZA_WM_BQ.json")
        if r.get("Elemento")
    ]
    reglas = [r.get("Reglas") for r in records("REGLAS_GOBERNANZA.json") if r.get("Reglas")]
    dump("gobernanza", {"elementos": gob, "reglas": reglas})


def build_cierre():
    def kv(fname, kcol, vcol):
        return [{"clave": r[kcol], "valor": r.get(vcol)} for r in records(fname) if r.get(kcol)]

    dump(
        "cierre",
        {
            "dictamenGlobal": kv("DICTAMEN_GLOBAL.json", "Sección", "Contenido"),
            "resumenEjecutivo": kv("RESUMEN_EJECUTIVO_FINAL.json", "Indicador", "Valor"),
            "roadmapPilotaje": kv("ROADMAP_PILOTAJE.json", "Fase", "Descripción"),
            "checklistFinal": kv("CHECKLIST_FINAL.json", "Requisito", "Estado"),
        },
    )


def build_dashboard():
    rows_raw = load_raw("DASHBOARD.json")["rows_raw"]
    filas = [
        {"etiqueta": r[0], "A": r[1], "B": r[2], "C": r[3], "D": r[4]}
        for r in rows_raw[2:6]
        if r and r[0]
    ]
    dump("dashboard", {"titulo": rows_raw[0][0], "filas": filas})


def main():
    factores = build_factores()
    subfactores = build_subfactores()
    preguntas = build_preguntas()
    valid_ids = {p["id"] for p in preguntas}
    indicadores = build_indicadores(valid_ids)
    planes = build_planes_accion()
    decisiones = build_decisiones()
    build_criterios()
    build_modelo_final_ad()
    build_gobernanza()
    build_cierre()
    build_dashboard()

    seleccionadas = [p for p in preguntas if p["estado"] == "Seleccionada"]
    print(f"Factores: {len(factores)}")
    print(f"Subfactores: {len(subfactores)}")
    print(f"Preguntas totales: {len(preguntas)}  ·  seleccionadas: {len(seleccionadas)}")
    print(f"Indicadores: {len(indicadores)}")
    print(f"Planes de acción: {len(planes)}")
    print(f"Decisiones: {len(decisiones)}")
    print(f"\nModelo escrito en {MODEL}")


if __name__ == "__main__":
    main()
