import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY);

async function list() {
  try {
    // Intentaremos listar los modelos para ver cuáles tienes activos
    // Nota: El SDK a veces no expone listModels directamente, 
    // así que probaremos una llamada simple de salud.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Hola");
    console.log("✅ Tu API Key funciona correctamente y tiene acceso a Gemini.");
  } catch (e) {
    console.error("❌ Error de acceso:", e.message);
  }
}
list();