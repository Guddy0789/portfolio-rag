# 🚗 Portfolio RAG

Mini proyecto de **RAG (Retrieval-Augmented Generation)** construido con **Node.js**, **Google Gemini** y **Supabase (pgvector)**.

La idea es sencilla: en lugar de pedirle a un modelo de lenguaje que "se invente" la respuesta, primero **buscamos** los fragmentos de información más relevantes en una base de datos vectorial y luego se los pasamos a Gemini como **contexto** para que redacte una respuesta fundamentada.

El conocimiento de ejemplo ([conocimiento.txt](conocimiento.txt)) trata sobre **tecnología automotriz** (motores de combustión, híbridos y eléctricos).

---

## 🧠 ¿Cómo funciona?

```
                    ┌──────────────────┐
   conocimiento.txt │                  │
        │           │   ingest.js      │   1. Lee el texto
        └──────────▶│  (Ingesta)       │   2. Lo divide en fragmentos
                    │                  │   3. Genera embeddings (Gemini)
                    └────────┬─────────┘   4. Los guarda en Supabase
                             │
                             ▼
                    ┌──────────────────┐
                    │     Supabase     │   Tabla `documents`
                    │    (pgvector)    │   + función match_documents()
                    └────────┬─────────┘
                             │
                             ▼
   "tu pregunta"   ┌──────────────────┐
        │          │   query.js       │   1. Convierte la pregunta en vector
        └─────────▶│   (Consulta)     │   2. Busca los 3 fragmentos similares
                   │                  │   3. Arma el "super prompt" con contexto
                   └────────┬─────────┘   4. Gemini redacta la respuesta final
                            │
                            ▼
                     🤖 Respuesta
```

---

## 📂 Estructura del proyecto

| Archivo                              | Descripción                                                                                    |
| ------------------------------------ | ---------------------------------------------------------------------------------------------- |
| [index.js](index.js)                 | Inicializa los clientes de **Supabase** y **Gemini**. Exporta `supabase` y `embeddingModel`.   |
| [brain.js](brain.js)                 | Función `createEmbedding()`: convierte un texto en un vector de **1536 dimensiones**.          |
| [ingest.js](ingest.js)               | Proceso de **ingesta**: lee `conocimiento.txt`, lo trocea y guarda los embeddings en Supabase. |
| [query.js](query.js)                 | Proceso de **consulta** (RAG): recupera contexto y pide la respuesta a Gemini.                 |
| [conocimiento.txt](conocimiento.txt) | Base de conocimiento de ejemplo (texto plano).                                                 |
| [db/schema.sql](db/schema.sql)       | SQL para crear la tabla `documents` y la función `match_documents` en Supabase.                |
| [check_models.js](check_models.js)   | Utilidad: comprueba que tu API key de Gemini funciona.                                         |
| [list_models.js](list_models.js)     | Utilidad: lista los modelos disponibles para tu API key.                                       |
| [.env.example](.env.example)         | Plantilla de variables de entorno.                                                             |

---

## ✅ Requisitos previos

- **Node.js 18 o superior** (se usa `fetch` nativo y ES Modules).
- Una cuenta de **[Supabase](https://supabase.com/)** (plan gratuito sirve).
- Una **API key de Google Gemini** → [Google AI Studio](https://aistudio.google.com/apikey).

---

## 🚀 Puesta en marcha

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar las variables de entorno

Copia la plantilla y rellena tus credenciales:

```bash
# Windows (PowerShell)
Copy-Item .env.example .env

# macOS / Linux
cp .env.example .env
```

Edita el `.env`:

```ini
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_supabase_anon_key
GOOGLE_GENAI_API_KEY=tu_google_genai_api_key
```

> 🔒 El archivo `.env` está incluido en [.gitignore](.gitignore), por lo que **nunca se subirá al repositorio**. Nunca pongas claves directamente en el código.

### 3. Preparar la base de datos en Supabase

En el panel de Supabase, abre **SQL Editor** y ejecuta el contenido de [db/schema.sql](db/schema.sql). Esto:

1. Habilita la extensión `pgvector`.
2. Crea la tabla `documents`.
3. Crea la función `match_documents()` que usa la búsqueda.

### 4. (Opcional) Verificar tu API key de Gemini

```bash
node list_models.js     # comprueba que la key funciona
node check_models.js    # lista los modelos disponibles
```

---

## 📥 Uso

### Paso 1 — Ingesta (cargar el conocimiento)

Lee [conocimiento.txt](conocimiento.txt), genera los embeddings y los guarda en Supabase:

```bash
node ingest.js
```

> ⚠️ Cada ejecución **inserta** los fragmentos de nuevo. Si lo corres varias veces tendrás documentos duplicados; vacía la tabla `documents` si quieres empezar de cero.

### Paso 2 — Consulta (preguntar)

Pregunta usando una pregunta personalizada como argumento:

```bash
node query.js "¿Qué ventajas tienen los autos de combustión?"
```

Si no pasas ningún argumento, se usa una pregunta de ejemplo:

```bash
node query.js
# → "¿Qué se dice sobre Ferrari y Porsche?"
```

La salida muestra los fragmentos recuperados (datos en bruto y su % de similitud) y, al final, la respuesta redactada por Gemini.

---

## ⚙️ Configuración y ajustes

Puedes afinar el comportamiento del RAG en [query.js](query.js):

| Parámetro              | Dónde                                  | Qué hace                                                                                |
| ---------------------- | -------------------------------------- | --------------------------------------------------------------------------------------- |
| `match_threshold`      | `supabase.rpc('match_documents', ...)` | Similitud mínima (0–1) para considerar un fragmento relevante. Más alto = más estricto. |
| `match_count`          | `supabase.rpc('match_documents', ...)` | Número de fragmentos a recuperar como contexto.                                         |
| `outputDimensionality` | [brain.js](brain.js)                   | Dimensión del vector. **Debe coincidir** con `vector(1536)` en la base de datos.        |

---

## 🧩 Modelos usados

| Tarea                   | Modelo               | Definido en          |
| ----------------------- | -------------------- | -------------------- |
| Embeddings              | `gemini-embedding-2` | [index.js](index.js) |
| Generación de respuesta | `gemini-2.5-flash`   | [query.js](query.js) |

> 💡 Si al ejecutar recibes un error tipo _"model not found"_, lista los modelos disponibles con `node check_models.js` y actualiza el nombre del modelo correspondiente.

---

## 🐛 Solución de problemas

| Problema                                  | Posible causa / solución                                                          |
| ----------------------------------------- | --------------------------------------------------------------------------------- |
| `process.env.X is undefined`              | Falta el archivo `.env` o una variable. Revisa el paso 2.                         |
| Error `model not found`                   | El nombre del modelo no está disponible para tu key. Usa `node check_models.js`.  |
| `function match_documents does not exist` | No ejecutaste [db/schema.sql](db/schema.sql) en Supabase.                         |
| La dimensión del vector no coincide       | `outputDimensionality` (brain.js) debe ser igual que `vector(N)` en `schema.sql`. |
| No se encuentran fragmentos               | Ejecuta primero `node ingest.js` y/o baja el `match_threshold`.                   |

---

## 📜 Licencia

ISC. Proyecto con fines educativos / de portfolio.
