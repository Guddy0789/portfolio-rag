import fs from 'fs';
import { supabase } from './index.js';
import { createEmbedding } from './brain.js';

async function runIngestion() {
  console.log("🚀 Iniciando proceso de ingesta...");

  // 1. Leer el archivo de texto
  const text = fs.readFileSync('conocimiento.txt', 'utf8');

  // 2. Chunking (División): Por ahora dividiremos simplemente por párrafos (\n\n)
  const chunks = text.split('\n').filter(p => p.trim() !== "");
  
  console.log(`📝 Se encontraron ${chunks.length} pedazos de texto.`);

  for (const chunk of chunks) {
    console.log(`⏳ Procesando pedazo: "${chunk.substring(0, 30)}..."`);

    // 3. Crear el vector (Embedding)
    const vector = await createEmbedding(chunk);

    if (vector) {
      // 4. Guardar en Supabase
      const { error } = await supabase
        .from('documents')
        .insert({
          content: chunk,
          embedding: vector
        });

      if (error) {
        console.error("❌ Error al insertar en Supabase:", error);
      } else {
        console.log("✅ Guardado en la base de datos vectorial.");
      }
    }
  }
  
  console.log("🏁 Proceso terminado.");
}

runIngestion();