import { embeddingModel } from './index.js';

/**
 * Función que recibe un texto y devuelve su representación numérica (768 dimensiones)
 */
// brain.js
export async function createEmbedding(text) {
  try {
    const result = await embeddingModel.embedContent({
      content: { parts: [{ text }] },
      // Esta es la clave: le pedimos a Google que recorte el vector por nosotros
      outputDimensionality: 1536, 
    });
    
    return result.embedding.values;
  } catch (error) {
    console.error("❌ Error al crear el embedding:", error);
    return null;
  }
}