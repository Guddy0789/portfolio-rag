import { supabase } from './index.js';
import { createEmbedding } from './brain.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

async function askRAG(question) {
  console.log(`\n🔍 Pregunta: ${question}`);

  // 1. Convertir la pregunta en un vector
  const queryVector = await createEmbedding(question);

  if (!queryVector) return;

  // 2. Buscar en Supabase
  const { data: documents, error } = await supabase.rpc('match_documents', {
    query_embedding: queryVector,
    match_threshold: 0.3, // Bajamos un poco el umbral para ver más resultados si existen
    match_count: 3,
  });

  if (documents && documents.length > 0) {
  console.log("\n--- 🧱 DATOS EN BRUTO (RAW) DESDE SUPABASE ---");
  
  documents.forEach((doc, i) => {
    console.log(`\n[Fragmento #${i + 1}]`);
    console.log(`Contenido Original: ${doc.content}`); // <--- Esto es lo que "lee" la base de datos
    console.log(`Similitud Matemática: ${doc.similarity.toFixed(4)}`);
  });

  console.log("\n----------------------------------------------");
}

  if (error) {
    console.error("❌ Error en la búsqueda:", error);
    return;
  }

  // --- NUEVA SECCIÓN DE DEPURACIÓN ---
  console.log("\n--- 📦 DATOS ENCONTRADOS EN SUPABASE (RAW) ---");
  if (documents.length === 0) {
    console.log("⚠️ No se encontraron fragmentos similares.");
  } else {
    documents.forEach((doc, index) => {
      console.log(`\n[Resultado #${index + 1}]`);
      console.log(`🆔 ID: ${doc.id}`);
      console.log(`📈 Similitud: ${(doc.similarity * 100).toFixed(2)}%`);
      console.log(`📝 Texto: "${doc.content.substring(0, 200)}..."`);
    });
  }
  console.log("----------------------------------------------\n");
  // ------------------------------------

  if (documents.length === 0) {
    console.log("🤖 Gemini no tiene contexto suficiente para responder.");
    return;
  }

  // 3. Unir los textos encontrados
  const context = documents.map(doc => doc.content).join('\n---\n');

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

// Prueba con una pregunta específica
askRAG("¿Qué se dice sobre Ferrari y Porsche?");