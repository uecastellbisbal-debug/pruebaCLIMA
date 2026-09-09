# WellnessMETER — app de encuesta + panel de gestión

## Arranque rápido (Windows, sin usar la terminal)

Haz doble clic en **`Iniciar_WellnessMETER.bat`** (en esta misma carpeta). Instala lo necesario la
primera vez (puede tardar un par de minutos), arranca el servidor en una ventana aparte y abre la
app en el navegador en `http://localhost:4000`. Las siguientes veces solo hace falta volver a hacer
doble clic — será casi instantáneo. Necesitas tener [Node.js](https://nodejs.org) instalado (versión
LTS); si no lo tienes, el propio script te avisa y te lleva a la página de descarga.

Si prefieres la línea de comandos, o estás en Mac/Linux, sigue la sección 4 más abajo.

---

Aplicación construida a partir de `WMKB_WellnessMETER_Knowledge_Base_v7.0_RC1_Fase3_Cierre.xlsx`,
la base de conocimiento (WM-KB) de la encuesta de bienestar laboral WellnessMETER. Este documento
es el **contexto completo** del proyecto: qué es el modelo, cómo se extrajo del Excel, cómo está
construida la app y qué falta.

## 1. Qué es WellnessMETER (resumen del WM-KB)

WM-KB es la fuente única de verdad de un cuestionario de bienestar laboral organizado en una
arquitectura de 4 niveles ("Factores"):

| Factor | Nombre | Preguntas originales | Seleccionadas | Peso (referencia, no usado para una puntuación única) |
|---|---|---|---|---|
| A | Nivel Individual: la Persona | 70 | 25 | 0.263 |
| B | Nivel de grupo: el Equipo | 12 | 15 (13 según el resumen ejecutivo final) | 0.137 |
| C | Nivel organizativo: la Empresa | 99 | 44 | 0.463 |
| D | Nivel de síntesis: FIT persona–organización | 30 | 13 | 0.137 |

Cada factor se subdivide en **subfactores** (51 en el diccionario oficial, `DICCIONARIO_SUBFACTORES`
— la hoja `SUBFACTORES` sólo documenta 41 en detalle; los 10 restantes, B.5.x y B.6.x, existen en el
diccionario pero aún no tienen ficha ampliada). Cada subfactor tiene indicadores (síntesis de 1-3
preguntas con interpretación cualitativa alta/baja) y, en muchos casos, un plan de acción con
responsable, objetivo y horizonte.

El banco maestro de preguntas es la hoja **WM-BQ**: 278 registros, cada uno con ID permanente,
criterios metodológicos (claridad, relevancia, accionabilidad, no redundancia, sensibilidad al
cambio, comprensión, sesgo, complejidad), estado (`Seleccionada` / `Reserva` / `Descartada` /
`Descartada · Error de origen`) y trazabilidad completa a la decisión metodológica (`DM-*`) que lo
resolvió. **97 preguntas están en estado "Seleccionada"** (25 A · 15 B · 44 C · 13 D) y son las que
usa el cuestionario de esta app. Todas las preguntas usan escala 1–10.

### Reglas metodológicas que la app respeta

Tomadas literalmente de la hoja `MODELO_FINAL_AD` y de `REGLAS_GOBERNANZA`:

- **R1 — No calcular una puntuación global A–D única** hasta que se confirme la validación
  psicométrica (AFE/AFC). La app **nunca combina los 4 factores en un solo índice**: siempre
  reporta 4 puntuaciones de factor separadas.
- **R2** — Reportar resultados por subfactor y nivel, con agregaciones cuidadosas.
- **R4** — No declarar validación psicométrica hasta completar AFE/ESEM. La UI muestra
  explícitamente que la validación empírica está pendiente.
- **Gobernanza**: WM-BQ es la fuente única de verdad; todo cambio metodológico se hace primero ahí;
  las hojas de auditoría se regeneran desde WM-BQ; todo subfactor debe pertenecer al diccionario
  oficial (`DICCIONARIO_SUBFACTORES`).

Estado de cierre (según `DICTAMEN_GLOBAL`, `RESUMEN_EJECUTIVO_FINAL`, `CHECKLIST_FINAL`): modelo
"conforme con observaciones", 0 no-conformidades mayores, 3 menores, preparado para pilotaje
empírico; validación psicométrica empírica pendiente.

## 2. Cómo se extrajo el contexto

Las **110 hojas** del Excel original se volcaron íntegras a JSON en `data/raw/` (una fila = un
objeto, usando la fila de cabecera cuando existe; si no, la matriz de celdas en bruto). Ese volcado
es el contexto completo — nada del Excel se ha resumido u omitido ahí. `data/raw/_manifest.json`
lista las 110 hojas con su fichero, dimensiones y nº de filas.

Sobre ese volcado se construyó un **modelo curado** en `data/model/` (factores, subfactores,
preguntas, indicadores, planes de acción, decisiones, criterios metodológicos, gobernanza, cierre,
dashboard) que es lo que consume la aplicación. Los scripts de extracción están documentados aquí
abajo (sección 6) por si hay que re-generar el modelo desde una versión más nueva del Excel.

### Incidencias de calidad de datos detectadas (y cómo se trataron)

- **SUBFACTORES vs DICCIONARIO_SUBFACTORES**: la hoja `SUBFACTORES` sólo tiene 41 filas; el
  diccionario oficial (`DICCIONARIO_SUBFACTORES`) tiene 51, que es el que también usan los códigos
  normalizados en `WM-BQ`. Se usó el diccionario de 51 como base y se enriqueció con los campos
  extra de `SUBFACTORES` donde había coincidencia de código.
- **INDICADORES con filas mal formateadas**: 4 de las 21 filas de la hoja `INDICADORES`
  (`IND-A3-MOT`, `IND-A3-VAL`, `IND-A3-REA`, y un duplicado de `IND-A2-RET`) tienen las columnas
  desplazadas — el ID real está mezclado con el nombre en la misma celda ("IND-A3-MOT ·
  Motivación..."), y lo que debería ser "preguntas seleccionadas" contiene en su lugar el
  responsable o una nota de estado. El extractor las repara heurísticamente (regex sobre todas las
  columnas para recuperar IDs de pregunta `WM-*-Q###`, y separación de "ID · Nombre"); estas filas
  quedan marcadas con `"calidadDatos": "revisar_fuente"` en `data/model/indicadores.json` y se
  señalan con una etiqueta "revisar fuente" en el panel. 3 indicadores de C7 (`IND-C7-SEG`,
  `IND-C7-AMB`, `IND-C7-REC`) no tienen preguntas asignadas todavía — el propio Excel dice
  "Pendiente de cierre/identificación en iteración X.X.2"; la app lo muestra tal cual, sin inventar
  datos.
- **Encuesta vs banco completo**: `Seleccionada <100` = "Sí" da 97 filas, no 95 — el número "95" que
  aparece en varias hojas de cierre (`RESUMEN_EJECUTIVO_FINAL`, `MODELO_FINAL_AD`,
  `SELECCION_FINAL_95`) corresponde a una iteración anterior de la selección; `WM-BQ` es la fuente
  de verdad más reciente según la propia regla de gobernanza, así que la encuesta usa las 97
  preguntas con `Estado = "Seleccionada"`.

Nada de esto se "arregló" silenciosamente en el sentido de inventar valores: donde el dato de origen
falta o es ambiguo, la app lo dice explícitamente (pendientes, indicadores sin preguntas, etc.) en
vez de mostrar un número falso.

## 3. Estructura del proyecto

```
wellnessmeter-app/
├── data/
│   ├── raw/            # Las 110 hojas del Excel, íntegras, en JSON (el "contexto completo")
│   └── model/          # Modelo curado que consume la app (factores, preguntas, indicadores...)
├── server/              # API Node/Express (sin dependencias nativas — nada de compilar SQLite)
│   ├── index.js         # Rutas HTTP
│   ├── scoring.js       # Lógica de puntuación (respeta la Regla R1)
│   ├── store.js         # Persistencia de respuestas en un JSON file (server/db/responses.json)
│   └── package.json
└── client/              # SPA en React + Vite
    ├── src/
    │   ├── pages/            # Home, Survey (encuesta), Results (resultados)
    │   └── pages/Admin/      # Overview, Factors, Questions, Indicators, Decisions,
    │                         # Governance, Explorer (110 hojas), Responses
    └── package.json
```

## 4. Cómo ejecutar

Requiere Node 18+.

```bash
# 1. Backend
cd server
npm install
npm run dev        # http://localhost:4000 (recarga automática con --watch)

# 2. Frontend (en otra terminal)
cd client
npm install
npm run dev        # http://localhost:5173, con proxy de /api hacia :4000
```

Abre `http://localhost:5173`.

### Producción (un solo proceso Node sirviendo todo)

```bash
cd client && npm install && npm run build   # genera client/dist
cd ../server && npm install && npm start    # sirve la API y el client/dist ya compilado en :4000
```

No hay base de datos que instalar: las respuestas de la encuesta se guardan en
`server/db/responses.json` (se crea solo). Para producción real conviene sustituir `server/store.js`
por una base de datos de verdad (Postgres, SQLite...) — la interfaz (`readAll`, `append`, `getById`)
es intencionadamente mínima para que ese cambio sea aislado.

## 5. La aplicación

**Encuesta** (`/encuesta`): las 97 preguntas seleccionadas, agrupadas por factor y subfactor, escala
1–10, en 4 pasos (uno por factor) + resumen antes de enviar. Al enviar, el backend calcula y
devuelve las puntuaciones (`/resultados/:id`): por factor (4 números separados, nunca combinados),
por subfactor (51), y por indicador con su interpretación cualitativa.

**Panel de gestión** (`/panel`): navegación completa del WM-KB —

- *Overview*: contadores clave y las tablas de cierre (dictamen, checklist, roadmap de pilotaje).
- *Factores & Subfactores*: definiciones, objetivos, pesos de referencia y el diccionario de 51
  subfactores.
- *Banco de preguntas*: las 278 preguntas de WM-BQ, filtrables por factor/estado, buscables por
  texto.
- *Indicadores & planes*: cada indicador con sus preguntas vinculadas, interpretación alta/baja y el
  plan de acción asociado.
- *Decisiones (DM)*: el registro completo de decisiones metodológicas.
- *Gobernanza & dictamen*: reglas de gobierno, dictamen global, resumen ejecutivo, checklist y
  roadmap de pilotaje.
- *Explorador (110 hojas)*: acceso íntegro a cualquier hoja del Excel original, agrupadas por
  categoría (auditorías psicométricas, C7/C8/C9, D10, auditoría transversal C-D, auditoría global
  A-D, etc.), con buscador y tabla completa.
- *Respuestas recibidas*: lista de envíos y un agregado (promedio de promedios por persona, para no
  sobreponderar a quien responde más).

## 6. Regenerar `data/` desde un Excel más nuevo

Los scripts están incluidos en `scripts/` y son la fuente de verdad de cómo se generó `data/`
(re-ejecutarlos contra el mismo Excel reproduce exactamente los mismos JSON, byte a byte — así se
verificó al construir esta app):

```bash
pip install openpyxl
python3 scripts/extract_raw.py /ruta/al/WMKB_WellnessMETER_Knowledge_Base.xlsx   # -> data/raw/
python3 scripts/build_model.py                                                   # -> data/model/
```

1. **`extract_raw.py`** — extracción íntegra: recorre las 110 hojas, detecta si la primera fila es
   una cabecera (todas las celdas no vacías son texto) y, si lo es, genera `records` (lista de
   objetos); si no, guarda `rows_raw` (matriz de celdas). Cada hoja → un `.json`; más un
   `_manifest.json` con el índice.
2. **`build_model.py`** — modelo curado: mapea las columnas de `FACTORES`, `SUBFACTORES` +
   `DICCIONARIO_SUBFACTORES`, `WM-BQ`, `INDICADORES` (con la reparación heurística de las 4 filas
   desplazadas), `PLANES_ACCION`, `DECISIONES_DM`, `CRITERIOS_METODOLOGICOS`, `GOBERNANZA_WM_BQ` +
   `REGLAS_GOBERNANZA`, `MODELO_FINAL_AD`, `DASHBOARD` y las hojas de cierre (`DICTAMEN_GLOBAL`,
   `RESUMEN_EJECUTIVO_FINAL`, `ROADMAP_PILOTAJE`, `CHECKLIST_FINAL`) a los JSON que consume la API.
   Reinicia el servidor (o espera al `--watch`) para que recoja los datos nuevos.

## 7. Qué falta / roadmap sugerido

Tomado directamente de `ROADMAP_PILOTAJE` y `DICTAMEN_GLOBAL` del WM-KB:

1. **Piloto** — recoger una muestra real de respuestas (esta app ya permite hacerlo y las guarda).
2. **Fiabilidad** — calcular Alpha de Cronbach por subfactor/indicador sobre los datos del piloto.
3. **Validez** — Análisis Factorial Exploratorio/Confirmatorio (AFE/AFC) antes de considerar
   cualquier puntuación agregada más allá de las actuales medias por subfactor/factor.
4. **v7.0** — liberación, una vez completada la validación.

Del lado técnico de esta app, lo razonable antes de un piloto con gente real: autenticación /
anonimato configurable, exportar respuestas a CSV/Excel, y sustituir el almacenamiento en JSON por
una base de datos si el volumen de respuestas crece.
