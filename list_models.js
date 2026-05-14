//solo lista modelos
import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY);

async function checkAvailableModels() {
  try {
    // Usamos el método nativo para listar modelos
    // Probamos con v1 que es la versión estable en 2026
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${process.env.GOOGLE_GENAI_API_KEY}`
    );
    const data = await response.json();

    if (data.models) {
      console.log("=== Modelos Disponibles para tu API Key ===");
      data.models.forEach(m => {
        console.log(`- Nombre: ${m.name}`);
        console.log(`  Capacidades: ${m.supportedGenerationMethods.join(', ')}`);
        console.log('---');
      });
    } else {
      console.log("No se encontraron modelos. Respuesta de Google:", data);
    }
  } catch (error) {
    console.error("❌ Error al listar modelos:", error.message);
  }
}

checkAvailableModels();