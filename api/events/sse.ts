// api/events/sse.ts
// Server-Sent Events para respaldo del WebSocket

import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Configurar headers para SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Enviar evento de conexión
  res.write(`data: ${JSON.stringify({
    type: 'sse/connected',
    timestamp: Date.now(),
    message: 'SSE connection established'
  })}\n\n`);

  // Simular eventos periódicos (en producción esto vendría del sistema real)
  const interval = setInterval(() => {
    const event = {
      type: 'sse/heartbeat',
      timestamp: Date.now(),
      data: {
        status: 'active',
        uptime: Date.now() - Date.now() // En producción sería el uptime real
      }
    };

    res.write(`data: ${JSON.stringify(event)}\n\n`);
  }, 30000); // Cada 30 segundos

  // Limpiar al cerrar la conexión
  req.on('close', () => {
    clearInterval(interval);
    console.log('[SSE] Client disconnected');
  });

  req.on('error', (error) => {
    clearInterval(interval);
    console.error('[SSE] Connection error:', error);
  });
}
