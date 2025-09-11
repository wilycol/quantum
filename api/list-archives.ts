export const config = { runtime: 'edge' };

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export default async function handler(req: Request) {
  try {
    const url = new URL(req.url);
    const year = url.searchParams.get('year');
    const month = url.searchParams.get('month');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    // Construir el path de búsqueda
    let searchPath = '';
    if (year && month) {
      searchPath = `${year}/${month}`;
    } else if (year) {
      searchPath = `${year}`;
    }

    // Listar archivos en Supabase Storage
    const { data, error } = await supabase.storage
      .from('quantum-archives')
      .list(searchPath, {
        limit,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      console.error('[ListArchives] Supabase error:', error);
      return Response.json({
        success: false,
        error: `Failed to list archives: ${error.message}`
      }, { status: 500 });
    }

    // Procesar la lista de archivos
    const archives = data.map(file => {
      const pathParts = file.name.split('/');
      const fileName = pathParts[pathParts.length - 1];
      const dateStr = fileName.replace('.json.gz', '');
      
      return {
        name: file.name,
        fileName: fileName,
        date: dateStr,
        size: file.metadata?.size || 0,
        sizeMB: ((file.metadata?.size || 0) / (1024 * 1024)).toFixed(2),
        created: file.created_at,
        updated: file.updated_at,
        path: file.name
      };
    });

    // Obtener estadísticas del bucket
    const { data: bucketData, error: bucketError } = await supabase.storage
      .from('quantum-archives')
      .list('', { limit: 1000 });

    let totalFiles = 0;
    let totalSize = 0;

    if (!bucketError && bucketData) {
      // Calcular estadísticas totales (aproximadas)
      totalFiles = bucketData.length;
      // Nota: Supabase no expone el tamaño total del bucket en la API gratuita
      // Esto requeriría iterar por todos los archivos
    }

    return Response.json({
      success: true,
      archives,
      stats: {
        totalFiles,
        totalSizeMB: totalSize.toFixed(2),
        searchPath: searchPath || 'all',
        limit
      }
    });

  } catch (error) {
    console.error('[ListArchives] Error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
