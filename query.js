import { supabase } from "./index.js";
import { createEmbedding } from "./brain.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

/**
 * Ejecuta el flujo RAG completo para una pregunta:
 *  1. Convierte la pregunta en un vector (embedding).
 *  2. Busca los fragmentos más parecidos en Supabase (pgvector).
 *  3. Construye un prompt con ese contexto y pide la respuesta a Gemini.
 *
 * @param {string} question Pregunta en lenguaje natural del usuario.
 */
async function askRAG(question) {
  console.log(`\n🔍 Pregunta: ${question}`);

  // 1. Convertir la pregunta en un vector.
  const queryVector = await createEmbedding(question);

  if (!queryVector) {
    console.error("❌ No se pudo generar el embedding de la pregunta.");
    return;
  }

  // 2. Buscar los fragmentos más similares en la base vectorial.
  const { data: documents, error } = await supabase.rpc("match_documents", {
    query_embedding: queryVector,
    match_threshold: 0.3, // Umbral bajo para recuperar más candidatos.
    match_count: 3,
  });

  if (error) {
    console.error("❌ Error en la búsqueda:", error);
    return;
  }

  // Mostrar los datos en bruto recuperados (útil para depurar).
  console.log("\n--- 📦 DATOS ENCONTRADOS EN SUPABASE (RAW) ---");
  if (!documents || documents.length === 0) {
    console.log("⚠️ No se encontraron fragmentos similares.");
    console.log("----------------------------------------------\n");
    console.log("🤖 Gemini no tiene contexto suficiente para responder.");
    return;
  }

  documents.forEach((doc, index) => {
    console.log(`\n[Resultado #${index + 1}]`);
    console.log(`🆔 ID: ${doc.id}`);
    console.log(`📈 Similitud: ${(doc.similarity * 100).toFixed(2)}%`);
    console.log(`📝 Texto: "${doc.content.substring(0, 200)}..."`);
  });
  console.log("----------------------------------------------\n");

  // 3. Unir los textos encontrados
  const context = documents.map((doc) => doc.content).join("\n---\n");

  // 4. El "Super Prompt"
  const prompt = `
    Eres un experto en tecnología automotriz. 
    Usa el siguiente CONTEXTO para responder la PREGUNTA del usuario. 
    Si la respuesta no está en el contexto, di que no lo sabes.

    CONTEXTO:
    ${context}

    PREGUNTA:
    ${question}
  `;

  // 5. Generar la respuesta final
  const result = await model.generateContent(prompt);
  console.log("🤖 Respuesta refinada de Gemini:");
  console.log(result.response.text());
}

// Permite pasar la pregunta como argumento: `node query.js "tu pregunta"`.
// Si no se pasa nada, usa una pregunta de ejemplo.
const question =
  process.argv.slice(2).join(" ") || "¿Qué se dice sobre Ferrari y Porsche?";
askRAG(question);
