export const config = { runtime: 'edge' };

import { Redis } from '@upstash/redis';
import { createClient } from '@supabase/supabase-js';

const redis = Redis.fromEnv();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Función para comprimir datos (simulada - en producción usarías gzip)
function compressData(data: any[]): string {
  // En producción, usarías una librería de compresión real
  // Por ahora, simulamos compresión removiendo espacios y optimizando JSON
  return JSON.stringify(data.map(event => ({
    t: event.t,
    type: event.type,
    ...(event.s && { s: event.s }),
    ...(event.p && { p: event.p }),
    ...(event.sid && { sid: event.sid }),
    ...(event.m && { m: event.m })
  })));
}

// Función para calcular el tamaño aproximado en MB
function calculateSize(data: string): number {
  return new Blob([data]).size / (1024 * 1024);
}

export default async function handler(req: Request) {
  try {
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const { targetDate, forceArchive } = await req.json();
    
    // Si no se especifica fecha, usar hace 30 días
    const archiveDate = targetDate ? new Date(targetDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dateStr = archiveDate.toISOString().slice(0, 10);
    
    console.log(`[Archive] Starting monthly archive for ${dateStr}`);

    // 1. Obtener todos los datos del mes a archivar
    const monthKey = `events:${dateStr}`;
    const monthData = await redis.lrange(monthKey, 0, -1);
    
    if (monthData.length === 0) {
      return Response.json({ 
        success: true, 
        message: `No data found for ${dateStr}`,
        archived: 0,
        size: 0
      });
    }

    // 2. Comprimir los datos
    const compressedData = compressData(monthData);
    const sizeMB = calculateSize(compressedData);
    
    console.log(`[Archive] Compressed ${monthData.length} events to ${sizeMB.toFixed(2)} MB`);

    // 3. Subir a Supabase Storage
    const year = archiveDate.getFullYear();
    const month = String(archiveDate.getMonth() + 1).padStart(2, '0');
    const fileName = `${dateStr}.json.gz`;
    const filePath = `${year}/${month}/${fileName}`;
    
    try {
      const { data, error } = await supabase.storage
        .from('quantum-archives')
        .upload(filePath, compressedData, {
          contentType: 'application/gzip',
          upsert: false // No sobrescribir si ya existe
        });
      
      if (error) {
        console.error(`[Archive] Supabase upload error:`, error);
        throw new Error(`Failed to upload to Supabase: ${error.message}`);
      }
      
      console.log(`[Archive] Successfully uploaded to Supabase: ${filePath}`);
    } catch (uploadError) {
      console.error(`[Archive] Upload failed:`, uploadError);
      throw uploadError;
    }

    // 4. Verificar si debemos eliminar datos antiguos (después de 120 días)
    const shouldDelete = forceArchive || (Date.now() - archiveDate.getTime()) > (120 * 24 * 60 * 60 * 1000);
    
    if (shouldDelete) {
      // Eliminar datos del Redis (solo si tienen más de 120 días)
      await redis.del(monthKey);
      console.log(`[Archive] Deleted old data from Redis: ${dateStr}`);
    } else {
      console.log(`[Archive] Keeping data in Redis (less than 120 days old)`);
    }

    // 5. Obtener estadísticas actuales
    const currentStats = await getCurrentStats();

    return Response.json({
      success: true,
      message: `Successfully archived ${dateStr}`,
      archived: {
        date: dateStr,
        events: monthData.length,
        sizeMB: sizeMB.toFixed(2),
        supabasePath: filePath,
        deleted: shouldDelete
      },
      currentStats
    });

  } catch (error) {
    console.error('[Archive] Error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// Función auxiliar para obtener estadísticas actuales
async function getCurrentStats() {
  try {
    // Obtener conteo de eventos de los últimos 7 días
    const last7Days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().slice(0, 10);
      const key = `events:${dateStr}`;
      const count = await redis.llen(key);
      last7Days.push({ date: dateStr, count });
    }

    // Obtener información de memoria
    const info = await redis.info('memory');
    const usedMemoryBytes = parseInt(info.used_memory);
    const maxMemoryBytes = 256 * 1024 * 1024; // 256 MB
    const usagePercentage = (usedMemoryBytes / maxMemoryBytes * 100).toFixed(2);

    return {
      memory: {
        used: info.used_memory_human,
        max: '256MB',
        percentage: `${usagePercentage}%`,
        bytes: usedMemoryBytes,
        maxBytes: maxMemoryBytes
      },
      events: {
        last7Days: last7Days.reverse()
      }
    };
  } catch (error) {
    return { error: 'Failed to get current stats' };
  }
}
