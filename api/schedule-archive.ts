export const config = { runtime: 'edge' };

import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export default async function handler(req: Request) {
  try {
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const { action } = await req.json();

    if (action === 'check') {
      // Verificar si es momento de hacer archivo
      const now = new Date();
      const lastArchive = await redis.get('last_archive_date');
      
      if (!lastArchive) {
        // Primera vez, establecer fecha de último archivo
        await redis.set('last_archive_date', now.toISOString().slice(0, 10));
        return Response.json({
          shouldArchive: false,
          message: 'First time setup - archive scheduled for next month',
          lastArchive: null,
          nextArchive: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
        });
      }

      const lastArchiveDate = new Date(lastArchive as string);
      const daysSinceLastArchive = Math.floor((now.getTime() - lastArchiveDate.getTime()) / (24 * 60 * 60 * 1000));
      
      const shouldArchive = daysSinceLastArchive >= 30;
      
      return Response.json({
        shouldArchive,
        message: shouldArchive ? 'Time to archive!' : 'Archive not needed yet',
        lastArchive,
        daysSinceLastArchive,
        nextArchive: new Date(lastArchiveDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      });

    } else if (action === 'archive') {
      // Ejecutar archivo
      const targetDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const dateStr = targetDate.toISOString().slice(0, 10);
      
      // Llamar al endpoint de archivo directamente
      const archiveResponse = await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/archive-monthly`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetDate: dateStr })
      });
      
      const archiveResult = await archiveResponse.json();
      
      if (archiveResult.success) {
        // Actualizar fecha de último archivo
        await redis.set('last_archive_date', new Date().toISOString().slice(0, 10));
      }
      
      return Response.json(archiveResult);

    } else if (action === 'status') {
      // Obtener estado del sistema de archivo
      const lastArchive = await redis.get('last_archive_date');
      const now = new Date();
      
      let status = 'unknown';
      let nextArchive = null;
      let daysUntilNext = null;
      
      if (lastArchive) {
        const lastArchiveDate = new Date(lastArchive as string);
        const daysSinceLastArchive = Math.floor((now.getTime() - lastArchiveDate.getTime()) / (24 * 60 * 60 * 1000));
        
        if (daysSinceLastArchive >= 30) {
          status = 'ready_to_archive';
        } else {
          status = 'waiting';
          nextArchive = new Date(lastArchiveDate.getTime() + 30 * 24 * 60 * 60 * 1000);
          daysUntilNext = 30 - daysSinceLastArchive;
        }
      } else {
        status = 'first_time';
        nextArchive = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        daysUntilNext = 30;
      }
      
      return Response.json({
        status,
        lastArchive,
        nextArchive: nextArchive?.toISOString().slice(0, 10),
        daysUntilNext,
        message: getStatusMessage(status, daysUntilNext)
      });

    } else {
      return Response.json({
        error: 'Invalid action. Use: check, archive, or status'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('[ScheduleArchive] Error:', error);
    return Response.json({
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

function getStatusMessage(status: string, daysUntilNext: number | null): string {
  switch (status) {
    case 'ready_to_archive':
      return 'Ready to archive! 30+ days have passed since last archive.';
    case 'waiting':
      return `Waiting for next archive. ${daysUntilNext} days remaining.`;
    case 'first_time':
      return 'First time setup. Archive will be scheduled for next month.';
    default:
      return 'Unknown status.';
  }
}
