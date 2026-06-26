-- =====================================================================
-- Esquema de base de datos para el proyecto RAG (Supabase + pgvector).
-- Ejecuta este script en el SQL Editor de tu proyecto de Supabase.
-- =====================================================================

-- 1. Habilitar la extensión pgvector (almacenamiento y búsqueda de vectores).
create extension if not exists vector;

-- 2. Tabla que guarda cada fragmento de texto junto con su embedding.
--    La dimensión (1536) debe coincidir con `outputDimensionality` en brain.js.
create table if not exists documents (
  id        bigserial primary key,
  content   text,
  embedding vector(1536)
);

-- 3. Función de búsqueda por similitud de coseno.
--    Es la que invoca query.js mediante `supabase.rpc('match_documents', ...)`.
create or replace function match_documents (
  query_embedding vector(1536),
  match_threshold float,
  match_count     int
)
returns table (
  id         bigint,
  content    text,
  similarity float
)
language sql stable
as $$
  select
    documents.id,
    documents.content,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where 1 - (documents.embedding <=> query_embedding) > match_threshold
  order by documents.embedding <=> query_embedding
  limit match_count;
$$;

-- 4. (Opcional) Índice para acelerar la búsqueda cuando hay muchos documentos.
--    Ajusta `lists` según el tamaño de tu dataset.
-- create index on documents
--   using ivfflat (embedding vector_cosine_ops)
--   with (lists = 100);
