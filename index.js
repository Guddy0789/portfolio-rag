import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 1. Inicializar Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// 2. Inicializar Google AI (Gemini)
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY);

// Este es el modelo específico para convertir texto a números (vectores)
const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-2" });

console.log("✅ Conexiones inicializadas correctamente");

// Exportamos las instancias para usarlas en otros archivos
export { supabase, embeddingModel };