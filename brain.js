import { embeddingModel } from "./index.js";

/**
 * Convierte un texto en su representación numérica (vector de 1536 dimensiones).
 *
 * @param {string} text Texto a convertir en embedding.
 * @returns {Promise<number[]|null>} Vector de embedding, o `null` si ocurre un error.
 */
export async function createEmbedding(text) {
  try {
    const result = await embeddingModel.embedContent({
      content: { parts: [{ text }] },
      // Recortamos el vector a 1536 dimensiones para que coincida con la
      // columna `embedding vector(1536)` definida en Supabase.
      outputDimensionality: 1536,
    });

    return result.embedding.values;
  } catch (error) {
    console.error("❌ Error al crear el embedding:", error);
    return null;
  }
}
